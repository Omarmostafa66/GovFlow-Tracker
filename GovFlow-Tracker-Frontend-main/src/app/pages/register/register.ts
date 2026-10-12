import { Component, ElementRef, HostListener, ViewChild, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgModel } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

interface Country {
  code: string; name: string; dialCode: string; flag: string; maxLength: number;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink, CommonModule],
  templateUrl: './register.html',
  styleUrls: ['./register.css'],
})
export class RegisterComponent implements OnInit {
  fullName = '';
  nationalId = '';
  phoneNumber = '';
  address = '';
  email = '';
  password = '';
  confirmPassword = '';
  role = 'citizen';
  jobRoleCode = '';
  showRoleCode = false;

  passwordVisible = false;
  confirmPasswordVisible = false;

  countries: Country[] = [
    { code: 'EG', name: 'Egypt', dialCode: '+20', flag: 'assets/flags/eg.png', maxLength: 10 },
    { code: 'SA', name: 'Saudi Arabia', dialCode: '+966', flag: 'assets/flags/sa.png', maxLength: 9 },
  ];
  selectedCountry: Country = this.countries[0];

  isDropdownOpen = false;
  @ViewChild('phoneWrapper') phoneWrapper!: ElementRef;
  @ViewChild('passwordInput') passwordInput!: NgModel;

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

  isPhoneValid: boolean = true;
  phoneErrorMessage: string = '';

  showPopup = false;
  popupTitle = '';
  popupMessage = '';
  popupIcon = '';
  popupType: 'success' | 'error' | 'warning' | 'info' = 'info';

  private _registrationState: 'form' | 'pending' = 'form';
  get registrationState(): 'form' | 'pending' {
    return this._registrationState;
  }

  // ==========================================================
  // ✅ START: هذا هو التعديل الخاص بـ "اللينك المزدوج"
  // قمنا بحذف استدعاء resendLink(true) التلقائي
  // ==========================================================
  set registrationState(value: 'form' | 'pending') {
    this._registrationState = value;

    // (تم حذف سطر setTimeout لإعادة الإرسال التلقائي من هنا)
    // الآن، عند التسجيل، سيرسل الباك إند لينك واحد فقط، وستنتقل الواجهة لهذه الحالة لعرض الرسالة.
    // إذا أراد المستخدم إعادة الإرسال، يجب أن يضغط على الزر بنفسه.

    // (هذا السطر مطلوب للتعامل مع السيناريو الآخر - وهو الضغط على زر "Resend" من الـ Popup)
    if (value === 'pending' && this.showConfirmationPopup === false) {
      // إذا انتقلنا إلى pending ولم نكن في الـ popup (أي تسجيل عادي)، أظهر رسالة الإرسال الأولى
      this.resendMessage = 'Sending verification link...';
      // ثم قم بتشغيل الـ Cooldown ليظهر العداد (هذا يمنع المستخدم من الضغط على "Resend" مباشرة)
      this.startCooldown();
      // ملاحظة: قمنا بتعديل دالة resendLink لـ *لا* ترسل تلقائياً إذا كانت (isAutomatic = true)
    }
  }
  // ==========================================================
  // ✅ END: نهاية التعديل
  // ==========================================================

  isLoading = false;
  showConfirmationPopup = false;

  resendDisabled = false;
  resendMessage = '';
  isResendError = false;
  private resendAttempts = 0;
  private readonly MAX_RESEND_ATTEMPTS = 3;
  private readonly COOLDOWN_SECONDS = 120; // 2 minutes
  private countdownInterval: any;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void { }

  formatFullName(): void {
    this.fullName = this.fullName.replace(/[^a-zA-Z\u0600-\u06FF\s]/g, '');
  }

  formatNationalId(): void {
    this.nationalId = this.nationalId.replace(/\D/g, '');
  }

  validatePassword(): void {
    const p = this.password;
    this.passwordValidations.minLength.valid = p.length >= 8;
    this.passwordValidations.hasUppercase.valid = /[A-Z]/.test(p);
    this.passwordValidations.hasLowercase.valid = /[a-z]/.test(p);
    this.passwordValidations.hasNumber.valid = /[0-9]/.test(p);
    this.passwordValidations.hasSpecialChar.valid = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p);
  }

  togglePasswordVisibility(): void { this.passwordVisible = !this.passwordVisible; }
  toggleConfirmPasswordVisibility(): void { this.confirmPasswordVisible = !this.confirmPasswordVisible; }

  toggleDropdown() { this.isDropdownOpen = !this.isDropdownOpen; }

  selectCountry(country: Country) {
    this.selectedCountry = country;
    this.phoneNumber = '';
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
    // ... (هذا الكود صحيح كما هو)
    if (!this.phoneNumber) {
      this.isPhoneValid = true;
      this.phoneErrorMessage = '';
      return;
    }
    const country = this.selectedCountry;
    const number = this.phoneNumber;
    if (number.length !== country.maxLength) {
      this.isPhoneValid = false;
      this.phoneErrorMessage = `${country.name} phone numbers must be exactly ${country.maxLength} digits long.`;
      return;
    }
    const validationRules: { [key: string]: { regex: RegExp; message: string } } = {
      EG: { regex: /^(1[0125])\d{8}$/, message: 'A valid Egyptian number must be 10 digits and start with 10, 11, 12, or 15.' },
      SA: { regex: /^5\d{8}$/, message: 'A valid Saudi number must be 9 digits and start with 5.' }
    };
    const rule = validationRules[country.code];
    if (rule && rule.regex.test(number)) {
      this.isPhoneValid = true; this.phoneErrorMessage = '';
    } else {
      this.isPhoneValid = false;
      this.phoneErrorMessage = rule ? rule.message : `Invalid phone number format for ${country.name}.`;
    }
  }

  validateEgyptianNationalId(id: string): boolean {
    // ... (هذا الكود صحيح كما هو)
    if (!/^[23][0-9]{13}$/.test(id)) return false;
    const century = id.charAt(0) === '2' ? 1900 : 2000;
    const year = parseInt(id.substring(1, 3), 10) + century;
    const month = parseInt(id.substring(3, 5), 10);
    const day = parseInt(id.substring(5, 7), 10);
    const governorateCode = parseInt(id.substring(7, 9), 10);
    const date = new Date(year, month - 1, day);
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return false;
    const validGovernorates = [1,2,3,4,11,12,13,14,15,16,17,18,19,21,22,23,24,25,26,27,28,29,31,32,33,34,35];
    if (!validGovernorates.includes(governorateCode)) return false;
    return true;
  }

  register() {
    // ... (هذا الكود صحيح كما هو - يعالج الضغط المزدوج)
    if (this.isLoading) {
      return;
    }
    this.isLoading = true;

    const nameParts = this.fullName.trim().split(/\s+/);
    if (nameParts.length < 4) {
      this.showErrorPopup('Validation Error', 'Full name must contain at least 4 words.');
      this.isLoading = false;
      return;
    }
    if (!this.validateEgyptianNationalId(this.nationalId)) {
      this.showErrorPopup('Validation Error','Please enter a valid Egyptian National ID (14 digits, correct date and governorate).');
      this.isLoading = false;
      return;
    }
    this.validatePhone();
    if (!this.isPhoneValid) {
      this.showErrorPopup('Validation Error', this.phoneErrorMessage);
      this.isLoading = false;
      return;
    }
    if (!this.isPasswordStrong) {
      this.showErrorPopup('Validation Error', 'Password does not meet all the required criteria.');
      this.isLoading = false;
      return;
    }
    if (this.password !== this.confirmPassword) {
      this.showErrorPopup('Validation Error', 'Passwords do not match.');
      this.isLoading = false;
      return;
    }
    // ... (نهاية كود التحقق)

    const userPayload = {
      fullName: this.fullName,
      nationalId: this.nationalId,
      phoneNumber: this.selectedCountry.dialCode + this.phoneNumber,
      address: this.address,
      email: this.email,
      password: this.password,
      role: this.role,
      jobRoleCode: this.jobRoleCode,
    };

    this.authService.register(userPayload).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.registrationState = 'pending'; // <-- هذا سيشغل الـ setter المعدل (لن يرسل لينك ثاني)
      },
      error: (err) => {
        this.isLoading = false;
        if (err.status === 409) {
          this.showConfirmationPopup = true; // <-- هذا يعرض الـ Popup (وهو صحيح)
        } else {
          console.error('Registration Error:', err);
          const errorMessage = err.error?.message || 'An unknown error occurred during registration.';
          this.showErrorPopup('Registration Failed', errorMessage);
        }
      },
    });
  }

  handleConfirmation(shouldUpdate: boolean) {
    this.showConfirmationPopup = false;
    this.isLoading = true;

    if (shouldUpdate) {
      // (هذا الكود صحيح - يستدعي الخدمة المعدلة)
      const userPayload = {
        fullName: this.fullName,
        nationalId: this.nationalId,
        phoneNumber: this.selectedCountry.dialCode + this.phoneNumber,
        address: this.address,
        email: this.email,
        password: this.password,
        role: this.role,
        jobRoleCode: this.jobRoleCode,
      };

      this.authService.updatePendingRegistration(userPayload).subscribe({
        next: () => {
          this.isLoading = false;
          // سنقوم باستدعاء resendLink يدوياً هنا لضمان الإرسال *بعد* التحديث
          this.resendLink(true, true); // (إرسال تلقائي ولكن بعد التحديث)
          this.registrationState = 'pending'; // الانتقال للحالة بدون إرسال مزدوج
        },
        error: (err) => {
          this.isLoading = false;
          const errorMessage = err.error?.message || 'Failed to update account.';
          this.showErrorPopup('Update Failed', errorMessage);
        }
      });
    } else {
      // إذا اختار "Resend Link"
      this.isLoading = false;
      // استدعاء دالة الإرسال يدوياً (ليس تلقائي، هذا طلب صريح من المستخدم)
      this.resendLink(false);
      this.registrationState = 'pending'; // الانتقال للحالة
    }
  }

  // --- START: تعديل دالة إعادة الإرسال ---
  // (isAutomatic: هل هذا إرسال تلقائي أم ضغطة زر؟)
  // (forceSend: هل يجب أن نرسل حتى لو كان تلقائياً؟ (يستخدم في سيناريو التحديث))
  resendLink(isAutomatic: boolean = false, forceSend: boolean = false) {
    if (this.resendDisabled) return;

    // لا ترسل تلقائياً عند تحميل الصفحة، فقط اعرض العداد (كما عدلنا في الـ setter)
    if (isAutomatic && !forceSend) {
      this.resendMessage = 'A verification link has been sent.'; // هذه هي الرسالة بعد التسجيل الأول
      this.startCooldown(); // ابدأ العداد فقط
      return;
    }

    // لا نزيد عدد المحاولات في الإرسال التلقائي (الخاص بالتحديث)
    if (!isAutomatic) {
      this.resendAttempts++;
    }

    if (this.resendAttempts >= this.MAX_RESEND_ATTEMPTS) {
      this.resendMessage = 'Maximum resend attempts reached. Please try again in an hour.';
      this.isResendError = true;
      this.resendDisabled = true;
      return;
    }

    this.isLoading = true;
    this.resendDisabled = true;
    this.isResendError = false;
    this.resendMessage = 'Sending verification link...';

    this.authService.resendVerificationLink(this.email).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.resendMessage = response.message || 'A new link has been sent successfully.';
        this.startCooldown();
      },
      error: (err) => {
        this.isLoading = false;
        this.resendDisabled = false;
        if (!isAutomatic) {
          this.resendAttempts--;
        }
        this.resendMessage = err.error?.message || 'Failed to resend link.';
        this.isResendError = true;
      }
    });
  }

  startCooldown() {
    // ... (هذا الكود صحيح كما هو)
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
    let countdown = this.COOLDOWN_SECONDS;
    this.resendDisabled = true;
    this.countdownInterval = setInterval(() => {
      this.resendMessage = `You can resend the link again in ${countdown} seconds.`;
      countdown--;
      if (countdown < 0) {
        clearInterval(this.countdownInterval);
        this.resendMessage = '';
        this.resendDisabled = false;
      }
    }, 1000);
  }
  // --- END: نهاية التعديل ---

  toggleRoleCode() { this.showRoleCode = this.role !== 'citizen'; }

  showSuccessPopup(title: string, message: string) {
    this.popupTitle = title; this.popupMessage = message; this.popupIcon = 'fas fa-check-circle'; this.popupType = 'success'; this.showPopup = true;
  }
  showErrorPopup(title: string, message: string) {
    this.popupTitle = title; this.popupMessage = message; this.popupIcon = 'fas fa-exclamation-triangle'; this.popupType = 'error'; this.showPopup = true;
  }
  closePopup() {
    this.showPopup = false;
  }
}
