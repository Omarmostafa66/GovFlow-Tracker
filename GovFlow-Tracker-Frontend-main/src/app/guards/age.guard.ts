import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service'; // تأكد من أن المسار صحيح

@Injectable({
  providedIn: 'root'
})
export class AgeGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

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
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age;
    } catch {
      return 0;
    }
  }

  canActivate(): boolean | UrlTree {
    const currentUser = this.authService.getCurrentUserValue();

    // Check for user and their national ID
    if (currentUser && (currentUser as any).nationalId) {
      const age = this.calculateAgeFromNationalId((currentUser as any).nationalId);

      // If age is 18 or over, grant access
      if (age >= 18) {
        return true;
      }
    }

    // If user is not logged in, has no national ID, or is underage,
    // redirect them to the main traffic services page and deny access.
    return this.router.createUrlTree(['/traffic-services']);
  }
}
