import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
// MODIFICATION START: Updated ServiceRequestDto interface
import { ServiceRequestService, ServiceRequestDto as OriginalServiceRequestDto, DocumentDto } from '../../../../services/service-request.service';
// MODIFICATION END
import { saveAs } from 'file-saver';

// MODIFICATION START: Extended the interface to include the new field
interface ServiceRequestDto extends OriginalServiceRequestDto {
  reasonForStatusChange?: string;
}
// MODIFICATION END

@Component({
  selector: 'app-request-details',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './request-details.component.html',
  styleUrls: ['./request-details.component.css']
})
export class RequestDetailsComponent implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  request: ServiceRequestDto | null = null;
  loading = true;
  error: string | null = null;
  showPopup = false;
  popupTitle = '';
  popupMessage = '';
  popupIcon = '';

  parsedDetails: any = null;

  isDragging = false;
  popupType: 'alert' | 'confirm' = 'alert';
  docIdToDelete: number | null = null;
  docIdToReplace: number | null = null;

  expandedElements: { [key: string]: boolean } = {};
  truncationLimit = 50;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private requestService: ServiceRequestService
  ) {}

  ngOnInit(): void {
    const requestId = this.route.snapshot.paramMap.get('id');
    if (requestId) {
      this.loadRequestDetails(+requestId);
    } else {
      this.error = "Request ID not found in URL.";
      this.loading = false;
    }
  }

  loadRequestDetails(id: number): void {
    this.loading = true;
    this.error = null;
    this.requestService.getRequestById(id).subscribe({
      next: (data) => {
        this.request = { ...data, uploadedDocuments: data.uploadedDocuments || [] };

        if (data.details) {
          try {
            this.parsedDetails = JSON.parse(data.details);
          } catch (e) {
            console.error('Could not parse request details JSON:', e);
            this.parsedDetails = null;
          }
        }

        this.loading = false;
      },
      error: (error) => {
        this.error = "Failed to load request details. Please try again.";
        this.loading = false;
        console.error('Error loading request details:', error);
      }
    });
  }

  toggleExpansion(key: string): void {
    this.expandedElements[key] = !this.expandedElements[key];
  }

  isExpanded(key: string): boolean {
    return this.expandedElements[key] || false;
  }

  public asString(value: unknown): string {
    return String(value);
  }

  getDetailLabel(key: unknown): string {
    const strKey = String(key);
    const labels: { [key: string]: string } = {
      fullName: 'Full Name',
      nationalId: 'National ID',
      licenseNumber: 'License Number',
      licenseCategory: 'License Category'
    };
    return labels[strKey] || strKey;
  }

  viewDocument(doc: DocumentDto): void {
    this.requestService.getViewableFile(doc.filePath).subscribe({
      next: (blob) => {
        const fileURL = URL.createObjectURL(blob);
        window.open(fileURL, '_blank');
      },
      error: (err) => {
        this.showPopupMessage('View Failed', 'Could not load document for viewing.', 'fas fa-times-circle error');
        console.error('View document error:', err);
      }
    });
  }

  downloadDocument(doc: DocumentDto): void {
    this.requestService.downloadDocument(doc.filePath).subscribe({
      next: (blob) => saveAs(blob, doc.name),
      error: (err) => this.showPopupMessage('Download Failed', 'Failed to download the document.', 'fas fa-times-circle error')
    });
  }

  deleteDocument(docId: number): void {
    if (!this.request) return;
    this.docIdToDelete = docId;
    this.popupType = 'confirm';
    this.showPopupMessage(
      'Confirm Deletion',
      'Are you sure you want to delete this document? This action cannot be undone.',
      'fas fa-exclamation-triangle warning'
    );
  }

  confirmDelete(): void {
    if (this.docIdToDelete && this.request && this.request.id) {
      this.requestService.deleteDocument(this.request.id, this.docIdToDelete).subscribe({
        next: () => {
          this.closePopup();
          this.showPopupMessage('Success', 'Document deleted successfully.', 'fas fa-check-circle success');
          this.loadRequestDetails(this.request!.id);
        },
        error: (err) => {
          this.closePopup();
          this.showPopupMessage('Error', 'Failed to delete the document. Please try again.', 'fas fa-times-circle error');
        }
      });
    }
  }

  handleFileUpload(file: File, request: ServiceRequestDto): void {
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      this.showPopupMessage('Invalid File Type', 'Please upload only JPG, PNG images or PDF documents.', 'fas fa-exclamation-triangle warning');
      return;
    }
    if (file.size > 5 * 1024 * 1024) { // 5MB
      this.showPopupMessage('File Too Large', 'Please upload files smaller than 5MB.', 'fas fa-exclamation-triangle warning');
      return;
    }

    this.requestService.uploadDocument(request.id, file).subscribe({
      next: () => {
        this.showPopupMessage('Success', 'File uploaded successfully!', 'fas fa-check-circle success');
        this.loadRequestDetails(request.id);
      },
      error: (err) => {
        this.showPopupMessage('Upload Failed', 'There was an error uploading your file.', 'fas fa-times-circle error');
      }
    });
  }

  handleFileReplacement(file: File, request: ServiceRequestDto, docId: number): void {
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      this.showPopupMessage('Invalid File Type', 'Please upload only JPG, PNG images or PDF documents.', 'fas fa-exclamation-triangle warning');
      return;
    }
    if (file.size > 5 * 1024 * 1024) { // 5MB
      this.showPopupMessage('File Too Large', 'Please upload files smaller than 5MB.', 'fas fa-exclamation-triangle warning');
      return;
    }

    this.requestService.replaceDocument(request.id, docId, file).subscribe({
      next: () => {
        this.showPopupMessage('Success', 'File replaced successfully!', 'fas fa-check-circle success');
        this.loadRequestDetails(request.id);
      },
      error: (err) => {
        console.error('Replacement failed:', err);
        this.showPopupMessage('Replacement Failed', 'There was an error replacing your file. Please try again.', 'fas fa-times-circle error');
      }
    });
  }

  onFileSelected(event: Event, request: ServiceRequestDto): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];

    if (this.docIdToReplace) {
      this.handleFileReplacement(file, request, this.docIdToReplace);
      this.docIdToReplace = null;
    } else {
      this.handleFileUpload(file, request);
    }
    input.value = '';
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent, request: ServiceRequestDto): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files[0];
      this.handleFileUpload(file, request);
      event.dataTransfer.clearData();
    }
  }

  triggerReplace(docId: number): void {
    this.docIdToReplace = docId;
    this.fileInput.nativeElement.click();
  }

  canReplaceDocument(status: string): boolean {
    const allowedStatuses = ['IN_PROGRESS', 'PENDING_CITIZEN_ACTION', 'APPROVED_PENDING_PAYMENT'];
    return allowedStatuses.includes(status);
  }

  getRequiredDocsCount(serviceName: string): number {
    const serviceDocCounts: { [key: string]: number } = {
      'Driver License Issuance': 6, 'License Renewal': 5, 'License Replacement': 2, 'Vehicle Registration': 9,
      'Building Permit': 12, 'Building Permit Renewal': 10, 'Renovation Permit': 10,
      'Building Violation Complaint': 2, 'Cleanliness Complaint': 2,
    };
    return serviceDocCounts[serviceName] || 1;
  }

  canUploadMore(request: ServiceRequestDto): boolean {
    const requiredCount = this.getRequiredDocsCount(request.serviceName);
    return (request.uploadedDocuments?.length || 0) < requiredCount;
  }

  getStatusClass(status: string = ''): string { return 'status-' + status.toLowerCase().replace(/_/g, '-'); }
  formatStatus(status: string = ''): string { return status.replace(/_/g, ' '); }
  getDocumentIconClass(fileType: string = ''): string {
    if (fileType?.includes('pdf')) return 'fa-file-pdf pdf-icon';
    if (fileType?.includes('image')) return 'fa-file-image image-icon';
    return 'fa-file-alt';
  }
  formatFileSize(bytes: number = 0): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  goBack(): void { this.router.navigate(['/my-requests']); }

  navigateToPayment(): void {
    if (this.request) {
      this.router.navigate(['/payments', { preselectId: this.request.id }]);
    }
  }

  showPopupMessage(title: string, message: string, icon: string): void {
    this.popupTitle = title;
    this.popupMessage = message;
    this.popupIcon = icon;
    this.showPopup = true;
  }

  closePopup(): void {
    this.showPopup = false;
    this.docIdToDelete = null;
    setTimeout(() => {
      this.popupType = 'alert';
    }, 300);
  }
}
