import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DriversLicenseService {
  private apiUrl = 'https://api.yourdomain.com/drivers-license';

  constructor(private http: HttpClient) { }

  submitLicenseRequest(formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/requests`, formData);
  }

  getLicenseCategories(): Observable<string[]> {
    return this.http.get<string[]>(`${thisapiUrl}/categories`);
  }

  getRequestStatus(requestId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/requests/${requestId}`);
  }

  cancelRequest(requestId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/requests/${requestId}`);
  }
}
