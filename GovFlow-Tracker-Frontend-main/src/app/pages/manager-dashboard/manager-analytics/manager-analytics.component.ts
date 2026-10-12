import { Component, Input, OnChanges, SimpleChanges } from '@angular/core'; // تم إضافة OnChanges و SimpleChanges
import { CommonModule } from '@angular/common';
// تأكد من أن هذا الـ DTO يطابق ما يأتيك من الـ Service
import { ManagerDashboardDto } from '../../../services/manager.service';


/**
 * This interface extends the imported DTO to include the missing properties.
 * The best long-term solution is to add these properties to the main
 * ManagerDashboardDto interface in 'manager.service.ts'.
 */
interface CompleteManagerDashboardDto extends ManagerDashboardDto {
  approvedTasksInScope: number;
  rejectedTasksInScope: number;
}


@Component({
  selector: 'app-manager-analytics',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './manager-analytics.component.html',
  styleUrls: ['./manager-analytics.component.css']
})
// تم إضافة OnChanges
export class ManagerAnalyticsComponent implements OnChanges {
  @Input() dashboardStats: ManagerDashboardDto | null = null;


  // START: الإضافة الأخيرة: متغير لحساب أقصى عدد للطلبات

  public maxRequests = 0;

  ngOnChanges(changes: SimpleChanges): void {
    // This function runs whenever the input 'dashboardStats' changes.
    if (changes['dashboardStats'] && this.dashboardStats && this.dashboardStats.serviceTypeStats) {
      // Find the highest request count among all service types to use as a baseline.
      this.maxRequests = Math.max(...this.dashboardStats.serviceTypeStats.map(stat => stat.requestCount), 0);
    }
  }



  /**
   * Calculates the approval rate based on the number of approved tasks
   * relative to the total number of reviewed tasks (approved + rejected).
   */
  get approvalRate(): number {
    if (!this.dashboardStats) {
      return 0;
    }

    const stats = this.dashboardStats as CompleteManagerDashboardDto;

    const approved = stats.approvedTasksInScope;
    const rejected = stats.rejectedTasksInScope;

    const totalReviewed = approved + rejected;

    // Handle case where no tasks have been reviewed to avoid division by zero.
    if (totalReviewed === 0) {
      return 0;
    }

    const rate = (approved / totalReviewed) * 100;
    return parseFloat(rate.toFixed(1)); // Return one decimal place
  }

  /**
   * Calculates the rejection rate based on the number of rejected tasks
   * relative to the total number of reviewed tasks (approved + rejected).
   */
  get rejectionRate(): number {
    if (!this.dashboardStats) {
      return 0;
    }

    const stats = this.dashboardStats as CompleteManagerDashboardDto;

    const approved = stats.approvedTasksInScope;
    const rejected = stats.rejectedTasksInScope;

    const totalReviewed = approved + rejected;

    // Handle case where no tasks have been reviewed.
    if (totalReviewed === 0) {
      return 0;
    }

    const rate = (rejected / totalReviewed) * 100;
    return parseFloat(rate.toFixed(1)); // Return one decimal place
  }

  /**
   * Gets the total number of reviewed tasks (approved + rejected).
   */
  get totalReviewed(): number {
    if (!this.dashboardStats) return 0;
    const stats = this.dashboardStats as CompleteManagerDashboardDto;
    return stats.approvedTasksInScope + stats.rejectedTasksInScope;
  }

  /**
   * Gets the count of approved tasks.
   */
  get approvedCount(): number {
    if (!this.dashboardStats) return 0;
    const stats = this.dashboardStats as CompleteManagerDashboardDto;
    return stats.approvedTasksInScope;
  }

  /**
   * Gets the count of rejected tasks.
   */
  get rejectedCount(): number {
    if (!this.dashboardStats) return 0;
    const stats = this.dashboardStats as CompleteManagerDashboardDto;
    return stats.rejectedTasksInScope;
  }

}
