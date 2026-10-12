import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

// ✅ Renamed the interface to 'MunicipalityServiceData'
export interface MunicipalityServiceData {
  id: string;
  title: string;
  description: string;
  category: 'permits' | 'complaints';
  requirements: string[];
  fee: number;
  processingTime: string;
  icon: string;
}

@Injectable({
  providedIn: 'root'
})
export class MunicipalityService {

  constructor() { }

  // ✅ The function now returns the renamed interface type
  getServices(): Observable<MunicipalityServiceData[]> {
    // ✅ The mock data array now uses the renamed interface type
    const mockServices: MunicipalityServiceData[] = [
      {
        id: 'MUN-01',
        title: 'Building Permit Issuance',
        description: 'Apply for a new permit to begin construction.',
        category: 'permits',
        requirements: ['Ownership Deed', 'Engineering Drawings', 'National ID'],
        fee: 2000.00,
        processingTime: '15-20 Business Days',
        icon: 'fa-building'
      },
      {
        id: 'MUN-02',
        title: 'Building Permit Renewal',
        description: 'Renew your existing building permit before it expires.',
        category: 'permits',
        requirements: ['Previous Permit', 'Recent Photos'],
        fee: 1200.00,
        processingTime: '5-7 Business Days',
        icon: 'fa-sync-alt'
      },
      {
        id: 'MUN-03',
        title: 'Building Violation Complaint',
        description: 'File a formal complaint about a building violation.',
        category: 'complaints',
        requirements: ['Violation Address', 'Photo Evidence'],
        fee: 0,
        processingTime: '48 Hours Review',
        icon: 'fa-exclamation-triangle'
      },
      {
        id: 'MUN-04',
        title: 'Cleanliness Complaint',
        description: 'Report issues related to public cleanliness and waste.',
        category: 'complaints',
        requirements: ['Location Details', 'Description of Issue'],
        fee: 0,
        processingTime: '24 Hours Response',
        icon: 'fa-broom'
      },
      {
        id: 'MUN-05',
        title: 'Request Renovation Permit',
        description: 'Apply for a permit for internal or external renovations.',
        category: 'permits',
        requirements: ['Property Deed', 'Renovation Plan'],
        fee: 750.00,
        processingTime: '7-10 Business Days',
        icon: 'fa-paint-roller'
      }
    ];

    return of(mockServices);
  }
}
