import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const expectedRole = route.data['expectedRole'];

  // =================================================================
  // ===> START: اللوجيك الجديد للسماح للزائر برؤية الهوم <===
  // =================================================================
  // إذا كانت الصفحة تتطلب دور "مواطن" (مثل الهوم) والمستخدم ليس مسجلاً دخوله بعد،
  // اسمح له بالمرور ليرى الصفحة الرئيسية.
  if (expectedRole === 'CITIZEN' && !authService.isAuthenticated()) {
    return true; // ✅ السماح للزائر غير المسجل برؤية الهوم
  }
  // =================================================================
  // ===> END: نهاية اللوجيك المضاف <===
  // =================================================================


  // 2. تحقق مما إذا كان المستخدم مسجلاً (هذا الشرط الآن يأتي ثانياً)
  if (!authService.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }

  // 3. احصل على دور المستخدم الحالي
  const currentUser = authService.currentUser();
  const userRole = currentUser?.role.toUpperCase();

  // (اللوجيك المضاف في المرة السابقة لمنع الموظف/المدير)
  if (expectedRole === 'CITIZEN') {
    if (userRole === 'CITIZEN') {
      return true; // ✅ إذا كان مواطن مسجل، اسمح له بالدخول
    } else {
      // ❌ إذا كان موظف أو مدير يحاول دخول الهوم (بعد تسجيل الدخول)
      let userDashboard = '/';
      if (userRole === 'MANAGER') userDashboard = '/manager-dashboard';
      if (userRole === 'EMPLOYEE') userDashboard = '/employee-dashboard';

      router.navigate([userDashboard]);
      return false; // امنعه من الدخول
    }
  }

  // (اللوجيك القديم الخاص بباقي الصفحات)
  if (userRole === expectedRole) {
    return true;
  } else {
    let userDashboard = '/';
    if (userRole === 'MANAGER') userDashboard = '/manager-dashboard';
    if (userRole === 'EMPLOYEE') userDashboard = '/employee-dashboard';
    if (userRole === 'CITIZEN') userDashboard = '/citizen-dashboard';

    router.navigate([userDashboard]);
    return false;
  }
};

