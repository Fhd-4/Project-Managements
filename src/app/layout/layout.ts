import { Component, ChangeDetectorRef, Inject, NgZone, OnInit } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { Router, RouterLink, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { PortfolioService } from '../portfolios/portfolio.service';

type LangCode = 'ar' | 'en';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink],
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
    public portfolioService: PortfolioService
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
      const storedPhone = localStorage.getItem('auth_phone');
      if (storedPhone) {
        this.userEmail = storedPhone; // Or default email representation
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

  goBackToPortfoliosList() {
    this.portfolioService.isCreatePageActive = false;
    this.router.navigate(['/portfolios']);
    this.cdr.detectChanges();
  }
}
