import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface FAQ {
  question: string;
  answer: string;
  category: string;
  role: 'citizen' | 'employee' | 'manager' | 'general';
  open?: boolean;
}

@Component({
  selector: 'app-help',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './help.html',
  styleUrls: ['./help.css']
})
export class HelpComponent implements OnInit {
  searchTerm = '';
  selectedCategory = 'all';
  activeTab: 'all' | 'citizen' | 'employee' | 'manager' = 'all';

  // لإدارة الفلتر الديناميكي
  availableCategories: string[] = [];
  categoryDisplayMap: { [key: string]: string } = {
    'General': 'General Questions',
    'Account': 'Account & Login',
    'Services': 'Service Requests',
    'Workflow': 'Workflow & Tasks',
    'Analytics': 'Analytics & Reports'
  };

  faqs: FAQ[] = [
    // General
    { question: 'What is GovFlow Tracker?', answer: 'GovFlow Tracker is a prototype system designed to demonstrate how government services can be digitized to improve efficiency. It is a simulation and not connected to any real government entity.', category: 'General', role: 'general' },
    { question: 'Is the data in this system real?', answer: 'No, all data, including citizen information, service requests, and payments, is entirely simulated for demonstration purposes only.', category: 'General', role: 'general' },

    // Citizen
    { question: 'How do I register for a new citizen account?', answer: 'Click the "Register" button on the main page. You will need to provide your personal details, including your 14-digit National ID, which will be used for logging in.', category: 'Account', role: 'citizen' },
    { question: 'How do I track the status of my service request?', answer: 'Your citizen dashboard provides a real-time view of all your submitted requests and their current status (e.g., Pending, Under Review, Approved, Rejected). You will also receive notifications for any status changes.', category: 'Services', role: 'citizen' },
    { question: 'How can I submit a request for a building permit?', answer: 'After logging in, navigate to the "Municipality" department from your dashboard. Select "Building Permit Issuance", fill out the required online form, and upload all necessary documents directly.', category: 'Services', role: 'citizen' },
    { question: 'What should I do if my request is rejected?', answer: 'If your request is rejected, the reviewing employee will provide a reason in the comments section of the request. You will be notified and can then take the required action, such as uploading a missing document.', category: 'Services', role: 'citizen' },
    // ## سؤال جديد ## (Citizen / Workflow)
    { question: "What does 'Pending Review' mean in my request's workflow?", answer: "This status means your application has been received successfully and is in the queue waiting for an employee to begin processing it.", category: 'Workflow', role: 'citizen' },
    // ## سؤال جديد ## (Citizen / Analytics)
    { question: "Can I view a history of all my completed services and payments?", answer: "Yes, your dashboard includes an 'Archive' section where you can view a full history of all completed or rejected requests, including any payments made.", category: 'Analytics', role: 'citizen' },


    // Employee
    { question: 'How do I log in as an employee?', answer: 'Select the "Employee / Manager" toggle on the login page. You will need to use your official email and password. A specific job role code verification is required to grant elevated access.', category: 'Account', role: 'employee' },
    { question: 'How can I view the tasks assigned to my department?', answer: 'Your employee dashboard is designed to show all incoming service requests specifically assigned to your department (e.g., Traffic or Municipality). You can organize and track these requests by priority or submission date.', category: 'Workflow', role: 'employee' },
    { question: 'How do I review documents and update a request status?', answer: 'Open any request from your task list to view its details and all attached documents online. You can then change the status (e.g., Approved, Rejected) and add comments for the citizen.', category: 'Workflow', role: 'employee' },
    // ## سؤال جديد ## (Employee / Services)
    { question: "How can I filter requests by service type (e.g., only 'Building Permit')?", answer: "Your main task dashboard has filter controls at the top. You can filter the queue by service type, submission date, or current status.", category: 'Services', role: 'employee' },
    // ## سؤال جديد ## (Employee / Analytics)
    { question: "Can I see my personal processing statistics?", answer: "Yes, under your profile, there is a 'My Performance' tab that shows your average processing time and the number of requests you have completed this month.", category: 'Analytics', role: 'employee' },


    // Manager
    { question: 'How can I monitor my department\'s overall performance?', answer: 'The manager dashboard provides an interactive overview of key metrics, including the number of requests per service, acceptance and rejection rates, and average processing times.', category: 'Analytics', role: 'manager' },
    { question: 'Is it possible to track the performance of individual employees?', answer: 'Yes, the dashboard includes tools to monitor employee performance. You can filter requests by a specific employee to identify delays, review their workload, and address any recurring issues.', category: 'Analytics', role: 'manager' },
    { question: 'How do I identify which services are most in-demand?', answer: 'Use the advanced filtering tools in your dashboard to analyze request volume by service type, date, or status. This data is crucial for identifying trends and allocating staff effectively during peak times.', category: 'Analytics', role: 'manager' },
    // ## سؤال جديد ## (Manager / Account)
    { question: "An employee forgot their password. How do I reset it?", answer: "From the 'Team Management' panel, find the employee, click 'Manage,' and select 'Send Password Reset Link' to their official email.", category: 'Account', role: 'manager' },
    // ## سؤال جديد ## (Manager / Workflow)
    { question: "How can I override a workflow step or approval?", answer: "As a manager, you have override privileges. Find the relevant request, open it, and you will see a 'Manager Override' button. This allows you to manually change the status after leaving an audit comment.", category: 'Workflow', role: 'manager' }
  ];

  ngOnInit() {
    this.updateAvailableCategories(); // نقوم بتشغيلها عند بدء تشغيل الكومبوننت
  }

  setActiveTab(tab: 'all' | 'citizen' | 'employee' | 'manager') {
    this.activeTab = tab;
    this.selectedCategory = 'all'; // إعادة تعيين الفلتر عند تغيير الدور
    this.updateAvailableCategories(); // تحديث قائمة الفلاتر
  }

  /**
   * دالة لتحديث قائمة الأقسام المتاحة بناءً على الدور المختار
   */
  updateAvailableCategories() {
    let relevantFaqs: FAQ[];

    if (this.activeTab === 'all') {
      relevantFaqs = this.faqs; // اعرض كل شيء إذا كان "الكل" محدداً
    } else {
      // اعرض فقط الأسئلة "العامة" + الأسئلة الخاصة بالدور المحدد
      relevantFaqs = this.faqs.filter(faq =>
        faq.role === 'general' || faq.role === this.activeTab
      );
    }

    // استخراج الأقسام الفريدة من الأسئلة المفلترة
    const categories = new Set(relevantFaqs.map(faq => faq.category));
    this.availableCategories = [...categories];
  }

  toggleAccordion(faq: FAQ) {
    // This logic allows only one FAQ to be open at a time for a cleaner interface.
    if (!faq.open) {
      this.faqs.forEach(item => item.open = false);
    }
    faq.open = !faq.open;
  }

  get filteredFaqs() {
    return this.faqs.filter(faq =>
      (this.activeTab === 'all' || faq.role === this.activeTab || faq.role === 'general') &&
      (this.selectedCategory === 'all' || faq.category === this.selectedCategory) &&
      (faq.question.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        faq.answer.toLowerCase().includes(this.searchTerm.toLowerCase()))
    );
  }
}
