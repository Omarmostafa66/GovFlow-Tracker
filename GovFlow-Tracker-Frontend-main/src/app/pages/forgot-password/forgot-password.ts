import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: './forgot-password.html',
  styleUrls: ['./forgot-password.css']
})
export class ForgotPasswordComponent {
  identifier: string = '';
  resetMethod: 'email' | 'nationalId' = 'email';
  isLoading: boolean = false;

  showPopup = false;
  popupTitle = '';
  popupMessage = '';
  popupIcon = '';
  popupType: 'success' | 'error' | 'info' = 'info';

  constructor(private authService: AuthService) {}

  setResetMethod(method: 'email' | 'nationalId') {
    this.resetMethod = method;
    this.identifier = '';
  }

  requestReset() {
    this.isLoading = true;
    this.authService.forgotPassword(this.identifier).subscribe({
      next: (response: any) => {
        // --- THIS IS THE SUCCESS POPUP ---
        // This block only runs if the backend confirms the user exists and sends the email.
        this.isLoading = false;
        this.showSuccessPopup('Check Your Email', 'A password reset link has been sent to the email address associated with this account.');
      },
      error: (err: any) => {
        this.isLoading = false;
        // --- START: MODIFICATION ---
        // Check if the error status is 404 (Not Found)
        if (err.status === 404) {
          // --- THIS IS THE "ACCOUNT NOT FOUND" POPUP ---
          this.showErrorPopup('Account Not Found', 'No account was found with the provided credentials. Please check your input and try again.');
        } else {
          // For any other unexpected server error
          this.showErrorPopup('An Error Occurred', 'Something went wrong. Please try again later.');
        }
        // --- END: MODIFICATION ---
        console.error('Forgot password error:', err);
      }
    });
  }

  showSuccessPopup(title: string, message: string) {
    this.popupTitle = title;
    this.popupMessage = message;
    this.popupIcon = 'fas fa-check-circle';
    this.popupType = 'success';
    this.showPopup = true;
  }

  showErrorPopup(title: string, message: string) {
    this.popupTitle = title;
    this.popupMessage = message;
    this.popupIcon = 'fas fa-exclamation-triangle';
    this.popupType = 'error';
    this.showPopup = true;
  }

  closePopup() {
    this.showPopup = false;
  }
}
