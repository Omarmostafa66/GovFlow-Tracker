import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MunicipalityService, MunicipalityServiceData } from '../../../services/municipality.service';
import { AuthService } from '../../../services/auth.service'; // ADDITION: Import AuthService

@Component({
  selector: 'app-municipality-services',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './municipality-services.html',
  styleUrls: ['./municipality-services.css']
})
export class MunicipalityServicesComponent implements OnInit {
  services: MunicipalityServiceData[] = [];
  filteredServices: MunicipalityServiceData[] = [];
  searchQuery = '';
  selectedCategory = 'all';
  loading = true;
  error: string | null = null;

  // ADDITION: Properties for age restriction logic
  userAge: number = 0;
  isUnderage: boolean = false;

  constructor(
    private municipalityService: MunicipalityService,
    private router: Router,
    private authService: AuthService // ADDITION: Inject AuthService
  ) {}

  ngOnInit(): void {
    this.checkUserAge(); // ADDITION: Call age check on init
    this.loadServices();
  }

  // ADDITION: New method to check user's age
  checkUserAge(): void {
    const currentUser = this.authService.getCurrentUserValue();
    if (currentUser && (currentUser as any).nationalId) {
      this.userAge = this.calculateAgeFromNationalId((currentUser as any).nationalId);
      this.isUnderage = this.userAge > 0 && this.userAge < 18;
    } else {
      this.isUnderage = false;
    }
  }

  // ADDITION: New method to calculate age from National ID
  private calculateAgeFromNationalId(nationalId: string): number {
    if (!nationalId || nationalId.length !== 14) { return 0; }
    try {
      const centuryDigit = parseInt(nationalId.substring(0, 1), 10);
      const yearDigits = parseInt(nationalId.substring(1, 3), 10);
      const month = parseInt(nationalId.substring(3, 5), 10);
      const day = parseInt(nationalId.substring(5, 7), 10);
      const year = (centuryDigit === 3 ? 2000 : 1900) + yearDigits;
      const birthDate = new Date(year, month - 1, day);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age;
    } catch { return 0; }
  }


  loadServices(): void {
    this.loading = true;
    this.error = null;
    this.municipalityService.getServices().subscribe({
      next: (data) => {
        this.services = data;
        this.filteredServices = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load services. Please try again later.';
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

  applyForService(service: MunicipalityServiceData): void {
    // ADDITION: Prevent navigation if the user is underage
    if (this.isUnderage) {
      return;
    }

    console.log('Applying for service:', service.title);
    const title = service.title.toLowerCase();

    if (title.includes('building permit renewal')) {
      this.router.navigate(['/municipality-services/building-permit-renewal']);
    } else if (title.includes('violation complaint')) {
      this.router.navigate(['/municipality-services/building-violation-complaint']);
    } else if (title.includes('building permit')) {
      this.router.navigate(['/municipality-services/building-permit']);
    } else if (title.includes('cleanliness complaint')) {
      this.router.navigate(['/municipality-services/cleanliness-complaint']);
    } else if (title.includes('renovation permit')) {
      this.router.navigate(['/municipality-services/renovation-permit']);
    } else {
      console.warn('No specific route configured for:', service.title);
    }
  }
}
