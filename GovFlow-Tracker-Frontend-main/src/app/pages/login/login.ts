import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService, User } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink, CommonModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
})
export class LoginComponent implements OnInit {
  nationalId = '';
  email = '';
  password = '';
  role = 'citizen';
  rememberMe = false;
  isPasswordVisible = false;

  showPopup = false;
  popupTitle = '';
  popupMessage = '';
  popupIcon = '';
  popupType: 'success' | 'error' | 'warning' | 'info' = 'info';

  // ==========================================================
  // ✅ START: مفاتيح التخزين لتذكر بيانات الفورم
  // ==========================================================
  private readonly REMEMBER_ME_KEY = 'govflow_remember_me';
  private readonly REMEMBER_ID_KEY = 'govflow_remember_id';
  private readonly REMEMBER_ROLE_KEY = 'govflow_remember_role';
  // ==========================================================
  // ✅ END: نهاية الإضافة
  // ==========================================================


  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // ==========================================================
    // ✅ START: منطق استرجاع البيانات عند تحميل الصفحة
    // ==========================================================
    // 1. تحقق مما إذا كان المستخدم يريد "تذكرني"
    const isRemembered = localStorage.getItem(this.REMEMBER_ME_KEY) === 'true';
    if (isRemembered) {
      this.rememberMe = true;
      const savedRole = localStorage.getItem(this.REMEMBER_ROLE_KEY) || 'citizen';
      const savedIdentifier = localStorage.getItem(this.REMEMBER_ID_KEY) || '';

      this.role = savedRole;

      // 2. املأ الحقل الصحيح (ID أو Email) بناءً على الدور المحفوظ
      if (savedRole === 'citizen') {
        this.nationalId = savedIdentifier;
      } else {
        // (سيغطي هذا employee و manager حيث أنهما يستخدمان الإيميل)
        this.email = savedIdentifier;
      }
    }
    // ==========================================================
    // ✅ END: نهاية الإضافة
    // ==========================================================


    // هذا الكود خاص بمعالجة الدخول عبر رابط التفعيل (لا علاقة له بـ Remember Me)
    this.route.queryParams.subscribe(params => {
      const token = params['token'];
      const encodedUser = params['user'];

      if (token && encodedUser) {
        try {
          const userJson = atob(encodedUser);
          const user: User = JSON.parse(userJson);
          this.authService.handleVerificationLogin(token, user);
        } catch (error) {
          console.error('Failed to process verification login:', error);
          this.showErrorPopup('Verification Failed', 'There was an error logging you in automatically.');
        }
      }
    });
  }

  setRole(selectedRole: 'citizen' | 'employee') {
    this.role = selectedRole;
    this.nationalId = '';
    this.email = '';

    // عند تغيير الدور، امسح حقل كلمة السر (اختياري لكن جيد للأمان)
    // this.password = '';
  }

  login() {
    const identifier = (this.role === 'citizen' ? this.nationalId : this.email) ?? '';

    // ==========================================================
    // ✅ START: منطق حفظ أو مسح بيانات التذكر (قبل إرسال الطلب)
    // ==========================================================
    if (this.rememberMe) {
      // إذا تم تفعيل "تذكرني"، احفظ البيانات في localStorage
      localStorage.setItem(this.REMEMBER_ME_KEY, 'true');
      localStorage.setItem(this.REMEMBER_ID_KEY, identifier);
      localStorage.setItem(this.REMEMBER_ROLE_KEY, this.role);
    } else {
      // إذا لم يتم تفعيلها، امسح أي بيانات قديمة لضمان عدم ملء الفورم المرة القادمة
      localStorage.removeItem(this.REMEMBER_ME_KEY);
      localStorage.removeItem(this.REMEMBER_ID_KEY);
      localStorage.removeItem(this.REMEMBER_ROLE_KEY);
    }
    // ==========================================================
    // ✅ END: نهاية الإضافة
    // ==========================================================


    // استدعاء خدمة الدخول (هنا الخدمة ستقرر تخزين التوكن في session أو local بناء على rememberMe)
    this.authService.login(identifier, this.password, this.role, this.rememberMe).subscribe({
      next: (response: any) => {
        // لا نحتاج لكتابة كود هنا لأن الخدمة (AuthService) ستقوم
        // بحفظ التوكن وتوجيه المستخدم للداشبورد (عبر الـ tap operator)
      },
      error: (err) => {
        const errorMessage = err.error?.message || 'Please check your credentials and selected role.';
        this.showErrorPopup('Login Failed', errorMessage);
        console.error(err);
      }
    });
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

  togglePasswordVisibility() {
    this.isPasswordVisible = !this.isPasswordVisible;
  }
}
