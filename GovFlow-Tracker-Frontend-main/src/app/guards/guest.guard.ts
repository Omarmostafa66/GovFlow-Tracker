import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * هذا الحارس يمنع المستخدم المسجل دخوله من الوصول إلى صفحات
 * مثل تسجيل الدخول والتسجيل مرة أخرى.
 */
export const guestGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // تحقق مما إذا كان المستخدم مسجلاً دخوله
  if (authService.isAuthenticated()) {
    // إذا كان مسجلاً، لا تسمح له برؤية صفحة الدخول/التسجيل
    const user = authService.currentUser();
    let userDashboard = '/'; // المسار الافتراضي

    // أعد توجيهه إلى لوحة التحكم المناسبة لدوره
    if (user) {
      switch (user.role.toUpperCase()) {
        case 'CITIZEN':
          userDashboard = '/'; // المواطن يذهب للهوم
          break;
        case 'EMPLOYEE':
          userDashboard = '/employee-dashboard';
          break;
        case 'MANAGER':
          userDashboard = '/manager-dashboard';
          break;
      }
    }

    router.navigate([userDashboard]);
    return false; // امنع الوصول إلى المسار الحالي (مثل /login)
  }

  // إذا لم يكن مسجلاً، اسمح له بالمرور
  return true;
};
