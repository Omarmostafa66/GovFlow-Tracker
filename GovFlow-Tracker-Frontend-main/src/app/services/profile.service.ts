// import { Injectable } from '@angular/core';
// import { HttpClient, HttpHeaders } from '@angular/common/http';
// import { Observable, tap } from 'rxjs';
// import { AuthService } from './auth.service';
//
// export interface UserProfile {
//   address: string;
//   nationalId: string;
//   notifications: { email: boolean; sms: boolean; marketing: boolean };
//   id: number;
//   fullName: string;
//   email: string;
//   phoneNumber: string;
//   department: string;
//   position: string;
//   avatar: string;
//   createdAt: Date;
// }
//
// @Injectable({
//   providedIn: 'root'
// })
// export class ProfileService {
//   private apiUrl = 'http://localhost:8080/api/profile';
//
//   constructor(private http: HttpClient, private authService: AuthService) { }
//
//   getUserProfile(): Observable<UserProfile> {
//     return this.http.get<UserProfile>(this.apiUrl);
//   }
//
//   updateProfile(profile: UserProfile, avatarFile: File | null): Observable<UserProfile> {
//     const formData = new FormData();
//     formData.append('profile', JSON.stringify(profile));
//
//     if (avatarFile) {
//       formData.append('avatar', avatarFile, avatarFile.name);
//     }
//
//     return this.http.put<UserProfile>(this.apiUrl, formData).pipe(
//       tap(updatedProfile => {
//         this.authService.updateCurrentUser(updatedProfile);
//       })
//     );
//   }
//
//   changePassword(currentPassword: string, newPassword: string): Observable<{ message: string }> {
//     const payload = { currentPassword, newPassword };
//     return this.http.post<{ message: string }>(`${this.apiUrl}/change-password`, payload);
//   }
//
//   // START: MODIFIED CODE
//   /**
//    * دالة لحذف صورة بروفايل المستخدم.
//    * تعيد Observable<void> لأن استجابة 204 No Content لا تحتوي على body.
//    */
//   deleteAvatar(): Observable<void> {
//     return this.http.delete<void>(`${this.apiUrl}/avatar`).pipe(
//       tap(() => {
//         // عند النجاح، نقوم بتحديث الحالة المحلية للمستخدم
//         const currentUser = this.authService.getCurrentUserValue();
//         if (currentUser) {
//           const updatedUser = { ...currentUser, avatar: '' }; // إفراغ رابط الصورة
//           this.authService.updateCurrentUser(updatedUser);
//         }
//       })
//     );
//   }
//   // END: MODIFIED CODE
// }




import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { AuthService } from './auth.service';

// ✅ تم تعديل الواجهة لتشمل كل الحقول الجديدة كحقول اختيارية
export interface UserProfile {
  id: number;
  fullName: string;
  email: string;
  nationalId: string;
  phoneNumber: string;
  address: string;
  avatar: string;
  createdAt: Date;
  notifications: { email: boolean; sms: boolean; marketing: boolean };
  department?: string;
  position?: string;
  employeeCode?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private apiUrl = 'http://localhost:8080/api/profile';

  constructor(private http: HttpClient, private authService: AuthService) { }

  getUserProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(this.apiUrl);
  }

  updateProfile(profile: UserProfile, avatarFile: File | null): Observable<UserProfile> {
    const formData = new FormData();
    formData.append('profile', JSON.stringify(profile));

    if (avatarFile) {
      formData.append('avatar', avatarFile, avatarFile.name);
    }

    return this.http.put<UserProfile>(this.apiUrl, formData).pipe(
      tap(updatedProfile => {
        this.authService.updateCurrentUser(updatedProfile);
      })
    );
  }

  changePassword(currentPassword: string, newPassword: string): Observable<{ message: string }> {
    const payload = { currentPassword, newPassword };
    return this.http.post<{ message: string }>(`${this.apiUrl}/change-password`, payload);
  }

  deleteAvatar(): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/avatar`).pipe(
      tap(() => {
        const currentUser = this.authService.getCurrentUserValue();
        if (currentUser) {
          const updatedUser = { ...currentUser, avatar: '' };
          this.authService.updateCurrentUser(updatedUser);
        }
      })
    );
  }
}


