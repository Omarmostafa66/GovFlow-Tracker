import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ServiceRequestService } from '../../../../../services/service-request.service';
import { AuthService } from '../../../../../services/auth.service';
import { User } from '../../../../../interfaces/user.interface';

// MODIFICATION START: Updated validator to handle 'YYYY-MM-DD' format from date input
export function futureDateValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) { return null; }
    // The value from <input type="date"> is 'YYYY-MM-DD'.
    // We create a date object from it. The time is set to midnight UTC.
    const selectedDate = new Date(control.value);

    // To avoid timezone issues, we create a 'today' date at midnight in the local timezone.
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // The selectedDate might be a day behind depending on the timezone.
    // We can get the UTC time of the selected date and add the timezone offset to get the correct local date.
    const correctedSelectedDate = new Date(selectedDate.getTime() + selectedDate.getTimezoneOffset() * 60000);

    if (correctedSelectedDate < today) {
      return { pastDate: true };
    }
    return null;
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

// ADDITION: Interface to hold detailed status for each license category
interface LicenseCategoryStatus {
  status: 'AVAILABLE' | 'PENDING' | 'RENEWED';
  expiryDate?: string;
}

@Component({
  selector: 'app-license-renewal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl: './license-renewal.html',
  styleUrls: ['./license-renewal.css']
})
export class LicenseRenewalComponent implements OnInit {
  renewalForm: FormGroup;
  isLoading = false;
  userInfo: User | null = null;
  isAlertVisible = false;
  alertTitle = '';
  alertMessage = '';
  alertType: 'success' | 'error' = 'success';
  totalFileSize: number = 0;
  maxTotalFileSize: number = 100 * 1024 * 1024;

  // ADDITION: Object to hold the detailed status of each license category
  licenseCategoryStatus: { [key: string]: LicenseCategoryStatus } = {};

  serviceDetails = {
    title: 'License Renewal',
    description: 'Renew your expiring driver\'s license and update your information.',
    processingTime: '3-5 business days'
  };

  requiredDocuments: RequiredDocument[] = [
    { id: 'nationalIdCopy', name: 'Copy of a valid National ID', description: 'Front and back. Allowed: PDF, JPG, PNG', allowedTypes: ['application/pdf', 'image/jpeg', 'image/png'], file: null },
    { id: 'oldLicenseCopy', name: 'Copy of the expiring driver\'s license', description: 'Allowed formats: PDF, JPG, PNG', allowedTypes: ['application/pdf', 'image/jpeg', 'image/png'], file: null },
    { id: 'medicalCert', name: 'Valid Medical Certificate (Internal Medicine & Ophthalmology)', description: 'Allowed formats: PDF, JPG', allowedTypes: ['application/pdf', 'image/jpeg'], file: null },
    { id: 'personalPhoto', name: 'Recent Personal Photograph', description: 'Allowed formats: JPG, PNG', allowedTypes: ['image/jpeg', 'image/png'], file: null },
    { id: 'violationsClearance', name: 'Traffic Violations Clearance Certificate', description: 'Allowed: PDF', allowedTypes: ['application/pdf'], file: null }
  ];

  licenseCategories = [
    'Private', 'Motorcycle', 'Professional - 3rd Grade',
    'Professional - 2nd Grade', 'Professional - 1st Grade'
  ];

  deliveryOptions = ['Pickup at Traffic Unit', 'Mail Delivery'];
  governorates = ['Cairo', 'Giza'];

  constructor(
    private fb: FormBuilder,
    private serviceRequestService: ServiceRequestService,
    private router: Router,
    private authService: AuthService
  ) {
    this.renewalForm = this.fb.group({
      fullName: [{ value: '', disabled: true }, Validators.required],
      nationalId: [{ value: '', disabled: true }, Validators.required],
      age: [{ value: '', disabled: true }],
      governorate: ['', Validators.required],
      currentAddress: [{ value: '', disabled: true }, Validators.required],
      mobileNumber: [{ value: '', disabled: true }, Validators.required],
      email: [{ value: '', disabled: true }, Validators.required],
      licenseNumber: ['', [Validators.required, Validators.pattern('^[0-9]{7,10}$')]],
      // MODIFICATION START: Removed pattern validator as it's not needed for date input type
      licenseExpirationDate: ['', [
        Validators.required,
        futureDateValidator()
      ]],
      // MODIFICATION END
      licenseCategory: ['', Validators.required],
      deliveryMethod: ['Pickup at Traffic Unit', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadUserData();
    this.checkExistingLicenseRequests(); // ADDITION: Check for existing requests
  }

  // ADDITION: New function to fetch requests and determine category statuses
  checkExistingLicenseRequests(): void {
    this.serviceRequestService.getMyRequests().subscribe({
      next: (requests) => {
        const licenseRequests = requests.filter(req =>
          req.serviceName === 'License Renewal' || req.serviceName === 'Driver License Issuance'
        );

        for (const req of licenseRequests) {
          if (req.details) {
            try {
              const details = JSON.parse(req.details);
              const category = details.licenseCategory;

              if (category) {
                const isRejectedOrCancelled = req.status === 'REJECTED' || req.status === 'CANCELLED';
                const isApprovedOrCompleted = req.status === 'COMPLETED' || req.status === 'APPROVED' || req.status === 'PAID';

                if (isApprovedOrCompleted) {
                  const renewalYears = (category.includes('Private') || category.includes('Motorcycle')) ? 10 : 3;
                  const approvalDate = new Date(req.updatedAt || req.submissionDate);
                  approvalDate.setFullYear(approvalDate.getFullYear() + renewalYears);
                  this.licenseCategoryStatus[category] = {
                    status: 'RENEWED',
                    expiryDate: approvalDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                  };
                } else if (!isRejectedOrCancelled) {
                  this.licenseCategoryStatus[category] = { status: 'PENDING' };
                }
              }
            } catch (e) { console.error('Could not parse request details for request ID:', req.id); }
          }
        }
      },
      error: (err) => { console.error('Could not fetch user requests:', err); }
    });
  }

  // ADDITION: Helper function for the template to check if an option should be disabled
  isCategoryDisabled(category: string): boolean {
    const statusInfo = this.licenseCategoryStatus[category];
    return !!statusInfo && (statusInfo.status === 'RENEWED' || statusInfo.status === 'PENDING');
  }

  // ADDITION: Helper function for the template to display the correct label
  getCategoryLabel(category: string): string {
    const statusInfo = this.licenseCategoryStatus[category];
    if (statusInfo?.status === 'RENEWED') {
      return `${category} (Renewed until ${statusInfo.expiryDate})`;
    }
    if (statusInfo?.status === 'PENDING') {
      return `${category} (Renewal Pending)`;
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
      this.userInfo = currentUser;
      const age = this.calculateAgeFromNationalId(currentUser.nationalId || '');
      this.renewalForm.patchValue({
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

  areAllDocumentsUploaded(): boolean { return this.requiredDocuments.every(doc => doc.file !== null); }
  onFileSelected(event: any, index: number): void { const file = event.target.files?.[0]; if (!file) return; const documentRequirement = this.requiredDocuments[index]; const oldFileSize = documentRequirement.file ? documentRequirement.file.size : 0; if (this.totalFileSize - oldFileSize + file.size > this.maxTotalFileSize) { const maxSizeInMB = this.maxTotalFileSize / (1024 * 1024); this.showAlert('File Size Limit Exceeded', `The total size of all files cannot exceed ${maxSizeInMB} MB.`, 'error'); event.target.value = null; return; } if (documentRequirement.allowedTypes.includes(file.type)) { this.totalFileSize = this.totalFileSize - oldFileSize + file.size; documentRequirement.file = file; } else { this.showAlert('Invalid File Type', `File format not allowed. Please upload: ${documentRequirement.description}`, 'error'); } event.target.value = null; }
  removeFile(index: number): void { const documentRequirement = this.requiredDocuments[index]; if (documentRequirement.file) { this.totalFileSize -= documentRequirement.file.size; documentRequirement.file = null; } }
  onSubmit(): void { if (this.renewalForm.invalid) { this.renewalForm.markAllAsTouched(); this.showAlert('Missing Information', 'Please fill in all required fields correctly.', 'error'); return; } if (!this.areAllDocumentsUploaded()) { this.showAlert('Missing Documents', 'Please upload all the required documents.', 'error'); return; } this.isLoading = true; const formData = new FormData(); const formDetails = this.renewalForm.getRawValue(); const requestPayload = { serviceName: this.serviceDetails.title, department: 'Traffic Department', details: JSON.stringify(formDetails) }; formData.append('request', JSON.stringify(requestPayload)); this.requiredDocuments.forEach(doc => { if (doc.file) { formData.append('files', doc.file, doc.file.name); } }); this.serviceRequestService.createRequest(formData).subscribe({ next: (response: any) => { this.isLoading = false; const newRequestId = response.id; this.showAlert('Success', 'Your license renewal request has been submitted successfully! Redirecting to payment...', 'success'); setTimeout(() => { this.hideAlert(); this.router.navigate(['/payments', newRequestId]); }, 2000); }, error: (error) => { this.isLoading = false; console.error('Error submitting request', error); this.showAlert('Submission Failed', 'There was an error submitting your request. Please try again.', 'error'); } }); }
  showAlert(title: string, message: string, type: 'success' | 'error' = 'success') { this.alertTitle = title; this.alertMessage = message; this.alertType = type; this.isAlertVisible = true; }
  hideAlert() { this.isAlertVisible = false; }
  cancel(): void { this.router.navigate(['/traffic-services']); }
}
