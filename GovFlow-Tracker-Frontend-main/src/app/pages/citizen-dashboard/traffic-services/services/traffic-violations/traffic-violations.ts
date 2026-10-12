// import { Component, OnInit } from '@angular/core';
// import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
// import { Router, RouterLink } from '@angular/router';
// import { CommonModule } from '@angular/common';
// import { AuthService } from '../../../../../services/auth.service';
// import { User } from '../../../../../interfaces/user.interface';
//
// type ViolationStatus = 'Paid' | 'Unpaid';
//
// interface Violation {
//   id: string;
//   date: string;
//   type: string;
//   location: string;
//   amount: number;
//   status: ViolationStatus;
//   description: string;
// }
//
// @Component({
//   selector: 'app-traffic-violations',
//   standalone: true,
//   templateUrl: './traffic-violations.html',
//   imports: [
//     CommonModule,
//     ReactiveFormsModule,
//     RouterLink
//   ],
//   styleUrls: ['./traffic-violations.css']
// })
// export class TrafficViolationsComponent implements OnInit {
//   violationForm: FormGroup;
//   isSubmitting = false;
//   userInfo: User | null = null;
//   violations: Violation[] = [];
//   showViolationsList = false;
//
//   isAlertVisible = false;
//   alertTitle = '';
//   alertMessage = '';
//   alertType: 'success' | 'error' = 'success';
//
//   // ✅ UPDATE: Add a new property to track selections
//   selectedViolationIds = new Set<string>();
//
//   constructor(
//     private fb: FormBuilder,
//     private router: Router,
//     private authService: AuthService
//   ) {
//     this.violationForm = this.fb.group({
//       licenseNumber: ['', Validators.required],
//       vehiclePlate: ['', Validators.required]
//     });
//   }
//
//   ngOnInit() {
//     this.loadUserData();
//   }
//
//   loadUserData(): void {
//     this.userInfo = this.authService.currentUser();
//   }
//
//   onSubmit(): void {
//     if (this.violationForm.invalid) {
//       this.violationForm.markAllAsTouched();
//       return;
//     }
//     this.isSubmitting = true;
//
//     setTimeout(() => {
//       this.violations = this.getMockViolations();
//       this.isSubmitting = false;
//       this.showViolationsList = true;
//     }, 1500);
//   }
//
//   // ✅ UPDATE: New function to handle checkbox clicks
//   onViolationSelectionChange(event: Event, violationId: string): void {
//     const checkbox = event.target as HTMLInputElement;
//     if (checkbox.checked) {
//       this.selectedViolationIds.add(violationId);
//     } else {
//       this.selectedViolationIds.delete(violationId);
//     }
//   }
//
//   // ✅ UPDATE: The totalAmount getter now calculates based on selection
//   get totalAmount(): number {
//     return this.violations
//       .filter(v => this.selectedViolationIds.has(v.id))
//       .reduce((sum, v) => sum + v.amount, 0);
//   }
//
//   // ✅ UPDATE: The payViolations method now uses the selected violations data
//   payViolations(): void {
//     const selectedIds = Array.from(this.selectedViolationIds);
//     const amountToPay = this.totalAmount;
//
//     console.log('Paying for violations:', selectedIds);
//     console.log('Total Amount:', amountToPay);
//
//     this.showAlert('Redirecting', `Redirecting to payment page for ${amountToPay} EGP...`, 'success');
//
//     setTimeout(() => {
//       this.router.navigate(['/payments', 'new-payment-request-id'], {
//         queryParams: { amount: amountToPay, items: selectedIds.join(',') }
//       });
//     }, 2000);
//   }
//
//   // ✅ UPDATE: searchAgain now also clears selections
//   searchAgain(): void {
//     this.showViolationsList = false;
//     this.violations = [];
//     this.selectedViolationIds.clear();
//     this.violationForm.reset();
//   }
//
//   showAlert(title: string, message: string, type: 'success' | 'error' = 'success') { this.alertTitle = title; this.alertMessage = message; this.alertType = type; this.isAlertVisible = true; }
//   hideAlert() { this.isAlertVisible = false; }
//   onCancel(): void { this.router.navigate(['/traffic-services']); }
//
//   private getMockViolations(): Violation[] {
//     return [
//       { id: 'V1001', date: '2025-08-15', type: 'Exceeding Speed Limit', location: 'Ring Road, Cairo', amount: 300, status: 'Unpaid', description: 'Speed recorded at 120 km/h in a 90 km/h zone.' },
//       { id: 'V1002', date: '2025-07-22', type: 'Illegal Parking', location: 'Tahrir Square, Cairo', amount: 150, status: 'Unpaid', description: 'Parking in a no-parking zone.' },
//       { id: 'V1003', date: '2025-05-10', type: 'Using Mobile Phone While Driving', location: '6th of October Bridge', amount: 100, status: 'Paid', description: 'Observed using a mobile phone.' },
//       { id: 'V1004', date: '2025-08-25', type: 'Not Wearing Seatbelt', location: 'Autostrad, Maadi', amount: 100, status: 'Unpaid', description: 'Driver was not wearing a seatbelt.' }
//     ];
//   }
// }



import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-traffic-violations',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './traffic-violations.html',
  styleUrls: ['./traffic-violations.css']
})
export class TrafficViolationsComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

  // You can add methods here for future functionality,
  // like fetching violation data or handling the "Apply Now" click.
  applyForService(): void {
    // This method would be triggered if the button were not disabled
    console.log('Apply for Pay Traffic Violation clicked!');
    // Implement actual service application logic here
    alert('This service is currently under development!');
  }
}
