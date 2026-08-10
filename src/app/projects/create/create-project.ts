import { Component, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ProjectService } from '../project.service';

type LangCode = 'ar' | 'en';
//w
@Component({
  selector: 'app-create-project',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './create-project.html',
  styleUrl: './create-project.scss'
})
export class CreateProjectComponent implements OnInit, OnDestroy {
  currentLang: LangCode = 'ar';
  isEditMode: boolean = false;
  editingId: number | null = null;
  isLoading: boolean = false;

  // Option Lists loaded from DB
  portfoliosList: Array<{ id: number, nameAr: string, nameEn: string, name?: string }> = [];
  programsList: Array<{ id: number, name: string }> = [];

  // Static Manager dropdown lists
  managersList = ['Abdallah Othman', 'Faisal Al-Otaibi', 'Omar Al-Harbi', 'Mahmoud Salah'];
  ownersList = ['Faisal Al-Otaibi', 'Abdallah Othman', 'Omar Al-Harbi', 'Mahmoud Salah'];
  sponsorsList = ['Omar Al-Harbi', 'Mahmoud Salah', 'Faisal Al-Otaibi', 'Abdallah Othman'];

  // File Upload State
  attachedFiles: Array<{ name: string, progress: number, size: string, type: string, path?: string }> = [];

  // Form Fields
  name: string = '';
  description: string = '';
  budget: number = 0;
  startDate: string = '';
  endDate: string = '';
  status: string = 'Active';
  priority: number = 2; // Medium

  category: string = 'SaaS';
  portfolioId: number = 0;
  programId: number = 0;
  managerName: string = 'Abdallah Othman';
  ownerName: string = 'Faisal Al-Otaibi';
  sponsorName: string = 'Omar Al-Harbi';

  // Toasts
  showSuccessToast: boolean = false;
  showErrorToast: boolean = false;

  translations = {
    ar: {
      langLabel: 'English',
      cancelBtn: 'إلغاء',
      saveBtn: 'حفظ التغييرات',
      addBtn: 'إضافة جديد',
      titleCreate: 'إنشاء مشروع',
      titleEdit: 'تعديل المشروع',
      lblProjName: 'اسم المشروع',
      lblProjBudget: 'ميزانية المشروع',
      lblProjCategory: 'تصنيف المشروع',
      lblProgName: 'اسم البرنامج',
      lblPortfolio: 'المحفظة المرتبطة',
      lblStartDate: 'تاريخ الاستحقاق',
      lblEndDate: 'تاريخ الانتهاء',
      lblManager: 'مدير المشروع',
      lblOwner: 'مالك البرنامج',
      lblSponsor: 'راعي البرنامج',
      lblPriority: 'الأولوية',
      lblStatus: 'الحالة',
      lblDescription: 'الوصف',
      lblAttachFile: 'إرفاق ملف',
      lblAttachedFilesList: 'الملفات المرفقة',
      uploadDragText: 'اسحب ملفك هنا لبدء الرفع',
      uploadBtn: 'رفع ملف',
      uploadSubtext: 'يمكنك رفع حتى 5 ملفات كحد أقصى. يدعم صيغ jpg, png, svg, zip, pdf, doc',
      priorityLow: 'منخفض',
      priorityMedium: 'متوسط',
      priorityHigh: 'مرتفع'
    },
    en: {
      langLabel: 'العربية',
      cancelBtn: 'Cancel',
      saveBtn: 'Save Changes',
      addBtn: 'Add New',
      titleCreate: 'Create Project',
      titleEdit: 'Edit Project',
      lblProjName: 'Project Name',
      lblProjBudget: 'Project Budget',
      lblProjCategory: 'Project Category',
      lblProgName: 'Program Name',
      lblPortfolio: 'Linked Portfolio',
      lblStartDate: 'Due Date',
      lblEndDate: 'End Date',
      lblManager: 'Project Manager',
      lblOwner: 'Program Owner',
      lblSponsor: 'Program Sponsor',
      lblPriority: 'Priority',
      lblStatus: 'Status',
      lblDescription: 'Description',
      lblAttachFile: 'Attach File',
      lblAttachedFilesList: 'File Attached',
      uploadDragText: 'Drag your file(s) to start uploading',
      uploadBtn: 'Upload',
      uploadSubtext: 'You can upload up to 5 files max. Only support jpg, png, svg, zip, pdf, doc',
      priorityLow: 'Low',
      priorityMedium: 'Medium',
      priorityHigh: 'High'
    }
  };

  constructor(
    private projectService: ProjectService,
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
    this.projectService.isCreatePageActive = true;
  }

  ngOnInit() {
    this.loadDropdownData();

    this.route.paramMap.subscribe(params => {
      const idStr = params.get('id');
      if (idStr) {
        const id = parseInt(idStr, 10);
        if (!isNaN(id)) {
          this.isEditMode = true;
          this.editingId = id;
          this.loadProjectDetails(id);
        }
      } else {
        this.isEditMode = false;
        this.editingId = null;
        this.resetForm();
      }
    });

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

  loadDropdownData() {
    // Portfolios
    this.projectService.getPortfolios().subscribe(res => {
      this.portfoliosList = res || [];
      if (this.portfoliosList.length > 0 && !this.isEditMode) {
        this.portfolioId = this.portfoliosList[0].id;
      }
      this.cdr.detectChanges();
    });

    // Programs
    this.projectService.getPrograms().subscribe(res => {
      this.programsList = res || [];
      this.cdr.detectChanges();
    });
  }

  loadProjectDetails(id: number) {
    this.isLoading = true;
    this.projectService.getProjectDetails(id).subscribe({
      next: (project) => {
        this.name = project.name;
        this.description = project.description || '';
        this.budget = project.budget;
        this.startDate = project.startDate ? project.startDate.split('T')[0] : '';
        this.endDate = project.endDate ? project.endDate.split('T')[0] : '';
        this.status = project.status;
        this.priority = project.priority || 2;
        this.category = project.category || 'SaaS';
        this.portfolioId = project.portfolioId;
        this.programId = project.programId || 0;
        this.managerName = project.managerName || 'Abdallah Othman';

        if (project.attachedFiles) {
          try {
            this.attachedFiles = JSON.parse(project.attachedFiles);
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

  resetForm() {
    this.name = '';
    this.description = '';
    this.budget = 0;
    const today = new Date();
    this.startDate = today.toISOString().split('T')[0];
    const sixMonthsLater = new Date(today.setMonth(today.getMonth() + 6));
    this.endDate = sixMonthsLater.toISOString().split('T')[0];
    this.status = 'Active';
    this.priority = 2;
    this.category = 'SaaS';
    this.portfolioId = this.portfoliosList.length > 0 ? this.portfoliosList[0].id : 0;
    this.programId = 0;
    this.managerName = 'Abdallah Othman';
    this.ownerName = 'Faisal Al-Otaibi';
    this.sponsorName = 'Omar Al-Harbi';
    this.attachedFiles = [];
  }

  triggerFileInput(fileInput: HTMLInputElement) {
    fileInput.click();
  }

  onFileSelected(event: any) {
    const files = event.target.files;
    if (files && files.length > 0) {
      this.projectService.uploadFiles(files).subscribe({
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
          this.projectService.triggerErrorToast();
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

  getInitials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  getAvatarClass(name: string): string {
    const map: Record<string, string> = {
      'Abdallah Othman': 'FO',
      'Faisal Al-Otaibi': 'OH',
      'Omar Al-Harbi': 'MS',
      'Mahmoud Salah': 'FO'
    };
    return 'small-preview-avatar ' + (map[name] || 'FO');
  }

  saveProject() {
    if (!this.name || this.budget <= 0 || !this.portfolioId) {
      this.projectService.triggerErrorToast();
      return;
    }

    this.isLoading = true;

    // Dates resolving
    const resolvedStartDate = this.startDate
      ? new Date(this.startDate).toISOString()
      : new Date().toISOString();

    const resolvedEndDate = this.endDate
      ? new Date(this.endDate).toISOString()
      : new Date(new Date().setMonth(new Date().getMonth() + 6)).toISOString();

    const payload = {
      name: this.name,
      description: this.description,
      budget: this.budget,
      status: this.status,
      priority: this.priority,
      startDate: resolvedStartDate,
      endDate: resolvedEndDate,
      managerName: this.managerName,
      portfolioId: this.portfolioId,
      programId: this.programId !== 0 ? this.programId : null,
      attachedFiles: this.attachedFiles.length > 0 ? JSON.stringify(this.attachedFiles) : null
    };

    if (this.isEditMode && this.editingId !== null) {
      this.projectService.updateProject(this.editingId, payload).subscribe({
        next: () => {
          this.projectService.triggerSuccessToast();
          this.router.navigate(['/projects']);
        },
        error: () => {
          this.isLoading = false;
          this.projectService.triggerErrorToast();
          this.cdr.detectChanges();
        }
      });
    } else {
      this.projectService.createProject(payload).subscribe({
        next: () => {
          this.projectService.triggerSuccessToast();
          this.router.navigate(['/projects']);
        },
        error: () => {
          this.isLoading = false;
          this.projectService.triggerErrorToast();
          this.cdr.detectChanges();
        }
      });
    }
  }

  goBack() {
    this.router.navigate(['/projects']);
  }
}
