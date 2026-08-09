import { Component, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { PortfolioService, Portfolio } from '../portfolio.service';
import { UserService, AppUser } from '../../programs/create/user.service';

type LangCode = 'ar' | 'en';

@Component({
  selector: 'app-create-portfolio',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './create-portfolio.html',
  styleUrl: './create-portfolio.scss'
})
export class CreatePortfolioComponent implements OnInit, OnDestroy {
  currentLang: LangCode = 'ar';
  isEditMode: boolean = false;
  editingId: number | null = null;
  isLoading: boolean = false;
  users: AppUser[] = [];

  // File Upload State
  attachedFiles: Array<{ name: string, progress: number, size: string, type: string, path?: string }> = [];

  triggerFileInput(fileInput: HTMLInputElement) {
    fileInput.click();
  }

  onFileSelected(event: any) {
    const files = event.target.files;
    if (files && files.length > 0) {
      this.portfolioService.uploadFiles(files).subscribe({
        next: (res) => {
          if (res) {
            res.forEach((file: any) => {
              this.attachedFiles.push({
                name: file.name,
                progress: 100,
                size: file.size,
                type: file.type,
                path: file.path
              });
            });
          }
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('File upload failed', err);
          this.portfolioService.triggerErrorToast();
        }
      });
    }
  }

  removeFile(index: number) {
    this.attachedFiles.splice(index, 1);
    this.cdr.detectChanges();
  }

  clearAllFiles() {
    this.attachedFiles = [];
    this.cdr.detectChanges();
  }

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
      langLabel: 'English',
      cancelBtn: 'إلغاء',
      saveBtn: 'حفظ والتحديث',
      addBtn: 'إضافة جديد',
      titleCreate: 'إنشاء محفظة',
      titleEdit: 'تعديل المحفظة'
    },
    en: {
      langLabel: 'العربية',
      cancelBtn: 'Cancel',
      saveBtn: 'Save Changes',
      addBtn: 'Add New',
      titleCreate: 'Portfolios',
      titleEdit: 'Edit Portfolio'
    }
  };

  constructor(
    private portfolioService: PortfolioService,
    private userService: UserService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private route: ActivatedRoute
  ) {
    if (typeof window !== 'undefined' && window.localStorage) {
      const savedLang = localStorage.getItem('preferred_lang') as LangCode;
      if (savedLang) {
        this.currentLang = savedLang;
      }
    }
    // Inform the layout shell that the Create page is active
    this.portfolioService.isCreatePageActive = true;
  }

  ngOnInit() {
    this.userService.getAllUsers().subscribe(list => {
      this.users = list;
      
      // Set default values from database list if available to prevent empty selects
      if (this.users.length && !this.isEditMode) {
        const getVal = (idx: number) => {
          const u = this.users[idx] || this.users[0];
          return u.userName || u.nameEn || u.id;
        };
        this.ownerName = getVal(0);
        this.sponsorName = getVal(1 % this.users.length);
        this.managerName = getVal(2 % this.users.length);
      }
      this.cdr.detectChanges();
    });

    this.route.paramMap.subscribe(params => {
      const idStr = params.get('id');
      if (idStr) {
        const id = parseInt(idStr, 10);
        if (!isNaN(id)) {
          this.isEditMode = true;
          this.editingId = id;
          this.loadPortfolioDetails(id);
        }
      } else {
        this.isEditMode = false;
        this.editingId = null;
        this.resetForm();
      }
    });

    this.portfolioService.successToast$.subscribe(val => {
      this.showSuccessToast = val;
      this.cdr.detectChanges();
    });

    this.portfolioService.errorToast$.subscribe(val => {
      this.showErrorToast = val;
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy() {
    // Reset layout shell title state when leaving the page
    this.portfolioService.isCreatePageActive = false;
  }

  get t() {
    return this.translations[this.currentLang];
  }

  formatBudget(val: number): string {
    return new Intl.NumberFormat('en-US').format(val);
  }

  /** Returns 2-letter initials from a full name, e.g. "Faisal Al-Otaibi" → "FA" */
  getInitials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  /** Returns a CSS class string for the avatar color based on the selected name */
  getAvatarClass(name: string): string {
    const map: Record<string, string> = {
      'Faisal Al-Otaibi': 'FO',
      'Omar Al-Harbi':    'OH',
      'Mahmoud Salah':    'MS',
    };
    return 'small-preview-avatar ' + (map[name] || 'FO');
  }

  get isRtl(): boolean {
    return this.currentLang === 'ar';
  }

  resetForm() {
    this.nameAr = '';
    this.nameEn = '';
    this.descriptionAr = '';
    this.descriptionEn = '';
    this.budget = 0;
    
    const today = new Date();
    this.startDate = today.toISOString().split('T')[0];
    const sixMonthsLater = new Date(today.setMonth(today.getMonth() + 6));
    this.endDate = sixMonthsLater.toISOString().split('T')[0];
    
    this.status = 'Active';
    this.category = 'Execution';
    this.ownerName = 'Faisal Al-Otaibi';
    this.sponsorName = 'Omar Al-Harbi';
    this.managerName = 'Mahmoud Salah';
  }

  loadPortfolioDetails(id: number) {
    this.isLoading = true;
    this.portfolioService.getPortfolioDetails(id).subscribe({
      next: (portfolio) => {
        this.nameAr = portfolio.nameAr;
        this.nameEn = portfolio.nameEn;
        this.descriptionAr = portfolio.descriptionAr || '';
        this.descriptionEn = portfolio.descriptionEn || '';
        this.budget = portfolio.budget;
        this.startDate = portfolio.startDate ? portfolio.startDate.split('T')[0] : new Date().toISOString().split('T')[0];
        this.endDate = portfolio.endDate ? portfolio.endDate.split('T')[0] : new Date().toISOString().split('T')[0];
        this.status = portfolio.status;
        this.ownerName = portfolio.ownerName || 'Faisal Al-Otaibi';
        this.sponsorName = portfolio.sponsorName || 'Omar Al-Harbi';
        this.managerName = portfolio.managerName || 'Mahmoud Salah';
        this.category = portfolio.category || 'Execution';
        
        if (portfolio.attachedFiles) {
          try {
            this.attachedFiles = JSON.parse(portfolio.attachedFiles);
          } catch (e) {
            this.attachedFiles = [];
          }
        } else {
          this.attachedFiles = [];
        }

        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  savePortfolio() {
    // Only require name and a valid budget – dates are optional/auto-generated
    if (!this.nameAr) {
      this.portfolioService.triggerErrorToast();
      return;
    }

    if (this.budget <= 0) {
      this.portfolioService.triggerErrorToast();
      return;
    }

    this.isLoading = true;

    // Auto-generate dates if not provided by the user
    const today = new Date();
    const sixMonthsLater = new Date();
    sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);

    const resolvedStartDate = this.startDate
      ? new Date(this.startDate).toISOString()
      : today.toISOString();

    const resolvedEndDate = this.endDate
      ? new Date(this.endDate).toISOString()
      : sixMonthsLater.toISOString();

    const payload = {
      nameAr: this.nameAr,
      name: this.nameAr,
      descriptionAr: this.descriptionAr,
      description: this.descriptionAr,
      budget: this.budget,
      startDate: resolvedStartDate,
      endDate: resolvedEndDate,
      status: this.status,
      ownerName: this.ownerName,
      category: this.category,
      sponsorName: this.sponsorName,
      managerName: this.managerName,
      attachedFiles: this.attachedFiles.length > 0 ? JSON.stringify(this.attachedFiles) : null
    };

    if (this.isEditMode && this.editingId !== null) {
      this.portfolioService.updatePortfolio(this.editingId, payload).subscribe({
        next: () => {
          this.portfolioService.triggerSuccessToast();
          this.router.navigate(['/portfolios']);
        },
        error: () => {
          this.isLoading = false;
          this.portfolioService.triggerErrorToast();
          this.cdr.detectChanges();
        }
      });
    } else {
      this.portfolioService.createPortfolio(payload).subscribe({
        next: () => {
          this.portfolioService.triggerSuccessToast();
          this.router.navigate(['/portfolios']);
        },
        error: () => {
          this.isLoading = false;
          this.portfolioService.triggerErrorToast();
          this.cdr.detectChanges();
        }
      });
    }
  }

  goBack() {
    this.router.navigate(['/portfolios']);
  }

  userLabel(u: AppUser): string {
    return this.isRtl ? (u.nameAr || u.userName || u.email || u.id) : (u.nameEn || u.userName || u.email || u.id);
  }
}
