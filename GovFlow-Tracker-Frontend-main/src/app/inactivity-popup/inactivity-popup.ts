import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-inactivity-popup',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './inactivity-popup.html',
  styleUrls: ['./inactivity-popup.css']
})
export class InactivityPopupComponent {
  showPopup$: Observable<boolean>;
  countdown$: Observable<number>;

  constructor(private authService: AuthService) {
    this.showPopup$ = this.authService.showInactivityPopup.asObservable();
    this.countdown$ = this.authService.countdownValue.asObservable();
  }

  stayLoggedIn() {
    this.authService.continueSession();
  }

  logout() {
    this.authService.logout();
  }
}
