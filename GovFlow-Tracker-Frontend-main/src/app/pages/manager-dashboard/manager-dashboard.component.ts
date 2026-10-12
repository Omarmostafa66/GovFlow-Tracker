import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ManagerAnalyticsComponent } from './manager-analytics/manager-analytics.component';
import { EmployeePerformanceComponent, DisplayEmployee } from '../employee-performance/employee-performance.component';
import { SystemAlertsComponent } from '../system-alerts/system-alerts.component';
import { AuthService } from '../../services/auth.service';
// ✅ START: إضافة ManagedEmployee و ManagerService للـ import
import { ManagerDashboardDto, ManagerService, ManagedEmployee } from '../../services/manager.service';
// ✅ END: نهاية الإضافة
// ✅ START: إضافة combineLatest و map للتعامل مع أكثر من طلب في نفس الوقت
import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
// ✅ END: نهاية الإضافة

@Component({
  selector: 'app-manager-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ManagerAnalyticsComponent,
    EmployeePerformanceComponent,
    SystemAlertsComponent,
  ],
  templateUrl: './manager-dashboard.component.html',
  styleUrls: ['./manager-dashboard.component.css'],
})
export class ManagerDashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private managerService = inject(ManagerService);

  user = this.authService.currentUser;
  public dashboardData$!: Observable<ManagerDashboardDto>;

  // ✅ START: إضافة لإدارة بيانات النافذة المنبثقة
  public selectedEmployee = signal<DisplayEmployee | null>(null);
  // ✅ END: نهاية الإضافة

  ngOnInit(): void {
    // ==========================================================
    // ✅ START: التعديل المطلوب: جلب بيانات الموظفين مع الإحصائيات لفلترة العدد
    // ==========================================================
    const stats$ = this.managerService.getManagerDashboardStats();
    const employees$ = this.managerService.getManagedEmployees(); // ده بيجيب كل الموظفين

    // بنستخدم combineLatest عشان ندمج نتيجتين الـ requests مع بعض
    this.dashboardData$ = combineLatest([stats$, employees$]).pipe(
      map(([dashboardData, employees]) => {
        // هنا بنحسب عدد الموظفين اللي مش محذوفين (Active)
        const activeEmployeesCount = employees.filter(emp => !emp.deletedAt).length;

        // بنرجع نفس الـ object بتاع الـ dashboard بس بنغير قيمة الـ count
        return {
          ...dashboardData,
          managedEmployeesCount: activeEmployeesCount
        };
      })
    );
    // ==========================================================
    // END: ✅ نهاية التعديل
    // ==========================================================
  }

  getInitials(fullName: string | undefined): string {
    if (!fullName) return '';
    return fullName.split(' ').map((name) => name[0]).join('').toUpperCase();
  }

  // ✅ START: إضافة دالة لتحديث بيانات الموظف المختار
  /**
   * This function is triggered by an event from the employee-performance component.
   * It sets the employee data to be displayed in the modal.
   * @param employee The employee object to display.
   */
  handleViewDetails(employee: DisplayEmployee): void {
    this.selectedEmployee.set(employee);
    // This will navigate to the modal anchor, making it visible.
    window.location.hash = 'employee-details-modal';
  }



  /**
   * Returns the appropriate CSS class for a given performance level.
   * This is used to color-code the performance text in the modal.
   * @param performance The performance level string (e.g., 'Excellent', 'Good').
   * @returns The CSS class name.
   */
  getPerformanceClass(performance: string): string {
    if (!performance) {
      return 'performance-default';
    }
    switch (performance.toLowerCase()) {
      case 'excellent': return 'performance-excellent';
      case 'good': return 'performance-good';
      case 'average': return 'performance-average';
      default: return 'performance-default';
    }
  }

}
