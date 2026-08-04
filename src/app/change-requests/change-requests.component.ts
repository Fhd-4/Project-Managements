import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ProjectService, ChangeRequest, Project } from '../projects/project.service';

type LangCode = 'ar' | 'en';

@Component({
  selector: 'app-change-requests',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './change-requests.component.html',
  styleUrl: './change-requests.component.scss'
})
export class ChangeRequestsComponent implements OnInit {
  currentLang: LangCode = 'ar';
  isLoading: boolean = true;
  changeRequests: ChangeRequest[] = [];
  filteredRequests: ChangeRequest[] = [];
  projects: Project[] = [];
  projectsMap = new Map<number, Project>();

  // Filter params
  searchQuery: string = '';
  selectedStatus: string = '';

  // Translations
  translations = {
    ar: {
      title: 'طلبات التغيير',
      totalRequests: 'Total Requests',
      criticalRequests: 'Critical Requests',
      pendingRequests: 'Pending Requests',
      planningRequests: 'Planning Requests',
      completedRequests: 'Completed Requests',
      allRequests: 'All Requests',
      searchPlaceholder: 'Search for everything',
      statusPlaceholder: 'Status',
      btnCreateNew: '+ إنشاء طلب جديد',
      thTitle: 'عنوان الطلب',
      thType: 'نوع التغيير',
      thPortfolio: 'اسم المحفظة',
      thProgram: 'اسم البرنامج',
      thProject: 'اسم المشروع',
      thStatus: 'الحالة',
      thActions: 'الإجراءات',
      noDataTitle: 'لا توجد بيانات حالياً',
      noDataSub: 'الرجاء النقر على إنشاء جديد لاختيار الخيار المناسب',
      toastSuccessDelete: 'تم حذف طلب التغيير بنجاح!',
      toastErrorDelete: 'فشل حذف طلب التغيير.'
    },
    en: {
      title: 'Change Requests',
      totalRequests: 'Total Requests',
      criticalRequests: 'Critical Requests',
      pendingRequests: 'Pending Requests',
      planningRequests: 'Planning Requests',
      completedRequests: 'Completed Requests',
      allRequests: 'All Requests',
      searchPlaceholder: 'Search for everything',
      statusPlaceholder: 'Status',
      btnCreateNew: '+ Create New',
      thTitle: 'Request Title',
      thType: 'Change Type',
      thPortfolio: 'Portfolio name',
      thProgram: 'Program name',
      thProject: 'Project name',
      thStatus: 'Status',
      thActions: 'Actions',
      noDataTitle: 'No data right now',
      noDataSub: 'Please click on create new to choose the suitable option',
      toastSuccessDelete: 'Change request deleted successfully!',
      toastErrorDelete: 'Failed to delete change request.'
    }
  };

  constructor(
    private router: Router,
    public projectService: ProjectService,
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
    this.loadProjectsAndRequests();
  }

  get t() {
    return this.translations[this.currentLang];
  }

  get isRtl(): boolean {
    return this.currentLang === 'ar';
  }

  loadProjectsAndRequests() {
    this.isLoading = true;
    this.projectService.getProjects().subscribe({
      next: (projs) => {
        this.projects = projs;
        this.projectsMap.clear();
        projs.forEach(p => this.projectsMap.set(p.id, p));

        this.projectService.getChangeRequests().subscribe({
          next: (reqs) => {
            this.changeRequests = reqs;
            this.applyFilters();
            this.isLoading = false;
            this.cdr.detectChanges();
          },
          error: () => {
            this.isLoading = false;
            this.cdr.detectChanges();
          }
        });
      },
      error: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  applyFilters() {
    let temp = [...this.changeRequests];

    // Search query filter
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      temp = temp.filter(r => 
        r.title.toLowerCase().includes(q) || 
        r.reason.toLowerCase().includes(q) || 
        r.description.toLowerCase().includes(q)
      );
    }

    // Status filter
    if (this.selectedStatus) {
      temp = temp.filter(r => r.status === Number(this.selectedStatus));
    }

    this.filteredRequests = temp;
    this.cdr.detectChanges();
  }

  parseDescription(description: string) {
    const meta = {
      type: 'Scope Change',
      priority: 'Medium',
      currentBudget: '0',
      proposedBudget: '0',
      currentDeadline: '',
      proposedDeadline: '',
      currentScope: '',
      proposedScope: '',
      currentResources: '',
      proposedResources: '',
      actualDescription: description || ''
    };

    if (!description || !description.includes('Type:')) {
      return meta;
    }

    try {
      const lines = description.split('\n');
      lines.forEach(line => {
        if (line.startsWith('Type:')) meta.type = line.replace('Type:', '').trim();
        else if (line.startsWith('Priority:')) meta.priority = line.replace('Priority:', '').trim();
        else if (line.startsWith('CurrentBudget:')) meta.currentBudget = line.replace('CurrentBudget:', '').trim();
        else if (line.startsWith('ProposedBudget:')) meta.proposedBudget = line.replace('ProposedBudget:', '').trim();
        else if (line.startsWith('CurrentDeadline:')) meta.currentDeadline = line.replace('CurrentDeadline:', '').trim();
        else if (line.startsWith('ProposedDeadline:')) meta.proposedDeadline = line.replace('ProposedDeadline:', '').trim();
        else if (line.startsWith('CurrentScope:')) meta.currentScope = line.replace('CurrentScope:', '').trim();
        else if (line.startsWith('ProposedScope:')) meta.proposedScope = line.replace('ProposedScope:', '').trim();
        else if (line.startsWith('CurrentResources:')) meta.currentResources = line.replace('CurrentResources:', '').trim();
        else if (line.startsWith('ProposedResources:')) meta.proposedResources = line.replace('ProposedResources:', '').trim();
      });

      // Extract actual description by skipping headers
      const descIndex = lines.findIndex(l => l.startsWith('Description:'));
      if (descIndex !== -1) {
        meta.actualDescription = lines.slice(descIndex).join('\n').replace('Description:', '').trim();
      }
    } catch (e) {
      console.error('Error parsing description metadata', e);
    }

    return meta;
  }

  getPortfolioName(projectId: number): string {
    const proj = this.projectsMap.get(projectId);
    return proj?.portfolioName || 'N/A';
  }

  getProgramName(projectId: number): string {
    const proj = this.projectsMap.get(projectId);
    return proj?.programName || 'N/A';
  }

  getProjectName(projectId: number): string {
    const proj = this.projectsMap.get(projectId);
    return proj?.name || 'N/A';
  }

  // Count calculations
  get totalCount(): number {
    return this.changeRequests.length;
  }

  get pendingCount(): number {
    return this.changeRequests.filter(r => r.status === 1).length;
  }

  get criticalCount(): number {
    return this.changeRequests.filter(r => {
      const meta = this.parseDescription(r.description);
      return meta.priority.toLowerCase() === 'critical';
    }).length;
  }

  get planningCount(): number {
    // Figma lists "Planning Requests" (we can represent it as those where type == "Scope Change")
    return this.changeRequests.filter(r => {
      const meta = this.parseDescription(r.description);
      return meta.type.toLowerCase().includes('scope') || meta.type.toLowerCase().includes('planning');
    }).length;
  }

  get completedCount(): number {
    return this.changeRequests.filter(r => r.status === 2).length;
  }

  getStatusClass(status: number): string {
    if (status === 1) return 'pending';
    if (status === 2) return 'approved';
    return 'rejected';
  }

  getStatusLabel(status: number): string {
    if (status === 1) return this.currentLang === 'ar' ? 'انتظار' : 'Pending';
    if (status === 2) return this.currentLang === 'ar' ? 'مقبول' : 'Approved';
    return this.currentLang === 'ar' ? 'مرفوض' : 'Rejected';
  }

  deleteRequest(id: number, event: MouseEvent) {
    event.stopPropagation();
    const msg = this.currentLang === 'ar' 
      ? 'هل أنت متأكد من حذف هذا الطلب؟' 
      : 'Are you sure you want to delete this change request?';
    if (confirm(msg)) {
      this.projectService.deleteChangeRequest(id).subscribe({
        next: () => {
          this.projectService.triggerSuccessToast();
          this.loadProjectsAndRequests();
        },
        error: () => {
          this.projectService.triggerErrorToast();
        }
      });
    }
  }

  viewDetails(id: number) {
    this.router.navigate([`/change-requests/details/${id}`]);
  }

  editRequest(id: number, event: MouseEvent) {
    event.stopPropagation();
    this.router.navigate([`/change-requests/edit/${id}`]);
  }
}
