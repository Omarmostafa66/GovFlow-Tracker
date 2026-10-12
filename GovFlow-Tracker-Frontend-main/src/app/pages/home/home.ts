import { Component, OnInit, effect } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    RouterLink,
    CommonModule
  ],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class HomeComponent implements OnInit {
  isLoggedIn: boolean = false;
  userName: string = '';

  activeTeam: 'developers' | 'testers' = 'developers';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    // Using effect to react to currentUser changes
    effect(() => {
      const user = this.authService.currentUser();
      this.isLoggedIn = user !== null;
      this.userName = user?.fullName || '';
    });
  }

  ngOnInit(): void {
    this.checkLoginStatus();
  }

  // Function to get the current user from AuthService
  currentUser(): any {
    return this.authService.currentUser();
  }

  // Function to navigate to the appropriate Dashboard based on user role
  navigateToDashboard(): void {
    const role = this.currentUser()?.role;
    let route: string;

    switch (role?.toUpperCase()) {
      case 'CITIZEN':
        // As per previous logic, Citizen goes to home/dashboard
        route = '/citizen-dashboard';
        break;
      case 'EMPLOYEE':
        route = '/employee-dashboard';
        break;
      case 'MANAGER':
        route = '/manager-dashboard';
        break;
      default:
        route = '/'; // Default page
    }

    this.router.navigate([route]);
  }

  // Function to check login status
  checkLoginStatus(): void {
    this.isLoggedIn = this.authService.isAuthenticated();

    if (this.isLoggedIn) {
      const userJson = this.authService.getCurrentUserValue();
      if (userJson) {
        this.userName = userJson.fullName || '';
      }
    }
  }

  // Logout function
  logout(): void {
    this.authService.logout();
  }
}

