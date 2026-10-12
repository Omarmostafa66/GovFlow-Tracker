import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { TrafficService, TrafficServiceData } from '../../../services/traffic.service';
import { AuthService, User } from '../../../services/auth.service'; // I changed the import to include User as well

@Component({
  selector: 'app-traffic-services',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './traffic-services.html',
  styleUrls: ['./traffic-services.css']
})
export class TrafficServicesComponent implements OnInit {
  services: TrafficServiceData[] = [];
  filteredServices: TrafficServiceData[] = [];
  searchQuery = '';
  selectedCategory = 'all';
  loading = true;
  error: string | null = null;

  userAge: number = 0;
  isUnderage: boolean = false;

  constructor(
    private trafficService: TrafficService,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.checkUserAge();
    this.loadServices();
  }

  /**
   * Calculates age from an Egyptian National ID.
   * @param nationalId The 14-digit national ID.
   * @returns The calculated age.
   */
  private calculateAgeFromNationalId(nationalId: string): number {
    if (!nationalId || nationalId.length !== 14) {
      return 0; // Return 0 for invalid ID format
    }

    try {
      const centuryDigit = parseInt(nationalId.substring(0, 1), 10);
      const yearDigits = parseInt(nationalId.substring(1, 3), 10);
      const month = parseInt(nationalId.substring(3, 5), 10);
      const day = parseInt(nationalId.substring(5, 7), 10);

      const year = (centuryDigit === 3 ? 2000 : 1900) + yearDigits;

      const birthDate = new Date(year, month - 1, day);
      const today = new Date();

      // Adjust for timezone differences to prevent off-by-one day errors
      birthDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);

      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDifference = today.getMonth() - birthDate.getMonth();

      if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      return age;
    } catch (e) {
      console.error("Error calculating age from National ID:", e);
      return 0;
    }
  }

  // MODIFIED: This method now calculates age from the national ID
  checkUserAge(): void {
    const currentUser = this.authService.getCurrentUserValue();
    // Assuming 'nationalId' property exists on the User object
    if (currentUser && (currentUser as any).nationalId) {
      this.userAge = this.calculateAgeFromNationalId((currentUser as any).nationalId);
      this.isUnderage = this.userAge > 0 && this.userAge < 18;
    } else {
      // Default behavior if national ID is not available
      this.isUnderage = false;
    }
  }

  loadServices(): void {
    this.loading = true;
    this.error = null;
    this.trafficService.getServices().subscribe({
      next: (data: TrafficServiceData[]) => {
        this.services = data;
        this.filteredServices = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load services.';
        this.loading = false;
      }
    });
  }

  filterServices(): void {
    let tempServices = this.services;

    if (this.selectedCategory !== 'all') {
      tempServices = tempServices.filter(service => service.category === this.selectedCategory);
    }

    if (this.searchQuery) {
      tempServices = tempServices.filter(service =>
        service.title.toLowerCase().includes(this.searchQuery.toLowerCase())
      );
    }

    this.filteredServices = tempServices;
  }

  applyForService(service: TrafficServiceData): void {
    if (service.title === 'Pay Traffic Violation') {
      return;
    }

    if (this.isUnderage && service.category === 'license') {
      return;
    }

    if (service.title === 'Driver License Issuance') {
      this.router.navigate(['/traffic-services/issue-license']);
    } else if (service.title === 'License Renewal') {
      this.router.navigate(['/traffic-services/renew-license']);
    } else if (service.title === 'License Replacement') {
      this.router.navigate(['/traffic-services/replace-license']);
    } else if (service.title === 'Pay Traffic Violation') {
      this.router.navigate(['/traffic-services/traffic-violations']);
    } else if (service.title === 'Vehicle Registration') {
      this.router.navigate(['/traffic-services/vehicle-registration']);
    }
  }
}
