// src/app/services/auth.interceptor.ts

import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // حقن (inject) للـ AuthService لجلب التوكن
  const authService = inject(AuthService);
  const authToken = authService.getToken();

  // لو التوكن موجود، استنسخ الطلب وأضف هيدر الـ Authorization
  if (authToken) {
    const clonedReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${authToken}`)
    });
    return next(clonedReq);
  }

  // لو لا يوجد توكن، مرّر الطلب الأصلي كما هو
  return next(req);
};
