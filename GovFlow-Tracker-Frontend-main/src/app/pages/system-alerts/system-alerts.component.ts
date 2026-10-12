import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ManagerService, AlertDto } from '../../services/manager.service';
import { Subscription, timer } from 'rxjs';
import { switchMap } from 'rxjs/operators';

// Interface to define the structure of an alert for the template
interface SystemAlert {
  id: string;
  type: 'warning' | 'error' | 'info';
  icon: string;
  title: string;
  message: string;
}

@Component({
  selector: 'app-system-alerts',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './system-alerts.component.html',
  styleUrls: ['./system-alerts.component.css']
})
export class SystemAlertsComponent implements OnInit, OnDestroy { // ✅ Implemented OnDestroy for cleanup

  private managerService = inject(ManagerService);

  // ✅ This will hold our polling subscription to manage it
  private alertsSubscription: Subscription | undefined;

  public alerts: SystemAlert[] = [];
  public isLoading = true;

  constructor() { }

  ngOnInit(): void {
    this.startPollingForAlerts();
  }

  // ✅ START: New function to handle periodic fetching
  /**
   * Starts a polling mechanism that fetches alerts from the backend every 30 seconds.
   * It starts immediately and then repeats.
   */
  private startPollingForAlerts(): void {
    this.alertsSubscription = timer(0, 30000) // Starts at 0ms, then runs every 30000ms (30 seconds)
      .pipe(
        // switchMap cancels the previous pending request if a new interval starts
        switchMap(() => {
          this.isLoading = true;
          return this.managerService.getSystemAlerts();
        })
      )
      .subscribe({
        next: (backendAlerts: AlertDto[]) => {
          this.mapAndSetAlerts(backendAlerts);
          this.isLoading = false;
        },
        error: (err: any) => {
          console.error("Polling for system alerts failed. This is handled in the service.", err);
          // The service's catchError will return an empty array, so the UI won't break.
          this.isLoading = false;
          this.alerts = [];
        }
      });
  }
  // ✅ END: New function

  /**
   * Maps backend data to the format required by the component's template.
   * @param backendAlerts - Array of alerts from the backend.
   */
  private mapAndSetAlerts(backendAlerts: AlertDto[]): void {
    // We can sort alerts by date to show the newest first
    const sortedAlerts = backendAlerts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    this.alerts = sortedAlerts.map(alert => ({
      id: alert.id,
      message: alert.message,
      title: this.generateTitle(alert.type, alert.entityType),
      ...this.getAlertTypeAndIcon(alert.type)
    }));
  }

  /**
   * Determines the display type ('error', 'warning', 'info') and icon from the backend alert type.
   */
  private getAlertTypeAndIcon(type: string): { type: 'error' | 'warning' | 'info'; icon: string } {
    switch (type.toUpperCase()) {
      case 'DELAY':
        return { type: 'error', icon: 'fas fa-clock' };
      case 'REJECTION_RATE':
        return { type: 'warning', icon: 'fas fa-exclamation-triangle' };
      case 'ONBOARDING':
        return { type: 'info', icon: 'fas fa-user-plus' };
      default:
        return { type: 'info', icon: 'fas fa-info-circle' };
    }
  }

  /**
   * Generates a user-friendly title based on the alert type.
   */
  private generateTitle(type: string, entity: string): string {
    const entityName = entity.replace('_', ' ').toLowerCase();
    switch (type.toUpperCase()) {
      case 'DELAY': return `Processing delays detected in ${entityName}`;
      case 'REJECTION_RATE': return `High rejection rate in ${entityName}`;
      case 'ONBOARDING': return `New employee onboarding`;
      default: return 'System Notification';
    }
  }

  // ✅ START: تم إضافة الدالة المفقودة هنا لحل المشكلة
  /**
   * Marks all alerts as read. This would call a service to update the backend.
   */
  markAllAsRead(): void {
    // For demonstration, we'll just clear the local array.
    console.log("Marking all alerts as read...");
    this.alerts = [];
    // In a real app, you would also call a service to mark all alerts as read in the backend.
    // this.managerService.markAllAlertsAsRead().subscribe();
  }
  // ✅ END: نهاية الإضافة

  /**
   * Dismisses a single alert. This would call a service to delete/update the specific alert.
   * @param alertId The ID of the alert to be removed.
   */
  dismissAlert(alertId: string): void {
    // For demonstration, we'll filter the local array.
    console.log(`Dismissing alert with ID: ${alertId}`);
    this.alerts = this.alerts.filter(a => a.id !== alertId);
    // In a real app, you would also call a service to mark it as dismissed in the backend.
    // this.managerService.dismissAlert(alertId).subscribe();
  }

  // ✅ START: Implement ngOnDestroy to prevent memory leaks
  /**
   * This is a lifecycle hook that runs when the component is destroyed (e.g., navigating to another page).
   * We must unsubscribe from our polling subscription to prevent it from running in the background forever.
   */
  ngOnDestroy(): void {
    if (this.alertsSubscription) {
      this.alertsSubscription.unsubscribe();
    }
  }
  // ✅ END: Implementation of ngOnDestroy
}
