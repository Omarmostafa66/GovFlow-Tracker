import { Component, OnInit, inject, NgZone } from '@angular/core'; // <<< START: تمت إضافة NgZone هنا
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { ManagerService, ManagedEmployee, CreateEmployeeDto, ServiceDto, EmployeeDetailsDto } from '../../services/manager.service';
import { catchError, throwError, timer, finalize } from 'rxjs';

// ✅ Make sure you have jsPDF installed: npm install jspdf
import jsPDF from 'jspdf';

@Component({
  selector: 'app-employee-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ReactiveFormsModule],
  templateUrl: './employee-management.component.html',
  styleUrls: ['./employee-management.component.css']
})
export class EmployeeManagementComponent implements OnInit {

  employees: ManagedEmployee[] = [];
  employeeToDelete: ManagedEmployee | null = null;
  employeeToView: ManagedEmployee | null = null;
  managedServices: ServiceDto[] = [];
  isModalOpen = false;
  employeeForm: FormGroup;
  showSuccessCard = false;
  newEmployeeDetails: EmployeeDetailsDto | null = null;
  showDeleteConfirm = false;
  successMessage: string | null = null;
  errorMessage: string | null = null;
  isLoading = false;
  showViewCard = false;

  private managerService = inject(ManagerService);
  private fb = inject(FormBuilder);
  private zone = inject(NgZone); // <<< START: تمت إضافة هذا السطر لحقن NgZone

  constructor() {
    this.employeeForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(100), Validators.pattern('^(\\S+\\s+){3,}\\S+$')]],
      nationalId: ['', [Validators.required, Validators.pattern('^[23]\\d{13}$')]],
      serviceId: [null, [Validators.required]],
      departmentName: [{ value: '', disabled: true }],
      generatedJobRole: [{ value: '', disabled: true }],
    });

    this.employeeForm.get('serviceId')?.valueChanges.subscribe(serviceId => {
      const selectedService = this.managedServices.find(s => s.id === serviceId);
      if (selectedService) {
        this.employeeForm.get('departmentName')?.setValue(selectedService.department.name);
        this.employeeForm.get('generatedJobRole')?.setValue(`EMP-${selectedService.department.govCode}-${selectedService.cardCode}-XXX`);
      } else {
        this.employeeForm.get('departmentName')?.setValue('');
        this.employeeForm.get('generatedJobRole')?.setValue('');
      }
    });
  }

  ngOnInit(): void {
    this.loadEmployees();
    this.loadManagedServices();
  }

  get f() { return this.employeeForm.controls; }

  loadEmployees(): void {
    this.isLoading = true;
    this.managerService.getManagedEmployees().pipe(
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: (data) => {
        // <<< START: هذا هو التعديل الذي يجبر الواجهة على التحديث
        this.zone.run(() => {
          this.employees = data;
        });
        // <<< END: نهاية التعديل
      },
      error: (err: HttpErrorResponse) => this.showError('Failed to load employees.')
    });
  }

  loadManagedServices(): void {
    this.managerService.getManagedServices().subscribe({
      next: (data) => this.managedServices = data,
      error: (err: HttpErrorResponse) => this.showError('Failed to load managed services.')
    });
  }

  openAddModal(): void {
    this.isModalOpen = true;
    this.employeeForm.reset({ departmentName: '', generatedJobRole: '' });
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  saveEmployee(): void {
    this.clearAlerts();
    if (this.employeeForm.invalid) {
      this.employeeForm.markAllAsTouched();
      return;
    }

    const payload: CreateEmployeeDto = {
      fullName: this.employeeForm.value.fullName,
      nationalId: this.employeeForm.value.nationalId,
      serviceId: this.employeeForm.value.serviceId,
    };

    this.managerService.createEmployee(payload).pipe(
      catchError((err: HttpErrorResponse) => {
        this.showError(err.error?.message || 'An unexpected error occurred.');
        return throwError(() => err);
      })
    ).subscribe({
      next: (newEmployee: EmployeeDetailsDto) => {
        this.closeModal();
        this.loadEmployees();
        this.newEmployeeDetails = newEmployee;
        this.showSuccessCard = true;
      }
    });
  }

  closeSuccessCard(): void {
    this.showSuccessCard = false;
    this.newEmployeeDetails = null;
  }

  copyToClipboard(text: string, field: string): void {
    navigator.clipboard.writeText(text).then(() => {
      this.showSuccess(`${field} copied to clipboard!`);
    }).catch(err => {
      this.showError('Failed to copy text.');
      console.error('Copy error:', err);
    });
  }

  downloadAsPDF(): void {
    if (!this.newEmployeeDetails) return;

    // ✅ START: Professional PDF Generation Logic
    const doc = new jsPDF();
    const details = this.newEmployeeDetails;
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 20;

    // Define colors from the invoice theme
    const primaryColor = '#2D4059'; // Dark Blue
    const secondaryColor = '#6B7B9B'; // Grey Blue
    const accentColor = '#FF5722'; // Orange
    const bgColor = '#F5F7FA'; // Light Grey

    // --- 1. PDF Header ---
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor);
    doc.text('GovFlow', margin, 30);

    doc.setFontSize(10);
    doc.setTextColor(secondaryColor);
    doc.text('Government Service Portal', margin, 36);

    doc.setFontSize(26);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(accentColor);
    doc.text('EMPLOYEE CARD', pageW - margin, 30, { align: 'right' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(primaryColor);
    const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    doc.text(`Date Issued: ${currentDate}`, pageW - margin, 36, { align: 'right' });

    doc.setDrawColor(bgColor);
    doc.line(margin, 45, pageW - margin, 45);

    // --- 2. Employee Details Section ---
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(secondaryColor);
    doc.text('EMPLOYEE INFORMATION', margin, 60);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor);
    doc.text(details.fullName, margin, 68);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(secondaryColor);
    doc.text(`National ID: ${details.nationalId}`, margin, 74);

    // --- 3. Details Table ---
    const tableStartY = 90;
    const tableHeaderX = margin;
    const tableHeaderY = tableStartY;
    const tableRowHeight = 15;
    const tableCol1Width = 60;
    const tableCol2Width = pageW - (2 * margin) - tableCol1Width;

    // Table Header
    doc.setFillColor(bgColor);
    doc.rect(tableHeaderX, tableHeaderY, pageW - (2 * margin), 10, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(secondaryColor);
    doc.text('FIELD DESCRIPTION', tableHeaderX + 15, tableHeaderY + 7);
    doc.text('DETAILS', tableHeaderX + tableCol1Width + 15, tableHeaderY + 7);

    // Table Rows
    const tableContent = [
      { label: 'Full Name', value: details.fullName },
      { label: 'National ID', value: details.nationalId },
      { label: 'Job Role Code', value: details.jobRoleCode }
    ];

    let currentY = tableHeaderY + 10; // Start below the header
    tableContent.forEach(item => {
      currentY += tableRowHeight;
      // Label
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(primaryColor);
      doc.text(item.label, tableHeaderX + 15, currentY);

      // Value
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(primaryColor);
      doc.text(item.value, tableHeaderX + tableCol1Width + 15, currentY);

      // Bottom line for the row
      doc.setDrawColor(bgColor);
      doc.line(margin, currentY + 5, pageW - margin, currentY + 5);
    });

    // --- 4. Footer ---
    const footerY = pageH - 35;
    doc.setDrawColor(bgColor);
    doc.line(margin, footerY, pageW - margin, footerY);

    doc.setFontSize(9);
    doc.setTextColor(secondaryColor);
    doc.text(
      'Please use these details to register your official account on the portal.',
      pageW / 2,
      footerY + 10,
      { align: 'center' }
    );
    doc.text(
      'This document is an official registration card. Please keep it safe.',
      pageW / 2,
      footerY + 15,
      { align: 'center' }
    );
    // ✅ END: Professional PDF Generation Logic

    doc.save(`${this.newEmployeeDetails.fullName.replace(/\s/g, '_')}_details.pdf`);
    this.showSuccess('Professional employee PDF downloaded successfully!');
  }

  openViewCard(employee: ManagedEmployee): void {
    this.employeeToView = employee;
    this.showViewCard = true;
  }

  closeViewCard(): void {
    this.showViewCard = false;
    this.employeeToView = null;
  }

  confirmDelete(employee: ManagedEmployee): void {
    this.employeeToDelete = employee;
    this.showDeleteConfirm = true;
  }

  deleteEmployee(): void {
    if (!this.employeeToDelete) return;
    const empId = this.employeeToDelete.id;
    this.managerService.softDeleteEmployee(empId).subscribe({
      next: () => {
        const index = this.employees.findIndex(e => e.id === empId);
        if (index > -1) {
          this.employees[index].deletedAt = new Date().toISOString();
        }
        this.showSuccess('Employee deleted successfully. It can be restored later.');
        this.closeDeleteConfirm();
      },
      error: (err: HttpErrorResponse) => {
        this.showError('Failed to delete employee.');
        this.closeDeleteConfirm();
      }
    });
  }

  restoreEmployee(employee: ManagedEmployee): void {
    this.managerService.restoreEmployee(employee.id).subscribe({
      next: () => {
        const index = this.employees.findIndex(e => e.id === employee.id);
        if (index > -1) {
          this.employees[index].deletedAt = null;
        }
        this.showSuccess('Employee restored successfully!');
      },
      error: (err: HttpErrorResponse) => {
        this.showError('Failed to restore employee.');
      }
    });
  }

  closeDeleteConfirm(): void {
    this.showDeleteConfirm = false;
    this.employeeToDelete = null;
  }

  getInitials(fullName?: string): string {
    if (!fullName) return '';
    const nameParts = fullName.trim().split(' ');
    if (nameParts.length > 1) {
      return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
    }
    return fullName.substring(0, 2).toUpperCase();
  }

  private showSuccess(message: string) {
    this.successMessage = message;
    timer(4000).subscribe(() => this.successMessage = null);
  }

  private showError(message: string) {
    this.errorMessage = message;
    timer(5000).subscribe(() => this.errorMessage = null);
  }

  clearAlerts() {
    this.successMessage = null;
    this.errorMessage = null;
  }
}
