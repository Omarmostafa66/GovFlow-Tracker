import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { tap } from 'rxjs/operators'; // ✅ تم استيراد tap
import { AuthService } from './auth.service';

export interface Notification {
  id: number;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

// Interface for the payload sent to the show method
export interface NotificationPayload {
  title: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private baseUrl = 'http://localhost:8080/api';

  // A Subject to broadcast notification messages
  private notificationSubject = new Subject<NotificationPayload>();

  // A public observable that components can subscribe to
  public notification$ = this.notificationSubject.asObservable();

  // ✅ START: الإضافة المطلوبة
  // Subject لإعلام المشتركين بحدوث تغيير في الإشعارات
  private _notificationsChanged = new Subject<void>();

  // Observable عام يمكن للمكونات الأخرى الاشتراك به
  get notificationsChanged$() {
    return this._notificationsChanged.asObservable();
  }
  // ✅ END: نهاية الإضافة

  constructor(private http: HttpClient, private authService: AuthService) { }

  /**
   * Pushes a new notification to the notification stream.
   * Components subscribed to notification$ will receive this.
   * @param payload The notification data to display.
   */
  show(payload: NotificationPayload) {
    this.notificationSubject.next(payload);
  }

  /**
   * Fetches notifications for the current user from the backend.
   * @returns Observable containing an array of notifications.
   */
  getNotifications(): Observable<Notification[]> {
    const token = this.authService.getToken();
    if (!token) {
      // Return an empty observable if the user is not logged in
      return new Observable<Notification[]>(subscriber => {
        subscriber.next([]);
        subscriber.complete();
      });
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<Notification[]>(`${this.baseUrl}/notifications`, { headers });
  }

  // ✅ START: تم تعديل الدوال التالية لإرسال إشعار بالتغيير
  markAllAsRead(): Observable<void> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    return this.http.post<void>(`${this.baseUrl}/notifications/mark-all-as-read`, {}, { headers }).pipe(
      tap(() => this._notificationsChanged.next()) // إرسال إشعار بعد نجاح العملية
    );
  }

  deleteNotification(notificationId: number): Observable<void> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    return this.http.delete<void>(`${this.baseUrl}/notifications/${notificationId}`, { headers }).pipe(
      tap(() => this._notificationsChanged.next()) // إرسال إشعار بعد نجاح العملية
    );
  }

  clearAllNotifications(): Observable<void> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    return this.http.delete<void>(`${this.baseUrl}/notifications/clear-all`, { headers }).pipe(
      tap(() => this._notificationsChanged.next()) // إرسال إشعار بعد نجاح العملية
    );
  }
  // ✅ END: نهاية التعديل
}
