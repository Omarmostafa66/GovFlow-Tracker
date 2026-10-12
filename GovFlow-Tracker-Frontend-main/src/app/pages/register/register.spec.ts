import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    CommonModule
  ],
  templateUrl: './register.html',
  styleUrls: ['./register.css'],
})
export class RegisterComponent {
  fullName = '';
  nationalId = '';
  email = '';
  password = '';
  confirmPassword = '';
  role = 'citizen';
  phoneNumber = '';
  address = '';
  jobRoleCode = '';
  showRoleCode = false;

  constructor(private authService: AuthService, private router: Router) {}

  register() {
    if (this.password !== this.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    const userPayload = {
      fullName: this.fullName,
      nationalId: this.nationalId,
      email: this.email,
      password: this.password,
      role: this.role,
      phoneNumber: this.phoneNumber,
      address: this.address,
      jobRoleCode: this.jobRoleCode,
    };

    this.authService.register(userPayload).subscribe({
      next: (res) => {
        alert('Registration successful! Please login.');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        console.error('Registration Error:', err);
        const errorMsg = err?.error?.message || 'Unknown registration error';
        alert('Registration failed: ' + errorMsg);
      }
    });
  }

  toggleRoleCode() {
    this.showRoleCode = this.role !== 'citizen';
  }
}
