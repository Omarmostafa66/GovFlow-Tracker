import { Component, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [
    CommonModule, // Required for *ngIf
    RouterLink
  ],
  templateUrl: './footer.html',
  styleUrls: ['./footer.css']
})
export class Footer {

  public complaintMailto: string;
  public showFullFooter: boolean = true; // Default is to show the footer

  constructor(
    private router: Router,
    private authService: AuthService // Inject AuthService
  ) {
    this.complaintMailto = this.generateComplaintMailto();

    // =======================================================
    // ===> START: Corrected logic to control footer visibility <===
    // =======================================================
    // Use effect to react to login status changes
    effect(() => {
      const user = this.authService.currentUser();
      // Hide the full footer ONLY if the user is an Employee or Manager
      if (user && (user.role.toUpperCase() === 'EMPLOYEE' || user.role.toUpperCase() === 'MANAGER')) {
        this.showFullFooter = false;
      } else {
        // Show it for Citizens and non-logged-in users
        this.showFullFooter = true;
      }
    });
    // =======================================================
    // ===> END: End of corrected logic <===
    // =======================================================
  }

  scrollToServices(): void {
    if (this.router.url === '/') {
      const servicesElement = document.getElementById('services');
      if (servicesElement) {
        servicesElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else {
      this.router.navigate(['/']).then(() => {
        setTimeout(() => {
          const servicesElement = document.getElementById('services');
          if (servicesElement) {
            servicesElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
      });
    }
  }

  private generateComplaintMailto(): string {
    const email = 'govflowtracker@gmail.com';
    const subject = 'Official Complaint Submission';
    const bodyTemplate = [
      'Dear GovFlow Support Team,',
      '',
      'I would like to formally submit a complaint regarding the following issue:',
      '',
      '--- Complaint Information ---',
      'Full Name: [ENTER YOUR FULL NAME]',
      'National ID: [ENTER YOUR 14-DIGIT NATIONAL ID]',
      'Department/Service Concerned: [SPECIFY HERE]',
      '',
      'Complaint Details:',
      '[PLEASE DESCRIBE YOUR ISSUE CLEARLY AND IN DETAIL]',
      '',
      '--- Contact Information ---',
      'Phone Number: [ENTER YOUR PHONE NUMBER]',
      'Email Address: [ENTER YOUR EMAIL]',
      '',
      'I kindly request your assistance in resolving this matter at the earliest convenience.',
      '',
      'Thank you for your time and support.',
      '',
      'Sincerely,',
      '[YOUR NAME]'
    ].join('\n');

    const encodedSubject = encodeURIComponent(subject);
    const encodedBody = encodeURIComponent(bodyTemplate);
    return `https://mail.google.com/mail/?view=cm&fs=1&to=${email}&su=${encodedSubject}&body=${encodedBody}`;
  }
}

