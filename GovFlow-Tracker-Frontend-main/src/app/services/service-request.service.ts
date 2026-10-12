import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from './auth.service';

export interface ServiceRequestDto {
  id: number;
  serviceName: string;
  status: string;
  submissionDate: Date;
  department: string;
  details?: string;
  employeeComments?: string;
  uploadedDocuments?: DocumentDto[];
  updatedAt?: Date;
  fee?: number;
}

export interface DocumentDto {
  id: number;
  name: string;
  type: string;
  filePath: string;
  uploadedAt?: string;
  size?: number;
}

export interface PayableService {
  id: string;
  name: string;
  amount: number;
}

export interface PaymentRecord {
  id: string;
  serviceName: string;
  amount: number;
  date: string;
  status: 'Completed' | 'Failed' | 'Pending';
}

export interface PaymentRequest {
  serviceRequestId: number;
  amount: number;
}

export interface PaymentSummary {
  totalReceived: number;
  totalPending: number;
}

@Injectable({
  providedIn: 'root'
})
export class ServiceRequestService {
  private backendUrl = 'http://localhost:8080/api/v1';
  private apiUrl = `${this.backendUrl}/requests`;
  private paymentsUrl = `${this.backendUrl}/payments`;
  private filesUrl = `${this.backendUrl}/files`;

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    if (!token) { console.error('No authentication token found'); }
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  private getAuthHeadersJson(): HttpHeaders {
    const token = this.authService.getToken();
    if (!token) { console.error('No authentication token found'); }
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  private getAuthHeadersForMultipart(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  }

  private handleError(error: any): Observable<never> {
    console.error('An error occurred:', error);
    if (error.status === 401) { this.authService.logout(); }
    return throwError(() => new Error(error.message || 'Server error'));
  }

  getMyRequests(statusFilter?: string): Observable<ServiceRequestDto[]> {
    let params = new HttpParams();
    if (statusFilter && statusFilter !== 'all') {
      params = params.set('status', statusFilter);
    }
    return this.http.get<ServiceRequestDto[]>(`${this.apiUrl}`, {
      headers: this.getAuthHeadersJson(),
      params
    }).pipe(catchError(this.handleError.bind(this)));
  }

  getRequestById(id: number): Observable<ServiceRequestDto> {
    return this.http.get<ServiceRequestDto>(`${this.apiUrl}/${id}`, {
      headers: this.getAuthHeadersJson()
    }).pipe(catchError(this.handleError.bind(this)));
  }

  createRequest(formData: FormData): Observable<any> {
    return this.http.post(this.apiUrl, formData, {
      headers: this.getAuthHeadersForMultipart()
    }).pipe(catchError(this.handleError.bind(this)));
  }

  getPayableServices(): Observable<PayableService[]> { return this.http.get<PayableService[]>(`${this.paymentsUrl}/payable`, { headers: this.getAuthHeadersJson() }).pipe(catchError(this.handleError.bind(this))); }
  getPaymentHistory(): Observable<PaymentRecord[]> { return this.http.get<PaymentRecord[]>(`${this.paymentsUrl}/history`, { headers: this.getAuthHeadersJson() }).pipe(catchError(this.handleError.bind(this))); }
  processPayment(paymentData: PaymentRequest): Observable<PaymentRecord> { return this.http.post<PaymentRecord>(`${this.paymentsUrl}/process`, paymentData, { headers: this.getAuthHeadersJson() }).pipe(catchError(this.handleError.bind(this))); }
  getPaymentSummary(): Observable<PaymentSummary> { return this.http.get<PaymentSummary>(`${this.paymentsUrl}/summary`, { headers: this.getAuthHeadersJson() }).pipe(catchError(this.handleError.bind(this))); }

  uploadDocument(requestId: number, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    return this.http.post<any>(`${this.apiUrl}/${requestId}/documents`, formData, { headers: this.getAuthHeadersForMultipart() }).pipe(catchError(this.handleError.bind(this)));
  }

  /**
   * ✅ START: دالة جديدة لاستبدال مستند موجود
   */
  replaceDocument(requestId: number, docId: number, file: File): Observable<DocumentDto> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    const url = `${this.apiUrl}/${requestId}/documents/${docId}/replace`;
    return this.http.post<DocumentDto>(url, formData, {
      headers: this.getAuthHeadersForMultipart()
    }).pipe(catchError(this.handleError.bind(this)));
  }
  /**
   * ✅ END: نهاية الإضافة
   */

  deleteDocument(requestId: number, docId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${requestId}/documents/${docId}`, { headers: this.getAuthHeadersJson() }).pipe(catchError(this.handleError.bind(this)));
  }

  getViewableFile(filePath: string): Observable<Blob> {
    return this.http.get(`${this.filesUrl}/${filePath}`, {
      headers: this.getAuthHeaders(),
      responseType: 'blob'
    }).pipe(catchError(this.handleError.bind(this)));
  }

  downloadDocument(filePath: string): Observable<Blob> {
    return this.http.get(`${this.filesUrl}/${filePath}`, {
      headers: this.getAuthHeaders(),
      responseType: 'blob',
      params: { disposition: 'attachment' }
    }).pipe(catchError(this.handleError.bind(this)));
  }

  getDocumentUrl(filePath: string): string {
    return `${this.filesUrl}/${filePath}`;
  }

  updateRequestStatus(requestId: number, status: string, comments?: string): Observable<any> {
    const body = { status, comments };
    return this.http.patch(`${this.apiUrl}/${requestId}/status`, body, { headers: this.getAuthHeadersJson() }).pipe(catchError(this.handleError.bind(this)));
  }
}
