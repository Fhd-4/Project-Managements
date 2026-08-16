import { Component, ChangeDetectorRef, Inject, NgZone, OnInit } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { Router, RouterLink, RouterOutlet, NavigationEnd } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { filter } from 'rxjs/operators';
import { PortfolioService } from '../portfolios/portfolio.service';
import { AuthService } from '../auth/auth.service';
import { ProjectService } from '../projects/project.service';
import { ChatWidgetComponent } from '../components/chat-widget/chat-widget';

type LangCode = 'ar' | 'en';


@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, FormsModule, ChatWidgetComponent],
  templateUrl: './layout.html',
  styleUrl: './layout.scss'
})
export class LayoutComponent implements OnInit {
  currentLang: LangCode = 'ar';
  userName: string = 'PMO Name';
  userEmail: string = 'PMO Email';
  currentRoute: string = '';
  isCollapsed: boolean = false;
  isUserDropdownOpen: boolean = false;

  translations = {
    ar: {
      langLabel: 'English',
      logout: 'تسجيل الخروج',
      menu: {
        dashboard: 'الرئيسية',
        portfolios: 'المحافظ',
        programs: 'البرامج',
        projects: 'المشاريع',
        tasks: 'المهام',
        changeRequests: 'طلبات التعديل',
        plans: 'الخطط',
        users: 'المستخدمين',
        setting: 'الإعدادات'
      }
    },
    en: {
      langLabel: 'العربية',
      logout: 'Logout',
      menu: {
        dashboard: 'Dashboard',
        portfolios: 'Portfolios',
        programs: 'Programs',
        projects: 'Projects',
        tasks: 'Tasks',
        changeRequests: 'Change Requests',
        plans: 'Plans',
        users: 'Users',
        setting: 'Setting'
      }
    }
  };

  constructor(
    private cdr: ChangeDetectorRef,
    private router: Router,
    private ngZone: NgZone,
    @Inject(DOCUMENT) private document: Document,
    public portfolioService: PortfolioService,
    private authService: AuthService,
    private projectService: ProjectService
  ) {
    if (typeof window !== 'undefined' && window.localStorage) {
      const savedLang = localStorage.getItem('preferred_lang') as LangCode;
      if (savedLang) {
        this.currentLang = savedLang;
      }
      
      const storedUser = localStorage.getItem('auth_userName');
      if (storedUser) {
        this.userName = storedUser;
      }
      const storedEmail = localStorage.getItem('auth_email');
      if (storedEmail && storedEmail.includes('@')) {
        this.userEmail = storedEmail;
      } else {
        const storedPhone = localStorage.getItem('auth_phone');
        if (storedPhone) {
          this.userEmail = storedPhone;
        }
      }
    }
    this.applyDirection();
  }

  ngOnInit() {
    this.currentRoute = this.router.url;
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.currentRoute = event.urlAfterRedirects;
      this.cdr.detectChanges();
    });

    const userId = typeof window !== 'undefined' && window.localStorage ? localStorage.getItem('auth_userId') : null;
    if (userId) {
      this.projectService.getUserProfile(userId).subscribe({
        next: (profile) => {
          if (profile && profile.email) {
            this.userEmail = profile.email;
            if (typeof window !== 'undefined' && window.localStorage) {
              localStorage.setItem('auth_email', profile.email);
            }
            this.cdr.detectChanges();
          }
        }
      });
    }
  }

  get t() {
    return this.translations[this.currentLang];
  }

  get isRtl(): boolean {
    return this.currentLang === 'ar';
  }

  changeLang() {
    this.currentLang = this.currentLang === 'ar' ? 'en' : 'ar';
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('preferred_lang', this.currentLang);
    }
    this.applyDirection();
    this.cdr.detectChanges();
  }

  private applyDirection() {
    const html = this.document.documentElement;
    html.setAttribute('dir', this.isRtl ? 'rtl' : 'ltr');
    html.setAttribute('lang', this.currentLang);
  }

  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed;
    this.cdr.detectChanges();
  }

  toggleUserDropdown() {
    this.isUserDropdownOpen = !this.isUserDropdownOpen;
    this.cdr.detectChanges();
  }

  logout() {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.clear();
    }
    this.ngZone.run(() => {
      this.router.navigate(['/auth/login']);
    });
  }

  isActive(route: string): boolean {
    return this.currentRoute.includes(route);
  }

  goBackList() {
    this.portfolioService.isCreatePageActive = false;
    if (this.currentRoute.includes('/change-requests')) {
      this.router.navigate(['/change-requests']);
    } else if (this.currentRoute.includes('/projects')) {
      this.router.navigate(['/projects']);
    } else if (this.currentRoute.includes('/tasks')) {
      this.router.navigate(['/tasks']);
    } else if (this.currentRoute.includes('/programs')) {
      this.router.navigate(['/programs']);
    } else {
      this.router.navigate(['/portfolios']);
    }
    this.cdr.detectChanges();
  }

  isChangePasswordModalOpen: boolean = false;
  currentPass: string = '';
  newPass: string = '';
  confirmPass: string = '';
  isCurrentPassHidden: boolean = true;
  isNewPassHidden: boolean = true;
  isConfirmPassHidden: boolean = true;
  isModalLoading: boolean = false;
  modalError: string = '';
  modalSuccess: string = '';

  openChangePasswordModal() {
    this.isChangePasswordModalOpen = true;
    this.isUserDropdownOpen = false;
    this.currentPass = '';
    this.newPass = '';
    this.confirmPass = '';
    this.modalError = '';
    this.modalSuccess = '';
    this.cdr.detectChanges();
  }

  closeChangePasswordModal() {
    this.isChangePasswordModalOpen = false;
    this.cdr.detectChanges();
  }

  submitChangePassword() {
    this.modalError = '';
    this.modalSuccess = '';

    if (!this.currentPass || !this.newPass || !this.confirmPass) {
      this.modalError = this.isRtl 
        ? 'يرجى ملء جميع الحقول المطلوبة!' 
        : 'Please fill in all required fields!';
      return;
    }

    if (this.newPass !== this.confirmPass) {
      this.modalError = this.isRtl 
        ? 'كلمة المرور الجديدة وتأكيد كلمة المرور غير متطابقين!' 
        : 'New password and confirmation do not match!';
      return;
    }

    if (this.newPass.length < 6) {
      this.modalError = this.isRtl 
        ? 'كلمة المرور الجديدة يجب ألا تقل عن 6 خانات!' 
        : 'New password must be at least 6 characters long!';
      return;
    }

    this.isModalLoading = true;
    this.cdr.detectChanges();

    this.authService.changePassword(this.userEmail, this.currentPass, this.newPass).subscribe({
      next: (res) => {
        this.isModalLoading = false;
        this.modalSuccess = this.isRtl 
          ? 'تم تغيير كلمة المرور بنجاح!' 
          : 'Password changed successfully!';
        this.cdr.detectChanges();

        setTimeout(() => {
          this.closeChangePasswordModal();
        }, 2000);
      },
      error: (err) => {
        this.isModalLoading = false;
        if (err.error && typeof err.error === 'string') {
          this.modalError = err.error;
        } else if (err.error && Array.isArray(err.error)) {
          this.modalError = err.error[0].description || (this.isRtl ? 'حدث خطأ ما، يرجى المحاولة مرة أخرى' : 'An error occurred, please try again');
        } else if (err.error && err.error.message) {
          this.modalError = err.error.message;
        } else {
          this.modalError = this.isRtl 
            ? 'حدث خطأ أثناء تغيير كلمة المرور، يرجى المحاولة مرة أخرى' 
            : 'An error occurred while changing password, please try again';
        }
        this.cdr.detectChanges();
      }
    });
  }
}
