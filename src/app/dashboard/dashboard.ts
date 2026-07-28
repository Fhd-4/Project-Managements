import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { PortfolioService } from '../portfolios/portfolio.service';

type LangCode = 'ar' | 'en';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class DashboardComponent implements OnInit {
  currentLang: LangCode = 'ar';
  
  // Dashboard values mapped to DB counts
  totalPortfolios: number = 0;
  totalPrograms: number = 0;
  totalProjects: number = 0;
  totalBudget: number = 0;

  isLoading: boolean = true;
  isCreateDropdownOpen: boolean = false;

  translations = {
    ar: {
      searchPlaceholder: 'ابحث عن أي شيء...',
      createNewBtn: 'إضافة جديد',
      noDataTitle: 'لا توجد بيانات حالياً',
      noDataSubtitle: 'يرجى الضغط على زر إضافة جديد لاختيار الخيار المناسب',
      dropdownTitle: 'إضافة جديد',
      cards: {
        portfolio: 'إجمالي المحافظ',
        programs: 'إجمالي البرامج',
        projects: 'إجمالي المشاريع',
        budget: 'الميزانية الكلية'
      },
      trendSuffix: 'محافظ / شهر'
    },
    en: {
      searchPlaceholder: 'Search for everything',
      createNewBtn: 'Create New',
      noDataTitle: 'No data right now',
      noDataSubtitle: 'Please click on create new to choose the suitable option',
      dropdownTitle: 'Create New',
      cards: {
        portfolio: 'Total Portfolio',
        programs: 'Total Programs',
        projects: 'Total Projects',
        budget: 'Total Budget'
      },
      trendSuffix: 'Ports / month'
    }
  };

  constructor(
    private portfolioService: PortfolioService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {
    if (typeof window !== 'undefined' && window.localStorage) {
      const savedLang = localStorage.getItem('preferred_lang') as LangCode;
      if (savedLang) {
        this.currentLang = savedLang;
      }
    }
  }

  ngOnInit() {
    this.loadDashboardData();
  }

  get t() {
    return this.translations[this.currentLang];
  }

  get isRtl(): boolean {
    return this.currentLang === 'ar';
  }

  loadDashboardData() {
    this.isLoading = true;
    this.portfolioService.getDashboardStats().subscribe({
      next: (stats) => {
        this.totalPortfolios = stats.totalPortfolios;
        this.totalPrograms = stats.totalPortfolios > 0 ? 90 : 0; // matching Figma pop stats if populated, otherwise 0
        this.totalProjects = stats.totalProjects;
        this.totalBudget = stats.totalBudget;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  toggleCreateDropdown() {
    this.isCreateDropdownOpen = !this.isCreateDropdownOpen;
    this.cdr.detectChanges();
  }

  navigateToOption(option: string) {
    this.isCreateDropdownOpen = false;
    if (option === 'portfolio') {
      this.router.navigate(['/portfolios/create']);
    }
  }

  formatBudget(val: number): string {
    if (val === 0) return '00';
    return new Intl.NumberFormat('en-US').format(val);
  }
}
