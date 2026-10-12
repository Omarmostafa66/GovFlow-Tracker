import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
// ==========================================================
// ✅ START: الهدف 4: إضافة ActivatedRoute
// ==========================================================
import { Router, RouterLink, ActivatedRoute } from '@angular/router'; // تم إضافة ActivatedRoute هنا
// ==========================================================
// ✅ END: نهاية التعديل
// ==========================================================
import { ServiceRequestService, ServiceRequestDto } from '../../../services/service-request.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-my-requests',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './my-requests.component.html',
  styleUrls: ['./my-requests.component.css']
})
export class MyRequestsComponent implements OnInit {
  requests: ServiceRequestDto[] = [];
  filteredRequests: ServiceRequestDto[] = [];
  loading = true;
  error: string | null = null;
  statusFilter: string = 'all'; // القيمة الافتراضية

  constructor(
    private router: Router,
    private requestService: ServiceRequestService,
    // ==========================================================
    // ✅ START: الهدف 4: عمل Inject للـ service
    // ==========================================================
    private route: ActivatedRoute // إضافة الـ Route service
    // ==========================================================
    // ✅ END: نهاية التعديل
    // ==========================================================
  ) {}

  // ==========================================================
  // ✅ START: الهدف 4: تعديل ngOnInit ليقرأ الرابط
  // ==========================================================
  ngOnInit(): void {
    // سنقوم بالاشتراك في متغيرات الرابط (Query Params)
    this.route.queryParamMap.subscribe(params => {
      // ابحث عن باراميتر اسمه 'status' (الذي أرسلناه من الداشبورد)
      const statusFromQuery = params.get('status');

      if (statusFromQuery) {
        // إذا وجدنا حالة في الرابط، قم بتعيينها كفلتر افتراضي
        this.statusFilter = statusFromQuery;
      } else {
        // إذا لم نجد (المستخدم فتح الصفحة مباشرة)، استخدم 'all'
        this.statusFilter = 'all';
      }

      // الآن فقط قم بتحميل الطلبات (بعد أن تأكدنا من ضبط الفلتر)
      this.loadMyRequests();
    });
  }
  // ==========================================================
  // ✅ END: نهاية تعديل ngOnInit
  // ==========================================================

  loadMyRequests(): void {
    this.loading = true;
    this.error = null;
    this.requestService.getMyRequests().subscribe({
      next: (data) => {
        this.requests = data.sort((a, b) => new Date(b.submissionDate).getTime() - new Date(a.submissionDate).getTime());
        // سيتم تطبيق الفلتر الذي تم ضبطه من الرابط (أو 'all' إذا لم يوجد)
        this.applyFilter();
        this.loading = false;
      },
      error: (err) => {
        this.error = "Failed to load requests. Please try again later.";
        this.loading = false;
        console.error('Error loading requests:', err);
      }
    });
  }

  applyFilter(): void {
    if (this.statusFilter === 'all') {
      this.filteredRequests = this.requests;
    } else {
      this.filteredRequests = this.requests.filter(r => r.status === this.statusFilter);
    }
  }

  viewDetails(requestId: number): void {
    this.router.navigate(['/my-requests', requestId]);
  }

  // ==========================================================
  // ✅ START: تم استبدال الدوال القديمة بالدوال الموحدة الجديدة
  // ==========================================================

  /**
   * هذه الدالة تترجم حالة الطلب القادمة من الباك إند (مثل "COMPLETED")
   * إلى اسم كلاس الـ CSS الصحيح (مثل "status-approved") لتوحيد الشكل.
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
  // ✅ END: نهاية الدوال المحدثة
  // ==========================================================
}
