import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ProjectService } from '../../projects/project.service';

type LangCode = 'ar' | 'en';

@Component({
  selector: 'app-create-user',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './create-user.component.html',
  styleUrl: './create-user.component.scss'
})
export class CreateUserComponent implements OnInit {
  currentLang: LangCode = 'ar';
  isLoading: boolean = false;
  isEditMode: boolean = false;
  userId: string | null = null;

  // Form Fields
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

  // Select dropdowns options
  portfolios: any[] = [];
  programs: any[] = [];
  projects: any[] = [];

  assignedPortfolioId: number | null = null;
  assignedProgramId: number | null = null;
  assignedProjectId: number | null = null;

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
      addUserTitle: 'إضافة مستخدم جديد',
      editUserTitle: 'تعديل بيانات المستخدم',
      breadcrumbsUsers: 'المستخدمين',
      breadcrumbsAdd: 'إضافة مستخدم',
      breadcrumbsEdit: 'تعديل مستخدم',
      lblUsername: 'اسم المستخدم (English)',
      lblEmail: 'البريد الإلكتروني',
      lblPhone: 'رقم الجوال',
      lblRole: 'الدور الوظيفي',
      lblPortfolio: 'المحفظة المنسوبة',
      lblProgram: 'البرنامج المنسوب',
      lblProject: 'المشروع المنسوب',
      lblState: 'حالة المستخدم',
      lblPassword: 'كلمة المرور',
      lblActive: 'نشط',
      lblUnactive: 'غير نشط',
      writeHere: 'اكتب هنا',
      btnCancel: 'إلغاء',
      btnAdd: '+ إضافة جديد',
      btnSave: 'حفظ التعديلات',
      phoneError: 'رقم الجوال غير صحيح! يجب أن يكون رقم جوال سعودي يبدأ بـ 5 أو 05 أو +966 ويتكون من أرقام فقط.'
    },
    en: {
      addUserTitle: 'Add User',
      editUserTitle: 'Edit User Profile',
      breadcrumbsUsers: 'Users',
      breadcrumbsAdd: 'Add User',
      breadcrumbsEdit: 'Edit User',
      lblUsername: 'User Name',
      lblEmail: 'Email',
      lblPhone: 'Phone Number',
      lblRole: 'Role',
      lblPortfolio: 'Assigned Portfolio',
      lblProgram: 'Assigned Program',
      lblProject: 'Assigned Project',
      lblState: 'User State',
      lblPassword: 'Password',
      lblActive: 'Active',
      lblUnactive: 'Unactive',
      writeHere: 'Write Here',
      btnCancel: 'Cancel',
      btnAdd: '+ Add New',
      btnSave: 'Save Edits',
      phoneError: 'Invalid phone number! Must be a Saudi mobile starting with 5, 05 or +966.'
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
        this.isEditMode = true;
        this.userId = params['id'];
        this.loadUserDetails(this.userId!);
      }
    });
  }

  get t() {
    return this.translations[this.currentLang];
  }

  get isRtl(): boolean {
    return this.currentLang === 'ar';
  }

  loadDropdowns() {
    this.projectService.getPortfolios().subscribe(res => { this.portfolios = res; this.cdr.detectChanges(); });
    this.projectService.getPrograms().subscribe(res => { this.programs = res; this.cdr.detectChanges(); });
    this.projectService.getProjects().subscribe(res => { this.projects = res; this.cdr.detectChanges(); });
  }

  loadUserDetails(id: string) {
    this.isLoading = true;
    this.projectService.getUserProfile(id).subscribe({
      next: (profile) => {
        this.username = profile.userName;
        this.email = profile.email;
        this.phoneNumber = profile.phoneNumber;
        this.role = profile.role || 'Member';
        this.nameAr = profile.nameAr || '';
        this.nameEn = profile.nameEn || '';
        this.titleAr = profile.titleAr || '';
        this.titleEn = profile.titleEn || '';
        this.isActive = profile.isActive !== false;
        
        // Find if associated with any portfolio/program/project owned/managed
        if (profile.portfolios && profile.portfolios.length > 0) {
          this.assignedPortfolioId = profile.portfolios[0].id;
        }
        if (profile.programs && profile.programs.length > 0) {
          this.assignedProgramId = profile.programs[0].id;
        }
        if (profile.projects && profile.projects.length > 0) {
          this.assignedProjectId = profile.projects[0].id;
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

  saveUser() {
    if (!this.username.trim() || !this.email.trim() || !this.phoneNumber.trim()) {
      return;
    }

    // Saudi Phone format validate
    const cleanPhone = this.phoneNumber.replace(/\s+/g, '');
    if (!/^(?:\+966|966|0)?5\d{8}$/.test(cleanPhone)) {
      alert(this.t.phoneError);
      return;
    }

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
      password: this.password,
      portfolioId: this.assignedPortfolioId || null,
      programId: this.assignedProgramId || null,
      projectId: this.assignedProjectId || null
    };

    this.isLoading = true;
    if (this.isEditMode && this.userId) {
      this.projectService.updateUser(this.userId, payload).subscribe({
        next: () => {
          this.projectService.triggerSuccessToast();
          this.router.navigate(['/users']);
        },
        error: () => {
          this.projectService.triggerErrorToast();
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
    } else {
      if (!this.password) {
        alert(this.isRtl ? 'حقل كلمة المرور مطلوب للمستخدم الجديد' : 'Password is required for new users');
        this.isLoading = false;
        return;
      }
      this.projectService.createUser(payload).subscribe({
        next: () => {
          this.projectService.triggerSuccessToast();
          this.router.navigate(['/users']);
        },
        error: () => {
          this.projectService.triggerErrorToast();
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
    }
  }

  cancel() {
    this.router.navigate(['/users']);
  }
}
