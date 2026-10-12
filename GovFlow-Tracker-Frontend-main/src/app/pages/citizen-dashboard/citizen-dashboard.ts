import { Component, OnInit, signal, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CitizenService, ServiceCategory, CitizenDashboardData } from '../../services/citizen.service';
import { AuthService, User } from '../../services/auth.service';

@Component({
  selector: 'app-citizen-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './citizen-dashboard.html',
  styleUrls: ['./citizen-dashboard.css']
})
export class CitizenDashboardComponent implements OnInit {
  // Signals for reactive state management
  dashboardData = signal<CitizenDashboardData | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  // ✅ Directly use the currentUser signal from AuthService
  currentUser: WritableSignal<User | null>;

  // Properties for search functionality
  searchQuery = '';
  filteredCategories = signal<ServiceCategory[]>([]);

  constructor(
    private citizenService: CitizenService,
    private authService: AuthService // ✅ Inject AuthService
  ) {
    // ✅ Initialize currentUser from the service
    this.currentUser = this.authService.currentUser;
  }

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.loading.set(true);
    this.error.set(null);

    this.citizenService.getDashboardData().subscribe({
      next: (data) => {
        // We still use dashboardData for stats, categories, etc.
        this.dashboardData.set(data);
        this.filteredCategories.set(data.categories);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load dashboard data. Please try again later.');
        this.loading.set(false);
        console.error(err);
      }
    });
  }

  // ✅ This function now gets the initials from the centrally managed user data
  protected getInitials(): string {
    const fullName = this.currentUser()?.fullName;
    if (!fullName) return '';

    const parts = fullName.trim().split(/\s+/);
    if (parts.length < 2) {
      return parts[0] ? parts[0][0].toUpperCase() : '';
    }
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  filterCategories(): void {
    const allCategories = this.dashboardData()?.categories ?? [];
    if (!this.searchQuery) {
      this.filteredCategories.set(allCategories);
      return;
    }
    const lowerCaseQuery = this.searchQuery.toLowerCase();
    const filtered = allCategories.filter(category =>
      category.name.toLowerCase().includes(lowerCaseQuery) ||
      category.description.toLowerCase().includes(lowerCaseQuery)
    );
    this.filteredCategories.set(filtered);
  }

  // ==========================================================
  // ✅ START: الدوال الجديدة التي تمت إضافتها لتحسين عرض الحالة
  // ==========================================================

  /**
   * هذه الدالة تترجم حالة الطلب القادمة من الباك إند (مثل "COMPLETED")
   * إلى اسم كلاس الـ CSS الصحيح (مثل "status-approved")
   * والموجود في ملف .css الخاص بك.
   */
  protected getStatusClass(status: string): string {
    if (!status) return 'status-default'; // كلاس افتراضي

    switch (status) {
      case 'COMPLETED':
        return 'status-approved'; // أخضر

      case 'REJECTED':
        return 'status-rejected'; // أحمر

      case 'IN_PROGRESS':
      case 'SUBMITTED': // "SUBMITTED" و "PENDING" تعتبر كأنها "قيد التنفيذ"
      case 'PENDING':
        return 'status-in-progress'; // أزرق

      case 'UNDER_REVIEW':
      case 'PENDING_CITIZEN_ACTION': // الحالات التي تتطلب انتظار
      case 'APPROVED_PENDING_PAYMENT':
        return 'status-under-review'; // أصفر/برتقالي

      default:
        return 'status-default'; // رمادي للحالات غير المعروفة
    }
  }

  /**
   * هذه الدالة تحول نص الحالة من "UPPER_CASE" إلى "Title Case"
   * مثال: "UNDER_REVIEW" تصبح "Under Review"
   */
  protected formatStatus(status: string): string {
    if (!status) return 'Unknown';
    return status.replace(/_/g, ' ') // استبدال الشرطات السفلية بمسافات
      .toLowerCase() // تحويل الكل إلى حروف صغيرة
      .replace(/\b\w/g, c => c.toUpperCase()); // تحويل أول حرف من كل كلمة إلى كبير
  }

  // ==========================================================
  // ✅ START: الهدف 4: دالة جديدة لربط الداشبورد بالفلتر
  // ==========================================================
  /**
   * دالة مساعدة لربط ليبل الكارت (من الداشبورد) بمفتاح الحالة (في صفحة طلباتي)
   * @param label (e.g., "Pending Payment")
   * @returns (e.g., "APPROVED_PENDING_PAYMENT")
   */
  protected getStatusKeyForLabel(label: string): string {
    switch (label) {
      // ==========================================================
      // ✅ START: تم إصلاح هذا السطر
      // ==========================================================
      case 'In Progress': // تم تغييرها من 'Active Requests' لتطابق الليبل القادم من الباك إند
        // ==========================================================
        // ✅ END: نهاية الإصلاح
        // ==========================================================
        return 'IN_PROGRESS';

      // ==========================================================
      // ✅ START: إضافة ربط للكارت الجديد
      // ==========================================================
      case 'Under Review':
        return 'UNDER_REVIEW';
      // ==========================================================
      // ✅ END: نهاية الإضافة
      // ==========================================================

      case 'Completed':
        return 'COMPLETED';
      case 'Pending Action':
        return 'PENDING_CITIZEN_ACTION';
      case 'Rejected':
        return 'REJECTED';
      // ==========================================================
      // ✅ START: تم تعديل هذا السطر ليطابق النص الجديد
      // ==========================================================
      case 'Payment Due':
        // ==========================================================
        // ✅ END: نهاية التعديل
        // ==========================================================
        return 'APPROVED_PENDING_PAYMENT';
      default:
        return 'all'; // الافتراضي هو عرض الكل
    }
  }
  // ==========================================================
  // ✅ END: نهاية إضافة دالة الربط
  // ==========================================================
}
