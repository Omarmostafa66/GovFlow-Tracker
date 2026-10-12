// import { Injectable } from '@angular/core';
// import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
// import { Observable, of } from 'rxjs';
// import { map, catchError } from 'rxjs/operators';
// import { AuthService } from './auth.service';
//
// // ... (All interfaces remain the same)
// export interface Employee {
//   id: number;
//   name: string;
//   email: string;
//   avatar: string;
//   department: string;
//   position: string;
//   hireDate: string;
//   status: 'Active' | 'On Leave' | 'Suspended';
// }
// export interface UserDto {
//   id: number;
//   fullName: string;
//   email: string;
//   role: string;
//   jobRoleCode?: string;
//   departmentName?: string;
// }
// export interface UpdateEmployeePayload {
//   fullName: string;
//   email: string;
//   roleId: number;
//   departmentId: number;
// }
// export interface ServiceDto {
//   id: number;
//   name: string;
//   cardCode: string;
//   department: {
//     id: number;
//     name: string;
//     govCode: string;
//   };
// }
// export interface DepartmentDto {
//   id: number;
//   name: string;
// }
// export interface EmployeeDetailsDto {
//   fullName: string;
//   nationalId: string;
//   jobRoleCode: string;
// }
// export interface CreateEmployeeDto {
//   fullName: string;
//   nationalId: string;
//   serviceId: number;
// }
// export interface ReportStatValue { value: string; change?: number; }
// export interface ReportStats { totalRequests: ReportStatValue; approved: ReportStatValue; rejected: ReportStatValue; avgProcessingTime: { value: string; change?: number }; }
// export interface PerformanceMetric { department: string; totalRequests: number; approved: number; rejected: number; approvalRate: string; avgTime: number; slaCompliance: string; }
// export interface TopPerformer {
//   initials: string;
//   name: string;
//   department: string;
//   requestsProcessed: number;
//   approvalRate: string;
//   avgTime: string;
// }
// export interface ReportData {
//   stats: ReportStats;
//   performanceMetrics: PerformanceMetric[];
//   topPerformers?: TopPerformer[];
// }
// export interface ScopedReportData {
//   report: ReportData;
//   managerScope: string;
// }
// export interface EmployeePerformanceData {
//   employeeName: string;
//   employeeJobCode: string;
//   assignedTasks: number;
//   completedTasks: number;
// }
// export interface ServiceTypeStatDto {
//   serviceName: string;
//   requestCount: number;
// }
// export interface ManagerDashboardDto {
//   managerScope: string;
//   managedEmployeesCount: number;
//   totalTasksInScope: number;
//   completedTasksInScope: number;
//   employeePerformance: EmployeePerformanceData[];
//   serviceTypeStats: ServiceTypeStatDto[];
// }
// export interface AlertDto {
//   id: string;
//   type: 'DELAY' | 'REJECTION_RATE' | 'ONBOARDING';
//   message: string;
//   entityType: string;
//   entityId: string;
//   createdAt: string;
// }
// export interface ManagedEmployee {
//   id: number;
//   fullName: string;
//   email: string | null;
//   jobRoleCode: string;
//   departmentName: string;
//   isRegistered: boolean;
//   deletedAt: string | null;
// }
//
// @Injectable({
//   providedIn: 'root'
// })
// export class ManagerService {
//   private baseUrl = 'http://localhost:8080/api/v1/manager';
//
//   constructor(private http: HttpClient, private authService: AuthService) { }
//
//   private getAuthHeaders(): HttpHeaders {
//     const token = this.authService.getToken();
//     return new HttpHeaders({
//       'Authorization': `Bearer ${token}`
//     });
//   }
//
//   getEmployees(): Observable<Employee[]> {
//     return this.http.get<UserDto[]>(`${this.baseUrl}/employees`, { headers: this.getAuthHeaders() })
//       .pipe(
//         map((userDtos: UserDto[]) => userDtos.map((dto: UserDto) => this.mapUserDtoToEmployee(dto)))
//       );
//   }
//
//   getManagedEmployees(): Observable<ManagedEmployee[]> {
//     const params = new HttpParams().set('timestamp', Date.now().toString());
//     return this.http.get<ManagedEmployee[]>(`${this.baseUrl}/managed-employees`, {
//       headers: this.getAuthHeaders(),
//       params: params
//     });
//   }
//
//   getDepartments(): Observable<DepartmentDto[]> {
//     return this.http.get<DepartmentDto[]>(`${this.baseUrl}/departments`, { headers: this.getAuthHeaders() });
//   }
//
//   getManagedServices(): Observable<ServiceDto[]> {
//     return this.http.get<ServiceDto[]>(`${this.baseUrl}/managed-services`, { headers: this.getAuthHeaders() });
//   }
//
//   createEmployee(employeeData: CreateEmployeeDto): Observable<EmployeeDetailsDto> {
//     return this.http.post<EmployeeDetailsDto>(`${this.baseUrl}/employees`, employeeData, { headers: this.getAuthHeaders() });
//   }
//
//   softDeleteEmployee(id: number): Observable<void> {
//     return this.http.delete<void>(`${this.baseUrl}/employees/${id}`, { headers: this.getAuthHeaders() });
//   }
//
//   restoreEmployee(id: number): Observable<void> {
//     return this.http.post<void>(`${this.baseUrl}/employees/${id}/restore`, {}, { headers: this.getAuthHeaders() });
//   }
//
//   updateEmployee(id: number, employeeData: UpdateEmployeePayload): Observable<UserDto> {
//     return this.http.put<UserDto>(`${this.baseUrl}/employees/${id}`, employeeData, { headers: this.getAuthHeaders() });
//   }
//
//   private mapUserDtoToEmployee(dto: UserDto): Employee {
//     const nameParts = dto.fullName.trim().split(/\s+/);
//     const initials = nameParts.length > 1
//       ? (nameParts[0][0] + nameParts[1][0]).toUpperCase()
//       : nameParts[0].substring(0, 2).toUpperCase();
//
//     return {
//       id: dto.id,
//       name: dto.fullName,
//       email: dto.email,
//       avatar: initials,
//       department: 'N/A',
//       position: dto.role.charAt(0).toUpperCase() + dto.role.slice(1).toLowerCase(),
//       hireDate: '2023-01-01',
//       status: 'Active'
//     };
//   }
//
//   // <<< ✍️ START: التعديل المطلوب لحل المشكلة
//   // 1. أضفنا parameter هنا اسمه period
//   getReportData(period: string): Observable<ScopedReportData> {
//     // 2. أنشأنا HttpParams لإرسال الفترة الزمنية مع الطلب
//     const params = new HttpParams().set('period', period);
//
//     // 3. أضفنا الـ params للطلب
//     return this.http.get<ScopedReportData>(`${this.baseUrl}/reports`, {
//       headers: this.getAuthHeaders(),
//       params: params
//     });
//   }
//   // <<< ✍️ END: نهاية التعديل
//
//   getManagerDashboardStats(): Observable<ManagerDashboardDto> {
//     return this.http.get<ManagerDashboardDto>(`${this.baseUrl}/dashboard`, { headers: this.getAuthHeaders() });
//   }
//
//   getSystemAlerts(): Observable<AlertDto[]> {
//     return this.http.get<AlertDto[]>(`${this.baseUrl}/alerts`, { headers: this.getAuthHeaders() }).pipe(
//       catchError(error => {
//         console.warn('Could not fetch system alerts. The backend might be down or the endpoint is not implemented yet. Returning an empty array.', error);
//         return of([]);
//       })
//     );
//   }
// }



import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AuthService } from './auth.service';

// ... (All interfaces remain the same)
export interface Employee {
  id: number;
  name: string;
  email: string;
  avatar: string;
  department: string;
  position: string;
  hireDate: string;
  status: 'Active' | 'On Leave' | 'Suspended';
}
export interface UserDto {
  id: number;
  fullName: string;
  email: string;
  role: string;
  jobRoleCode?: string;
  departmentName?: string;
}
export interface UpdateEmployeePayload {
  fullName: string;
  email: string;
  roleId: number;
  departmentId: number;
}
export interface ServiceDto {
  id: number;
  name: string;
  cardCode: string;
  department: {
    id: number;
    name: string;
    govCode: string;
  };
}
export interface DepartmentDto {
  id: number;
  name: string;
}
export interface EmployeeDetailsDto {
  fullName: string;
  nationalId: string;
  jobRoleCode: string;
}
export interface CreateEmployeeDto {
  fullName: string;
  nationalId: string;
  serviceId: number;
}
export interface ReportStatValue { value: string; change?: number; }
export interface ReportStats { totalRequests: ReportStatValue; approved: ReportStatValue; rejected: ReportStatValue; avgProcessingTime: { value: string; change?: number }; }
export interface PerformanceMetric { department: string; totalRequests: number; approved: number; rejected: number; approvalRate: string; avgTime: number; slaCompliance: string; }
export interface TopPerformer {
  initials: string;
  name: string;
  department: string;
  requestsProcessed: number;
  approvalRate: string;
  avgTime: string;
}
export interface ReportData {
  stats: ReportStats;
  performanceMetrics: PerformanceMetric[];
  topPerformers?: TopPerformer[];
}
export interface ScopedReportData {
  report: ReportData;
  managerScope: string;
}

// ==========================================================
// START: ✅ التعديل المطلوب: تحديث الواجهة لتشمل بيانات الأداء الجديدة
// ==========================================================
export interface EmployeePerformanceData {
  employeeName: string;
  employeeId: string; // Corrected from employeeJobCode to match DTO
  assignedTasks: number;
  completedTasks: number;
  avgProcessingTimeInDays: number; // حقل متوسط وقت المعالجة
  approvalRate: number; // حقل معدل القبول
}
// ==========================================================
// END: ✅ نهاية التعديل
// ==========================================================

export interface ServiceTypeStatDto {
  serviceName: string;
  requestCount: number;
}
export interface ManagerDashboardDto {
  managerScope: string;
  managedEmployeesCount: number;
  totalTasksInScope: number;
  completedTasksInScope: number;
  employeePerformance: EmployeePerformanceData[];
  serviceTypeStats: ServiceTypeStatDto[];
}
export interface AlertDto {
  id: string;
  type: 'DELAY' | 'REJECTION_RATE' | 'ONBOARDING';
  message: string;
  entityType: string;
  entityId: string;
  createdAt: string;
}
export interface ManagedEmployee {
  id: number;
  fullName: string;
  email: string | null;
  jobRoleCode: string;
  departmentName: string;
  isRegistered: boolean;
  deletedAt: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class ManagerService {
  private baseUrl = 'http://localhost:8080/api/v1/manager';

  constructor(private http: HttpClient, private authService: AuthService) { }

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  getEmployees(): Observable<Employee[]> {
    return this.http.get<UserDto[]>(`${this.baseUrl}/employees`, { headers: this.getAuthHeaders() })
      .pipe(
        map((userDtos: UserDto[]) => userDtos.map((dto: UserDto) => this.mapUserDtoToEmployee(dto)))
      );
  }

  getManagedEmployees(): Observable<ManagedEmployee[]> {
    const params = new HttpParams().set('timestamp', Date.now().toString());
    return this.http.get<ManagedEmployee[]>(`${this.baseUrl}/managed-employees`, {
      headers: this.getAuthHeaders(),
      params: params
    });
  }

  getDepartments(): Observable<DepartmentDto[]> {
    return this.http.get<DepartmentDto[]>(`${this.baseUrl}/departments`, { headers: this.getAuthHeaders() });
  }

  getManagedServices(): Observable<ServiceDto[]> {
    return this.http.get<ServiceDto[]>(`${this.baseUrl}/managed-services`, { headers: this.getAuthHeaders() });
  }

  createEmployee(employeeData: CreateEmployeeDto): Observable<EmployeeDetailsDto> {
    return this.http.post<EmployeeDetailsDto>(`${this.baseUrl}/employees`, employeeData, { headers: this.getAuthHeaders() });
  }

  softDeleteEmployee(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/employees/${id}`, { headers: this.getAuthHeaders() });
  }

  restoreEmployee(id: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/employees/${id}/restore`, {}, { headers: this.getAuthHeaders() });
  }

  updateEmployee(id: number, employeeData: UpdateEmployeePayload): Observable<UserDto> {
    return this.http.put<UserDto>(`${this.baseUrl}/employees/${id}`, employeeData, { headers: this.getAuthHeaders() });
  }

  private mapUserDtoToEmployee(dto: UserDto): Employee {
    const nameParts = dto.fullName.trim().split(/\s+/);
    const initials = nameParts.length > 1
      ? (nameParts[0][0] + nameParts[1][0]).toUpperCase()
      : nameParts[0].substring(0, 2).toUpperCase();

    return {
      id: dto.id,
      name: dto.fullName,
      email: dto.email,
      avatar: initials,
      department: 'N/A',
      position: dto.role.charAt(0).toUpperCase() + dto.role.slice(1).toLowerCase(),
      hireDate: '2023-01-01',
      status: 'Active'
    };
  }

  // <<< ✍ START: التعديل المطلوب لحل المشكلة
  // 1. أضفنا parameter هنا اسمه period
  getReportData(period: string): Observable<ScopedReportData> {
    // 2. أنشأنا HttpParams لإرسال الفترة الزمنية مع الطلب
    const params = new HttpParams().set('period', period);

    // 3. أضفنا الـ params للطلب
    return this.http.get<ScopedReportData>(`${this.baseUrl}/reports`, {
      headers: this.getAuthHeaders(),
      params: params
    });
  }
  // <<< ✍ END: نهاية التعديل

  getManagerDashboardStats(): Observable<ManagerDashboardDto> {
    return this.http.get<ManagerDashboardDto>(`${this.baseUrl}/dashboard`, { headers: this.getAuthHeaders() });
  }

  getSystemAlerts(): Observable<AlertDto[]> {
    return this.http.get<AlertDto[]>(`${this.baseUrl}/alerts`, { headers: this.getAuthHeaders() }).pipe(
      catchError(error => {
        console.warn('Could not fetch system alerts. The backend might be down or the endpoint is not implemented yet. Returning an empty array.', error);
        return of([]);
      })
    );
  }
}
