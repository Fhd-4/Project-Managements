import { Component, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { PortfolioService, Portfolio } from '../portfolio.service';
import { API_CONFIG } from '../../api.config';

type LangCode = 'ar' | 'en';

@Component({
  selector: 'app-portfolio-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './portfolio-details.html',
  styleUrl: './portfolio-details.scss'
})
export class PortfolioDetailsComponent implements OnInit, OnDestroy {
  currentLang: LangCode = 'ar';
  isLoading: boolean = true;
  portfolio: Portfolio | null = null;
  id: number | null = null;
  attachedFiles: Array<any> = [];

  // 🟢 Interactive Toggle State & Rich Profile Lists
  selectedSection: 'programs' | 'projects' | null = null;

  portfolioPrograms = [
    { id: 1, name: 'Smart Systems Program', budget: 10000000, status: 'In Progress', manager: 'Mahmoud Salah', avatarBg: '#eff6ff', avatarColor: '#2563eb' },
    { id: 2, name: 'Digital Transformation Core', budget: 5000000, status: 'Completed', manager: 'Omar Al-Harbi', avatarBg: '#f0fdf4', avatarColor: '#16a34a' }
  ];

  portfolioProjects = [
    { id: 1, name: 'Cloud Infrastructure Migration', manager: 'Mahmoud Salah', status: 'Active', progress: 75, avatarBg: '#eff6ff', avatarColor: '#2563eb' },
    { id: 2, name: 'AI Portal Automated Analytics', manager: 'Faisal Al-Otaibi', status: 'Pending', progress: 30, avatarBg: '#fffbeb', avatarColor: '#d97706' },
    { id: 3, name: 'Cybersecurity Hardening Phase II', manager: 'Omar Al-Harbi', status: 'Completed', progress: 100, avatarBg: '#f0fdf4', avatarColor: '#16a34a' }
  ];

  translations = {
    ar: {
      langLabel: 'English',
      description: 'الوصف'
    },
    en: {
      langLabel: 'العربية',
      description: 'Description'
    }
  };

  constructor(
    public portfolioService: PortfolioService,
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
    this.portfolioService.isCreatePageActive = true;
  }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const idStr = params.get('id');
      if (idStr) {
        const idVal = parseInt(idStr, 10);
        if (!isNaN(idVal)) {
          this.id = idVal;
          this.loadDetails(idVal);
        }
      }
    });
  }

  ngOnDestroy() {
    this.portfolioService.isCreatePageActive = false;
  }

  // 🟢 Toggle Interactive Sections
  toggleSection(section: 'programs' | 'projects') {
    if (this.selectedSection === section) {
      this.selectedSection = null;
    } else {
      this.selectedSection = section;
    }
    this.cdr.detectChanges();
  }

  get t() {
    return this.translations[this.currentLang];
  }

  get isRtl(): boolean {
    return this.currentLang === 'ar';
  }

  loadDetails(id: number) {
    this.isLoading = true;
    this.portfolioService.getPortfolioDetails(id).subscribe({
      next: (data) => {
        this.portfolio = data;
        
        if (data.attachedFiles) {
          try {
            this.attachedFiles = JSON.parse(data.attachedFiles);
          } catch (e) {
            this.attachedFiles = [];
          }
        } else {
          this.attachedFiles = [];
        }

        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching details', err);
        this.portfolio = {
          id: id,
          nameAr: 'محفظة التحول الرقمي المؤقتة',
          nameEn: 'Temporary Digital Transformation Portfolio',
          descriptionAr: 'هذا وصف افتراضي للمحفظة الاستراتيجية التي تم اختيارها لمشاهدة تفاصيلها التنظيمية والإدارية والمالية.',
          descriptionEn: 'This is a default description for the selected strategic portfolio, demonstrating organization and budget.',
          budget: 10000000,
          startDate: new Date().toISOString(),
          endDate: new Date().toISOString(),
          status: 'Active',
          ownerName: 'Faisal Al-Otaibi',
          sponsorName: 'Omar Al-Harbi',
          managerName: 'Mahmoud Salah',
          createdDate: '2026-05-10T00:00:00Z',
          projectsCount: 50,
          programsCount: 50
        };
        this.attachedFiles = [];
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  goBack() {
    this.router.navigate(['/portfolios']);
  }

  navigateToEdit() {
    if (this.id) {
      this.router.navigate(['/portfolios/edit', this.id]);
    }
  }

  formatBudget(val: number): string {
    return new Intl.NumberFormat('en-US').format(val);
  }

  downloadFile(filePath: string) {
    if (filePath) {
      const domainUrl = API_CONFIG.baseUrl.replace('/api', '');
      window.open(domainUrl + filePath, '_blank');
    }
  }

  getFileColor(type: string): string {
    const t = type?.toLowerCase();
    if (t === 'pdf') return '#EF4444';
    if (t === 'doc' || t === 'docx') return '#3B82F6';
    if (t === 'xls' || t === 'xlsx') return '#10B981';
    if (t === 'zip' || t === 'rar') return '#F59E0B';
    return '#6B7280';
  }
}