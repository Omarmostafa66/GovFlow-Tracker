import { Component, OnInit, WritableSignal, ElementRef, ViewChild, HostListener } from '@angular/core';
import { CommonModule, KeyValuePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ProfileService, UserProfile } from '../../services/profile.service';
import { AuthService, User } from '../../services/auth.service';

// MODIFICATION START: Added Country interface
interface Country {
  code: string; name: string; dialCode: string; flag: string; maxLength: number;
}
// MODIFICATION END

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, KeyValuePipe],
  templateUrl: './profile.html',
  styleUrls: ['./profile.css']
})
export class ProfileComponent implements OnInit {
  userProfile: UserProfile = {
    id: 0,
    fullName: '',
    email: '',
    phoneNumber: '',
    department: '',
    position: '',
    avatar: '',
    createdAt: new Date(),
    nationalId: '',
    address: '',
    employeeCode: '',
    notifications: { email: true, sms: true, marketing: false }
  };

  currentUser: WritableSignal<User | null>;

  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  isEditing = false;
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  isLoading = false;
  toastMessage: string | null = null;
  toastType: 'success' | 'error' | null = null;
  showConfirmationPopup = false;
  confirmationTitle = '';
  confirmationMessage = '';
  private onConfirmAction: (() => void) | null = null;
  newPasswordVisible = false;
  confirmPasswordVisible = false;
  passwordValidations = {
    length: { text: 'At least 8 characters long', valid: false },
    uppercase: { text: 'Contains an uppercase letter', valid: false },
    lowercase: { text: 'Contains a lowercase letter', valid: false },
    number: { text: 'Contains a number', valid: false },
    special: { text: 'Contains a special character (!@#$%^&*)', valid: false }
  };
  currentPasswordVisible: boolean = false;

  // MODIFICATION START: Added properties for phone input
  countries: Country[] = [
    { code: 'EG', name: 'Egypt', dialCode: '+20', flag: 'assets/flags/eg.png', maxLength: 10 },
    { code: 'SA', name: 'Saudi Arabia', dialCode: '+966', flag: 'assets/flags/sa.png', maxLength: 9 },
  ];
  selectedCountry: Country = this.countries[0];
  localPhoneNumber: string = '';
  isPhoneValid: boolean = true;
  phoneErrorMessage: string = '';
  isDropdownOpen = false;
  @ViewChild('phoneWrapper') phoneWrapper!: ElementRef;
  // MODIFICATION END

  constructor(
    private profileService: ProfileService,
    private router: Router,
    private authService: AuthService
  ) {
    this.currentUser = this.authService.currentUser;
  }

  ngOnInit(): void {
    this.loadUserProfile();
  }

  private showToast(message: string, type: 'success' | 'error'): void {
    this.toastMessage = message;
    this.toastType = type;
    setTimeout(() => { this.toastMessage = null; this.toastType = null; }, 4000);
  }

  loadUserProfile(): void {
    this.isLoading = true;
    this.profileService.getUserProfile().subscribe({
      next: (profile) => {
        this.userProfile = profile;
        this.parsePhoneNumber(); // MODIFICATION: Parse phone number on load
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading profile:', error);
        this.showToast('Failed to load profile data.', 'error');
        this.isLoading = false;
      }
    });
  }

  // MODIFICATION START: New method to parse full phone number
  private parsePhoneNumber(): void {
    const fullNumber = this.userProfile.phoneNumber;
    if (!fullNumber) {
      this.selectedCountry = this.countries[0];
      this.localPhoneNumber = '';
      return;
    }

    const matchedCountry = this.countries.find(c => fullNumber.startsWith(c.dialCode));

    if (matchedCountry) {
      this.selectedCountry = matchedCountry;
      this.localPhoneNumber = fullNumber.substring(matchedCountry.dialCode.length);
    } else {
      // Default fallback
      this.selectedCountry = this.countries[0];
      this.localPhoneNumber = fullNumber.replace(this.countries[0].dialCode, '');
    }
  }
  // MODIFICATION END

  enableEditing(): void {
    this.isEditing = true;
    this.parsePhoneNumber(); // Ensure local phone number is correctly set on edit
    this.currentPassword = '';
    this.newPassword = '';
    this.confirmPassword = '';
    this.validatePassword();
  }

  cancelEditing(): void {
    this.isEditing = false;
    this.selectedFile = null;
    this.previewUrl = null;
    this.currentPassword = '';
    this.newPassword = '';
    this.confirmPassword = '';
    this.loadUserProfile(); // This will reload and re-parse the phone number
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.match('image.*')) { this.showToast('Please select an image file.', 'error'); return; }
      if (file.size > 2 * 1024 * 1024) { this.showToast('Image size should be less than 2MB.', 'error'); return; }
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = () => { this.previewUrl = reader.result as string; };
      reader.readAsDataURL(file);
    }
  }

  toggleCurrentPasswordVisibility(): void {
    this.currentPasswordVisible = !this.currentPasswordVisible;
  }

  updatePassword(): void {
    if (!this.isPasswordValid()) {
      this.showToast('Please ensure the new password meets all criteria and matches the confirmation.', 'error');
      return;
    }

    this.isLoading = true;
    this.profileService.changePassword(this.currentPassword, this.newPassword).subscribe({
      next: (response) => {
        this.showToast(response.message, 'success');
        this.isLoading = false;
        this.currentPassword = '';
        this.newPassword = '';
        this.confirmPassword = '';
        this.validatePassword();
      },
      error: (error) => {
        console.error('Error changing password:', error);
        this.showToast(error.error?.message || 'Error changing password. Check current password.', 'error');
        this.isLoading = false;
      }
    });
  }

  saveProfile(): void {
    // MODIFICATION START: Validate phone before saving
    this.validatePhone();
    if (!this.isPhoneValid) {
      this.showToast(this.phoneErrorMessage, 'error');
      return;
    }
    // Re-combine phone number before sending
    this.userProfile.phoneNumber = this.selectedCountry.dialCode + this.localPhoneNumber;
    // MODIFICATION END

    this.isLoading = true;
    this.profileService.updateProfile(this.userProfile, this.selectedFile).subscribe({
      next: (updatedProfile) => {
        this.userProfile = updatedProfile;
        this.parsePhoneNumber(); // Re-parse after successful save
        this.isEditing = false;
        this.selectedFile = null;
        this.previewUrl = null;
        this.showToast('Profile updated successfully!', 'success');
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error updating profile:', error);
        this.showToast('Error updating profile. Please try again.', 'error');
        this.isLoading = false;
      }
    });
  }

  // MODIFICATION START: Copied phone input methods from register component
  toggleDropdown() { this.isDropdownOpen = !this.isDropdownOpen; }

  selectCountry(country: Country) {
    this.selectedCountry = country;
    this.localPhoneNumber = '';
    this.isPhoneValid = true;
    this.isDropdownOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.isDropdownOpen && this.phoneWrapper && this.phoneWrapper.nativeElement && !this.phoneWrapper.nativeElement.contains(event.target)) {
      this.isDropdownOpen = false;
    }
  }

  validatePhone() {
    if (!this.localPhoneNumber) {
      this.isPhoneValid = false;
      this.phoneErrorMessage = 'Phone number is required.';
      return;
    }
    const country = this.selectedCountry;
    const number = this.localPhoneNumber;
    if (number.length !== country.maxLength) {
      this.isPhoneValid = false;
      this.phoneErrorMessage = `${country.name} phone numbers must be ${country.maxLength} digits.`;
      return;
    }
    const validationRules: { [key: string]: { regex: RegExp; message: string } } = {
      EG: { regex: /^(1[0125])\d{8}$/, message: 'A valid Egyptian number starts with 10, 11, 12, or 15.' },
      SA: { regex: /^5\d{8}$/, message: 'A valid Saudi number starts with 5.' }
    };
    const rule = validationRules[country.code];
    if (rule && rule.regex.test(number)) {
      this.isPhoneValid = true; this.phoneErrorMessage = '';
    } else {
      this.isPhoneValid = false;
      this.phoneErrorMessage = rule ? rule.message : `Invalid format for ${country.name}.`;
    }
  }
  // MODIFICATION END

  removeAvatar(): void {
    this.confirmationTitle = 'Confirm Deletion';
    this.confirmationMessage = 'Are you sure you want to remove your profile picture? This action cannot be undone.';
    this.onConfirmAction = this.proceedWithAvatarRemoval.bind(this);
    this.showConfirmationPopup = true;
  }

  private proceedWithAvatarRemoval(): void {
    this.isLoading = true;
    this.profileService.deleteAvatar().subscribe({
      next: () => {
        this.userProfile.avatar = '';
        this.previewUrl = null;
        this.selectedFile = null;
        this.showToast('Avatar removed successfully.', 'success');
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error removing avatar:', err);
        this.showToast('Failed to remove avatar.', 'error');
        this.isLoading = false;
      }
    });
  }

  onConfirm(): void {
    if (this.onConfirmAction) { this.onConfirmAction(); }
    this.closeConfirmationPopup();
  }

  closeConfirmationPopup(): void {
    this.showConfirmationPopup = false;
    this.onConfirmAction = null;
  }

  onNotificationChange(type: keyof typeof this.userProfile.notifications, event: any): void {
    if (this.isEditing) { this.userProfile.notifications[type] = event.target.checked; }
  }

  getInitials(): string {
    return this.userProfile.fullName?.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || '';
  }

  toggleNewPasswordVisibility(): void { this.newPasswordVisible = !this.newPasswordVisible; }
  toggleConfirmPasswordVisibility(): void { this.confirmPasswordVisible = !this.confirmPasswordVisible; }

  validatePassword(): void {
    const pass = this.newPassword;
    this.passwordValidations.length.valid = pass.length >= 8;
    this.passwordValidations.uppercase.valid = /[A-Z]/.test(pass);
    this.passwordValidations.lowercase.valid = /[a-z]/.test(pass);
    this.passwordValidations.number.valid = /[0-9]/.test(pass);
    this.passwordValidations.special.valid = /[!@#$%^&*]/.test(pass);
  }

  isPasswordValid(): boolean {
    if (!this.currentPassword || this.newPassword !== this.confirmPassword) {
      return false;
    }
    return Object.values(this.passwordValidations).every(rule => rule.valid);
  }
}
