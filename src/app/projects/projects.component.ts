import { Component, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProjectService, Project } from './project.service';
import { PortfolioService } from '../portfolios/portfolio.service';

type LangCode = 'ar' | 'en';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './projects.component.html',
  styleUrl: './projects.component.scss'
})
export class ProjectsComponent implements OnInit, OnDestroy {
  currentLang: LangCode = 'ar';
  searchQuery: string = '';
  statusFilter: string = 'All';

  projects: Project[] = [];
  isLoading: boolean = true;

  // Stats
  totalProjects: number = 0;
  onTrackCount: number = 0;
  pendingCount: number = 0;
  needActionCount: number = 0;

  // Toasts
  showSuccessToast: boolean = false;
  showErrorToast: boolean = false;

  translations = {
    ar: {
      title: 'المشاريع',
      searchPlaceholder: 'البحث عن كل شيء',
      createBtn: 'إضافة مشروع',
      totalProjects: 'إجمالي المشاريع',
      onTrack: 'في المسار',
      pending: 'قيد الانتظار',
      needAction: 'بحاجة لإجراء',
      noData: 'لا توجد بيانات حالياً',
      noDataSub: 'يرجى الضغط على إضافة جديد واختيار الخيار المناسب',
      thName: 'اسم المشروع',
      thCategory: 'التصنيف',
      thProgram: 'اسم البرنامج',
      thDueDate: 'تاريخ الاستحقاق',
      thEndDate: 'تاريخ الانتهاء',
      thStatus: 'الحالة',
      thActions: 'الإجراءات',
      statusAll: 'الحالة'
    },
    en: {
      title: 'Projects',
      searchPlaceholder: 'Search for everything',
      createBtn: 'Create Project',
      totalProjects: 'Total Projects',
      onTrack: 'On Track',
      pending: 'Pending',
      needAction: 'Need Action',
      noData: 'No data right now',
      noDataSub: 'Please click on create new to choose the sutible option',
      thName: 'Project Name',
      thCategory: 'Category',
      thProgram: 'Program Name',
      thDueDate: 'Due Date',
      thEndDate: 'End Date',
      thStatus: 'Status',
      thActions: 'Actions',
      statusAll: 'Status'
    }
  };

  constructor(
    private projectService: ProjectService,
    private portfolioService: PortfolioService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {
    if (typeof window !== 'undefined' && window.localStorage) {
      const savedLang = localStorage.getItem('preferred_lang') as LangCode;
      if (savedLang) {
        this.currentLang = savedLang;
      }
    }
  }

  ngOnInit() {
    this.loadProjects();

    this.projectService.successToast$.subscribe(val => {
      this.showSuccessToast = val;
      this.cdr.detectChanges();
    });

    this.projectService.errorToast$.subscribe(val => {
      this.showErrorToast = val;
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy() {
    this.projectService.isCreatePageActive = false;
  }

  get t() {
    return this.translations[this.currentLang];
  }

  get isRtl(): boolean {
    return this.currentLang === 'ar';
  }

  loadProjects() {
    this.isLoading = true;
    this.projectService.getProjects(undefined, undefined, this.searchQuery || undefined, this.statusFilter || undefined).subscribe({
      next: (data) => {
        this.projects = data || [];
        this.calculateStats();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading projects', err);
        this.projects = [];
        this.calculateStats();
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  calculateStats() {
    this.totalProjects = this.projects.length;
    // On Track = Active
    this.onTrackCount = this.projects.filter(p => p.status === 'Active' || p.status === 'On Track').length;
    // Pending = OnHold / Pending
    this.pendingCount = this.projects.filter(p => p.status === 'OnHold' || p.status === 'Pending').length;
    // Need Action = Rejected
    this.needActionCount = this.projects.filter(p => p.status === 'Rejected' || p.status === 'Need Action').length;
  }

  onSearch() {
    this.loadProjects();
  }

  onStatusFilterChange() {
    this.loadProjects();
  }

  viewDetails(id: number) {
    this.router.navigate(['/projects/details', id]);
  }

  editProject(id: number, event: MouseEvent) {
    event.stopPropagation();
    this.router.navigate(['/projects/edit', id]);
  }

  deleteProject(id: number, event: MouseEvent) {
    event.stopPropagation();
    if (confirm(this.currentLang === 'ar' ? 'هل أنت متأكد من حذف هذا المشروع؟' : 'Are you sure you want to delete this project?')) {
      this.projectService.deleteProject(id).subscribe({
        next: () => {
          this.projectService.triggerSuccessToast();
          this.loadProjects();
        },
        error: (err) => {
          console.error('Error deleting project', err);
          this.projectService.triggerErrorToast();
        }
      });
    }
  }

  navigateToCreate() {
    this.router.navigate(['/projects/create']);
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toISOString().split('T')[0];
  }

  getStatusClass(status: string): string {
    const s = status?.toLowerCase() || '';
    if (s === 'active' || s === 'ontrack') return 'status-active';
    if (s === 'completed') return 'status-completed';
    if (s === 'onhold' || s === 'pending') return 'status-pending';
    if (s === 'rejected' || s === 'needaction') return 'status-rejected';
    return '';
  }

  getStatusLabel(status: string): string {
    const s = status?.toLowerCase() || '';
    if (this.currentLang === 'ar') {
      if (s === 'active' || s === 'ontrack') return 'في المسار';
      if (s === 'completed') return 'مكتمل';
      if (s === 'onhold' || s === 'pending') return 'قيد الانتظار';
      if (s === 'rejected' || s === 'needaction') return 'بحاجة لإجراء';
      return status;
    } else {
      if (s === 'active' || s === 'ontrack') return 'On Track';
      if (s === 'completed') return 'Completed';
      if (s === 'onhold' || s === 'pending') return 'Pending';
      if (s === 'rejected' || s === 'needaction') return 'Need Action';
      return status;
    }
  }
}
