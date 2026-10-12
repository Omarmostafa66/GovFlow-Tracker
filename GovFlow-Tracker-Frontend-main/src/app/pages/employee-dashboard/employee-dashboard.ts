// import { Component, OnInit, WritableSignal } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { RouterModule } from '@angular/router';
// // ✅ 1. تم استعادة الـ imports الأصلية مع إضافة الأنواع الجديدة المطلوبة
// import { EmployeeService, ServiceRequest, EmployeeDashboardDataV2 as EmployeeDashboardData } from '../../services/employee.service';
// import { AuthService, User } from '../../services/auth.service';
//
// @Component({
//   selector: 'app-employee-dashboard',
//   standalone: true,
//   imports: [CommonModule, FormsModule, RouterModule],
//   templateUrl: './employee-dashboard.html',
//   styleUrls: ['./employee-dashboard.css']
// })
// export class EmployeeDashboardComponent implements OnInit {
//   currentUser: WritableSignal<User | null>;
//
//   employee = {
//     name: '',
//     department: '',
//     initial: ''
//   };
//
//   stats = {
//     pending: 0,
//     underReview: 0,
//     approved: 0,
//     rejected: 0
//   };
//
//   // ✅ 2. تم استعادة المتغيرات الأصلية بالكامل
//   serviceRequests: ServiceRequest[] = [];
//   filteredRequests: ServiceRequest[] = [];
//   searchTerm: string = '';
//   statusFilter: string = 'all';
//   serviceFilter: string = 'all';
//   isModalVisible = false;
//   selectedRequest: ServiceRequest | null = null;
//   selectedRequestDocuments: any[] = [];
//   loading = true;
//
//   // ✨ الإضافة الجديدة: متغيرات خاصة بالداشبورد الجديدة
//   highPriorityRequests: ServiceRequest[] = [];
//   recentActivity: ServiceRequest[] = [];
//
//   constructor(
//     private employeeService: EmployeeService,
//     private authService: AuthService
//   ) {
//     this.currentUser = this.authService.currentUser;
//   }
//
//   ngOnInit(): void {
//     this.loadEmployeeData();
//     this.loadDashboardData();
//   }
//
//   private loadEmployeeData(): void {
//     const currentUser = this.authService.currentUser();
//     if (currentUser) {
//       this.employee.name = currentUser.fullName;
//       this.employee.department = this.formatRole(currentUser.role);
//       this.employee.initial = this.getInitials(currentUser.fullName);
//     }
//   }
//
//   // ✅ 3. تم تحديث هذه الدالة فقط لاستدعاء الـ API الجديد وتجهيز البيانات
//   loadDashboardData(): void {
//     this.loading = true;
//     // استدعاء الدالة الجديدة والصحيحة من الـ service
//     this.employeeService.getEmployeeDashboard().subscribe({
//       next: (data: EmployeeDashboardData) => {
//         // تحديث الإحصائيات مباشرةً
//         this.stats = data.stats;
//
//         //  نقوم بتحويل شكل البيانات الجديد لشكل البيانات القديم الذي يفهمه باقي الكود
//         this.serviceRequests = data.tasks.map(task => ({
//           id: String(task.requestId), //  تحويل الرقم إلى نص
//           citizenName: task.citizenName,
//           serviceType: task.serviceName, //  تغيير اسم الحقل
//           date: new Date(task.submissionDate), //  تحويل النص إلى تاريخ
//           priority: task.priority,
//           status: task.status,
//           department: '' //  هذا الحقل غير متوفر في الـ API الجديد
//         }));
//
//         // ✨ الإضافة الجديدة: تجهيز بيانات الأجزاء الجديدة في الداشبورد
//         // 1. تصفية الطلبات ذات الأولوية العالية (نعرض أول 5 فقط)
//         this.highPriorityRequests = this.serviceRequests
//           .filter(req => req.priority.toLowerCase() === 'high')
//           .slice(0, 5);
//
//         // 2. ترتيب الطلبات حسب التاريخ لعرض أحدث الأنشطة (نعرض أول 5 فقط)
//         this.recentActivity = [...this.serviceRequests]
//           .sort((a, b) => b.date.getTime() - a.date.getTime())
//           .slice(0, 5);
//
//
//         this.applyFilters(); // سيبقى هذا السطر كما هو بناءً على طلبك
//         this.loading = false;
//       },
//       error: (error) => {
//         console.error('Error loading dashboard data:', error);
//         this.loading = false;
//       }
//     });
//   }
//
//   // ✅ 4. جميع الدوال التالية تم استعادتها بالكامل كما كانت
//   applyFilters(): void {
//     this.filteredRequests = this.serviceRequests.filter(request => {
//       const matchesSearch = request.id.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
//         request.citizenName.toLowerCase().includes(this.searchTerm.toLowerCase());
//       const matchesStatus = this.statusFilter === 'all' || request.status.toLowerCase() === this.statusFilter.toLowerCase();
//       const matchesService = this.serviceFilter === 'all' || request.serviceType === this.serviceFilter;
//       return matchesSearch && matchesStatus && matchesService;
//     });
//   }
//
//   updateRequestStatus(requestId: string, event: Event): void {
//     const newStatus = (event.target as HTMLSelectElement).value;
//     this.employeeService.updateRequestStatus(requestId, newStatus.toUpperCase()).subscribe({
//       next: () => {
//         const request = this.serviceRequests.find(r => r.id === requestId);
//         if (request) {
//           request.status = newStatus;
//           //  يمكن إعادة تحميل البيانات لتحديث الإحصائيات
//           this.loadDashboardData();
//         }
//       },
//       error: (error) => console.error('Error updating request status:', error)
//     });
//   }
//
//   approveRequest(requestId: string): void {
//     this.updateSingleRequestStatus(requestId, 'APPROVED');
//   }
//
//   rejectRequest(requestId: string): void {
//     this.updateSingleRequestStatus(requestId, 'REJECTED');
//   }
//
//   private updateSingleRequestStatus(requestId: string, newStatus: string): void {
//     this.employeeService.updateRequestStatus(requestId, newStatus).subscribe({
//       next: () => {
//         const request = this.serviceRequests.find(r => r.id === requestId);
//         if (request) {
//           request.status = newStatus;
//         }
//         this.applyFilters();
//         //  الأفضل هو إعادة تحميل البيانات بالكامل لتحديث كل شيء
//         this.loadDashboardData();
//       },
//       error: (error) => console.error(`Error updating request ${requestId}:`, error)
//     });
//   }
//
//   viewDocuments(requestId: string): void {
//     this.selectedRequest = this.serviceRequests.find(r => r.id === requestId) || null;
//     if (!this.selectedRequest) return;
//
//     this.employeeService.getRequestDocuments(requestId).subscribe({
//       next: (documents) => {
//         this.selectedRequestDocuments = documents;
//         this.isModalVisible = true;
//       },
//       error: (error) => {
//         console.error('Error loading documents:', error);
//         //  يفضل استخدام نافذة منبثقة مخصصة بدلاً من alert
//       }
//     });
//   }
//
//   closeModal(): void {
//     this.isModalVisible = false;
//     this.selectedRequest = null;
//     this.selectedRequestDocuments = [];
//   }
//
//   // الدوال المساعدة (تبقى كما هي)
//   formatRole(role: string): string { if (!role) return ''; return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase(); }
//   getInitials(fullName: string): string { if (!fullName) return ''; const parts = fullName.trim().split(/\s+/); if (parts.length < 2) { return parts[0]?.[0]?.toUpperCase() ?? ''; } return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase(); }
// }



import { Component, OnInit, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { EmployeeService, ServiceRequest, EmployeeDashboardDataV2 as EmployeeDashboardData } from '../../services/employee.service';
import { AuthService, User } from '../../services/auth.service';

@Component({
  selector: 'app-employee-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './employee-dashboard.html',
  styleUrls: ['./employee-dashboard.css']
})
export class EmployeeDashboardComponent implements OnInit {
  currentUser: WritableSignal<User | null>;

  employee = {
    name: '',
    department: '',
    initial: ''
  };

  stats = {
    pending: 0,
    underReview: 0,
    approved: 0,
    rejected: 0
  };

  serviceRequests: ServiceRequest[] = [];
  filteredRequests: ServiceRequest[] = [];
  searchTerm: string = '';
  statusFilter: string = 'all';
  serviceFilter: string = 'all';
  isModalVisible = false;
  selectedRequest: ServiceRequest | null = null;
  selectedRequestDocuments: any[] = [];
  loading = true;

  highPriorityRequests: ServiceRequest[] = [];
  recentActivity: ServiceRequest[] = [];

  constructor(
    private employeeService: EmployeeService,
    private authService: AuthService
  ) {
    this.currentUser = this.authService.currentUser;
  }

  ngOnInit(): void {
    this.loadEmployeeData();
    this.loadDashboardData();
  }

  private loadEmployeeData(): void {
    const currentUser = this.authService.currentUser();
    if (currentUser) {
      this.employee.name = currentUser.fullName;
      this.employee.department = this.formatRole(currentUser.role);
      this.employee.initial = this.getInitials(currentUser.fullName);
    }
  }

  loadDashboardData(): void {
    this.loading = true;
    this.employeeService.getEmployeeDashboard().subscribe({
      next: (data: EmployeeDashboardData) => {
        this.stats = data.stats;

        this.serviceRequests = data.tasks.map(task => ({
          id: String(task.requestId),
          citizenName: task.citizenName,
          serviceType: task.serviceName,
          date: new Date(task.submissionDate),
          priority: task.priority,
          status: task.status,
          department: ''
        }));

        this.highPriorityRequests = this.serviceRequests
          .filter(req => req.priority.toLowerCase() === 'high')
          .slice(0, 5);

        this.recentActivity = [...this.serviceRequests]
          .sort((a, b) => b.date.getTime() - a.date.getTime())
          .slice(0, 5);


        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading dashboard data:', error);
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    this.filteredRequests = this.serviceRequests.filter(request => {
      const matchesSearch = request.id.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        request.citizenName.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchesStatus = this.statusFilter === 'all' || request.status.toLowerCase() === this.statusFilter.toLowerCase();
      const matchesService = this.serviceFilter === 'all' || request.serviceType === this.serviceFilter;
      return matchesSearch && matchesStatus && matchesService;
    });
  }

  updateRequestStatus(requestId: string, event: Event): void {
    const newStatus = (event.target as HTMLSelectElement).value;
    this.employeeService.updateRequestStatus(requestId, newStatus.toUpperCase()).subscribe({
      next: () => {
        const request = this.serviceRequests.find(r => r.id === requestId);
        if (request) {
          request.status = newStatus;
          this.loadDashboardData();
        }
      },
      error: (error) => console.error('Error updating request status:', error)
    });
  }

  approveRequest(requestId: string): void {
    this.updateSingleRequestStatus(requestId, 'APPROVED');
  }

  rejectRequest(requestId: string): void {
    this.updateSingleRequestStatus(requestId, 'REJECTED');
  }

  private updateSingleRequestStatus(requestId: string, newStatus: string): void {
    this.employeeService.updateRequestStatus(requestId, newStatus).subscribe({
      next: () => {
        const request = this.serviceRequests.find(r => r.id === requestId);
        if (request) {
          request.status = newStatus;
        }
        this.applyFilters();
        this.loadDashboardData();
      },
      error: (error) => console.error(`Error updating request ${requestId}:`, error)
    });
  }

  viewDocuments(requestId: string): void {
    this.selectedRequest = this.serviceRequests.find(r => r.id === requestId) || null;
    if (!this.selectedRequest) return;

    this.employeeService.getRequestDocuments(requestId).subscribe({
      next: (documents) => {
        this.selectedRequestDocuments = documents;
        this.isModalVisible = true;
      },
      error: (error) => {
        console.error('Error loading documents:', error);
      }
    });
  }

  closeModal(): void {
    this.isModalVisible = false;
    this.selectedRequest = null;
    this.selectedRequestDocuments = [];
  }

  formatRole(role: string): string { if (!role) return ''; return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase(); }
  getInitials(fullName: string): string { if (!fullName) return ''; const parts = fullName.trim().split(/\s+/); if (parts.length < 2) { return parts[0]?.[0]?.toUpperCase() ?? ''; } return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase(); }
}
