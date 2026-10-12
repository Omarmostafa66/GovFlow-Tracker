import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

import { ServiceRequestService } from '../../../../../services/service-request.service';
import { AuthService } from '../../../../../services/auth.service';
import { User } from '../../../../../interfaces/user.interface';

// MODIFICATION START: Added a custom validator for the year of manufacture
export function maxCurrentYearValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }
    const currentYear = new Date().getFullYear();
    const inputYear = parseInt(control.value, 10);
    if (isNaN(inputYear)) {
      return null;
    }
    return inputYear > currentYear ? { futureYear: true } : null;
  };
}
// MODIFICATION END

interface RequiredDocument {
  id: string;
  name: string;
  description: string;
  allowedTypes: string[];
  file: File | null;
}

@Component({
  selector: 'app-vehicle-registration',
  templateUrl: './vehicle-registration.html',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink
  ],
  styleUrls: ['./vehicle-registration.css']
})
export class VehicleRegistrationComponent implements OnInit {
  registrationForm: FormGroup;
  isLoading = false;
  userInfo: User | null = null;
  isAlertVisible = false;
  alertTitle = '';
  alertMessage = '';
  alertType: 'success' | 'error' = 'success';
  totalFileSize: number = 0;
  maxTotalFileSize: number = 100 * 1024 * 1024;

  requiredDocuments: RequiredDocument[] = [
    { id: 'nationalIdCopy', name: 'Copy of National ID (Front & Back)', description: 'Allowed: JPG, PNG', allowedTypes: ['image/jpeg', 'image/png'], file: null },
    { id: 'personalPhoto', name: 'Recent Personal Photograph', description: 'White background. Allowed: JPG, PNG', allowedTypes: ['image/jpeg', 'image/png'], file: null },
    { id: 'purchaseInvoice', name: 'Vehicle Purchase Invoice or Final Sale Contract', description: 'Allowed: PDF', allowedTypes: ['application/pdf'], file: null },
    { id: 'customsRelease', name: 'Customs Release Certificate (if imported)', description: 'Allowed: PDF', allowedTypes: ['application/pdf'], file: null },
    { id: 'technicalInspection', name: 'Technical Inspection / Conformance Certificate', description: 'Allowed: PDF', allowedTypes: ['application/pdf'], file: null },
    { id: 'insuranceReceipt', name: 'Mandatory Insurance Receipt', description: 'Allowed: PDF, JPG', allowedTypes: ['application/pdf', 'image/jpeg'], file: null },
    { id: 'violationsClearance', name: 'Violations Clearance Certificate (Baraaet Zimma)', description: 'Allowed: PDF', allowedTypes: ['application/pdf'], file: null },
    { id: 'powerOfAttorney', name: 'Official Power of Attorney (if applicable)', description: 'Allowed: PDF', allowedTypes: ['application/pdf'], file: null },
    { id: 'financingLetter', name: 'Letter from Bank/Financing Company (if applicable)', description: 'Allowed: PDF', allowedTypes: ['application/pdf'], file: null },
  ];

  deliveryOptions = ['Pickup at Traffic Unit', 'Mail Delivery'];
  governorates = ['Cairo', 'Giza'];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private serviceRequestService: ServiceRequestService,
    private authService: AuthService
  ) {
    this.registrationForm = this.fb.group({
      fullName: [{ value: '', disabled: true }, Validators.required],
      nationalId: [{ value: '', disabled: true }, Validators.required],
      age: [{ value: '', disabled: true }],
      governorate: ['', Validators.required],
      currentAddress: [{ value: '', disabled: true }, Validators.required],
      mobileNumber: [{ value: '', disabled: true }, Validators.required],
      email: [{ value: '', disabled: true }, Validators.required],
      vehicleMake: ['', [Validators.required, Validators.pattern('^[a-zA-Z0-9 ]+$')]],
      vehicleModel: ['', [Validators.required, Validators.pattern('^[a-zA-Z0-9 ]+$')]],
      // MODIFICATION START: Added the custom validator to the year field
      yearOfManufacture: ['', [Validators.required, Validators.pattern(/^\d{4}$/), maxCurrentYearValidator()]],
      // MODIFICATION START: Reverted vehicleColor to hex validator and removed colorCode
      vehicleColor: ['', [Validators.required, Validators.pattern(/^#[0-9a-fA-F]{6}$/)]],
      vin: ['', [Validators.required, Validators.pattern('^[a-zA-Z0-9]{5,17}$')]],
      engineNumber: ['', [Validators.required, Validators.pattern('^[a-zA-Z0-9]{5,20}$')]],
      // MODIFICATION END
      deliveryMethod: ['Pickup at Traffic Unit', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadUserData();
  }

  private calculateAgeFromNationalId(nationalId: string): number | null { if (!nationalId || nationalId.length !== 14) return null; const century = nationalId[0] === '2' ? 1900 : 2000; const year = century + parseInt(nationalId.substring(1, 3), 10); const month = parseInt(nationalId.substring(3, 5), 10); const day = parseInt(nationalId.substring(5, 7), 10); const birthDate = new Date(year, month - 1, day); const today = new Date(); let age = today.getFullYear() - birthDate.getFullYear(); const m = today.getMonth() - birthDate.getMonth(); if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--; return age; }

  loadUserData(): void {
    const currentUser = this.authService.currentUser();
    if (currentUser) {
      this.userInfo = currentUser;
      const age = this.calculateAgeFromNationalId(currentUser.nationalId || '');
      this.registrationForm.patchValue({
        fullName: currentUser.fullName,
        nationalId: currentUser.nationalId,
        age: age ? `${age} years` : '',
        governorate: currentUser.governorate || '',
        currentAddress: currentUser.address,
        mobileNumber: currentUser.phoneNumber,
        email: currentUser.email
      });
    }
  }

  // MODIFICATION START: Re-added the onColorPickerChange function
  onColorPickerChange(event: any) {
    const color = event.target.value;
    if (color) {
      this.registrationForm.patchValue({ vehicleColor: color });
    }
  }
  // MODIFICATION END

  areAllDocumentsUploaded(): boolean { return this.requiredDocuments.every(doc => doc.file !== null); }
  onFileSelected(event: any, index: number): void { const file = event.target.files?.[0]; if (!file) return; const documentRequirement = this.requiredDocuments[index]; const oldFileSize = documentRequirement.file ? documentRequirement.file.size : 0; if (this.totalFileSize - oldFileSize + file.size > this.maxTotalFileSize) { const maxSizeInMB = this.maxTotalFileSize / (1024 * 1024); this.showAlert('File Size Limit Exceeded', `The total size of all files cannot exceed ${maxSizeInMB} MB.`, 'error'); event.target.value = null; return; } if (documentRequirement.allowedTypes.includes(file.type)) { this.totalFileSize = this.totalFileSize - oldFileSize + file.size; documentRequirement.file = file; } else { this.showAlert('Invalid File Type', `File format not allowed. Please upload: ${documentRequirement.description}`, 'error'); } event.target.value = null; }
  removeFile(index: number): void { const documentRequirement = this.requiredDocuments[index]; if (documentRequirement.file) { this.totalFileSize -= documentRequirement.file.size; documentRequirement.file = null; } }

  onSubmit(): void {
    this.registrationForm.markAllAsTouched();
    if (this.registrationForm.invalid) {
      this.showAlert('Missing Information', 'Please fill in all required fields correctly.', 'error');
      return;
    }
    if (!this.areAllDocumentsUploaded()) {
      this.showAlert('Missing Documents', 'Please upload all the required documents.', 'error');
      return;
    }
    this.isLoading = true;
    const formData = new FormData();
    const formDetails = this.registrationForm.getRawValue();
    const requestPayload = { serviceName: 'Vehicle Registration', department: 'Traffic Department', details: JSON.stringify(formDetails) };
    formData.append('request', JSON.stringify(requestPayload));
    this.requiredDocuments.forEach(doc => { if (doc.file) { formData.append('files', doc.file, doc.file.name); } });
    this.serviceRequestService.createRequest(formData).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        const newRequestId = response.id;
        this.showAlert('Success', 'Your vehicle registration request has been submitted successfully! Redirecting to payment...', 'success');
        setTimeout(() => {
          this.hideAlert();
          this.router.navigate(['/payments', newRequestId]);
        }, 2000);
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error submitting request', error);
        this.showAlert('Submission Failed', 'There was an error submitting your request. Please try again.', 'error');
      }
    });
  }

  showAlert(title: string, message: string, type: 'success' | 'error' = 'success') { this.alertTitle = title; this.alertMessage = message; this.alertType = type; this.isAlertVisible = true; }
  hideAlert() { this.isAlertVisible = false; }
  cancel(): void { this.router.navigate(['/traffic-services']); }
}
