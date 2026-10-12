import { ApplicationConfig, importProvidersFrom } from '@angular/core';
// ✅ 1. تم استيراد "withInMemoryScrolling" هنا
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ServiceRequestService } from './services/service-request.service';
import { authInterceptor } from './services/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [

    // ✅ 2. تم تعديل "provideRouter" ليستخدم الإضافة الجديدة
    provideRouter(
      routes,
      withInMemoryScrolling({
        scrollPositionRestoration: 'top' // هذا السطر يحل مشكلة بدء الصفحة من المنتصف
      })
    ),

    // هذا الكود الخاص بك كما هو
    provideHttpClient(withInterceptors([authInterceptor])),

    importProvidersFrom(FormsModule)
    // لا داعي لإضافة ServiceRequestService هنا لأنها injectables
  ]
};
