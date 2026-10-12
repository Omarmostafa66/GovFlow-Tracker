import { Component, OnInit } from '@angular/core';
import { CommonModule, SlicePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PaymentRecord, PaymentRequest, PayableService, PaymentService, CitizenPaymentSummaryDto } from '../../../services/payment.service';
import { AuthService } from '../../../services/auth.service';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface UserProfileForPayment {
  name: string;
  addressLine1: string;
  addressLine2?: string;
}

@Component({
  selector: 'app-payments',
  standalone: true,
  imports: [CommonModule, FormsModule, SlicePipe, RouterLink],
  templateUrl: './payments.component.html',
  styleUrls: ['./payments.component.css']
})
export class PaymentsComponent implements OnInit {
  loading: boolean = true;
  error: string | null = null;
  userProfile: UserProfileForPayment | null = null;

  allPaymentHistory: PaymentRecord[] = [];
  recentPaymentHistory: PaymentRecord[] = [];

  payableServices: PayableService[] = [];
  selectedServiceId: string | null = null;
  currentPayment: {
    serviceName: string;
    processingFee: number;
    serviceFee: number;
    totalAmount: number;
  } | null = null;

  cardNumber: string = '';
  cardType: string = 'unknown';
  expiryDate: string = '';
  cvv: string = '';
  formErrors = {
    expiryDate: '',
    cardNumber: ''
  };

  paymentSummary: CitizenPaymentSummaryDto | null = null;

  showPopup: boolean = false;
  popupTitle: string = '';
  popupMessage: string = '';
  popupType: 'success' | 'error' | 'invoice' = 'success';

  lastSuccessfulPayment: (PaymentRecord & { processingFee?: number; serviceFee?: number; }) | null = null;

  private preselectId: string | null = null;

  constructor(
    private paymentService: PaymentService,
    private authService: AuthService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // MODIFICATION: Read the 'preselectId' from the route parameters.
    this.preselectId = this.route.snapshot.paramMap.get('preselectId');
    this.loadInitialData();
  }

  loadInitialData(): void {
    this.loading = true;
    this.error = null;
    const currentUser = this.authService.currentUser();
    if (currentUser) {
      this.userProfile = {
        name: currentUser.fullName,
        addressLine1: (currentUser as any).address || '123 Main Street, Cairo, Egypt'
      };
    } else {
      this.error = "Could not load user data.";
      this.loading = false;
      return;
    }
    this.loadPaymentServices();
    this.loadPaymentHistory();
    this.loadPaymentSummary();
  }

  loadPaymentSummary(): void {
    this.paymentService.getPaymentSummary().subscribe({
      next: (summary: CitizenPaymentSummaryDto) => {
        this.paymentSummary = summary;
      },
      error: (err: HttpErrorResponse) => {
        console.error('Failed to load payment summary:', err);
      }
    });
  }

  loadPaymentServices(): void {
    this.paymentService.getPayableServices().subscribe({
      next: (services: PayableService[]) => {
        this.payableServices = services;
        // MODIFICATION: If a preselectId exists and is found in the list, set it as the selected service.
        if (this.preselectId && services.some(s => s.id.toString() === this.preselectId)) {
          this.selectedServiceId = this.preselectId;
        } else if (services.length > 0) {
          this.selectedServiceId = services[0].id;
        } else {
          this.selectedServiceId = null;
        }
        this.updatePaymentDetails();
      },
      error: (err: HttpErrorResponse) => {
        this.error = 'Failed to load services for payment.';
        this.loading = false;
      }
    });
  }

  loadPaymentHistory(): void {
    this.paymentService.getPaymentHistory().subscribe({
      next: (data: PaymentRecord[]) => {
        this.allPaymentHistory = data;
        this.recentPaymentHistory = data.slice(0, 3);
        this.loading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.error = 'Failed to load payment history.';
        this.loading = false;
      }
    });
  }

  updatePaymentDetails(): void {
    if (!this.selectedServiceId) {
      this.currentPayment = null;
      return;
    }
    const selectedService = this.payableServices.find(s => s.id.toString() === this.selectedServiceId!.toString());

    if (selectedService) {
      const processingFee = selectedService.amount;
      const serviceFee = processingFee * 0.14;
      this.currentPayment = {
        serviceName: selectedService.name,
        processingFee: processingFee,
        serviceFee: serviceFee,
        totalAmount: processingFee + serviceFee
      };
    } else {
      this.currentPayment = null;
    }
  }

  processPayment(event: Event): void {
    event.preventDefault();
    if (this.isFormValid() && this.selectedServiceId && this.currentPayment) {
      this.loading = true;
      this.lastSuccessfulPayment = null;
      const paymentData: PaymentRequest = {
        serviceRequestId: Number(this.selectedServiceId),
        amount: this.currentPayment.totalAmount
      };
      const paidServiceDetails = this.currentPayment;
      this.paymentService.processPayment(paymentData).subscribe({
        next: (response: PaymentRecord) => {
          this.lastSuccessfulPayment = {
            ...response,
            serviceName: paidServiceDetails.serviceName || 'N/A',
            processingFee: paidServiceDetails.processingFee,
            serviceFee: paidServiceDetails.serviceFee
          };
          this.openPopup('Payment Successful', 'You can now view your invoice.', 'success');
          this.loadInitialData();
          this.loading = false;
        },
        error: (err: HttpErrorResponse) => {
          const errorMessage = err.error?.message || err.error || 'Payment failed. Please try again.';
          this.openPopup('Payment Failed', errorMessage, 'error');
          this.loading = false;
        }
      });
    } else {
      this.openPopup('Invalid Form', 'Please select a service and fill all payment details correctly.', 'error');
    }
  }

  private resetPaymentForm(): void {
    this.cardNumber = '';
    this.cardType = 'unknown';
    this.expiryDate = '';
    this.cvv = '';
    this.formErrors.expiryDate = '';
    this.formErrors.cardNumber = '';
    this.selectedServiceId = this.payableServices.length > 0 ? this.payableServices[0].id : null;
    this.updatePaymentDetails();
  }

  openPopup(title: string, message: string, type: 'success' | 'error' | 'invoice'): void {
    this.popupTitle = title;
    this.popupMessage = message;
    this.popupType = type;
    this.showPopup = true;
  }

  closePopup(): void {
    this.showPopup = false;
    if (this.popupType === 'success') {
      this.resetPaymentForm();
    }
    this.lastSuccessfulPayment = null;
  }

  async downloadInvoiceAsPDF(): Promise<void> {
    const contentToExport = document.getElementById('invoice-content-for-export');
    if (!contentToExport) {
      console.error("Invoice content for export element not found.");
      return;
    }

    try {
      const canvas = await html2canvas(contentToExport, {
        scale: 2,
        useCORS: true,
        logging: false,
        width: contentToExport.offsetWidth
      });
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

    const styles = Array.from(document.styleSheets)
      .map(styleSheet => {
        try {
          return Array.from(styleSheet.cssRules).map(rule => rule.cssText).join('');
        } catch (e) { return ''; }
      })
      .join('');

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
        </html>
      `);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      };
    }
  }

  // MODIFICATION: This function now calculates and adds fee details to the payment record before showing the invoice.
  viewInvoice(payment: PaymentRecord): void {
    // Calculate processingFee and serviceFee if they don't exist
    const processingFee = payment.amount / 1.14;
    const serviceFee = payment.amount - processingFee;

    this.lastSuccessfulPayment = {
      ...payment,
      processingFee: (payment as any).processingFee ?? processingFee,
      serviceFee: (payment as any).serviceFee ?? serviceFee
    };

    this.openPopup('View Invoice', '', 'invoice');

    setTimeout(() => {
      const invoiceSource = document.getElementById('invoice-content-for-export');
      const invoicePreview = document.getElementById('invoice-preview-content');
      if (invoiceSource && invoicePreview) {
        invoicePreview.innerHTML = invoiceSource.innerHTML;
      }
    }, 0);
  }

  detectCardType(): void {
    const cardNum = this.cardNumber.replace(/\s+/g, '');
    if (/^4/.test(cardNum)) this.cardType = 'visa';
    else if (/^5[1-5]/.test(cardNum)) this.cardType = 'mastercard';
    else if (/^3[47]/.test(cardNum)) this.cardType = 'amex';
    else if (/^6/.test(cardNum)) this.cardType = 'discover';
    else this.cardType = 'unknown';
  }

  formatCardNumber(): void {
    this.detectCardType();
    const sanitized = this.cardNumber.replace(/\D/g, '');
    let formatted = sanitized;
    if (this.cardType === 'amex') {
      const parts = [];
      if (sanitized.length > 0) parts.push(sanitized.substring(0, 4));
      if (sanitized.length > 4) parts.push(sanitized.substring(4, 10));
      if (sanitized.length > 10) parts.push(sanitized.substring(10, 15));
      formatted = parts.join(' ');
    } else {
      formatted = sanitized.match(/.{1,4}/g)?.join(' ') || '';
    }
    this.cardNumber = formatted;
  }

  formatExpiryDate(): void {
    let value = this.expiryDate.replace(/\D/g, '');
    if (value.length >= 2) {
      let month = parseInt(value.substring(0, 2));
      if (month > 12) value = '12' + value.substring(2);
      if (month === 0) value = '01' + value.substring(2);
    }
    if (value.length > 2) {
      value = value.substring(0, 2) + '/' + value.substring(2, 4);
    }
    this.expiryDate = value;
  }

  formatCvv(): void {
    this.cvv = this.cvv.replace(/\D/g, '');
  }

  validateExpiryDate(): void {
    this.formErrors.expiryDate = '';
    if (this.expiryDate.length < 5) return;
    const [monthStr, yearStr] = this.expiryDate.split('/');
    const month = parseInt(monthStr);
    const year = 2000 + parseInt(yearStr);
    const now = new Date();
    const expiryDate = new Date(year, month, 0);
    if (expiryDate < now) {
      this.formErrors.expiryDate = 'Card has expired.';
    }
  }

  private isValidLuhn(cardNumber: string): boolean {
    const sanitized = cardNumber.replace(/[\s-]+/g, '');
    if (!/^\d+$/.test(sanitized)) return false;
    let sum = 0;
    let shouldDouble = false;
    for (let i = sanitized.length - 1; i >= 0; i--) {
      let digit = parseInt(sanitized.charAt(i), 10);
      if (shouldDouble) {
        if ((digit *= 2) > 9) digit -= 9;
      }
      sum += digit;
      shouldDouble = !shouldDouble;
    }
    return sum % 10 === 0 && sanitized.length > 0;
  }

  validateCardNumber(): void {
    if (this.cardNumber && !this.isValidLuhn(this.cardNumber)) {
      this.formErrors.cardNumber = 'Please enter a valid card number.';
    } else {
      this.formErrors.cardNumber = '';
    }
  }

  isFormValid(): boolean {
    if (this.formErrors.cardNumber || this.formErrors.expiryDate) {
      return false;
    }

    const sanitizedCardNumber = this.cardNumber.replace(/\s+/g, '');
    let isLengthValid = (this.cardType === 'amex' && sanitizedCardNumber.length === 15) || (this.cardType !== 'amex' && sanitizedCardNumber.length === 16);
    let isCvvValid = (this.cardType === 'amex' ? this.cvv.length === 4 : this.cvv.length === 3);

    return this.isValidLuhn(this.cardNumber) && isLengthValid && isCvvValid && this.expiryDate.length === 5;
  }

  getCardTypeName(): string {
    switch (this.cardType) {
      case 'visa': return 'Visa';
      case 'mastercard': return 'MasterCard';
      case 'amex': return 'American Express';
      case 'discover': return 'Discover';
      default: return 'Card';
    }
  }
}
