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
  kind: 'pdf' | 'doc' | 'other';
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

  // Form fields
  name = '';
  description = '';
  budget: number = 0;
  status: number = ProgramStatus.Pending;
  portfolioId: number | null = null;

  // Program Owner: rendered as a real dropdown to match Figma, but the API
  // has no ownerId field yet (see delivery notes) — this stays a UI-only
  // selection and is never sent in the create/update payload.
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
      ownerComingSoon: '(قريباً - غير مفعل بعد)', 
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
      ownerComingSoon: '(Coming soon - not yet wired to API)',
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
          url,
          kind: this.kindFromUrl(url)
        }));

        // GET /api/Programs/{id} only returns managerName, not managerId —
        // best-effort match against the users list by display name.
        const matchManager = (list: AppUser[]) => {
          const match = list.find(u => this.userService.displayName(u, this.currentLang) === program.managerName);
          if (match) this.managerId = match.id;
        };
        if (this.users.length) matchManager(this.users);
        else this.userService.getAllUsers().subscribe(list => { matchManager(list); this.cdr.detectChanges(); });

        this.cdr.detectChanges();
      },
      error: () => { this.errorMessage = 'Failed to load program.'; this.cdr.detectChanges(); }
    });
  }

  private kindFromUrl(url: string): 'pdf' | 'doc' | 'other' {
    const ext = url.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return 'pdf';
    if (ext === 'doc' || ext === 'docx') return 'doc';
    return 'other';
  }

  onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || !input.files.length) return;

    const fileList = input.files;
    for (let i = 0; i < fileList.length; i++) {
      const f = fileList[i];
      const ext = f.name.split('.').pop()?.toLowerCase();
      this.attachedFiles.push({
        name: f.name,
        progress: 0,
        raw: f,
        kind: ext === 'pdf' ? 'pdf' : (ext === 'doc' || ext === 'docx') ? 'doc' : 'other'
      });
    }

    this.programService.uploadFiles(fileList).subscribe({
      next: (res) => {
        // Adjust once you confirm Portfolios/upload's actual response shape.
        const urls: string[] = res?.urls || res?.fileUrls || [];
        this.attachedFiles.forEach((f, idx) => {
          if (!f.url && urls[idx]) { f.url = urls[idx]; f.progress = 100; }
        });
        this.cdr.detectChanges();
      },
      error: () => { this.errorMessage = 'File upload failed.'; this.cdr.detectChanges(); }
    });
  }

  removeFile(index: number) { this.attachedFiles.splice(index, 1); }

  save() {
    this.errorMessage = '';

    if (!this.name || this.budget <= 0 || (!this.isEditMode && !this.portfolioId) || !this.managerId) {
      this.errorMessage = this.t.validationError;
      this.programService.triggerErrorToast();
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
    this.programService.triggerSuccessToast();
    this.router.navigate(['/programs']);
  }

  private onSaveError() {
    this.isSaving = false;
    this.programService.triggerErrorToast();
    this.cdr.detectChanges();
  }

  cancel() { this.router.navigate(['/programs']); }

  userLabel(u: AppUser): string {
    return this.isRtl ? (u.nameAr || u.userName || u.email || u.id) : (u.nameEn || u.userName || u.email || u.id);
  }
}