import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PortfolioService, Portfolio } from './portfolio.service';

type LangCode = 'ar' | 'en';

@Component({
  selector: 'app-portfolios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './portfolios.component.html',
  styleUrl: './portfolios.component.scss'
})
export class PortfoliosComponent implements OnInit {
  currentLang: LangCode = 'ar';
  searchQuery: string = '';
  viewMode: 'grid' | 'list' = 'grid'; // Grid view by default

  portfolios: Portfolio[] = [];
  isLoading: boolean = true;
  errorMessage: string = '';
  projectsSortDirection: 'asc' | 'desc' | 'none' = 'none';

  // Stats
  portfolioCount: number = 0;
  pendingCount: number = 0;
  onTrackCount: number = 0;
  completedCount: number = 0;

  // Modal / Drawer state
  isModalOpen: boolean = false;
  isEditMode: boolean = false;
  editingId: number | null = null;

  // Form Fields
  nameAr: string = '';
  nameEn: string = '';
  descriptionAr: string = '';
  descriptionEn: string = '';
  budget: number = 0;
  startDate: string = '';
  endDate: string = '';
  status: string = 'Active';

  category: string = 'Execution';
  ownerName: string = 'Faisal Al-Otaibi';
  sponsorName: string = 'Omar Al-Harbi';
  managerName: string = 'Mahmoud Salah';

  // Toasts
  showSuccessToast: boolean = false;
  showErrorToast: boolean = false;

  translations = {
    ar: {
      title: 'المحافظ الاستراتيجية',
      searchPlaceholder: 'ابحث بالاسم أو المالك...',
      createBtn: 'إنشاء محفظة جديدة',
      editBtn: 'تعديل المحفظة',
      cancelBtn: 'إلغاء',
      saveBtn: 'حفظ',
      updatingBtn: 'جاري الحفظ...',
      gridMode: 'عرض شبكي',
      listMode: 'عرض قائمتي',
      
      stats: {
        total: 'إجمالي المحافظ',
        pending: 'قيد الانتظار',
        onTrack: 'في المسار الصحيح',
        completed: 'مكتملة'
      },

      headers: {
        name: 'اسم المحفظة',
        budget: 'الميزانية',
        dates: 'التاريخ',
        status: 'الحالة',
        actions: 'الإجراءات',
        progress: 'التقدم'
      },

      form: {
        titleCreate: 'إنشاء محفظة جديدة',
        titleEdit: 'تعديل بيانات المحفظة',
        nameArLabel: 'اسم المحفظة (بالعربية)',
        nameEnLabel: 'اسم المحفظة (بالإنجليزي)',
        descArLabel: 'الوصف (بالعربية)',
        descEnLabel: 'الوصف (بالإنجليزي)',
        budgetLabel: 'الميزانية المخصصة (ريال)',
        startLabel: 'تاريخ البدء',
        endLabel: 'تاريخ الانتهاء',
        statusLabel: 'حالة المحفظة'
      },

      messages: {
        confirmDelete: 'هل أنت متأكد من رغبتك في حذف هذه المحفظة؟',
        deleteSuccess: 'تم حذف المحفظة بنجاح!',
        createSuccess: 'تم إنشاء المحفظة بنجاح!',
        updateSuccess: 'تم تحديث بيانات المحفظة بنجاح!',
        validationError: 'يرجى إكمال الحقول المطلوبة بشكل صحيح!',
        dateError: 'تاريخ الانتهاء يجب أن يكون بعد تاريخ البدء!',
        noData: 'لا توجد محافظ مسجلة حالياً، اضغط على إنشاء محفظة للبدء.'
      }
    },
    en: {
      title: 'Strategic Portfolios',
      searchPlaceholder: 'Search by name or owner...',
      createBtn: 'Create New Portfolio',
      editBtn: 'Edit Portfolio',
      cancelBtn: 'Cancel',
      saveBtn: 'Save',
      updatingBtn: 'Saving...',
      gridMode: 'Grid View',
      listMode: 'List View',

      stats: {
        total: 'Total Portfolio',
        pending: 'Pending',
        onTrack: 'On Track',
        completed: 'Completed'
      },

      headers: {
        name: 'Portfolio Name',
        budget: 'Budget',
        dates: 'Timeline',
        status: 'Status',
        actions: 'Actions',
        progress: 'Progress'
      },

      form: {
        titleCreate: 'Create New Portfolio',
        titleEdit: 'Edit Portfolio Details',
        nameArLabel: 'Portfolio Name (Arabic)',
        nameEnLabel: 'Portfolio Name (English)',
        descArLabel: 'Description (Arabic)',
        descEnLabel: 'Description (English)',
        budgetLabel: 'Allocated Budget (SAR)',
        startLabel: 'Start Date',
        endLabel: 'End Date',
        statusLabel: 'Portfolio Status'
      },

      messages: {
        confirmDelete: 'Are you sure you want to delete this portfolio?',
        deleteSuccess: 'Portfolio deleted successfully!',
        createSuccess: 'Portfolio created successfully!',
        updateSuccess: 'Portfolio details updated successfully!',
        validationError: 'Please complete all required fields correctly!',
        dateError: 'End Date must be after Start Date!',
        noData: 'No portfolios found. Click Create New Portfolio to get started.'
      }
    }
  };

  constructor(
    public portfolioService: PortfolioService,
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
    this.loadPortfolios();
    
    this.portfolioService.successToast$.subscribe(val => {
      this.showSuccessToast = val;
      this.cdr.detectChanges();
    });

    this.portfolioService.errorToast$.subscribe(val => {
      this.showErrorToast = val;
      this.cdr.detectChanges();
    });
  }

  get t() {
    return this.translations[this.currentLang];
  }

  get isRtl(): boolean {
    return this.currentLang === 'ar';
  }

  loadPortfolios() {
    this.isLoading = true;
    const sortParam = this.projectsSortDirection !== 'none' ? this.projectsSortDirection : undefined;
    this.portfolioService.getAllPortfolios(sortParam).subscribe({
      next: (list) => {
        this.portfolios = list;
        this.calculateStats();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMessage = this.t.messages.noData;
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  calculateStats() {
    this.portfolioCount = this.portfolios.length;
    this.pendingCount = this.portfolios.filter(p => p.status === 'OnHold').length;
    this.onTrackCount = this.portfolios.filter(p => p.status === 'Active').length;
    this.completedCount = this.portfolios.filter(p => p.status === 'Completed').length;
  }

  toggleProjectsSort() {
    if (this.projectsSortDirection === 'none') {
      this.projectsSortDirection = 'desc';
    } else if (this.projectsSortDirection === 'desc') {
      this.projectsSortDirection = 'asc';
    } else {
      this.projectsSortDirection = 'none';
    }
    this.loadPortfolios();
  }

  get filteredPortfolios(): Portfolio[] {
    const query = this.searchQuery.trim().toLowerCase();
    let result = [...this.portfolios];

    if (query) {
      result = result.filter(p =>
        p.nameAr.toLowerCase().includes(query) ||
        p.nameEn.toLowerCase().includes(query) ||
        (p.ownerName && p.ownerName.toLowerCase().includes(query))
      );
    }

    return result;
  }

  triggerSuccessToast() {
    this.showSuccessToast = true;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.showSuccessToast = false;
      this.cdr.detectChanges();
    }, 4000);
  }

  triggerErrorToast() {
    this.showErrorToast = true;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.showErrorToast = false;
      this.cdr.detectChanges();
    }, 4000);
  }

  // Handle Create / Edit Open
  openCreateModal() {
    this.router.navigate(['/portfolios/create']);
  }

  openEditModal(portfolio: Portfolio) {
    this.router.navigate(['/portfolios/edit', portfolio.id]);
  }

  closeModal() {
    this.isModalOpen = false;
    this.portfolioService.isCreatePageActive = false;
    this.cdr.detectChanges();
  }

  savePortfolio() {
    this.errorMessage = '';
    
    if (!this.nameAr || !this.nameEn || this.budget <= 0 || !this.startDate || !this.endDate) {
      this.triggerErrorToast();
      return;
    }

    if (new Date(this.endDate) < new Date(this.startDate)) {
      this.triggerErrorToast();
      return;
    }

    this.isLoading = true;

    const payload = {
      nameAr: this.nameAr,
      nameEn: this.nameEn,
      descriptionAr: this.descriptionAr,
      descriptionEn: this.descriptionEn,
      budget: this.budget,
      startDate: new Date(this.startDate).toISOString(),
      endDate: new Date(this.endDate).toISOString(),
      status: this.status,
      ownerName: this.ownerName
    };

    if (this.isEditMode && this.editingId !== null) {
      // Edit mode
      this.portfolioService.updatePortfolio(this.editingId, payload).subscribe({
        next: () => {
          this.triggerSuccessToast();
          this.closeModal();
          this.loadPortfolios();
        },
        error: () => {
          this.isLoading = false;
          this.triggerErrorToast();
          this.cdr.detectChanges();
        }
      });
    } else {
      // Create mode
      this.portfolioService.createPortfolio(payload).subscribe({
        next: () => {
          this.triggerSuccessToast();
          this.closeModal();
          this.loadPortfolios();
        },
        error: () => {
          this.isLoading = false;
          this.triggerErrorToast();
          this.cdr.detectChanges();
        }
      });
    }
  }

  deletePortfolio(id: number) {
    if (confirm(this.t.messages.confirmDelete)) {
      this.isLoading = true;
      this.portfolioService.deletePortfolio(id).subscribe({
        next: () => {
          alert(this.t.messages.deleteSuccess);
          this.loadPortfolios();
        },
        error: () => {
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
    }
  }

  formatBudget(val: number): string {
    return new Intl.NumberFormat('en-US').format(val);
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString(this.isRtl ? 'ar-SA' : 'en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  // Get project progress (placeholder calculations)
  getProgressPercent(portfolio: Portfolio): number {
    if (portfolio.status === 'Completed') return 100;
    if (portfolio.status === 'OnHold') return 25;
    if (portfolio.status === 'Archived') return 0;
    // For active, mock progress based on dates
    const start = new Date(portfolio.startDate).getTime();
    const end = new Date(portfolio.endDate).getTime();
    const now = new Date().getTime();
    if (now > end) return 95;
    if (now < start) return 5;
    const progress = ((now - start) / (end - start)) * 100;
    return Math.round(progress);
  }
}
