import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
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

// MODIFICATION START: Added custom validator for the permit year
export function permitYearValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value || !(control.value as string).includes('/')) {
      return null; // No year to validate
    }
    const parts = (control.value as string).split('/');
    if (parts.length < 2 || parts[1].length !== 4) {
      return null; // Invalid format, pattern validator will catch it
    }

    const year = parseInt(parts[1], 10);
    const currentYear = new Date().getFullYear();

    if (!isNaN(year) && year > currentYear) {
      return { futurePermitYear: true }; // Year is in the future
    }

    return null;
  };
}
// MODIFICATION END

@Component({
  selector: 'app-renovation-permit',
  standalone: true,
  imports: [ CommonModule, ReactiveFormsModule, RouterLink ],
  templateUrl: './renovation-permit.html',
  styleUrls: ['./renovation-permit.css']
})
export class RenovationPermitComponent implements OnInit {
  permitForm: FormGroup;
  isLoading = false;
  userData: User | null = null;
  isAlertVisible = false;
  alertTitle = '';
  alertMessage = '';
  alertType: 'success' | 'error' = 'success';
  totalFileSize: number = 0;
  maxTotalFileSize: number = 100 * 1024 * 1024;
  serviceInfo = {
    title: 'Renovation Permit',
    department: 'Local Municipality',
    description: 'Apply for a permit to carry out renovation or reinforcement work on an existing property.',
    processingTime: 'Estimated processing time: 5-7 business days after request completion and approvals.'
  };
  governorates = ['Cairo', 'Giza'];
  // MODIFICATION START: Added districts data and a new array for the dynamic city list
  districts: { [key: string]: string[] } = {
    'Cairo': ['Ain Shams', 'Al-Salam', 'Al-Zaytoun', 'Al-Sahel', 'Al-Sharabiya', 'Al-Zawiya al-Hamra', 'Hadayek al-Qubba', 'Maadi', 'Matareya', 'Heliopolis', 'Nasr City', 'New Cairo'],
    'Giza': ['Dokki', 'Agouza', 'Mohandessin', 'Haram', 'Faisal', 'Omrania', 'Imbaba', '6th of October City', 'Sheikh Zayed City']
  };
  cities: string[] = [];
  // MODIFICATION END

  requiredDocuments: RequiredDocument[] = [
    { id: 'nationalIdFile', name: 'National ID or Passport', description: 'PDF, JPG, PNG', allowedTypes: ['application/pdf', 'image/jpeg', 'image/png'], file: null },
    { id: 'powerOfAttorneyFile', name: 'Power of Attorney (if applicable)', description: 'PDF', allowedTypes: ['application/pdf'], file: null },
    { id: 'titleDeedFile', name: 'Title Deed (or proof of right)', description: 'PDF', allowedTypes: ['application/pdf'], file: null },
    { id: 'originalPermitFile', name: 'Copy of Original Building Permit (if available)', description: 'PDF', allowedTypes: ['application/pdf'], file: null },
    { id: 'surveyMapFile', name: 'Survey Map or Property Location', description: 'PDF', allowedTypes: ['application/pdf'], file: null },
    { id: 'engineeringReportFile', name: 'Certified Engineering Report on Building Condition', description: 'PDF', allowedTypes: ['application/pdf'], file: null },
    { id: 'engineeringDrawingsFile', name: 'Engineering Drawings for Proposed Work', description: 'PDF', allowedTypes: ['application/pdf'], file: null },
    { id: 'engineerDeclarationFile', name: 'Declaration from Supervising Engineer', description: 'PDF', allowedTypes: ['application/pdf'], file: null },
    { id: 'approvalsFile', name: 'Special Approvals (Civil Defense, Urban Harmony)', description: 'PDF', allowedTypes: ['application/pdf'], file: null },
    { id: 'receiptsFile', name: 'Fee Payment Receipts', description: 'PDF, JPG', allowedTypes: ['application/pdf', 'image/jpeg'], file: null }
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private serviceRequestService: ServiceRequestService,
    private authService: AuthService
  ) {
    this.permitForm = this.fb.group({
      fullName: [{ value: '', disabled: true }, Validators.required],
      nationalId: [{ value: '', disabled: true }, Validators.required],
      mobileNumber: [{ value: '', disabled: true }, Validators.required],
      email: [{ value: '', disabled: true }, [Validators.required, Validators.email]],
      governorate: ['', Validators.required],
      // MODIFICATION START: Added city FormControl and updated permit number and renovation details validators
      city: ['', Validators.required],
      propertyAddress: ['', Validators.required],
      originalPermitNumber: ['', [Validators.required, Validators.pattern(/^\d{4,10}(\/\d{4})?$/), permitYearValidator()]],
      renovationDetails: ['', [Validators.required, Validators.minLength(50), Validators.maxLength(1000)]],
      // MODIFICATION END
    });
  }

  ngOnInit(): void {
    this.loadUserData();
    this.onGovernorateChange(); // MODIFICATION: Setup listener for governorate changes
  }

  // MODIFICATION START: Added listener for governorate dropdown
  onGovernorateChange(): void {
    this.permitForm.get('governorate')?.valueChanges.subscribe(gov => {
      this.cities = this.districts[gov] || [];
      this.permitForm.get('city')?.setValue(''); // Reset city selection
    });
  }
  // MODIFICATION END

  // MODIFICATION START: Added function to auto-format the permit number input
  formatPermitNumber(event: any): void {
    const input = event.target;
    let value = input.value.replace(/[^\d]/g, ''); // Remove all non-digits

    if (value.length > 4) {
      value = `${value.substring(0, 4)}/${value.substring(4, 8)}`;
    }

    input.value = value;
    this.permitForm.get('originalPermitNumber')?.setValue(value, { emitEvent: false });
  }
  // MODIFICATION END

  loadUserData(): void {
    const currentUser = this.authService.currentUser();
    if (currentUser) {
      this.userData = currentUser;
      this.permitForm.patchValue({
        fullName: currentUser.fullName,
        nationalId: currentUser.nationalId,
        email: currentUser.email,
        mobileNumber: currentUser.phoneNumber
      });
    }
  }

  areAllDocumentsUploaded(): boolean {
    return this.requiredDocuments.every(doc => doc.file !== null);
  }

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
        this.showAlert('Success', 'Your renovation permit request has been submitted! Redirecting to payment...', 'success');
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

  showAlert(title: string, message: string, type: 'success' | 'error' = 'success'): void {
    this.alertTitle = title;
    this.alertMessage = message;
    this.alertType = type;
    this.isAlertVisible = true;
  }

  hideAlert(): void {
    this.isAlertVisible = false;
  }

  onFileSelected(event: any, index: number): void {
    const file = event.target.files?.[0];
    if (!file) return;
    const documentRequirement = this.requiredDocuments[index];
    const oldFileSize = documentRequirement.file ? documentRequirement.file.size : 0;
    if (this.totalFileSize - oldFileSize + file.size > this.maxTotalFileSize) {
      const maxSizeInMB = this.maxTotalFileSize / (1024 * 1024);
      this.showAlert('File Size Limit Exceeded', `The total size of all files cannot exceed ${maxSizeInMB} MB.`, 'error');
      event.target.value = null;
      return;
    }
    if (documentRequirement.allowedTypes.includes(file.type)) {
      this.totalFileSize = this.totalFileSize - oldFileSize + file.size;
      documentRequirement.file = file;
    } else {
      this.showAlert('Invalid File Type', `File format not allowed. Allowed formats: ${documentRequirement.description}`, 'error');
    }
    event.target.value = null;
  }

  removeFile(index: number): void {
    const documentRequirement = this.requiredDocuments[index];
    if (documentRequirement.file) {
      this.totalFileSize -= documentRequirement.file.size;
      documentRequirement.file = null;
    }
  }

  markFormGroupTouched(): void {
    Object.values(this.permitForm.controls).forEach(control => {
      control.markAsTouched();
    });
  }

  cancel(): void {
    this.router.navigate(['/municipality-services']);
  }
}
