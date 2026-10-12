import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // التحقق مما إذا كان المستخدم مسجلاً
  if (authService.isAuthenticated()) {
    // التحقق من أن دور المستخدم مواطن أو موظف أو مدير
    const user = authService.currentUser();
    if (
      user &&
      ['CITIZEN', 'EMPLOYEE', 'MANAGER'].includes(user.role.toUpperCase())
    ) {
      return true; // السماح بالوصول
    }
  }

  // إذا لم يكن مسجلاً أو لم يكن له دور مسموح، قم بإعادة توجيهه لصفحة الدخول
  router.navigate(['/login']);
  return false;
};
