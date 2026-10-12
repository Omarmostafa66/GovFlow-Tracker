import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../services/notification.service';
// نستورد التعريف القديم لنستخدمه بشكل مؤقت
import { Notification as ServiceNotification } from '../../services/notification.service';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';


export interface Notification {
  id: number;
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  type: 'info' | 'success' | 'warning' | 'error';
}

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './notifications.html',
  styleUrls: ['./notifications.css']
})
export class NotificationsComponent implements OnInit {
  notifications = signal<Notification[]>([]);
  isLoading = signal(true);

  dashboardLink = signal<string>('');
  dashboardName = signal<string>('');

  unreadCount = computed(() => this.notifications().filter(n => !n.read).length);

  constructor(
    private notificationService: NotificationService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.setupBreadcrumb();
    this.loadAllNotifications();
  }

  private setupBreadcrumb(): void {
    const token = this.authService.getToken();
    let userRole = 'CITIZEN'; // Default to CITIZEN role

    if (token) {
      try {
        // A JWT has three parts separated by dots; the payload is the second part.
        const payloadBase64Url = token.split('.')[1];
        // Convert the Base64Url string to a regular Base64 string.
        const payloadBase64 = payloadBase64Url.replace(/-/g, '+').replace(/_/g, '/');
        // Decode the Base64 string and parse the resulting JSON.
        const decodedPayload = JSON.parse(atob(payloadBase64));

        // Assume the role is stored in a 'role' property and convert to uppercase for reliable matching.
        if (decodedPayload && typeof decodedPayload.role === 'string') {
          userRole = decodedPayload.role.toUpperCase();
        }
      } catch (error) {
        console.error("Failed to decode JWT token or find role:", error);
        // If the token is invalid or the role is missing, the default 'CITIZEN' role will be used.
      }
    }

    switch (userRole) {
      case 'MANAGER':
        this.dashboardLink.set('/manager-dashboard');
        this.dashboardName.set('Dashboard');
        break;
      case 'EMPLOYEE':
        this.dashboardLink.set('/employee-dashboard');
        this.dashboardName.set('Dashboard');
        break;
      case 'CITIZEN':
      default:
        this.dashboardLink.set('/citizen-dashboard');
        this.dashboardName.set('Dashboard');
        break;
    }
  }

  loadAllNotifications(): void {
    this.isLoading.set(true);
    this.notificationService.getNotifications().subscribe({
      error: (err) => {
        console.error('Failed to load all notifications', err);
        this.isLoading.set(false);
      },
      next: (data: ServiceNotification[]) => {
        // ========================= التعديل المطلوب هنا =========================
        /*
          ✅ الحل: نمر على كل إشعار قادم من السيرفر (data)
          ونضيف له الخاصية المفقودة 'type' بقيمة افتراضية 'info'
          ثم نسند البيانات المعدلة للـ signal.
        */
        let enhancedData: {
          id: number;
          title: string;
          message: string;
          read: boolean;
          createdAt: string;
          type: string
        }[];
        enhancedData = data.map(notif => ({
          ...notif, // نسخ كل الخصائص القديمة
          id: Number(notif.id), // التأكد من أن الـ id هو رقم
          type: 'info' // إضافة الخاصية الجديدة
        }));

        // @ts-ignore
        this.notifications.set(enhancedData);
        // ========================= نهاية التعديل =========================

        this.isLoading.set(false);
      }
    });
  }

  markAsRead(notificationId: number): void {
    this.notifications.update(currentNotifications =>
      currentNotifications.map(notif =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
  }
  // ✅ START: الإضافة والتعديل المطلوب
  deleteNotification(notificationId: number): void {
    this.notificationService.deleteNotification(notificationId).subscribe({
      next: () => {
        this.notifications.update(currentNotifications =>
          currentNotifications.filter(notif => notif.id !== notificationId)
        );
      },
      error: (err) => console.error('Failed to delete notification', err)
    });
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.notifications.update(currentNotifications =>
          currentNotifications.map(notif => ({ ...notif, read: true }))
        );
      },
      error: (err) => console.error('Failed to mark all as read', err)
    });
  }

  clearAllNotifications(): void {
    this.notificationService.clearAllNotifications().subscribe({
      next: () => {
        this.notifications.set([]);
      },
      error: (err) => console.error('Failed to clear all notifications', err)
    });
  }
  // ✅ END: نهاية الإضافة والتعديل
  getIconForType(type: Notification['type']): string {
    switch (type) {
      case 'success': return 'fas fa-check-circle';
      case 'warning': return 'fas fa-exclamation-triangle';
      case 'error': return 'fas fa-times-circle';
      case 'info':
      default:
        return 'fas fa-info-circle';
    }
  }
}
