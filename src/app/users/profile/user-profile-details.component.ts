import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ProjectService, UserProfileDto, UserPortfolioDto, UserProgramDto, UserProjectDto } from '../../projects/project.service';

type LangCode = 'ar' | 'en';
type ProfileTab = 'personal' | 'portfolios' | 'programs' | 'projects';

@Component({
  selector: 'app-user-profile-details',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './user-profile-details.component.html',
  styleUrl: './user-profile-details.component.scss'
})
export class UserProfileDetailsComponent implements OnInit {
  currentLang: LangCode = 'ar';
  isLoading: boolean = false;
  userId: string | null = null;
  activeTab: ProfileTab = 'personal';

  // Profile details payload
  profile: UserProfileDto | null = null;

  // Personal Information editable fields
  username: string = '';
  email: string = '';
  phoneNumber: string = '';
  role: string = 'Member';
  nameAr: string = '';
  nameEn: string = '';
  titleAr: string = '';
  titleEn: string = '';
  isActive: boolean = true;
  password: string = '';

  // Select options list
  portfoliosList: any[] = [];
  programsList: any[] = [];
  projectsList: any[] = [];

  assignedPortfolioId: number | null = null;
  assignedProgramId: number | null = null;
  assignedProjectId: number | null = null;

  showSuccessToast: boolean = false;
  showErrorToast: boolean = false;

  rolesList = [
    { value: 'PMO', label: 'PMO' },
    { value: 'Owner', label: 'Owner' },
    { value: 'Portfolio Owner', label: 'Portfolio Owner' },
    { value: 'Portfolio Sponsor', label: 'Portfolio Sponsor' },
    { value: 'Portfolio Manager', label: 'Portfolio Manager' },
    { value: 'Project Manager', label: 'Project Manager' },
    { value: 'Member', label: 'Member' }
  ];

  translations = {
    ar: {
      profileTitle: 'ملف المستخدم الشخصي',
      breadcrumbsUsers: 'المستخدمين',
      breadcrumbsProfile: 'الملف الشخصي',
      lblRole: 'الدور الوظيفي',
      lblAddTime: 'تاريخ الإضافة',
      lblState: 'الحالة',
      lblEmail: 'البريد الإلكتروني',
      lblPhone: 'رقم الجوال',
      tabPersonal: 'البيانات الشخصية',
      tabPortfolios: 'المحافظ',
      tabPrograms: 'البرامج',
      tabProjects: 'المشاريع',
      lblUsername: 'اسم المستخدم',
      lblPortfolio: 'المحفظة المنسوبة',
      lblProgram: 'البرنامج المنسوب',
      lblProject: 'المشروع المنسوب',
      lblPassword: 'كلمة المرور',
      lblActive: 'نشط',
      lblUnactive: 'غير نشط',
      btnCancel: 'إلغاء',
      btnSave: 'حفظ التعديلات',
      colPortfolioName: 'اسم المحفظة',
      colProgramName: 'اسم البرنامج',
      colProjectName: 'اسم المشروع',
      colCategory: 'التصنيف',
      colPrograms: 'البرامج',
      colProjects: 'المشاريع',
      colTasks: 'المهام',
      colProgress: 'التقدم',
      colStatus: 'الحالة',
      colActions: 'الإجراءات',
      confirmRemoveRelation: 'هل أنت متأكد من رغبتك في إزالة ارتباط المستخدم بهذا العنصر؟'
    },
    en: {
      profileTitle: 'User Profile',
      breadcrumbsUsers: 'Users',
      breadcrumbsProfile: 'User Profile',
      lblRole: 'Role',
      lblAddTime: 'Add Time',
      lblState: 'State',
      lblEmail: 'Email',
      lblPhone: 'Phone Number',
      tabPersonal: 'Personal Informations',
      tabPortfolios: 'Portfolios',
      tabPrograms: 'Programs',
      tabProjects: 'Projects',
      lblUsername: 'User Name',
      lblPortfolio: 'Assigned Portfolio',
      lblProgram: 'Assigned Program',
      lblProject: 'Assigned Project',
      lblPassword: 'Password',
      lblActive: 'Active',
      lblUnactive: 'Unactive',
      btnCancel: 'Cancel',
      btnSave: 'Save Edits',
      colPortfolioName: 'Portfolio Name',
      colProgramName: 'Program Name',
      colProjectName: 'Project Name',
      colCategory: 'Category',
      colPrograms: 'Programs',
      colProjects: 'Projects',
      colTasks: 'Tasks',
      colProgress: 'Progress',
      colStatus: 'Status',
      colActions: 'Actions',
      confirmRemoveRelation: 'Are you sure you want to remove the user association from this item?'
    }
  };

  constructor(
    private projectService: ProjectService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {
    if (typeof window !== 'undefined' && window.localStorage) {
      const savedLang = localStorage.getItem('preferred_lang') as LangCode;
      if (savedLang) {
        this.currentLang = savedLang;
      }
    }
  }

  ngOnInit() {
    this.loadDropdowns();
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.userId = params['id'];
        this.loadProfile(this.userId!);
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

  get t() {
    return this.translations[this.currentLang];
  }

  get isRtl(): boolean {
    return this.currentLang === 'ar';
  }

  loadDropdowns() {
    this.projectService.getPortfolios().subscribe(res => { this.portfoliosList = res; this.cdr.detectChanges(); });
    this.projectService.getPrograms().subscribe(res => { this.programsList = res; this.cdr.detectChanges(); });
    this.projectService.getProjects().subscribe(res => { this.projectsList = res; this.cdr.detectChanges(); });
  }

  loadProfile(id: string) {
    this.isLoading = true;
    this.projectService.getUserProfile(id).subscribe({
      next: (data) => {
        this.profile = data;
        
        // Populate personal form fields
        this.username = data.userName;
        this.email = data.email;
        this.phoneNumber = data.phoneNumber;
        this.role = data.role || 'Member';
        this.nameAr = data.nameAr || '';
        this.nameEn = data.nameEn || '';
        this.titleAr = data.titleAr || '';
        this.titleEn = data.titleEn || '';
        this.isActive = data.isActive !== false;

        if (data.portfolios && data.portfolios.length > 0) {
          this.assignedPortfolioId = data.portfolios[0].id;
        } else {
          this.assignedPortfolioId = null;
        }
        if (data.programs && data.programs.length > 0) {
          this.assignedProgramId = data.programs[0].id;
        } else {
          this.assignedProgramId = null;
        }
        if (data.projects && data.projects.length > 0) {
          this.assignedProjectId = data.projects[0].id;
        } else {
          this.assignedProjectId = null;
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

  goToChangePassword() {
    this.router.navigate(['/auth/change-password'], { queryParams: { phone: this.phoneNumber } });
  }

  switchTab(tab: ProfileTab) {
    this.activeTab = tab;
    this.cdr.detectChanges();
  }

  savePersonalEdits() {
    if (!this.userId) return;

    const payload = {
      username: this.username,
      email: this.email,
      phoneNumber: this.phoneNumber,
      role: this.role,
      nameAr: this.nameAr || this.username,
      nameEn: this.nameEn || this.username,
      titleAr: this.titleAr || this.role,
      titleEn: this.titleEn || this.role,
      isActive: this.isActive,
      password: this.password || null,
      portfolioId: this.assignedPortfolioId || null,
      programId: this.assignedProgramId || null,
      projectId: this.assignedProjectId || null
    };

    this.isLoading = true;
    this.projectService.updateUser(this.userId, payload).subscribe({
      next: () => {
        this.projectService.triggerSuccessToast();
        this.loadProfile(this.userId!);
      },
      error: () => {
        this.projectService.triggerErrorToast();
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  cancelEdits() {
    if (this.userId) {
      this.loadProfile(this.userId);
    }
  }

  removeRelation(type: 'portfolio' | 'program' | 'project', id: number) {
    if (confirm(this.t.confirmRemoveRelation)) {
      this.isLoading = true;
      // In a real application we would clear OwnerId/ManagerId on the entity.
      // We will perform a PUT payload to unlink it.
      const payload = {
        username: this.username,
        email: this.email,
        phoneNumber: this.phoneNumber,
        role: this.role,
        nameAr: this.nameAr,
        nameEn: this.nameEn,
        titleAr: this.titleAr,
        titleEn: this.titleEn,
        isActive: this.isActive,
        portfolioId: type === 'portfolio' ? null : this.assignedPortfolioId,
        programId: type === 'program' ? null : this.assignedProgramId,
        projectId: type === 'project' ? null : this.assignedProjectId
      };

      this.projectService.updateUser(this.userId!, payload).subscribe({
        next: () => {
          this.projectService.triggerSuccessToast();
          this.loadProfile(this.userId!);
        },
        error: () => {
          this.projectService.triggerErrorToast();
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
    }
  }

  viewDetail(type: 'portfolio' | 'program' | 'project', id: number) {
    if (type === 'portfolio') {
      this.router.navigate(['/portfolios/details', id]);
    } else if (type === 'program') {
      this.router.navigate(['/programs/details', id]);
    } else if (type === 'project') {
      this.router.navigate(['/projects/details', id]);
    }
  }

  getUserInitials(name?: string): string {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  goBack() {
    this.router.navigate(['/users']);
  }
}
