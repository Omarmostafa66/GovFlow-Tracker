import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from './auth.service';

// Interfaces to define the shape of the data from the backend
export interface DashboardStats {
  label: string;
  count: number;
  icon: string;
  colorClass: string;
}

export interface ServiceCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  tags: string[];
}

export interface RequestItem {
  id: string;
  service: string;
  date: string;
  status: string;
  statusClass: string;
}

export interface CitizenDashboardData {
  name: string;
  stats: DashboardStats[];
  categories: ServiceCategory[];
  recentRequests: RequestItem[];
}

@Injectable({
  providedIn: 'root'
})
export class CitizenService {
  private apiUrl = 'http://localhost:8080/api/citizen';

  constructor(private http: HttpClient, private authService: AuthService) { }

  /**
   * Fetches all necessary data for the citizen dashboard from the backend.
   * @returns An Observable of the complete dashboard data.
   */
  getDashboardData(): Observable<CitizenDashboardData> {
    const token = this.authService.getToken();
    if (!token) {
      // If no token, return empty data to avoid errors
      return of({ name: '', stats: [], categories: [], recentRequests: [] });
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<CitizenDashboardData>(`${this.apiUrl}/dashboard`, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Private method to handle HTTP errors.
   */
  private handleError(error: any): Observable<never> {
    console.error('API Error:', error);
    let errorMessage = 'An unexpected error occurred';
    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }
    return throwError(() => new Error(errorMessage));
  }
}
