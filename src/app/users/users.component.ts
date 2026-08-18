import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ProjectService, AppUser } from '../projects/project.service';

type LangCode = 'ar' | 'en';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss'
})
export class UsersComponent implements OnInit {
  currentLang: LangCode = 'ar'; // Default to Arabic as per standard dashboard views
  isLoading: boolean = false;

  users: AppUser[] = [];
  filteredUsers: AppUser[] = [];

  // Metrics
  totalUsersCount: number = 0;
  activeUsersCount: number = 0;
  unactiveUsersCount: number = 0;

  searchQuery: string = '';
  selectedStatus: string = '';

  showSuccessToast: boolean = false;
  showErrorToast: boolean = false;
  errorMessage: string = '';

  translations = {
    ar: {
      title: 'المستخدمين',
      totalUsers: 'إجمالي المستخدمين',
      activeUsers: 'المستخدمين النشطين',
      unactiveUsers: 'المستخدمين غير النشطين',
      searchPlaceholder: 'البحث عن كل شيء',
      statusAll: 'كل الحالات',
      statusActive: 'نشط',
      statusUnactive: 'غير نشط',
      addUserBtn: '+ إضافة مستخدم',
      colUsername: 'اسم المستخدم',
      colRole: 'الدور',
      colEmail: 'البريد الإلكتروني',
      colPhone: 'رقم الجوال',
      colAddTime: 'تاريخ الإضافة',
      colState: 'الحالة',
      colActions: 'الإجراءات',
      emptyTitle: 'لا توجد بيانات حالياً',
      emptySubtitle: 'يرجى الضغط على إضافة مستخدم لتسجيل مستخدم جديد',
      confirmDelete: 'هل أنت متأكد من رغبتك في حذف هذا المستخدم؟'
    },
    en: {
      title: 'Users',
      totalUsers: 'Total Users',
      activeUsers: 'Active Users',
      unactiveUsers: 'Unactive Users',
      searchPlaceholder: 'Search for everything',
      statusAll: 'All Statuses',
      statusActive: 'Active',
      statusUnactive: 'Unactive',
      addUserBtn: '+ Add User',
      colUsername: 'Username',
      colRole: 'Role',
      colEmail: 'Email',
      colPhone: 'Phone Number',
      colAddTime: 'Add time',
      colState: 'State',
      colActions: 'Actions',
      emptyTitle: 'No data right now',
      emptySubtitle: 'Please click on Add User to choose the suitable option',
      confirmDelete: 'Are you sure you want to delete this user?'
    }
  };

  constructor(
    private projectService: ProjectService,
    private router: Router,
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
    this.loadUsers();
    
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

  loadUsers() {
    this.isLoading = true;
    this.projectService.getUsers().subscribe({
      next: (data) => {
        this.users = data;
        this.calculateMetrics();
        this.applyFilters();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load users', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  calculateMetrics() {
    this.totalUsersCount = this.users.length;
    this.activeUsersCount = this.users.filter(u => u.isActive).length;
    this.unactiveUsersCount = this.users.filter(u => !u.isActive).length;
  }

  applyFilters() {
    let list = [...this.users];

    // Search query filter
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      list = list.filter(u =>
        u.userName?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.phoneNumber?.includes(q) ||
        (u.nameAr && u.nameAr.toLowerCase().includes(q)) ||
        (u.nameEn && u.nameEn.toLowerCase().includes(q)) ||
        (u.role && u.role.toLowerCase().includes(q))
      );
    }

    // Status filter
    if (this.selectedStatus) {
      const wantActive = this.selectedStatus === 'active';
      list = list.filter(u => u.isActive === wantActive);
    }

    this.filteredUsers = list;
    this.cdr.detectChanges();
  }

  deleteUser(userId: string, event: MouseEvent) {
    event.stopPropagation();
    if (confirm(this.t.confirmDelete)) {
      this.isLoading = true;
      this.errorMessage = '';
      this.projectService.deleteUser(userId).subscribe({
        next: () => {
          this.projectService.triggerSuccessToast();
          this.loadUsers();
        },
        error: (err) => {
          console.error('Delete failed', err);
          this.isLoading = false;
          
          if (err && err.error) {
            if (typeof err.error === 'string') {
              this.errorMessage = err.error;
            } else if (err.error.message) {
              this.errorMessage = err.error.message;
            } else if (typeof err.error === 'object') {
              const errors = err.error;
              if (Array.isArray(errors)) {
                this.errorMessage = errors.map(e => e.description || e.message || JSON.stringify(e)).join(', ');
              } else {
                this.errorMessage = JSON.stringify(errors);
              }
            }
          } else {
            this.errorMessage = '';
          }
          
          this.projectService.triggerErrorToast();
          this.cdr.detectChanges();
        }
      });
    }
  }


  viewProfile(userId: string) {
    this.router.navigate(['/users/profile', userId]);
  }

  navigateToAddUser() {
    this.router.navigate(['/users/create']);
  }

  getUserInitials(name?: string): string {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }
}
