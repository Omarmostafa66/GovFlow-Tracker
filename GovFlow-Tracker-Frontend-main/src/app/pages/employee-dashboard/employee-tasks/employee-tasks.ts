// import { Component, OnInit } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { RouterLink, ActivatedRoute } from '@angular/router';
// import { AuthService } from '../../../services/auth.service';
// import { EmployeeService, EmployeeTask, FullTaskDetails } from '../../../services/employee.service';
// import { ServiceRequestService, DocumentDto } from '../../../services/service-request.service';
// import { saveAs } from 'file-saver';
//
// interface Employee {
//   name: string;
//   initial: string;
//   department: string;
//   avatar: string | null;
// }
//
// @Component({
//   selector: 'app-my-tasks',
//   standalone: true,
//   imports: [CommonModule, FormsModule, RouterLink],
//   templateUrl: './employee-tasks.html',
//   styleUrls: ['./employee-tasks.css']
// })
// export class MyTasksComponent implements OnInit {
//   employee: Employee = {
//     name: 'Loading...',
//     initial: '',
//     department: 'Loading...',
//     avatar: null
//   };
//
//   allTasks: EmployeeTask[] = [];
//   filteredTasks: EmployeeTask[] = [];
//   isLoading = true;
//
//   searchTerm: string = '';
//   statusFilter: string = 'all';
//   priorityFilter: string = 'all';
//
//   isModalVisible = false;
//   isDetailsLoading = false;
//   selectedTaskDetails: FullTaskDetails | null = null;
//   employeeComment: string = '';
//   modalError: string | null = null;
//   selectedTaskStatus: string = '';
//
//   parsedDetails: any = null;
//   isActionBlockedByPayment: boolean = false;
//
//   constructor(
//     private authService: AuthService,
//     private employeeService: EmployeeService,
//     private serviceRequestService: ServiceRequestService,
//     private route: ActivatedRoute
//   ) { }
//
//   ngOnInit(): void {
//     this.route.queryParams.subscribe(params => {
//       const statusFromUrl = params['status'];
//       if (statusFromUrl) {
//         // =======================================================
//         // ✅ START: تم تحديث القائمة لتشمل الحالة الجديدة
//         // =======================================================
//         const validStatuses = ['APPROVED_PENDING_PAYMENT', 'UNDER_REVIEW', 'PENDING', 'COMPLETED', 'REJECTED', 'PENDING_CITIZEN_ACTION'];
//         // =======================================================
//         // ✅ END: نهاية التحديث
//         // =======================================================
//         if (validStatuses.includes(statusFromUrl)) {
//           this.statusFilter = statusFromUrl;
//         }
//       }
//     });
//
//     this.loadUserData();
//     this.loadTasks();
//   }
//
//   loadTasks(): void {
//     this.isLoading = true;
//     this.employeeService.getMyTasks().subscribe({
//       next: (tasksFromApi) => {
//         const sortedTasks = tasksFromApi.sort((a, b) =>
//           new Date(b.submittedDate).getTime() - new Date(a.submittedDate).getTime()
//         );
//
//         this.allTasks = sortedTasks.map(task => ({
//           ...task,
//           priority: ['high', 'normal', 'low'][Math.floor(Math.random() * 3)] as 'high' | 'normal' | 'low',
//           dueDate: '2025-09-20'
//         }));
//         this.applyFilters();
//         this.isLoading = false;
//       },
//       error: (err) => {
//         console.error('Failed to load tasks:', err);
//         this.isLoading = false;
//       }
//     });
//   }
//
//   loadUserData(): void {
//     const currentUser = this.authService.currentUser();
//     if (currentUser) {
//       this.employee = {
//         name: currentUser.fullName,
//         department: this.formatRole(currentUser.role),
//         initial: this.getInitials(currentUser.fullName),
//         avatar: currentUser.avatar
//       };
//     }
//   }
//
//   applyFilters(): void {
//     let tasks = [...this.allTasks];
//     if (this.statusFilter !== 'all') {
//       tasks = tasks.filter(task => task.status === this.statusFilter);
//     }
//     if (this.priorityFilter !== 'all') {
//       tasks = tasks.filter(task => task.priority === this.priorityFilter);
//     }
//     if (this.searchTerm) {
//       const lowercasedTerm = this.searchTerm.toLowerCase();
//       tasks = tasks.filter(task =>
//         task.citizenName.toLowerCase().includes(lowercasedTerm) ||
//         task.serviceType.toLowerCase().includes(lowercasedTerm)
//       );
//     }
//     this.filteredTasks = tasks;
//   }
//
//   viewTaskDetails(taskId: string): void {
//     this.isModalVisible = true;
//     this.isDetailsLoading = true;
//     this.modalError = null;
//     this.selectedTaskDetails = null;
//     this.parsedDetails = null;
//     this.isActionBlockedByPayment = false;
//
//     this.employeeService.getTaskDetails(taskId).subscribe({
//       next: (details) => {
//         this.selectedTaskDetails = details;
//         this.employeeComment = details.employeeComments || '';
//         this.selectedTaskStatus = details.status;
//
//         if (details.details) {
//           try {
//             this.parsedDetails = JSON.parse(details.details);
//           } catch (e) {
//             console.error('Could not parse request details JSON:', e);
//             this.parsedDetails = null;
//           }
//         }
//
//         this.isActionBlockedByPayment = details.status === 'APPROVED_PENDING_PAYMENT' && !details.isPaid;
//
//         if (this.isActionBlockedByPayment && !this.employeeComment) {
//           this.employeeComment = 'The request is pending payment of the applicable fees. Please proceed with the payment to continue the process.';
//         }
//
//         this.isDetailsLoading = false;
//       },
//       error: (err) => {
//         console.error('Failed to load task details:', err);
//         this.modalError = 'Failed to load task details. Please try again.';
//         this.isDetailsLoading = false;
//       }
//     });
//   }
//
//   confirmReview(): void {
//     if (!this.selectedTaskDetails) return;
//
//     const taskId = this.selectedTaskDetails.id;
//     const comment = this.employeeComment;
//     const newStatus = this.isActionBlockedByPayment
//       ? this.selectedTaskDetails.status
//       : this.selectedTaskStatus;
//
//     this.isDetailsLoading = true;
//
//     this.employeeService.reviewTask(taskId.toString(), newStatus, comment).subscribe({
//       next: () => {
//         const taskIndex = this.allTasks.findIndex(t => t.id === taskId.toString());
//         if (taskIndex !== -1) {
//           this.allTasks[taskIndex].status = newStatus;
//         }
//         if (this.isActionBlockedByPayment) {
//           if (taskIndex !== -1) {
//             this.allTasks[taskIndex].isPaid = true;
//           }
//           if (this.selectedTaskDetails) {
//             this.selectedTaskDetails.isPaid = true;
//           }
//         }
//
//         this.applyFilters();
//         this.closeModal();
//       },
//       error: (err) => {
//         console.error('Failed to submit review:', err);
//         this.modalError = 'Failed to submit review. Please try again.';
//         this.isDetailsLoading = false;
//       }
//     });
//   }
//
//   closeModal(): void {
//     this.isModalVisible = false;
//     this.selectedTaskDetails = null;
//     this.employeeComment = '';
//     this.modalError = null;
//     this.selectedTaskStatus = '';
//     this.parsedDetails = null;
//     this.isActionBlockedByPayment = false;
//   }
//
//   viewFile(doc: DocumentDto): void {
//     this.serviceRequestService.getViewableFile(doc.filePath).subscribe({
//       next: (blob) => {
//         const fileURL = URL.createObjectURL(blob);
//         window.open(fileURL, '_blank');
//       },
//       error: (err) => {
//         this.modalError = 'Could not load document for viewing.';
//         console.error('View document error:', err);
//       }
//     });
//   }
//
//   downloadFile(doc: DocumentDto): void {
//     this.serviceRequestService.downloadDocument(doc.filePath).subscribe({
//       next: (blob) => saveAs(blob, doc.name),
//       error: (err) => {
//         this.modalError = 'Failed to download the document.';
//         console.error('Download document error:', err);
//       }
//     });
//   }
//
//   getDetailLabel(key: unknown): string {
//     const strKey = String(key);
//     const labels: { [key: string]: string } = {
//       fullName: 'Full Name',
//       nationalId: 'National ID',
//       licenseNumber: 'License Number',
//       licenseCategory: 'License Category',
//     };
//     return labels[strKey] || strKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
//   }
//
//   formatFileSize(bytes: number = 0): string {
//     if (bytes === 0) return '0 Bytes';
//     const k = 1024;
//     const sizes = ['Bytes', 'KB', 'MB'];
//     const i = Math.floor(Math.log(bytes) / Math.log(k));
//     return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
//   }
//
//   getDocumentIconClass(fileType: string): string {
//     if (fileType?.includes('pdf')) return 'fa-file-pdf pdf-icon';
//     if (fileType?.includes('image')) return 'fa-file-image image-icon';
//     return 'fa-file-alt';
//   }
//
//   formatStatus(status: string): string {
//     if (!status) return '';
//     return status.replace(/_/g, ' ').toLowerCase()
//       .replace(/\b\w/g, c => c.toUpperCase());
//   }
//
//   getStatusClass(status: string): string {
//     const statusMap: { [key: string]: string } = {
//       'PENDING': 'status-pending',
//       'PENDING_CITIZEN_ACTION': 'status-pending',
//       'APPROVED_PENDING_PAYMENT': 'status-payment',
//       'UNDER_REVIEW': 'status-in-progress',
//       'COMPLETED': 'status-completed',
//       'REJECTED': 'status-rejected'
//     };
//     return statusMap[status] || 'status-pending';
//   }
//
//   getHoverClass(status: string): string {
//     if (status === 'COMPLETED') {
//       return 'task-completed';
//     }
//     if (status === 'REJECTED') {
//       return 'task-rejected';
//     }
//     return '';
//   }
//
//   formatRole(role: string): string {
//     if (!role) return '';
//     return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase().replace(/_/g, ' ');
//   }
//
//   getInitials(name: string): string {
//     if (!name) return '';
//     const parts = name.trim().split(/\s+/);
//     if (parts.length < 2) {
//       return parts[0]?.[0]?.toUpperCase() || '';
//     }
//     return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
//   }
// }





import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { EmployeeService, EmployeeTask, FullTaskDetails } from '../../../services/employee.service';
import { ServiceRequestService, DocumentDto } from '../../../services/service-request.service';
import { saveAs } from 'file-saver';

interface Employee {
  name: string;
  initial: string;
  department: string;
  avatar: string | null;
}

@Component({
  selector: 'app-my-tasks',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './employee-tasks.html',
  styleUrls: ['./employee-tasks.css']
})
export class MyTasksComponent implements OnInit {
  employee: Employee = {
    name: 'Loading...',
    initial: '',
    department: 'Loading...',
    avatar: null
  };

  allTasks: EmployeeTask[] = [];
  filteredTasks: EmployeeTask[] = [];
  isLoading = true;

  searchTerm: string = '';
  statusFilter: string = 'all';
  priorityFilter: string = 'all';

  isModalVisible = false;
  isDetailsLoading = false;
  selectedTaskDetails: FullTaskDetails | null = null;
  employeeComment: string = '';
  modalError: string | null = null;
  selectedTaskStatus: string = '';

  parsedDetails: any = null;
  isActionBlockedByPayment: boolean = false;

  // ✅ START: New properties for text truncation
  expandedElements: { [key: string]: boolean } = {};
  truncationLimit = 30; // Character limit before truncating
  // ✅ END: End of new properties

  constructor(
    private authService: AuthService,
    private employeeService: EmployeeService,
    private serviceRequestService: ServiceRequestService,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const statusFromUrl = params['status'];
      if (statusFromUrl) {
        const validStatuses = ['APPROVED_PENDING_PAYMENT', 'UNDER_REVIEW', 'PENDING', 'COMPLETED', 'REJECTED', 'PENDING_CITIZEN_ACTION'];
        if (validStatuses.includes(statusFromUrl)) {
          this.statusFilter = statusFromUrl;
        }
      }
    });

    this.loadUserData();
    this.loadTasks();
  }

  // ✅ START: New methods for managing text expansion
  toggleExpansion(key: string): void {
    this.expandedElements[key] = !this.expandedElements[key];
  }

  isExpanded(key: string): boolean {
    return this.expandedElements[key] || false;
  }

  public asString(value: unknown): string {
    return String(value);
  }
  // ✅ END: End of new methods

  loadTasks(): void {
    this.isLoading = true;
    this.employeeService.getMyTasks().subscribe({
      next: (tasksFromApi) => {
        const sortedTasks = tasksFromApi.sort((a, b) =>
          new Date(b.submittedDate).getTime() - new Date(a.submittedDate).getTime()
        );

        this.allTasks = sortedTasks.map(task => ({
          ...task,
          priority: ['high', 'normal', 'low'][Math.floor(Math.random() * 3)] as 'high' | 'normal' | 'low',
          dueDate: '2025-09-20'
        }));
        this.applyFilters();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load tasks:', err);
        this.isLoading = false;
      }
    });
  }

  loadUserData(): void {
    const currentUser = this.authService.currentUser();
    if (currentUser) {
      this.employee = {
        name: currentUser.fullName,
        department: this.formatRole(currentUser.role),
        initial: this.getInitials(currentUser.fullName),
        avatar: currentUser.avatar
      };
    }
  }

  applyFilters(): void {
    let tasks = [...this.allTasks];
    if (this.statusFilter !== 'all') {
      tasks = tasks.filter(task => task.status === this.statusFilter);
    }
    if (this.priorityFilter !== 'all') {
      tasks = tasks.filter(task => task.priority === this.priorityFilter);
    }
    if (this.searchTerm) {
      const lowercasedTerm = this.searchTerm.toLowerCase();
      tasks = tasks.filter(task =>
        task.citizenName.toLowerCase().includes(lowercasedTerm) ||
        task.serviceType.toLowerCase().includes(lowercasedTerm)
      );
    }
    this.filteredTasks = tasks;
  }

  viewTaskDetails(taskId: string): void {
    this.isModalVisible = true;
    this.isDetailsLoading = true;
    this.modalError = null;
    this.selectedTaskDetails = null;
    this.parsedDetails = null;
    this.isActionBlockedByPayment = false;
    this.expandedElements = {}; // Reset expanded states when opening a new modal

    this.employeeService.getTaskDetails(taskId).subscribe({
      next: (details) => {
        this.selectedTaskDetails = details;
        this.employeeComment = details.employeeComments || '';
        this.selectedTaskStatus = details.status;

        if (details.details) {
          try {
            this.parsedDetails = JSON.parse(details.details);
          } catch (e) {
            console.error('Could not parse request details JSON:', e);
            this.parsedDetails = null;
          }
        }

        this.isActionBlockedByPayment = details.status === 'APPROVED_PENDING_PAYMENT' && !details.isPaid;

        if (this.isActionBlockedByPayment && !this.employeeComment) {
          this.employeeComment = 'The request is pending payment of the applicable fees. Please proceed with the payment to continue the process.';
        }

        this.isDetailsLoading = false;
      },
      error: (err) => {
        console.error('Failed to load task details:', err);
        this.modalError = 'Failed to load task details. Please try again.';
        this.isDetailsLoading = false;
      }
    });
  }

  confirmReview(): void {
    if (!this.selectedTaskDetails) return;

    const taskId = this.selectedTaskDetails.id;
    const comment = this.employeeComment;
    const newStatus = this.isActionBlockedByPayment
      ? this.selectedTaskDetails.status
      : this.selectedTaskStatus;

    this.isDetailsLoading = true;

    this.employeeService.reviewTask(taskId.toString(), newStatus, comment).subscribe({
      next: () => {
        const taskIndex = this.allTasks.findIndex(t => t.id === taskId.toString());
        if (taskIndex !== -1) {
          this.allTasks[taskIndex].status = newStatus;
        }
        if (this.isActionBlockedByPayment) {
          if (taskIndex !== -1) {
            this.allTasks[taskIndex].isPaid = true;
          }
          if (this.selectedTaskDetails) {
            this.selectedTaskDetails.isPaid = true;
          }
        }

        this.applyFilters();
        this.closeModal();
      },
      error: (err) => {
        console.error('Failed to submit review:', err);
        this.modalError = 'Failed to submit review. Please try again.';
        this.isDetailsLoading = false;
      }
    });
  }

  closeModal(): void {
    this.isModalVisible = false;
    this.selectedTaskDetails = null;
    this.employeeComment = '';
    this.modalError = null;
    this.selectedTaskStatus = '';
    this.parsedDetails = null;
    this.isActionBlockedByPayment = false;
  }

  viewFile(doc: DocumentDto): void {
    this.serviceRequestService.getViewableFile(doc.filePath).subscribe({
      next: (blob) => {
        const fileURL = URL.createObjectURL(blob);
        window.open(fileURL, '_blank');
      },
      error: (err) => {
        this.modalError = 'Could not load document for viewing.';
        console.error('View document error:', err);
      }
    });
  }

  downloadFile(doc: DocumentDto): void {
    this.serviceRequestService.downloadDocument(doc.filePath).subscribe({
      next: (blob) => saveAs(blob, doc.name),
      error: (err) => {
        this.modalError = 'Failed to download the document.';
        console.error('Download document error:', err);
      }
    });
  }

  getDetailLabel(key: unknown): string {
    const strKey = String(key);
    const labels: { [key: string]: string } = {
      fullName: 'Full Name',
      nationalId: 'National ID',
      licenseNumber: 'License Number',
      licenseCategory: 'License Category',
    };
    return labels[strKey] || strKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  }

  formatFileSize(bytes: number = 0): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getDocumentIconClass(fileType: string): string {
    if (fileType?.includes('pdf')) return 'fa-file-pdf pdf-icon';
    if (fileType?.includes('image')) return 'fa-file-image image-icon';
    return 'fa-file-alt';
  }

  formatStatus(status: string): string {
    if (!status) return '';
    return status.replace(/_/g, ' ').toLowerCase()
      .replace(/\b\w/g, c => c.toUpperCase());
  }

  getStatusClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      'PENDING': 'status-pending',
      'PENDING_CITIZEN_ACTION': 'status-pending',
      'APPROVED_PENDING_PAYMENT': 'status-payment',
      'UNDER_REVIEW': 'status-in-progress',
      'COMPLETED': 'status-completed',
      'REJECTED': 'status-rejected'
    };
    return statusMap[status] || 'status-pending';
  }

  getHoverClass(status: string): string {
    if (status === 'COMPLETED') {
      return 'task-completed';
    }
    if (status === 'REJECTED') {
      return 'task-rejected';
    }
    return '';
  }

  formatRole(role: string): string {
    if (!role) return '';
    return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase().replace(/_/g, ' ');
  }

  getInitials(name: string): string {
    if (!name) return '';
    const parts = name.trim().split(/\s+/);
    if (parts.length < 2) {
      return parts[0]?.[0]?.toUpperCase() || '';
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
}
