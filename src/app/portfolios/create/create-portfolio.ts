import { Component, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { PortfolioService, Portfolio } from '../portfolio.service';

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

  // File Upload State
  attachedFiles: Array<{ name: string, progress: number, size: string, type: string }> = [
    { name: 'Topic_1.pdf', progress: 75, size: '2.4 MB', type: 'pdf' },
    { name: 'Topic_2.doc', progress: 100, size: '1.8 MB', type: 'doc' }
  ];

  triggerFileInput(fileInput: HTMLInputElement) {
    fileInput.click();
  }

  onFileSelected(event: any) {
    const files = event.target.files;
    if (files) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const ext = file.name.split('.').pop()?.toLowerCase() || '';
        this.attachedFiles.push({
          name: file.name,
          progress: 100,
          size: (file.size / (1024 * 1024)).toFixed(1) + ' MB',
          type: ext
        });
      }
      this.cdr.detectChanges();
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
    if (!this.nameAr || this.budget <= 0 || !this.startDate || !this.endDate) {
      this.portfolioService.triggerErrorToast();
      return;
    }

    if (new Date(this.endDate) < new Date(this.startDate)) {
      this.portfolioService.triggerErrorToast();
      return;
    }

    this.isLoading = true;

    const payload = {
      nameAr: this.nameAr,
      descriptionAr: this.descriptionAr,
      budget: this.budget,
      startDate: new Date(this.startDate).toISOString(),
      endDate: new Date(this.endDate).toISOString(),
      status: this.status,
      ownerName: this.ownerName,
      category: this.category,
      sponsorName: this.sponsorName,
      managerName: this.managerName
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
}
