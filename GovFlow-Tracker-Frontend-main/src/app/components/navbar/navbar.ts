import { Component, signal, WritableSignal, effect, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NotificationService, Notification } from '../../services/notification.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.css'],
})
export class NavbarComponent {
  currentUser: WritableSignal<any | null>;

  showNotifications = signal(false);
  showUserMenu = signal(false);

  notifications = signal<Notification[]>([]);

  unreadCount = signal(0);

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router
  ) {
    this.currentUser = this.authService.currentUser;

    // effect لمراقبة تغيير حالة المستخدم وجلب الإشعارات
    effect(() => {
      if (this.currentUser()) {
        this.loadNotifications();
      } else {
        this.notifications.set([]);

        this.unreadCount.set(0); //  تصفير العداد

      }
    });

    this.notificationService.notificationsChanged$.subscribe(() => {
      this.loadNotifications();
    });

  }

  get userInitial(): string {
    const name = this.currentUser()?.fullName;
    return name ? name.charAt(0).toUpperCase() : '';
  }


  /**
   *  تحميل الإشعارات وتحديث كل من العداد والقائمة المنسدلة.
   */
  loadNotifications(): void {
    this.notificationService.getNotifications().subscribe({
      next: (data) => {
        // 1. حساب العدد الإجمالي للإشعارات غير المقروءة من "كامل" البيانات القادمة من السيرفر.
        const totalUnread = data.filter(n => !n.read).length;
        this.unreadCount.set(totalUnread);

        // 2. تحديث القائمة المنسدلة في النافبار بأحدث 5 إشعارات فقط.
        this.notifications.set(data.slice(0, 5));
      },
      error: (err) => console.error('Failed to load notifications in navbar', err)
    });
  }

  // ====================================================================
  // ===>  للسماح بالعودة للهوم من صفحات التسجيل
  // ====================================================================
  /**
   * دالة تنقل المستخدم عند الضغط على لوجو "GovFlow Tracker".
   * يتم التحقق من حالة المستخدم:
   * - غير مسجل دخوله: يذهب إلى الهوم (/). (هذا يحل مشكلة صفحات التسجيل)
   * - مواطن (CITIZEN): يذهب إلى الهوم (/).
   * - موظف/مدير (EMPLOYEE/MANAGER): يذهب إلى الداشبورد الخاصة به.
   */
  navigateHome(): void {
    const user = this.currentUser();

    // 1. إذا لم يكن المستخدم مسجل دخوله، اذهب إلى الهوم مباشرة.
    if (!user) {
      this.router.navigate(['/']);
      return;
    }

    const role = user.role;
    // 2. إذا كان مواطن، اذهب إلى الهوم.
    if (role?.toUpperCase() === 'CITIZEN') {
      this.router.navigate(['/']);
    } else {
      // 3. إذا كان له أي دور آخر (موظف أو مدير)، استدعِ الدالة الي بتبعته للداشبورد
      this.navigateToDashboard();
    }
  }

  // دالة للتنقل إلى لوحة التحكم المناسبة
  navigateToDashboard(): void {
    const role = this.currentUser()?.role;
    let route: string;

    switch (role?.toUpperCase()) {
      case 'CITIZEN':
        route = '/citizen-dashboard';
        break;
      case 'EMPLOYEE':
        route = '/employee-dashboard';
        break;
      case 'MANAGER':
        route = '/manager-dashboard';
        break;
      default:
        route = '/'; // صفحة افتراضية
    }
    this.router.navigate([route]);
    this.showUserMenu.set(false); // إغلاق القائمة بعد النقر
  }

  logout() {
    this.authService.logout();
  }

  // إغلاق القوائم عند النقر في أي مكان آخر في الصفحة
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.notifications-wrapper')) {
      this.showNotifications.set(false);
    }
    if (!target.closest('.dropdown-wrapper')) {
      this.showUserMenu.set(false);
    }
  }
}
