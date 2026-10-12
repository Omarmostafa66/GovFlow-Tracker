import { Component, Input, OnInit, SimpleChanges, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
// ✅ START: إضافة combineLatest لجلب بيانات الموظفين مع الإحصائيات
import { combineLatest } from 'rxjs';
import { EmployeePerformanceData, ManagerService, ManagerDashboardDto, ManagedEmployee } from '../../services/manager.service';
// ✅ END: نهاية الإضافة
import { AuthService } from '../../services/auth.service';

export interface DisplayEmployee {
  // START: ✅ تم تعديل هذا الحقل ليكون رقمياً ليتوافق مع البيانات الحقيقية
  id: number | string; // يمكن أن يكون JobRoleCode كمعرف أيضاً
  // END: ✅ نهاية التعديل
  card: string;
  name: string;
  department: string;
  processed: number;
  completed: number;
  avgTime: string;
  approvalRate: string;
  performance: string;
  // START: ✅ لم نعد بحاجة للتاريخ الوهمي لأنه سيتم الفلترة في الباك اند مستقبلاً
  // submissionDate: Date; // <<< تم إزالة هذا الحقل
  // END: ✅ نهاية التعديل
}

@Component({
  selector: 'app-employee-performance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './employee-performance.component.html',
  styleUrls: ['./employee-performance.component.css']
})
export class EmployeePerformanceComponent implements OnInit {

  @Output() viewDetails = new EventEmitter<DisplayEmployee>();

  private managerService = inject(ManagerService);
  private authService = inject(AuthService);

  public allEmployees: DisplayEmployee[] = [];
  public filteredEmployees: DisplayEmployee[] = [];
  public topPerformer: DisplayEmployee | null = null;

  selectedMonth: string = 'This Month';
  selectedDepartment: string = 'All Departments';
  selectedCard: string = 'All Cards';

  months = ['This Month', 'Last Month', 'Last 3 Months'];
  departments: string[] = ['All Departments'];
  cards: string[] = ['All Cards'];

  managerScope: 'SUPER_MANAGER' | 'DEPARTMENT' | 'CARD' | 'UNKNOWN' = 'UNKNOWN';

  constructor() { }

  ngOnInit(): void {
    this.determineManagerScope();
    this.loadPerformanceData();
  }

  private determineManagerScope(): void {
    const user = this.authService.currentUser() as any;
    if (user && user.jobRoleCode && user.jobRoleCode.startsWith('MGR')) {
      const parts = user.jobRoleCode.split('-');
      // =================================================================
      // START: 🚀🚀 هذا هو التعديل الوحيد والمطلوب 🚀🚀
      // تم تغيير الشرط ليتوافق مع بياناتك الفعلية (مثل MGR-TD-ALL)
      if (user.jobRoleCode.endsWith('-ALL')) {
        // END: 🚀🚀 نهاية التعديل 🚀🚀
        // =================================================================
        this.managerScope = 'SUPER_MANAGER';
      }
      else if (parts.length >= 3 && parts[2].startsWith('C')) {
        this.managerScope = 'CARD';
      }
      else {
        this.managerScope = 'DEPARTMENT';
      }
    } else {
      this.managerScope = 'UNKNOWN';
    }
  }

  // ==============================================================================
  // START: ✅ التعديل المطلوب: تم تغيير منطق جلب البيانات بالكامل
  // الآن يتم جلب بيانات الموظفين مع بيانات الأداء لفلترتها
  // ==============================================================================
  private loadPerformanceData(): void {
    const dashboardStats$ = this.managerService.getManagerDashboardStats();
    const managedEmployees$ = this.managerService.getManagedEmployees();

    // نستخدم combineLatest لدمج نتيجتي الطلبين معًا
    combineLatest([dashboardStats$, managedEmployees$]).subscribe({
      next: ([dashboardData, managedEmployees]) => {

        // 1. نجهز قائمة بـ ID الموظفين النشطين فقط
        const activeEmployeeIds = new Set<string>(
          managedEmployees
            .filter(emp => !emp.deletedAt) // فلترة الموظفين النشطين
            .map(emp => emp.jobRoleCode) // استخراج الـ jobRoleCode الخاص بهم
        );

        // 2. نقوم بفلترة بيانات الأداء بناءً على قائمة الموظفين النشطين
        const activePerformanceData = (dashboardData.employeePerformance || []).filter(perf =>
          activeEmployeeIds.has(perf.employeeId!) // نتأكد أن الموظف موجود في قائمة النشطين
        );

        // 3. نعالج البيانات بعد فلترتها
        this.processPerformanceData(activePerformanceData);

        // نفس منطق ملء الفلاتر ولكن بناءً على البيانات الجديدة
        if (this.managerScope === 'SUPER_MANAGER') {
          this.populateDepartmentFilter();
          this.populateCardFilter();
        } else if (this.managerScope === 'DEPARTMENT') {
          this.populateCardFilter();
        }
      },
      error: (err) => {
        console.error('Failed to load combined manager data', err);
        this.allEmployees = [];
        this.filteredEmployees = [];
      }
    });
  }

  /**
   * دالة جديدة مخصصة لمعالجة بيانات الأداء الحقيقية وتحويلها إلى شكل قابل للعرض.
   * @param performanceData - مصفوفة بيانات الأداء القادمة من الباك اند.
   */
  private processPerformanceData(performanceData: EmployeePerformanceData[]): void {
    if (!performanceData) {
      this.allEmployees = [];
      this.filteredEmployees = [];
      return;
    }

    this.allEmployees = performanceData.map(emp => {
      return {
        id: emp.employeeId,
        name: emp.employeeName,
        department: this.getDepartmentFromJobCode(emp.employeeId || ''),
        card: this.getCardFromJobCode(emp.employeeId || ''),
        processed: emp.assignedTasks,
        completed: emp.completedTasks,
        // تنسيق البيانات لعرضها بشكل مناسب
        approvalRate: `${emp.approvalRate.toFixed(1)}%`,
        avgTime: `${emp.avgProcessingTimeInDays.toFixed(1)} days`,
        // حساب مستوى الأداء بناءً على معدل القبول
        performance: this.getPerformanceLevel(emp.approvalRate),
      };
    });

    this.topPerformer = null; // يمكن إضافة منطق حساب الموظف الأفضل هنا لاحقاً
    this.filterData(); // تطبيق الفلاتر الافتراضية
  }
  // ==============================================================================
  // END: ✅ نهاية التعديل
  // ==============================================================================


  private populateDepartmentFilter(): void {
    const departmentSet = new Set<string>();
    this.allEmployees.forEach(emp => {
      if (emp.department) {
        departmentSet.add(emp.department);
      }
    });
    this.departments = ['All Departments', ...Array.from(departmentSet).sort()];
  }

  // ==============================================================================
  // START: 🚀 التحسين المطلوب: تم تحديث هذه الدالة
  // ==============================================================================
  private populateCardFilter(): void {
    // إذا كان المدير هو Super Manager، نعرض له قائمة ثابتة بكل الكروت
    if (this.managerScope === 'SUPER_MANAGER') {
      this.cards = ['All Cards', 'C1', 'C2', 'C3', 'C4', 'C5'];

      // إذا اختار المدير قسماً معيناً، نقوم بفلترة الموظفين
      // ولكن قائمة الكروت تظل ثابتة كما هي (C1-C5)
      // وهذا الجزء ليس له تأثير مباشر على قائمة الكروت هنا ولكنه ضروري للفلترة العامة
      let employeesToFilter = this.allEmployees;
      if (this.selectedDepartment !== 'All Departments') {
        employeesToFilter = this.allEmployees.filter(emp => emp.department === this.selectedDepartment);
      }
      // ملاحظة: لا نستخدم employeesToFilter هنا لتوليد الكروت، بل نستخدم القائمة الثابتة.

    } else {
      // للمدراء الآخرين (مثل مدير القسم)، يبقى المنطق كما هو
      // يتم توليد قائمة الكروت بناءً على الموظفين الفعليين
      const cardSet = new Set<string>();
      this.allEmployees.forEach(emp => {
        if (emp.card && emp.card !== 'N/A') {
          cardSet.add(emp.card);
        }
      });
      this.cards = ['All Cards', ...Array.from(cardSet).sort()];
    }
  }
  // ==============================================================================
  // END: 🚀 نهاية التحسين
  // ==============================================================================

  public onDepartmentChange(): void {
    this.selectedCard = 'All Cards';
    // عند تغيير القسم، يجب إعادة توليد قائمة الكروت (إذا لم يكن super manager)
    // أو ببساطة إعادة تطبيق الفلترة
    this.populateCardFilter();
    this.filterData();
  }

  filterData(): void {
    let tempEmployees = [...this.allEmployees];

    // START: ✅ تم إزالة الفلترة بالتاريخ من الفرونت اند مؤقتاً
    // سيتم تطبيقها في الباك اند في المستقبل لتكون أكثر دقة
    /*
    const now = new Date();
    let startDate: Date;

    switch (this.selectedMonth) {
      case 'This Month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        tempEmployees = tempEmployees.filter(emp => emp.submissionDate >= startDate);
        break;
      case 'Last Month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endDate = new Date(now.getFullYear(), now.getMonth(), 1);
        tempEmployees = tempEmployees.filter(emp => emp.submissionDate >= startDate && emp.submissionDate < endDate);
        break;
      case 'Last 3 Months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        tempEmployees = tempEmployees.filter(emp => emp.submissionDate >= startDate);
        break;
    }
    */
    // END: ✅ نهاية التعديل

    if (this.managerScope === 'SUPER_MANAGER' && this.selectedDepartment !== 'All Departments') {
      tempEmployees = tempEmployees.filter(emp => emp.department === this.selectedDepartment);
    }

    if ((this.managerScope === 'SUPER_MANAGER' || this.managerScope === 'DEPARTMENT') && this.selectedCard !== 'All Cards') {
      tempEmployees = tempEmployees.filter(emp => emp.card === this.selectedCard);
    }

    this.filteredEmployees = tempEmployees;
  }

  private calculateTopPerformer(): void { /* ... no changes ... */ }
  private findEmployeeIdByName(name: string): number | undefined { /* ... no changes ... */ return 0; }
  private getDepartmentFromJobCode(jobCode: string): string {
    if (jobCode.includes('-TD-')) return 'Traffic';
    if (jobCode.includes('-LM-')) return 'Municipality';
    return 'General';
  }
  private getCardFromJobCode(jobCode: string): string {
    if (!jobCode) return 'N/A';
    const parts = jobCode.split('-');
    if (parts.length >= 3 && parts[2].startsWith('C')) {
      return parts[2];
    }
    return 'N/A';
  }
  private getPerformanceLevel(rate: number): string {
    if (rate >= 90) return 'Excellent';
    if (rate >= 75) return 'Good';
    if (rate >= 50) return 'Average';
    return 'Poor';
  }
  getPerformanceClass(performance: string): string {
    switch (performance.toLowerCase()) {
      case 'excellent': return 'performance-excellent';
      case 'good': return 'performance-good';
      case 'average': return 'performance-average';
      default: return 'performance-default';
    }
  }
  onViewDetails(employee: DisplayEmployee): void {
    this.viewDetails.emit(employee);
  }
  private processIncomingData(performanceData: any[]): void {}
}
