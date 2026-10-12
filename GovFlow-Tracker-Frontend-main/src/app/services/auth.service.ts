// import { Injectable, signal, PLATFORM_ID, Inject } from '@angular/core';
// import { isPlatformBrowser } from '@angular/common';
// import { HttpClient } from '@angular/common/http';
// import { Router } from '@angular/router';
// import { Observable, tap } from 'rxjs';
// import { UserProfile } from './profile.service';
//
// export interface User extends UserProfile {
//   governorate: any;
//   role: string;
// }
//
// @Injectable({
//   providedIn: 'root'
// })
// export class AuthService {
//   private baseUrl = 'http://localhost:8080/api/auth';
//   currentUser = signal<User | null>(null);
//   private storage: Storage | null = null; // سيتم تحديده (localStorage أو sessionStorage)
//
//   constructor(
//     private http: HttpClient,
//     private router: Router,
//     @Inject(PLATFORM_ID) private platformId: Object
//   ) {
//     if (isPlatformBrowser(this.platformId)) {
//       this.loadUserFromStorage();
//     }
//   }
//
//   private loadUserFromStorage(): void {
//     if (!isPlatformBrowser(this.platformId)) {
//       return;
//     }
//
//     // 1. ابحث في localStorage (للمستخدم المتذكر)
//     let userJson = localStorage.getItem('user');
//     let token = localStorage.getItem('token');
//
//     if (userJson && token) {
//       this.storage = localStorage; // التخزين المستخدم هو الدائم
//       this.currentUser.set(JSON.parse(userJson));
//     } else {
//       // 2. ابحث في sessionStorage (للجلسة العادية)
//       userJson = sessionStorage.getItem('user');
//       token = sessionStorage.getItem('token');
//
//       if (userJson && token) {
//         this.storage = sessionStorage; // التخزين المستخدم هو المؤقت
//         this.currentUser.set(JSON.parse(userJson));
//       } else {
//         // 3. الافتراضي هو sessionStorage
//         this.storage = sessionStorage;
//       }
//     }
//   }
//
//   // يستقبل البارامتر الرابع
//   login(nationalIdOrEmail: string, password: string, role: string, rememberMe: boolean): Observable<any> {
//     const loginPayload = { nationalId: nationalIdOrEmail, password, role };
//
//     // حدد أين ستخزن التوكن بناء على اختيار المستخدم
//     if (isPlatformBrowser(this.platformId)) {
//       this.storage = rememberMe ? localStorage : sessionStorage;
//     }
//
//     interface LoginResponse {
//       token: string;
//       user: User;
//     }
//
//     return this.http.post<LoginResponse>(`${this.baseUrl}/login`, loginPayload).pipe(
//       tap(response => {
//         // سيخزن في المكان الصحيح (local أو session) بناء على ما تم تحديده أعلاه
//         if (response && response.token && response.user && this.storage) {
//           this.storage.setItem('token', response.token);
//           this.storage.setItem('user', JSON.stringify(response.user));
//           this.currentUser.set(response.user);
//           this.navigateToDashboard(response.user.role);
//         }
//       })
//     );
//   }
//
//   handleVerificationLogin(token: string, user: User): void {
//     if (token && user && isPlatformBrowser(this.platformId)) {
//       this.storage = sessionStorage; // التحقق من الإيميل لا يتم تذكره افتراضياً
//       this.storage.setItem('token', token);
//       this.storage.setItem('user', JSON.stringify(user));
//       this.currentUser.set(user);
//       this.navigateToDashboard(user.role);
//     }
//   }
//
//   updateCurrentUser(updatedProfile: Partial<User>): void {
//     const user = this.currentUser();
//     if (user && this.storage) {
//       const newUser = { ...user, ...updatedProfile };
//       this.currentUser.set(newUser);
//       this.storage.setItem('user', JSON.stringify(newUser));
//     }
//   }
//
//   getCurrentUserValue(): User | null {
//     return this.currentUser();
//   }
//
//   register(userData: any): Observable<any> {
//     return this.http.post<any>(`${this.baseUrl}/register`, userData);
//   }
//
//   resendVerificationLink(email: string): Observable<any> {
//     return this.http.post<any>(`${this.baseUrl}/resend-verification`, { email });
//   }
//
//   updatePendingRegistration(payload: any): Observable<any> {
//     return this.http.post<any>(`${this.baseUrl}/update-pending-registration`, payload);
//   }
//
//   // =======================================================
//   // ===> تم التعديل هنا ليعود إلى الهوم عند الخروج <===
//   // =======================================================
//   logout(): void {
//     if (isPlatformBrowser(this.platformId)) {
//       // امسح بيانات الجلسة (التوكن) من كلا المكانين
//       localStorage.removeItem('token');
//       localStorage.removeItem('user');
//       sessionStorage.removeItem('token');
//       sessionStorage.removeItem('user');
//       // هذا لن يمسح بيانات الفورم التي حفظناها في login.ts
//     }
//
//     this.storage = isPlatformBrowser(this.platformId) ? sessionStorage : null;
//     this.currentUser.set(null);
//     this.router.navigate(['/']); // <-- تم تغيير '/login' إلى '/'
//   }
//   // =======================================================
//   // ===> نهاية التعديل <===
//   // =======================================================
//
//   isAuthenticated(): boolean {
//     return !!this.storage?.getItem('token');
//   }
//
//   getToken(): string | null {
//     return this.storage?.getItem('token') ?? null;
//   }
//
//   forgotPassword(identifier: string): Observable<any> {
//     return this.http.post(`${this.baseUrl}/forgot-password`, { identifier });
//   }
//
//   resetPassword(token: string, newPassword: string): Observable<any> {
//     return this.http.post(`${this.baseUrl}/reset-password`, { token, newPassword }, { responseType: 'text' });
//   }
//
//   private navigateToDashboard(role: string): void {
//     let route: string;
//     switch (role.toUpperCase()) {
//       case 'CITIZEN':
//         route = '/'; // <-- (اللوجيك الجديد) المواطن يذهب إلى الهوم (الصفحة الرئيسية)
//         break;
//       case 'EMPLOYEE':
//         route = '/employee-dashboard';
//         break;
//       case 'MANAGER':
//         route = '/manager-dashboard';
//         break;
//       default:
//         route = '/';
//     }
//     this.router.navigate([route]);
//   }
// }
//




import { Injectable, signal, PLATFORM_ID, Inject, NgZone } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, BehaviorSubject, fromEvent, merge, timer } from 'rxjs';
import { switchMap, startWith } from 'rxjs/operators';
import { UserProfile } from './profile.service';

export interface User extends UserProfile {
  governorate: any;
  role: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseUrl = 'http://localhost:8080/api/auth';
  currentUser = signal<User | null>(null);
  private storage: Storage | null = null;

  // =======================================================
  // ===> START: إضافة منطق تسجيل الخروج التلقائي <===
  // =======================================================
  private inactivityTimer: any;
  private countdownTimer: any;
  private readonly INACTIVITY_TIMEOUT_MS = 5 * 24 * 60 * 60 * 1000; // 5 أيام
  private readonly COUNTDOWN_SECONDS = 30; // 30 ثانية

  // BehaviorSubjects للتحكم في حالة الـ popup والعد التنازلي من أي مكون
  public showInactivityPopup = new BehaviorSubject<boolean>(false);
  public countdownValue = new BehaviorSubject<number>(this.COUNTDOWN_SECONDS);
  // =======================================================
  // ===> END: نهاية الإضافة <===
  // =======================================================

  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object,
    private ngZone: NgZone // أضفنا NgZone لضمان تشغيل المؤقتات خارج دورة Angular
  ) {
    if (isPlatformBrowser(this.platformId)) {
      this.loadUserFromStorage();
      // إذا كان المستخدم مسجلاً دخوله بالفعل عند تحميل الصفحة، ابدأ المؤقت
      if (this.isAuthenticated()) {
        this.startInactivityTimer();
      }
    }
  }

  private loadUserFromStorage(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    let userJson = localStorage.getItem('user');
    let token = localStorage.getItem('token');

    if (userJson && token) {
      this.storage = localStorage;
      this.currentUser.set(JSON.parse(userJson));
    } else {
      userJson = sessionStorage.getItem('user');
      token = sessionStorage.getItem('token');
      if (userJson && token) {
        this.storage = sessionStorage;
        this.currentUser.set(JSON.parse(userJson));
      } else {
        this.storage = sessionStorage;
      }
    }
  }

  login(nationalIdOrEmail: string, password: string, role: string, rememberMe: boolean, jobRoleCode?: string): Observable<any> {
    const loginPayload = { nationalId: nationalIdOrEmail, email: nationalIdOrEmail, password, role, jobRoleCode };

    if (isPlatformBrowser(this.platformId)) {
      this.storage = rememberMe ? localStorage : sessionStorage;
    }

    interface LoginResponse {
      token: string;
      user: User;
    }

    return this.http.post<LoginResponse>(`${this.baseUrl}/login`, loginPayload).pipe(
      tap(response => {
        if (response && response.token && response.user && this.storage) {
          this.storage.setItem('token', response.token);
          this.storage.setItem('user', JSON.stringify(response.user));
          this.currentUser.set(response.user);
          this.navigateToDashboard(response.user.role);
          // ✅ عند نجاح تسجيل الدخول، ابدأ مؤقت عدم النشاط
          this.startInactivityTimer();
        }
      })
    );
  }

  handleVerificationLogin(token: string, user: User): void {
    if (token && user && isPlatformBrowser(this.platformId)) {
      this.storage = sessionStorage;
      this.storage.setItem('token', token);
      this.storage.setItem('user', JSON.stringify(user));
      this.currentUser.set(user);
      this.navigateToDashboard(user.role);
      // ✅ عند نجاح تسجيل الدخول عبر الرابط، ابدأ مؤقت عدم النشاط
      this.startInactivityTimer();
    }
  }

  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
    }

    this.storage = isPlatformBrowser(this.platformId) ? sessionStorage : null;
    this.currentUser.set(null);
    // ✅ عند تسجيل الخروج، أوقف جميع المؤقتات وأخفِ الـ Popup
    this.stopInactivityTimer();
    this.showInactivityPopup.next(false);
    this.router.navigate(['/']);
  }

  // =======================================================
  // ===> START: دوال جديدة لإدارة مؤقت عدم النشاط <===
  // =======================================================
  private startInactivityTimer(): void {
    // تأكد من أننا في المتصفح وأن المستخدم مسجل
    if (!isPlatformBrowser(this.platformId) || !this.isAuthenticated()) {
      return;
    }

    // استمع لأحداث نشاط المستخدم
    const activityEvents$ = merge(
      fromEvent(window, 'mousemove'),
      fromEvent(window, 'mousedown'),
      fromEvent(window, 'keydown'),
      fromEvent(window, 'touchstart')
    );

    // ngZone.runOutsideAngular لتجنب إطلاق Change Detection مع كل حركة
    this.ngZone.runOutsideAngular(() => {
      this.inactivityTimer = activityEvents$.pipe(
        startWith(0), // ابدأ فوراً
        switchMap(() => timer(this.INACTIVITY_TIMEOUT_MS))
      ).subscribe(() => {
        // ngZone.run لإعادة الكود إلى سياق Angular عند عرض الـ Popup
        this.ngZone.run(() => {
          this.showLogoutWarning();
        });
      });
    });
  }

  private stopInactivityTimer(): void {
    if (this.inactivityTimer) {
      this.inactivityTimer.unsubscribe();
      this.inactivityTimer = null;
    }
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
  }

  private showLogoutWarning(): void {
    this.showInactivityPopup.next(true);
    this.countdownValue.next(this.COUNTDOWN_SECONDS);

    this.countdownTimer = setInterval(() => {
      const currentValue = this.countdownValue.value - 1;
      this.countdownValue.next(currentValue);
      if (currentValue <= 0) {
        clearInterval(this.countdownTimer);
        this.logout();
      }
    }, 1000);
  }

  public continueSession(): void {
    this.showInactivityPopup.next(false);
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
    // إعادة تشغيل المؤقت الرئيسي بعد أن أكد المستخدم أنه نشط
    this.startInactivityTimer();
  }
  // =======================================================
  // ===> END: نهاية الدوال الجديدة <===
  // =======================================================

  updateCurrentUser(updatedProfile: Partial<User>): void {
    const user = this.currentUser();
    if (user && this.storage) {
      const newUser = { ...user, ...updatedProfile };
      this.currentUser.set(newUser);
      this.storage.setItem('user', JSON.stringify(newUser));
    }
  }

  getCurrentUserValue(): User | null {
    return this.currentUser();
  }

  register(userData: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/register`, userData);
  }

  resendVerificationLink(email: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/resend-verification`, { email });
  }

  updatePendingRegistration(payload: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/update-pending-registration`, payload);
  }

  isAuthenticated(): boolean {
    return !!this.storage?.getItem('token');
  }

  getToken(): string | null {
    return this.storage?.getItem('token') ?? null;
  }

  forgotPassword(identifier: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/forgot-password`, { identifier });
  }

  resetPassword(token: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/reset-password`, { token, newPassword }, { responseType: 'text' });
  }

  private navigateToDashboard(role: string): void {
    let route: string;
    switch (role.toUpperCase()) {
      case 'CITIZEN':
        route = '/';
        break;
      case 'EMPLOYEE':
        route = '/employee-dashboard';
        break;
      case 'MANAGER':
        route = '/manager-dashboard';
        break;
      default:
        route = '/';
    }
    this.router.navigate([route]);
  }
}
