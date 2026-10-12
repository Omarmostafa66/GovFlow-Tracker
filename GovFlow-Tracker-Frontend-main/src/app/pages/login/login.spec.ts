import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
})
export class LoginComponent {
  // ✅ تغيير email إلى nationalId
  nationalId = '';
  password = '';
  rememberMe = false;

  constructor(private authService: AuthService) {}

  login() {
    // ✅ استخدام this.nationalId في استدعاء الدالة
    this.authService.login(this.nationalId, this.password).subscribe({
      next: () => {
        console.log('Login successful!');
      },
      error: (err) => {
        alert('Login failed: ' + (err.error.message || 'Invalid credentials'));
      }
    });
  }

  togglePasswordVisibility() {
    // ... (الكود كما هو)
  }
}
