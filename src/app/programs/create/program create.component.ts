import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ProgramService, ProgramStatus } from '../program.service';
import { PortfolioService, Portfolio } from '../../portfolios/portfolio.service';
import { UserService, AppUser } from './user.service';

type LangCode = 'ar' | 'en';

interface AttachedFile {
  name: string;
  progress: number;
  url?: string;
  raw?: File;
}

@Component({
  selector: 'app-program-create',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './program create.component.html',
  styleUrl: './program create.component.scss'
})
export class ProgramCreateComponent implements OnInit {
  currentLang: LangCode = 'ar';
  isEditMode = false;
  editingId: number | null = null;
  isSaving = false;

  name = '';
  description = '';
  budget: number = 0;
  status: number = ProgramStatus.Pending;
  portfolioId: number | null = null;

  // UI-only until the backend adds ownerId.
  ownerUserId: string = '';

  sponsorUserId: string = '';
  managerId: string = '';
  attachedFiles: AttachedFile[] = [];

  portfolios: Portfolio[] = [];
  users: AppUser[] = [];

  errorMessage = '';

  readonly statusOptions = [
    { value: ProgramStatus.Pending, labelAr: 'قيد الانتظار', labelEn: 'Pending' },
    { value: ProgramStatus.Active, labelAr: 'قيد التنفيذ', labelEn: 'In Progress' },
    { value: ProgramStatus.Completed, labelAr: 'مكتمل', labelEn: 'Completed' },
    { value: ProgramStatus.Rejected, labelAr: 'مرفوض', labelEn: 'Rejected' }
  ];

  translations = {
    ar: {
      titleCreate: 'إنشاء برنامج جديد',
      titleEdit: 'تعديل بيانات البرنامج',
      breadcrumb: 'البرامج / إنشاء برنامج',
      programName: 'اسم البرنامج',
      portfolioName: 'اسم المحفظة',
      programOwner: 'مالك البرنامج',
      programManager: 'مدير البرنامج',
      programSponsor: 'راعي البرنامج',
      description: 'الوصف',
      status: 'الحالة',
      budget: 'الميزانية',
      attachFile: 'إرفاق ملف',
      dragDrop: 'اسحب وأفلت الملفات هنا أو',
      upload: 'رفع',
      fileAttached: 'الملفات المرفقة',
      cancel: 'إلغاء',
      addNew: 'إضافة',
      saveChanges: 'حفظ التغييرات',
      saving: 'جاري الحفظ...',
      selectPlaceholder: 'اختر...',
      writeHere: 'اكتب هنا',
      validationError: 'يرجى إكمال الحقول المطلوبة بشكل صحيح!'
    },
    en: {
      titleCreate: 'Create Program',
      titleEdit: 'Edit Program Details',
      breadcrumb: 'Programs / Create Program',
      programName: 'Program Name',
      portfolioName: 'Portfolio Name',
      programOwner: 'Program Owner',
      programManager: 'Program Manager',
      programSponsor: 'Program Sponsor',
      description: 'Description',
      status: 'Status',
      budget: 'Budget',
      attachFile: 'Attach File',
      dragDrop: "Drag your file(s) to start uploading OR",
      upload: 'Upload',
      fileAttached: 'File Attached',
      cancel: 'Cancel',
      addNew: 'Add New',
      saveChanges: 'Save Changes',
      saving: 'Saving...',
      selectPlaceholder: 'Select...',
      writeHere: 'Write Here',
      validationError: 'Please complete all required fields correctly!'
    }
  };

  constructor(
    private programService: ProgramService,
    private portfolioService: PortfolioService,
    private userService: UserService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    if (typeof window !== 'undefined' && window.localStorage) {
      const savedLang = localStorage.getItem('preferred_lang') as LangCode;
      if (savedLang) this.currentLang = savedLang;
    }
  }

  get t() { return this.translations[this.currentLang]; }
  get isRtl(): boolean { return this.currentLang === 'ar'; }

  ngOnInit() {
    this.portfolioService.getAllPortfolios().subscribe(list => { this.portfolios = list; this.cdr.detectChanges(); });
    this.userService.getAllUsers().subscribe(list => { this.users = list; this.cdr.detectChanges(); });

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEditMode = true;
      this.editingId = Number(idParam);
      this.loadExistingProgram(this.editingId);
    }
  }

  private loadExistingProgram(id: number) {
    this.programService.getProgramDetails(id).subscribe({
      next: (program) => {
        this.name = program.name;
        this.description = program.description || '';
        this.budget = program.budget;
        this.status = program.status;
        this.portfolioId = program.portfolioId;
        this.attachedFiles = (program.attachedDocumentUrls || []).map(url => ({
          name: url.split('/').pop() || url,
          progress: 100,
          url
        }));

        const matchAllUsers = (list: AppUser[]) => {
          const matchUserByName = (dbName?: string) => {
            if (!dbName) return null;
            const normalizedDbName = dbName.trim().toLowerCase();
            return list.find(u => 
              (u.nameAr && u.nameAr.trim().toLowerCase() === normalizedDbName) ||
              (u.nameEn && u.nameEn.trim().toLowerCase() === normalizedDbName) ||
              (u.userName && u.userName.trim().toLowerCase() === normalizedDbName) ||
              (u.email && u.email.trim().toLowerCase() === normalizedDbName) ||
              u.id.toLowerCase() === normalizedDbName
            );
          };

          // Match Manager
          const managerMatch = matchUserByName(program.managerName);
          if (managerMatch) this.managerId = managerMatch.id;

          // Match Sponsor
          const sponsorMatch = matchUserByName(program.sponsorName);
          if (sponsorMatch) this.sponsorUserId = sponsorMatch.id;

          // Match Owner (Portfolio Owner)
          if (program.portfolioId) {
            this.portfolioService.getPortfolioDetails(program.portfolioId).subscribe({
              next: (portfolio) => {
                const ownerMatch = matchUserByName(portfolio.ownerName);
                if (ownerMatch) {
                  this.ownerUserId = ownerMatch.id;
                  this.cdr.detectChanges();
                }
              }
            });
          }
        };

        if (this.users.length) {
          matchAllUsers(this.users);
        } else {
          this.userService.getAllUsers().subscribe(list => {
            this.users = list;
            matchAllUsers(list);
            this.cdr.detectChanges();
          });
        }

        this.cdr.detectChanges();
      },
      error: () => { this.errorMessage = 'Failed to load program.'; this.cdr.detectChanges(); }
    });
  }

  onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || !input.files.length) return;

    const fileList = input.files;
    const initialLength = this.attachedFiles.length;
    for (let i = 0; i < fileList.length; i++) {
      this.attachedFiles.push({ name: fileList[i].name, progress: 0, raw: fileList[i] });
    }

    this.programService.uploadFiles(fileList).subscribe({
      next: (res: any) => {
        const urls: string[] = Array.isArray(res) 
          ? res.map(item => item.path) 
          : (res?.urls || res?.fileUrls || []);
        
        let pathIdx = 0;
        for (let i = initialLength; i < this.attachedFiles.length; i++) {
          if (pathIdx < urls.length) {
            this.attachedFiles[i].url = urls[pathIdx];
            this.attachedFiles[i].progress = 100;
            pathIdx++;
          }
        }
        this.cdr.detectChanges();
      },
      error: () => { this.errorMessage = 'File upload failed.'; this.cdr.detectChanges(); }
    });
  }

  removeFile(index: number) { this.attachedFiles.splice(index, 1); }

  fileKind(name: string): 'pdf' | 'doc' | 'other' {
    const ext = name.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return 'pdf';
    if (ext === 'doc' || ext === 'docx') return 'doc';
    return 'other';
  }

  save() {
    this.errorMessage = '';
    if (!this.name || this.budget <= 0 || (!this.isEditMode && !this.portfolioId) || !this.managerId) {
      this.errorMessage = this.t.validationError;
      this.programService.triggerErrorToast('Please fill all required fields correctly', 'يرجى ملء جميع الحقول المطلوبة بشكل صحيح');
      return;
    }

    this.isSaving = true;
    const sponsorUser = this.users.find(u => u.id === this.sponsorUserId);
    const attachedUrls = this.attachedFiles.filter(f => f.url).map(f => f.url!) as string[];

    if (this.isEditMode && this.editingId !== null) {
      this.programService.updateProgram(this.editingId, {
        name: this.name,
        description: this.description,
        budget: this.budget,
        status: this.status,
        sponsorName: sponsorUser ? this.userService.displayName(sponsorUser, this.currentLang) : undefined,
        managerId: this.managerId,
        attachedUrls
      }).subscribe({ next: () => this.onSaveSuccess(), error: () => this.onSaveError() });
    } else {
      this.programService.createProgram({
        name: this.name,
        description: this.description,
        budget: this.budget,
        status: this.status,
        portfolioId: this.portfolioId!,
        sponsorName: sponsorUser ? this.userService.displayName(sponsorUser, this.currentLang) : undefined,
        managerId: this.managerId,
        attachedUrls
      }).subscribe({ next: () => this.onSaveSuccess(), error: () => this.onSaveError() });
    }
  }

  private onSaveSuccess() {
    this.isSaving = false;
    if (this.isEditMode) {
      this.programService.triggerSuccessToast('Program updated successfully', 'تم تعديل البرنامج بنجاح');
    } else {
      this.programService.triggerSuccessToast('Program created successfully', 'تم إنشاء البرنامج بنجاح');
    }
    this.router.navigate(['/programs']);
  }

  private onSaveError() {
    this.isSaving = false;
    this.programService.triggerErrorToast('Failed to save program changes', 'فشل في حفظ تعديلات البرنامج');
    this.cdr.detectChanges();
  }

  cancel() {
    const hasChanges = this.name || this.description || this.budget > 0 || this.attachedFiles.length > 0;
    if (hasChanges) {
      const confirmMsg = this.isRtl 
        ? 'هل أنت متأكد من إلغاء العملية؟ سيتم فقدان جميع التعديلات غير المحفوظة.' 
        : 'Are you sure you want to cancel? Any unsaved changes will be lost.';
      if (!confirm(confirmMsg)) {
        return;
      }
    }
    this.router.navigate(['/programs']);
  }

  userLabel(u: AppUser): string {
    return this.isRtl ? (u.nameAr || u.userName || u.email || u.id) : (u.nameEn || u.userName || u.email || u.id);
  }
}