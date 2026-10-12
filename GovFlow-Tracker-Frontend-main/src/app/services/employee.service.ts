import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from './auth.service';

// --- الأنواع الجديدة والصحيحة للداشبورد ---
export interface DashboardStatsV2 {
  pending: number;
  underReview: number;
  approved: number;
  rejected: number;
}

export interface EmployeeTaskV2 {
  requestId: string;
  serviceName: string;
  citizenName: string;
  // ✅ FIX 1: تم تصحيح اسم الخاصية ليطابق ما يتوقعه الـ component
  submissionDate: string;
  priority: string;
  status: string;
}

export interface EmployeeDashboardDataV2 {
  stats: DashboardStatsV2;
  tasks: EmployeeTaskV2[];
}

// --- الأنواع القديمة التي تم الحفاظ عليها ---
export interface ServiceRequest {
  id: string;
  citizenName: string;
  serviceType: string;
  date: Date;
  priority: string;
  status: string;
  department: string;
}

export interface DashboardStats {
  label: string;
  count: number;
  icon: string;
  colorClass: string;
}

export interface EmployeeDashboardData {
  stats: DashboardStats[];
  requests: ServiceRequest[];
}

export interface EmployeeTask {
  id: string;
  serviceType: string;
  citizenName: string;
  submittedDate: string;
  dueDate: string;
  priority: 'high' | 'normal' | 'low';
  status: string;
  isPaid: boolean; // ✅ تم إضافة خاصية الدفع هنا لحل المشكلة
}

// ✅ FIX 2: تم إكمال الواجهة الناقصة بالكامل
export interface FullTaskDetails {
  id: number;
  serviceName: string;
  department: string;
  submissionDate: string;
  status: string;
  fee: number;
  isPaid: boolean;
  details: string;
  employeeComments: string | null;
  updatedAt: string;
  citizenName: string;
  uploadedDocuments: Array<{
    id: number;
    name: string;
    type: string;
    filePath: string;
    uploadedAt: string;
    size: number;
  }>;
}


@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private baseUrl = 'http://localhost:8080/api/v1/employee';

  constructor(private http: HttpClient, private authService: AuthService) { }

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  getEmployeeDashboard(): Observable<EmployeeDashboardDataV2> {
    const headers = this.getAuthHeaders();

    interface BackendTaskData {
      id: string;
      serviceType: string;
      citizenName: string;
      submissionDate: string; // تم تغيير الاسم هنا ليطابق الواجهة الخلفية
      priority: string;
      status: string;
    }
    interface BackendResponse {
      stats: DashboardStatsV2;
      tasks: BackendTaskData[];
    }

    return this.http.get<BackendResponse>(`${this.baseUrl}/dashboard`, { headers }).pipe(
      map(backendData => {
        const transformedTasks: EmployeeTaskV2[] = backendData.tasks.map(task => ({
          ...task,
          requestId: task.id,
          serviceName: task.serviceType,
          submissionDate: task.submissionDate // التأكد من تمرير التاريخ
        }));

        return {
          stats: backendData.stats,
          tasks: transformedTasks
        };
      })
    );
  }

  // --- تم استعادة باقي الدوال بالكامل ---
  getEmployeeDashboardData(): Observable<EmployeeDashboardData> {
    const headers = this.getAuthHeaders();
    return forkJoin({
      stats: this.http.get<DashboardStats[]>(`${this.baseUrl}/stats`, { headers }),
      requests: this.http.get<ServiceRequest[]>(`${this.baseUrl}/requests`, { headers })
    });
  }

  getMyTasks(): Observable<EmployeeTask[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<EmployeeTask[]>(`${this.baseUrl}/my-tasks`, { headers });
  }

  getEmployeeTasks(): Observable<EmployeeTask[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<EmployeeTask[]>(`${this.baseUrl}/tasks`, { headers });
  }

  getTaskDetails(taskId: string): Observable<FullTaskDetails> {
    const numericId = taskId.replace('TSK-', '');
    const headers = this.getAuthHeaders();
    return this.http.get<FullTaskDetails>(`${this.baseUrl}/requests/${numericId}`, { headers });
  }

  reviewTask(taskId: string, status: string, comments: string): Observable<any> {
    const numericId = taskId.replace('TSK-', '');
    const headers = this.getAuthHeaders();
    const body = {
      status: status,
      employeeComments: comments
    };
    return this.http.patch(`${this.baseUrl}/requests/${numericId}/review`, body, { headers });
  }

  updateRequestStatus(requestId: string, status: string): Observable<any> {
    const headers = this.getAuthHeaders();
    const body = { status: status };
    return this.http.patch(`${this.baseUrl}/requests/${requestId}/status`, body, { headers });
  }

  getRequestDocuments(requestId: string): Observable<any[]> {
    return new Observable(observer => {
      const mockDocuments = [
        { name: 'national_id.pdf', url: '#' },
        { name: 'request_form.pdf', url: '#' }
      ];
      observer.next(mockDocuments);
      observer.complete();
    });
  }
}
