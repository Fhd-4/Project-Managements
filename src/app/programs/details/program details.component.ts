import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ProgramService, Program, getStatusMeta } from '../program.service';
import { PortfolioLookupService } from '../../portfolios/portfolio-lookup.service';
import { API_CONFIG } from '../../api.config';
import {
  ProjectService,
  Project,
  getProjectStatusMeta
} from '../../projects/project.service';

type LangCode = 'ar' | 'en';

@Component({
  selector: 'app-program-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './program details.component.html',
  styleUrls: ['./program details.component.scss']
})
export class ProgramDetailsComponent implements OnInit {
  currentLang: LangCode = 'ar';
  program: Program | null = null;
  portfolioOwnerName: string | null = null;
  projects: Project[] = [];
  projectsLoading = true;

  isLoading = true;
  errorMessage = '';

  translations = {
    ar: {
      breadcrumb: 'البرامج / تفاصيل البرنامج',
      portfolioOwner: 'مالك المحفظة',
      sponsor: 'راعي البرنامج',
      manager: 'مدير البرنامج',
      projects: 'المشاريع',
      tasks: 'المهام',
      budget: 'الميزانية',
      documents: 'المستندات',
      description: 'الوصف',
      noDocuments: 'لا توجد مستندات مرفقة',
      edit: 'تعديل',
      allProjects: 'كل المشاريع',
      noProjects: 'لا توجد مشاريع ضمن هذا البرنامج بعد',
      headers: { name: 'اسم المشروع', manager: 'المدير', status: 'الحالة', budget: 'الميزانية', start: 'تاريخ البدء', end: 'تاريخ الانتهاء', tasksCount: 'المهام', membersCount: 'الأعضاء', actions: 'الإجراءات' }
    },
    en: {
      breadcrumb: 'Programs / Program Details',
      portfolioOwner: 'Portfolio Owner',
      sponsor: 'Program Sponsor',
      manager: 'Program Manager',
      projects: 'Projects',
      tasks: 'Tasks',
      budget: 'Budget',
      documents: 'Documents',
      description: 'Description',
      noDocuments: 'No documents attached',
      edit: 'Edit',
      allProjects: 'All Projects',
      noProjects: 'No projects under this program yet',
      headers: { name: 'Project Name', manager: 'Manager', status: 'Status', budget: 'Budget', start: 'Start Date', end: 'End Date', tasksCount: 'Tasks', membersCount: 'Members', actions: 'Actions' }
    }
  };

  constructor(
    private programService: ProgramService,
    private portfolioLookup: PortfolioLookupService,
    private projectService: ProjectService,
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
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) { 
      this.errorMessage = 'Invalid program id.'; 
      this.isLoading = false; 
      this.cdr.detectChanges();
      return; 
    }

    this.programService.getProgramDetails(id).subscribe({
      next: (program) => {
        this.program = program;
        this.isLoading = false;
        this.cdr.detectChanges();

        if (program?.portfolioId) {
          this.portfolioLookup.getPortfolio(program.portfolioId).subscribe({
            next: (p) => {
              this.portfolioOwnerName = p?.ownerName || null;
              this.cdr.detectChanges();
            },
            error: () => {
              this.portfolioOwnerName = null;
            }
          });
        }

        this.projectsLoading = true;
        this.projectService.getProjectsByProgram(id).subscribe({
          next: (list) => {
            this.projects = list || [];
            this.projectsLoading = false;
            this.cdr.detectChanges();
          },
          error: () => {
            this.projects = [];
            this.projectsLoading = false;
            this.cdr.detectChanges();
          }
        });
      },
      error: () => { 
        this.errorMessage = 'Failed to load program.'; 
        this.isLoading = false; 
        this.cdr.detectChanges(); 
      }
    });
  }

  get statusMeta() { return this.program ? getStatusMeta(this.program.status) : getStatusMeta(0); }
  get progress(): number { return this.program?.progressPercentage ?? this.statusMeta.progress; }

  projectStatusMeta(status: string | number) {
    return {
      label: String(status),
      cssClass: 'status-' + String(status || '').toLowerCase()
    };
  }

  initials(name?: string | null): string {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase();
  }

  fileName(url: string): string { return url.split('/').pop() || url; }

  editProgram() { if (this.program) this.router.navigate(['/programs/edit', this.program.id]); }
  goBack() { this.router.navigate(['/programs']); }

  formatBudget(val?: number): string { return new Intl.NumberFormat('en-US').format(val || 0); }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString(this.isRtl ? 'ar-SA' : 'en-US', { day: '2-digit', month: 'short', year: 'numeric' });
  }
  fileKind(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return 'pdf';
    return 'doc';
  }

  downloadFile(url: string) {
    if (url) {
      if (url.startsWith('http://') || url.startsWith('https://')) {
        window.open(url, '_blank');
      } else {
        const domainUrl = API_CONFIG.baseUrl.replace('/api', '');
        window.open(domainUrl + url, '_blank');
      }
    }
  }

  createProject() {
    this.router.navigate(['/projects/create'], { queryParams: { programId: this.program?.id } });
  }

  viewProject(projectId: number) {
    this.router.navigate([`/projects/details/${projectId}`]);
  }
}