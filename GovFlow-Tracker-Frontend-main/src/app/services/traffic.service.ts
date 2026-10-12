import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';

export interface TrafficServiceData {
  id: string;
  title: string;
  description: string;
  category: 'license' | 'violations' | 'vehicles';
  requiredDocuments: string[];
  processingTime: string;
  fee: string;
  icon: string;
}

// ✅ Interface for Violation, as it's used in the component
export interface Violation {
  id: string;
  date: string;
  type: string;
  location: string;
  amount: number;
  status: string;
  description: string;
}

@Injectable({
  providedIn: 'root'
})
export class TrafficService {

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private router: Router
  ) { }

  getServices(): Observable<TrafficServiceData[]> {
    const mockServices: TrafficServiceData[] = [
      {
        id: "1",
        title: "Driver License Issuance",
        description: "Apply for a new driver's license.",
        category: 'license',
        requiredDocuments: ["National ID", "Medical Certificate", "Photograph"],
        processingTime: "7-10 Business Days",
        fee: "550.00 EGP",
        icon: "fa-id-card"
      },
      {
        id: "2",
        title: "License Renewal",
        description: "Renew your existing driver's license.",
        category: 'license',
        requiredDocuments: ["Current License", "National ID", "Photograph"],
        processingTime: "5-7 Business Days",
        fee: "250.00 EGP",
        icon: "fa-sync-alt"
      },
      {
        id: "3",
        title: "Pay Traffic Violation",
        description: "View and pay your outstanding traffic violations.",
        category: 'violations',
        requiredDocuments: ["Vehicle Plate Number"],
        processingTime: "Instant",
        fee: "Varies",
        icon: "fa-file-invoice-dollar"
      },
      {
        id: "4",
        title: "Vehicle Registration",
        description: "Register a new vehicle.",
        category: 'vehicles',
        requiredDocuments: ["Ownership Contract", "Technical Inspection"],
        processingTime: "7-10 Business Days",
        fee: "800.00 EGP",
        icon: "fa-car"
      },
      {
        id: "5",
        title: "License Replacement",
        description: "Replace a lost or damaged driver's license.",
        category: 'license',
        requiredDocuments: ["Police Report", "National ID"],
        processingTime: "5-7 Business Days",
        fee: "150.00 EGP",
        icon: "fa-exchange-alt"
      }
    ];
    return of(mockServices);
  }

  navigateToService(service: TrafficServiceData): void {
    console.log("Navigating to service:", service.title);
    if (service.title === "Driver's License Issuance") {
      this.router.navigate(['/traffic-services/issue-license']);
    } else if (service.title === "License Renewal") {
      this.router.navigate(['/traffic-services/renew-license']);
    } else {
      this.applyForService(service).subscribe({
        next: (response) => {
          alert('Application submitted successfully! (Simulated)');
        },
        error: (err) => {
          alert('Failed to submit application. (Simulated)');
        }
      });
    }
  }

  applyForService(service: TrafficServiceData): Observable<any> {
    return of({
      success: true,
      message: "Application submitted successfully (simulated).",
      requestId: `REQ-${Date.now()}`
    });
  }

  // ✅✅✅ الزيادة المطلوبة فقط ✅✅✅
  // This is a MOCK function. It does NOT call the backend.
  // It returns fake data to simulate a real search.
  searchViolations(vehiclePlate: string): Observable<Violation[]> {
    console.log(`Simulating search for violations with plate: ${vehiclePlate}`);

    const mockViolations: Violation[] = [
      { id: 'V001', date: '2024-08-15', type: 'Exceeding Speed Limit', location: 'Ring Road, Cairo', amount: 500, status: 'UNPAID', description: 'Speed was 120 km/h in a 90 km/h zone.'},
      { id: 'V002', date: '2024-07-20', type: 'Parking Violation', location: 'Tahrir Square, Cairo', amount: 150, status: 'PAID', description: 'Parked in a no-parking area.'}
    ];

    // Return the mock violations as an observable
    return of(mockViolations);
  }
}
