import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CitizenPaymentSummaryDto {
  totalReceived: number;
  totalPending: number;
}

export interface PayableService {
  id: string;
  name: string;
  amount: number;
}

export interface PaymentRecord {
  id: number;
  serviceName: string;
  amount: number;
  date: string;
  status: string;
  invoiceNumber?: string;
}

export interface PaymentRequest {
  serviceRequestId: number;
  amount: number;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService {

  // ✅ The final correct URL for the backend API
  private apiUrl = 'http://localhost:8080/api/v1/payments';

  constructor(private http: HttpClient) { }

  getPayableServices(): Observable<PayableService[]> {
    return this.http.get<PayableService[]>(`${this.apiUrl}/payable`);
  }

  getPaymentHistory(): Observable<PaymentRecord[]> {
    return this.http.get<PaymentRecord[]>(`${this.apiUrl}/history`);
  }

  processPayment(paymentData: PaymentRequest): Observable<PaymentRecord> {
    return this.http.post<PaymentRecord>(`${this.apiUrl}/process`, paymentData);
  }

  getPaymentSummary(): Observable<CitizenPaymentSummaryDto> {
    return this.http.get<CitizenPaymentSummaryDto>(`${this.apiUrl}/summary`);
  }
}
