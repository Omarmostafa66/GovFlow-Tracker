import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ServiceRequestService } from '../../../../../services/service-request.service';
import { AuthService } from '../../../../../services/auth.service';
import { User } from '../../../../../interfaces/user.interface';

// Interface for managing required document uploads
interface RequiredDocument {
  id: string;
  name: string;
  description: string;
  allowedTypes: string[];
  file: File | null;
}

// MODIFICATION START: Added custom validator for four-part name
export function fourNamesValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null; // Don't validate if empty, 'required' validator will handle it
    }
    const value = control.value as string;
    // Split by one or more spaces and filter out empty strings
    const names = value.trim().split(/\s+/).filter(name => name.length > 0);
    // Check if there are exactly 4 parts
    return names.length === 4 ? null : { requiresFourNames: true };
  };
}
// MODIFICATION END

@Component({
  selector: 'app-building-permit',
  standalone: true,
  imports: [ CommonModule, ReactiveFormsModule, RouterLink ],
  templateUrl: './building-permit.html',
  styleUrls: ['./building-permit.css']
})
export class BuildingPermitComponent implements OnInit {
  permitForm: FormGroup;
  isLoading = false;
  userData: User | null = null;

  // Alert properties
  isAlertVisible = false;
  alertTitle = '';
  alertMessage = '';
  alertType: 'success' | 'error' = 'success';

  // File size validation properties
  totalFileSize: number = 0;
  maxTotalFileSize: number = 100 * 1024 * 1024; // 100 MB

  // Service information displayed on the page
  serviceInfo = {
    title: 'Building Permit',
    department: 'Local Municipality',
    description: 'Apply for a new building construction permit.',
    processingTime: 'Estimated processing time: 10-15 business days after request completion and approvals.'
  };

  // List of all required documents based on user request
  requiredDocuments: RequiredDocument[] = [
    { id: 'nationalIdFile', name: 'National ID or Passport', description: 'PDF, JPG, PNG', allowedTypes: ['application/pdf', 'image/jpeg', 'image/png'], file: null },
    { id: 'powerOfAttorneyFile', name: 'Power of Attorney (if applicable)', description: 'PDF', allowedTypes: ['application/pdf'], file: null },
    { id: 'titleDeedFile', name: 'Title Deed (registered contract or proof)', description: 'PDF', allowedTypes: ['application/pdf'], file: null },
    { id: 'surveyMapFile', name: 'Official Survey Map or Site Plan', description: 'PDF', allowedTypes: ['application/pdf'], file: null },
    { id: 'siteValidityFile', name: 'Site Validity Certificate for Construction', description: 'PDF', allowedTypes: ['application/pdf'], file: null },
    { id: 'engineeringDrawingsFile', name: 'Engineering Drawings (Architectural & Structural)', description: 'PDF', allowedTypes: ['application/pdf'], file: null },
    { id: 'soilReportFile', name: 'Soil Report (for new lands)', description: 'PDF', allowedTypes: ['application/pdf'], file: null },
    { id: 'civilDefenseApprovalFile', name: 'Civil Defense Approval', description: 'PDF', allowedTypes: ['application/pdf'], file: null },
    { id: 'environmentApprovalFile', name: 'Environmental Approval (for major projects)', description: 'PDF', allowedTypes: ['application/pdf'], file: null },
    { id: 'trafficApprovalFile', name: 'Traffic Department Approval (if required)', description: 'PDF', allowedTypes: ['application/pdf'], file: null },
    { id: 'utilitiesApprovalFile', name: 'Utilities Approval (Electricity, Water, Sewage)', description: 'PDF', allowedTypes: ['application/pdf'], file: null },
    { id: 'receiptsFile', name: 'Fee Payment Receipts (Permit & Syndicate)', description: 'PDF, JPG', allowedTypes: ['application/pdf', 'image/jpeg'], file: null }
  ];

  governorates = ['Cairo', 'Giza'];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private serviceRequestService: ServiceRequestService,
    private authService: AuthService
  ) {
    this.permitForm = this.fb.group({
      // Owner Info (pre-filled and disabled)
      fullName: [{ value: '', disabled: true }, Validators.required],
      nationalId: [{ value: '', disabled: true }, Validators.required],
      mobileNumber: [{ value: '', disabled: true }, Validators.required],
      email: [{ value: '', disabled: true }, [Validators.required, Validators.email]],

      // Property Info (user input)
      governorate: ['', Validators.required],
      address: ['', Validators.required],

      // Consultant Info (user input)
      consultantOffice: ['', [Validators.required, Validators.pattern(/^[a-zA-Z\u0621-\u064A\s]+$/)]],
      // MODIFICATION START: Added the custom fourNamesValidator
      engineerName: ['', [Validators.required, Validators.pattern(/^[a-zA-Z\u0621-\u064A\s]+$/), fourNamesValidator()]],
      // MODIFICATION END
    });
  }

  ngOnInit(): void {
    this.loadUserData();
  }

  // Load user data from authentication service
  loadUserData(): void {
    const currentUser = this.authService.currentUser();
    if (currentUser) {
      this.userData = currentUser;
      this.permitForm.patchValue({
        fullName: currentUser.fullName,
        nationalId: currentUser.nationalId,
        email: currentUser.email,
        mobileNumber: currentUser.phoneNumber,
      });
    }
  }

  // Check if all required documents have been uploaded
  areAllDocumentsUploaded(): boolean {
    return this.requiredDocuments.every(doc => doc.file !== null);
  }

  // Handle form submission
  submitRequest(): void {
    this.markFormGroupTouched();
    if (this.permitForm.invalid) {
      this.showAlert('Incomplete Data', 'Please fill in all required fields correctly.', 'error');
      return;
    }
    if (!this.areAllDocumentsUploaded()) {
      this.showAlert('Missing Documents', 'Please upload all required documents.', 'error');
      return;
    }

    this.isLoading = true;
    const formData = new FormData();
    const formDetails = this.permitForm.getRawValue();
    const requestPayload = {
      serviceName: this.serviceInfo.title,
      department: 'Local Municipality',
      details: JSON.stringify(formDetails)
    };

    formData.append('request', JSON.stringify(requestPayload));

    this.requiredDocuments.forEach(doc => {
      if (doc.file) {
        formData.append('files', doc.file, doc.file.name);
      }
    });

    this.serviceRequestService.createRequest(formData).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        const newRequestId = response.id;
        this.showAlert('Success', 'Your building permit request has been submitted successfully! Redirecting to payment...', 'success');
        setTimeout(() => {
          this.hideAlert();
          this.router.navigate(['/payments', newRequestId]);
        }, 2000);
      },
      error: (error: any) => {
        this.isLoading = false;
        console.error('Error submitting request:', error);
        this.showAlert('Submission Failed', 'An error occurred while submitting your request. Please try again.', 'error');
      }
    });
  }

  // Show a modal alert
  showAlert(title: string, message: string, type: 'success' | 'error' = 'success'): void {
    this.alertTitle = title;
    this.alertMessage = message;
    this.alertType = type;
    this.isAlertVisible = true;
  }

  // Hide the modal alert
  hideAlert(): void {
    this.isAlertVisible = false;
  }

  // Handle file selection for a specific document
  onFileSelected(event: any, index: number): void {
    const file = event.target.files?.[0];
    if (!file) return;

    const documentRequirement = this.requiredDocuments[index];
    const oldFileSize = documentRequirement.file ? documentRequirement.file.size : 0;

    // Validate total file size
    if (this.totalFileSize - oldFileSize + file.size > this.maxTotalFileSize) {
      const maxSizeInMB = this.maxTotalFileSize / (1024 * 1024);
      this.showAlert('File Size Limit Exceeded', `The total size of all files cannot exceed ${maxSizeInMB} MB.`, 'error');
      event.target.value = null; // Clear the input
      return;
    }

    // Validate file type
    if (documentRequirement.allowedTypes.includes(file.type)) {
      this.totalFileSize = this.totalFileSize - oldFileSize + file.size;
      documentRequirement.file = file;
    } else {
      this.showAlert('Invalid File Type', `File format not allowed. Allowed formats: ${documentRequirement.description}`, 'error');
    }

    event.target.value = null; // Clear input to allow re-uploading the same file
  }

  // Remove an uploaded file
  removeFile(index: number): void {
    const documentRequirement = this.requiredDocuments[index];
    if (documentRequirement.file) {
      this.totalFileSize -= documentRequirement.file.size;
      documentRequirement.file = null;
    }
  }

  // Mark all form fields as 'touched' to trigger validation messages
  markFormGroupTouched(): void {
    Object.values(this.permitForm.controls).forEach(control => {
      control.markAsTouched();
    });
  }

  // Navigate back to the services page
  cancel(): void {
    this.router.navigate(['/municipality-services']);
  }
}
