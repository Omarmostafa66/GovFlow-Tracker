import { Component, OnInit, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ManagerService, ReportStats, PerformanceMetric, TopPerformer, ScopedReportData, ReportStatValue } from '../../../services/manager.service';
import { NgxChartsModule, Color, ScaleType } from '@swimlane/ngx-charts';
import { LegendPosition } from '@swimlane/ngx-charts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { AuthService } from '../../../services/auth.service';

interface DisplayPerformanceMetric extends PerformanceMetric {
  card: string;
}

@Component({
  selector: 'app-reports-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, NgxChartsModule],
  templateUrl: './reports-dashboard.component.html',
  styleUrls: ['./reports-dashboard.component.css']
})
export class ReportsDashboardComponent implements OnInit {
  @ViewChild('totalRequestsValue') totalRequestsEl!: ElementRef;
  @ViewChild('approvedValue') approvedEl!: ElementRef;
  @ViewChild('rejectedValue') rejectedEl!: ElementRef;
  @ViewChild('avgTimeValue') avgTimeEl!: ElementRef;

  stats: ReportStats | null = null;
  performanceMetrics: DisplayPerformanceMetric[] = [];
  filteredPerformanceMetrics: DisplayPerformanceMetric[] = [];
  topPerformers: TopPerformer[] = [];
  totalMetrics: any = null;
  selectedPeriod: string = 'Last 30 Days';
  periods = ['Last 30 Days', 'Last 90 Days', 'This Year'];
  math = Math;

  isLoading = true;
  errorMessage: string | null = null;
  showExportModal = false;
  isDownloading = false;
  currentDate = new Date();
  managerScope: string = 'Overall performance metrics';

  userScope: 'SUPER_MANAGER' | 'OTHER' = 'OTHER';
  selectedCard: string = 'All Cards';
  cards: string[] = ['All Cards', 'C1', 'C2', 'C3', 'C4', 'C5'];

  requestsByDepartmentData: any[] = [];
  approvalRateTrendData: any[] = [];

  view: [number, number] = [0, 350];
  gradient: boolean = true;
  showLegend: boolean = true;
  showLabels: boolean = true;
  isDoughnut: boolean = true;
  legendPosition: LegendPosition = LegendPosition.Right;
  colorSchemeDonut: Color = {
    name: 'govFlowVibrant',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: ['#3A4A7B', '#FF5722', '#28a745', '#f59e0b', '#6B7B9B', '#3b82f6', '#ef4444']
  };
  showXAxis = true;
  showYAxis = true;
  showXAxisLabel = true;
  // =================================================================
  // START: 🚀🚀 هذا هو التعديل الوحيد والمطلوب (تعديل 1) 🚀🚀
  xAxisLabel = 'Department'; // تم تغيير العنوان ليعكس البيانات الحقيقية
  // END: 🚀🚀 نهاية التعديل 🚀🚀
  // =================================================================
  showYAxisLabel = true;
  yAxisLabel = 'Approval Rate (%)';
  // =================================================================
  // START: 🚀🚀 هذا هو التعديل الوحيد والمطلوب (إضافة 2) 🚀🚀
  // تم تعطيل المقياس التلقائي وتحديد قيم البداية والنهاية
  autoScale = false;
  yScaleMin = 0;
  yScaleMax = 100;
  // END: 🚀🚀 نهاية التعديل 🚀🚀
  // =================================================================
  timeline = true;
  colorSchemeLine: Color = {
    name: 'govFlowLine',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: ['#3A4A7B']
  };

  private managerService = inject(ManagerService);
  private authService = inject(AuthService);

  ngOnInit(): void {
    this.determineUserScope();
    this.loadReportData();
  }

  private determineUserScope(): void {
    const user = this.authService.currentUser() as any;
    if (user && user.jobRoleCode && user.jobRoleCode.startsWith('MGR')) {
      if (user.jobRoleCode.endsWith('-ALL')) {
        this.userScope = 'SUPER_MANAGER';
      } else {
        this.userScope = 'OTHER';
      }
    } else {
      this.userScope = 'OTHER';
    }
  }

  private getCardFromDepartmentName(departmentName: string): string {
    if (departmentName.toLowerCase().includes('traffic')) return 'C1';
    if (departmentName.toLowerCase().includes('municipality')) return 'C3';
    return 'N/A';
  }

  loadReportData(): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.managerService.getReportData(this.selectedPeriod).subscribe({
      next: (data: ScopedReportData) => {
        this.stats = data.report.stats;
        this.performanceMetrics = data.report.performanceMetrics.map(metric => ({
          ...metric,
          card: this.getCardFromDepartmentName(metric.department)
        }));
        this.topPerformers = data.report.topPerformers ?? [];
        this.managerScope = data.managerScope;

        setTimeout(() => this.startCountersAnimation(), 0);

        this.requestsByDepartmentData = this.performanceMetrics.map(metric => ({
          name: metric.department,
          value: metric.totalRequests
        }));

        // =================================================================
        // START: 🚀🚀 هذا هو التعديل الوحيد والمطلوب (تعديل 3) 🚀🚀
        // الكود الجديد لتوليد بيانات الرسم البياني الخطي بشكل ديناميكي
        if (this.performanceMetrics && this.performanceMetrics.length > 0) {
          const trendSeries = this.performanceMetrics.map(metric => ({
            name: metric.department,
            value: parseFloat(metric.approvalRate) || 0
          }));

          this.approvalRateTrendData = [{
            name: 'Approval Rate',
            series: trendSeries
          }];
        } else {
          this.approvalRateTrendData = [];
        }
        // END: 🚀🚀 نهاية التعديل 🚀🚀
        // =================================================================

        this.filterMetrics();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load report data', err);
        this.errorMessage = "Could not load report data. Please try again later.";
        this.isLoading = false;
      }
    });
  }

  filterMetrics(): void {
    let tempMetrics = [...this.performanceMetrics];

    if (this.userScope === 'SUPER_MANAGER' && this.selectedCard !== 'All Cards') {
      tempMetrics = tempMetrics.filter(metric => metric.card === this.selectedCard);
    }

    this.filteredPerformanceMetrics = tempMetrics;
    this.calculateTotals();
  }

  startCountersAnimation(): void {
    if (!this.stats) return;
    this.animateValue(this.totalRequestsEl, parseFloat(this.stats.totalRequests.value), 1500);
    this.animateValue(this.approvedEl, parseFloat(this.stats.approved.value), 1500);
    this.animateValue(this.rejectedEl, parseFloat(this.stats.rejected.value), 1500);
    this.animateValue(this.avgTimeEl, parseFloat(this.stats.avgProcessingTime.value), 1500);
  }

  animateValue(elementRef: ElementRef, endValue: number, duration: number): void {
    if (!elementRef || isNaN(endValue)) {
      if (elementRef) {
        elementRef.nativeElement.textContent = isNaN(endValue) ? '0' : endValue.toLocaleString();
      }
      return;
    }
    const startValue = 0;
    const startTime = performance.now();
    const frame = (currentTime: number) => {
      const elapsedTime = currentTime - startTime;
      const progress = Math.min(elapsedTime / duration, 1);
      const currentValue = this.easeOutCubic(progress) * (endValue - startValue) + startValue;
      if (elementRef === this.avgTimeEl) {
        elementRef.nativeElement.textContent = currentValue.toFixed(1);
      } else {
        elementRef.nativeElement.textContent = Math.floor(currentValue).toLocaleString();
      }
      if (progress < 1) {
        requestAnimationFrame(frame);
      } else {
        if (elementRef === this.avgTimeEl) {
          elementRef.nativeElement.textContent = endValue.toFixed(1);
        } else {
          elementRef.nativeElement.textContent = endValue.toLocaleString();
        }
      }
    };
    requestAnimationFrame(frame);
  }

  easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }

  calculateTotals(): void {
    if (!this.filteredPerformanceMetrics || this.filteredPerformanceMetrics.length === 0) {
      this.totalMetrics = null;
      return;
    };
    const metricsToCalculate = this.filteredPerformanceMetrics;
    const totalRequests = metricsToCalculate.reduce((sum, item) => sum + item.totalRequests, 0);
    const approved = metricsToCalculate.reduce((sum, item) => sum + item.approved, 0);
    const rejected = metricsToCalculate.reduce((sum, item) => sum + item.rejected, 0);
    const avgTime = metricsToCalculate.reduce((sum, item) => sum + item.avgTime, 0) / metricsToCalculate.length;
    const slaCompliance = metricsToCalculate.reduce((sum, item) => sum + (parseFloat(item.slaCompliance) || 0), 0) / metricsToCalculate.length;
    this.totalMetrics = {
      department: 'Total',
      totalRequests,
      approved,
      rejected,
      approvalRate: totalRequests > 0 ? ((approved / totalRequests) * 100).toFixed(1) : '0.0',
      avgTime: avgTime.toFixed(1),
      slaCompliance: slaCompliance.toFixed(0)
    };
  }

  getStatChangeClass(change?: number): string {
    if (change === undefined) return '';
    if (this.stats && this.stats.avgProcessingTime.change === change) {
      return change > 0 ? 'stat-change-negative' : 'stat-change-positive';
    }
    return change >= 0 ? 'stat-change-positive' : 'stat-change-negative';
  }

  pieChartLabelFormatting(data: any): string {
    const label = data.label || 'N/A';
    if (this.totalMetrics && this.totalMetrics.totalRequests > 0 && data.value) {
      const percentage = ((data.value / this.totalMetrics.totalRequests) * 100).toFixed(1);
      return `${percentage}%`;
    }
    return String(label);
  }

  downloadPdf(): void {
    const data = document.getElementById('pdf-content');
    if (data) {
      this.isDownloading = true;
      html2canvas(data, { scale: 2, useCORS: true }).then(canvas => {
        const imgWidth = 208;
        const imgHeight = canvas.height * imgWidth / canvas.width;
        const contentDataURL = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        pdf.addImage(contentDataURL, 'PNG', 1, 1, imgWidth, imgHeight);
        pdf.save(`GovFlow_Report_${this.currentDate.toISOString().split('T')[0]}.pdf`);
        this.isDownloading = false;
        this.showExportModal = false;
      }).catch(() => {
        this.isDownloading = false;
      });
    }
  }
}
