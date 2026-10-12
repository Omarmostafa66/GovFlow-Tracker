import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: './reset-password.html',
  styleUrls: ['./reset-password.css']
})
export class ResetPasswordComponent implements OnInit {
  token: string | null = null;
  newPassword = '';
  confirmPassword = '';
  isLoading = false;

  showPopup = false;
  popupTitle = '';
  popupMessage = '';
  popupIcon = '';
  popupType: 'success' | 'error' | 'info' = 'info';
  isSuccess = false;

  isNewPasswordVisible: boolean = false;
  isConfirmPasswordVisible: boolean = false;

  passwordValidations = {
    minLength: { text: 'At least 8 characters long', valid: false },
    hasUppercase: { text: 'Contains an uppercase letter (A-Z)', valid: false },
    hasLowercase: { text: 'Contains a lowercase letter (a-z)', valid: false },
    hasNumber: { text: 'Contains a number (0-9)', valid: false },
    hasSpecialChar: { text: 'Contains a special character (!@#$...]', valid: false },
  };

  get isPasswordStrong(): boolean {
    return Object.values(this.passwordValidations).every(v => v.valid);
  }

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token');
    if (!this.token) {
      this.showErrorPopup('Error', 'No reset token found. The link may be invalid or has expired.');
    }
  }

  validatePassword(): void {
    const p = this.newPassword;
    this.passwordValidations.minLength.valid = p.length >= 8;
    this.passwordValidations.hasUppercase.valid = /[A-Z]/.test(p);
    this.passwordValidations.hasLowercase.valid = /[a-z]/.test(p);
    this.passwordValidations.hasNumber.valid = /[0-9]/.test(p);
    this.passwordValidations.hasSpecialChar.valid = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p);
  }

  resetPassword() {
    if (!this.isPasswordStrong) {
      this.showErrorPopup('Weak Password', 'Your new password does not meet all the required criteria.');
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.showErrorPopup('Error', 'Passwords do not match.');
      return;
    }
    if (!this.token) {
      this.showErrorPopup('Error', 'No reset token found. Please request a new password reset link.');
      return;
    }

    this.isLoading = true;
    this.authService.resetPassword(this.token, this.newPassword).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        this.isSuccess = true;
        this.showSuccessPopup('Success!', 'Your password has been reset successfully. You will be redirected to the login page shortly.');
      },
      error: (err: any) => {
        this.isLoading = false;
        this.isSuccess = false;
        const errorMessage = err.error?.message || 'Invalid or expired token. Please try requesting a new link.';
        this.showErrorPopup('Reset Failed', errorMessage);
      }
    });
  }

  toggleNewPasswordVisibility(): void {
    this.isNewPasswordVisible = !this.isNewPasswordVisible;
  }

  toggleConfirmPasswordVisibility(): void {
    this.isConfirmPasswordVisible = !this.isConfirmPasswordVisible;
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

  closePopupAndRedirect() {
    this.closePopup();
    if (this.isSuccess) {
      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 500);
    }
  }
}

