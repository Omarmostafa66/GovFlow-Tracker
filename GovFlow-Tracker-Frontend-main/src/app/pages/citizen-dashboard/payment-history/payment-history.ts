// src/app/pages/citizen-dashboard/payment-history/payment-history.component.ts

import { Component, OnInit } from '@angular/core';
// ✅ FIX: تم حذف SlicePipe من هنا لأنها غير مستخدمة
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { PaymentRecord, PaymentService } from '../../../services/payment.service';
import { AuthService } from '../../../services/auth.service';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// واجهة مستخدم مصغرة لبيانات الفاتورة
interface UserProfileForPayment {
  name: string;
  addressLine1: string;
  addressLine2?: string;
}

@Component({
  selector: 'app-payment-history',
  standalone: true,
  // ✅ FIX: تم حذف SlicePipe من مصفوفة imports
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './payment-history.html',
  styleUrls: ['./payment-history.css']
})
export class PaymentHistoryComponent implements OnInit {
  loading: boolean = true;
  error: string | null = null;
  userProfile: UserProfileForPayment | null = null;
  allPaymentHistory: PaymentRecord[] = []; // سيعرض القائمة الكاملة هنا

  showPopup: boolean = false;
  popupTitle: string = '';
  popupMessage: string = '';
  popupType: 'success' | 'error' | 'invoice' = 'success';

  lastSuccessfulPayment: PaymentRecord | null = null;

  constructor(
    private paymentService: PaymentService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadUserProfile();
    this.loadPaymentHistory();
  }

  loadUserProfile(): void {
    const currentUser = this.authService.currentUser();
    if (currentUser) {
      this.userProfile = {
        name: currentUser.fullName,
        addressLine1: (currentUser as any).address || '123 Main Street, Cairo, Egypt'
      };
    } else {
      this.error = "Could not load user data.";
      this.loading = false;
    }
  }

  loadPaymentHistory(): void {
    this.loading = true;
    this.error = null;
    this.paymentService.getPaymentHistory().subscribe({
      next: (data: PaymentRecord[]) => {
        this.allPaymentHistory = data; // تحميل السجل الكامل
        this.loading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.error = 'Failed to load payment history.';
        this.loading = false;
      }
    });
  }

  // --- دوال عرض الفاتورة والطباعة (تم نسخها كما هي) ---

  openPopup(title: string, message: string, type: 'success' | 'error' | 'invoice'): void {
    this.popupTitle = title;
    this.popupMessage = message;
    this.popupType = type;
    this.showPopup = true;
  }

  closePopup(): void {
    this.showPopup = false;
    this.lastSuccessfulPayment = null;
  }

  async downloadInvoiceAsPDF(): Promise<void> {
    const contentToExport = document.getElementById('invoice-content-for-export');
    if (!contentToExport) {
      console.error("Invoice content for export element not found.");
      return;
    }
    try {
      const canvas = await html2canvas(contentToExport, { scale: 2, useCORS: true, logging: false, width: contentToExport.offsetWidth });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`invoice-${this.lastSuccessfulPayment?.invoiceNumber || 'details'}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      this.openPopup('Download Failed', 'Could not generate the PDF file. Please try again.', 'error');
    }
  }

  printInvoice(): void {
    const invoiceHtmlContent = document.getElementById('invoice-preview-content')?.innerHTML;
    if (!invoiceHtmlContent) return;
    const styles = Array.from(document.styleSheets).map(styleSheet => { try { return Array.from(styleSheet.cssRules).map(rule => rule.cssText).join(''); } catch (e) { return ''; } }).join('');
    const printWindow = window.open('', '_blank', 'height=800,width=800');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Print Invoice - ${this.lastSuccessfulPayment?.invoiceNumber || ''}</title>
            <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" />
            <style>${styles}</style>
          </head>
          <body>${invoiceHtmlContent}</body>
        </html>`);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      };
    }
  }

  viewInvoice(payment: PaymentRecord): void {
    this.lastSuccessfulPayment = payment;
    this.openPopup('View Invoice', '', 'invoice');
    setTimeout(() => {
      const invoiceSource = document.getElementById('invoice-content-for-export');
      const invoicePreview = document.getElementById('invoice-preview-content');
      if (invoiceSource && invoicePreview) {
        invoicePreview.innerHTML = invoiceSource.innerHTML;
      }
    }, 0);
  }
}
