import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ServiceRequestService } from '../../../../../services/service-request.service';
import { AuthService } from '../../../../../services/auth.service';
import { User } from '../../../../../interfaces/user.interface';

interface RequiredDocument {
  id: string;
  name: string;
  description: string;
  allowedTypes: string[];
  file: File | null;
}

@Component({
  selector: 'app-drivers-license-issuance',
  standalone: true,
  imports: [ CommonModule, ReactiveFormsModule, RouterLink ],
  templateUrl: './drivers-license-issuance.html',
  styleUrls: ['./drivers-license-issuance.css']
})
export class DriversLicenseIssuanceComponent implements OnInit {
  licenseForm: FormGroup;
  isLoading = false;
  userData: User | null = null;
  isAlertVisible = false;
  alertTitle = '';
  alertMessage = '';
  alertType: 'success' | 'error' = 'success';
  totalFileSize: number = 0;
  maxTotalFileSize: number = 100 * 1024 * 1024;

  licenseCategoryStatus: { [key: string]: 'OWNED' | 'PENDING' | 'AVAILABLE' } = {};

  serviceInfo = {
    title: 'Driver License Issuance',
    description: 'Apply for a new driver\'s license by providing the required information and documents.',
    processingTime: 'Depends on completing tests at the Traffic Unit'
  };

  requiredDocuments: RequiredDocument[] = [
    { id: 'nationalIdFile', name: 'Copy of a valid National ID', description: 'Allowed formats: PDF, JPG, PNG', allowedTypes: ['application/pdf', 'image/jpeg', 'image/png'], file: null },
    { id: 'photoFile', name: 'Recent personal photograph', description: 'White background. Allowed: JPG, PNG', allowedTypes: ['image/jpeg', 'image/png'], file: null },
    { id: 'medicalCertFile', name: 'Valid Medical Certificate', description: 'Internal Medicine & Ophthalmology. Allowed: PDF', allowedTypes: ['application/pdf'], file: null },
    { id: 'drivingTestFile', name: 'Driving Test Completion Certificate', description: 'For first-time applicants. Allowed: PDF', allowedTypes: ['application/pdf'], file: null },
    { id: 'educationCertFile', name: 'Proof of Education or Literacy Certificate', description: 'Allowed formats: PDF, JPG', allowedTypes: ['application/pdf', 'image/jpeg'], file: null },
    { id: 'bloodTypeFile', name: 'Blood Type Certificate', description: 'Allowed formats: PDF, JPG', allowedTypes: ['application/pdf', 'image/jpeg'], file: null }
  ];

  licenseCategories = [
    'Private', 'Motorcycle', 'Professional - 3rd Grade',
    'Professional - 2nd Grade', 'Professional - 1st Grade'
  ];
  bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  qualifications = [
    'Literate (Reads and Writes)', 'Primary School Certificate', 'Preparatory School Certificate',
    'High School Certificate (or equivalent)', 'Diploma', 'Bachelor\'s Degree', 'Master\'s Degree', 'Doctorate (PhD)'
  ];

  governorates = ['Cairo', 'Giza'];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private serviceRequestService: ServiceRequestService,
    private authService: AuthService
  ) {
    this.licenseForm = this.fb.group({
      fullName: [{ value: '', disabled: true }, Validators.required],
      nationalId: [{ value: '', disabled: true }, Validators.required],
      age: [{ value: '', disabled: true }],
      governorate: ['', Validators.required],
      currentAddress: [{ value: '', disabled: true }, Validators.required],
      mobileNumber: [{ value: '', disabled: true }, Validators.required],
      email: [{ value: '', disabled: true }, Validators.required],
      licenseCategory: ['Private', Validators.required],
      bloodType: ['', Validators.required],
      qualification: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.loadUserData();
    this.checkExistingLicenseRequests();
  }

  checkExistingLicenseRequests(): void {
    this.serviceRequestService.getMyRequests().subscribe({
      next: (requests) => {
        const licenseRequests = requests.filter(req => req.serviceName === this.serviceInfo.title);

        for (const req of licenseRequests) {
          // ✅ CORRECTION: Check if req.details exists before parsing to prevent the error.
          if (req.details) {
            try {
              const details = JSON.parse(req.details);
              const category = details.licenseCategory;

              if (category) {
                if (req.status === 'COMPLETED' || req.status === 'APPROVED' || req.status === 'PAID') {
                  this.licenseCategoryStatus[category] = 'OWNED';
                }
                else if (req.status !== 'REJECTED' && req.status !== 'CANCELLED') {
                  this.licenseCategoryStatus[category] = 'PENDING';
                }
              }
            } catch (e) {
              console.error('Could not parse request details for request ID:', req.id);
            }
          }
        }
      },
      error: (err) => {
        console.error('Could not fetch user requests to check license status:', err);
      }
    });
  }

  isCategoryDisabled(category: string): boolean {
    const status = this.licenseCategoryStatus[category];
    return status === 'OWNED' || status === 'PENDING';
  }

  getCategoryLabel(category: string): string {
    const status = this.licenseCategoryStatus[category];
    if (status === 'OWNED') {
      return `${category} (Owned)`;
    }
    if (status === 'PENDING') {
      return `${category} (Pending Request)`;
    }
    return category;
  }

  private calculateAgeFromNationalId(nationalId: string): number | null {
    if (!nationalId || nationalId.length !== 14) return null;
    const century = nationalId[0] === '2' ? 1900 : 2000;
    const year = century + parseInt(nationalId.substring(1, 3), 10);
    const month = parseInt(nationalId.substring(3, 5), 10);
    const day = parseInt(nationalId.substring(5, 7), 10);
    const birthDate = new Date(year, month - 1, day);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  }

  loadUserData(): void {
    const currentUser = this.authService.currentUser();
    if (currentUser) {
      this.userData = currentUser;
      let age: number | null = null;
      if (currentUser.nationalId) {
        age = this.calculateAgeFromNationalId(currentUser.nationalId);
      }

      this.licenseForm.patchValue({
        fullName: currentUser.fullName,
        nationalId: currentUser.nationalId,
        email: currentUser.email,
        mobileNumber: currentUser.phoneNumber,
        currentAddress: currentUser.address,
        age: age ? `${age} years` : ''
      });
    }
  }

  areAllDocumentsUploaded(): boolean { return this.requiredDocuments.every(doc => doc.file !== null); }
  submitRequest(): void { this.markFormGroupTouched(); if (this.licenseForm.invalid) { this.showAlert('Invalid Form', 'Please fill in all required fields correctly.', 'error'); return; } if (!this.areAllDocumentsUploaded()) { this.showAlert('Missing Documents', 'Please upload all the required documents.', 'error'); return; } this.isLoading = true; const formData = new FormData(); const formDetails = this.licenseForm.getRawValue(); const requestPayload = { serviceName: this.serviceInfo.title, department: 'Traffic Department', details: JSON.stringify(formDetails) }; formData.append('request', JSON.stringify(requestPayload)); this.requiredDocuments.forEach(doc => { if (doc.file) { formData.append('files', doc.file, doc.file.name); } }); this.serviceRequestService.createRequest(formData).subscribe({ next: (response: any) => { this.isLoading = false; const newRequestId = response.id; this.showAlert('Success', 'Your license issuance request has been submitted successfully! Redirecting to payment...', 'success'); setTimeout(() => { this.hideAlert(); this.router.navigate(['/payments', newRequestId]); }, 2000); }, error: (error: any) => { this.isLoading = false; console.error('Error submitting request:', error); this.showAlert('Submission Failed', 'There was an error submitting your request. Please try again.', 'error'); } }); }
  showAlert(title: string, message: string, type: 'success' | 'error' = 'success'): void { this.alertTitle = title; this.alertMessage = message; this.alertType = type; this.isAlertVisible = true; }
  hideAlert(): void { this.isAlertVisible = false; }
  onFileSelected(event: any, index: number): void { const file = event.target.files?.[0]; if (!file) return; const documentRequirement = this.requiredDocuments[index]; const oldFileSize = documentRequirement.file ? documentRequirement.file.size : 0; if (this.totalFileSize - oldFileSize + file.size > this.maxTotalFileSize) { const maxSizeInMB = this.maxTotalFileSize / (1024 * 1024); this.showAlert('File Size Limit Exceeded', `The total size of all files cannot exceed ${maxSizeInMB} MB.`, 'error'); event.target.value = null; return; } if (documentRequirement.allowedTypes.includes(file.type)) { this.totalFileSize = this.totalFileSize - oldFileSize + file.size; documentRequirement.file = file; } else { this.showAlert('Invalid File Type', `File format not allowed. Please upload: ${documentRequirement.description}`, 'error'); } event.target.value = null; }
  removeFile(index: number): void { const documentRequirement = this.requiredDocuments[index]; if (documentRequirement.file) { this.totalFileSize -= documentRequirement.file.size; documentRequirement.file = null; } }
  markFormGroupTouched(): void { Object.values(this.licenseForm.controls).forEach(control => { control.markAsTouched(); }); }
  cancel(): void { this.router.navigate(['/traffic-services']); }
}

