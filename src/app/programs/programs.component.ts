import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProgramService, Program, getStatusMeta, ProgramStatus } from './program.service';

type LangCode = 'ar' | 'en';
type SortDir = 'asc' | 'desc' | 'none';
type SortKey = 'projects' | 'tasks' | 'none';
type ViewMode = 'list' | 'kanban';

@Component({
  selector: 'app-programs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './programs.component.html',
  styleUrl: './programs.component.scss'
})
export class ProgramsComponent implements OnInit {
  currentLang: LangCode = 'ar';
  searchQuery: string = '';
  viewMode: ViewMode = 'list';

  programs: Program[] = [];
  isLoading: boolean = true;
  errorMessage: string = '';

  statusFilter: number | null = null;
  readonly statusOptions = [
    { value: null as number | null, labelAr: 'كل الحالات', labelEn: 'All Status' },
    { value: ProgramStatus.Pending, labelAr: 'قيد الانتظار', labelEn: 'Pending' },
    { value: ProgramStatus.Active, labelAr: 'قيد التنفيذ', labelEn: 'In Progress' },
    { value: ProgramStatus.Completed, labelAr: 'مكتمل', labelEn: 'Completed' },
    { value: ProgramStatus.Rejected, labelAr: 'مرفوض', labelEn: 'Rejected' }
  ];

  sortKey: SortKey = 'none';
  sortDir: SortDir = 'none';

  // Pagination — client-side. The Swagger for GET /api/Programs only
  // documents portfolioId/keyword/status params, no page/pageSize, so this
  // paginates the already-fetched list rather than hitting the API per page.
  // If the backend adds real paging params, swap this for server-side paging.
  pageSize = 8;
  currentPage = 1;

  totalCount = 0;
  pendingCount = 0;
  activeCount = 0;
  completedCount = 0;

  showSuccessToast = false;
  showErrorToast = false;

  translations = {
    ar: {
      title: 'كل البرامج',
      searchPlaceholder: 'ابحث بالاسم...',
      createBtn: 'إنشاء برنامج',
      listView: 'عرض قائمة',
      kanbanView: 'عرض كانبان',
      stats: { total: 'إجمالي البرامج', pending: 'قيد الانتظار', active: 'قيد التنفيذ', completed: 'مكتملة' },
      headers: { name: 'اسم البرنامج', projects: 'المشاريع', tasks: 'المهام', owner: 'المسؤول', status: 'الحالة', actions: 'الإجراءات' },
      noData: 'لا توجد برامج مسجلة حالياً، اضغط على إنشاء برنامج للبدء.',
      confirmDelete: 'هل أنت متأكد من رغبتك في حذف هذا البرنامج؟'
    },
    en: {
      title: 'All Programs',
      searchPlaceholder: 'Search for everything',
      createBtn: 'Create Program',
      listView: 'List',
      kanbanView: 'Kanban',
      stats: { total: 'Total Programs', pending: 'Pending', active: 'In Progress', completed: 'Completed' },
      headers: { name: 'Program Name', projects: 'Projects', tasks: 'Tasks', owner: 'Owner', status: 'Status', actions: 'Actions' },
      noData: 'No programs found. Click Create Program to get started.',
      confirmDelete: 'Are you sure you want to delete this program?'
    }
  };

  constructor(
    public programService: ProgramService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {
    if (typeof window !== 'undefined' && window.localStorage) {
      const savedLang = localStorage.getItem('preferred_lang') as LangCode;
      if (savedLang) this.currentLang = savedLang;
    }
  }

  ngOnInit() {
    this.loadPrograms();
    this.programService.successToast$.subscribe(val => { this.showSuccessToast = val; this.cdr.detectChanges(); });
    this.programService.errorToast$.subscribe(val => { this.showErrorToast = val; this.cdr.detectChanges(); });
  }

  get t() { return this.translations[this.currentLang]; }
  get isRtl(): boolean { return this.currentLang === 'ar'; }

  loadPrograms() {
    this.isLoading = true;
    this.programService.getAllPrograms({
      keyword: this.searchQuery?.trim() || undefined,
      status: this.statusFilter ?? undefined
    }).subscribe({
      next: (list) => {
        this.programs = list;
        this.calculateStats();
        this.currentPage = 1;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage = this.t.noData;
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onSearchChange() { this.loadPrograms(); }
  onStatusFilterChange() { this.loadPrograms(); }

  calculateStats() {
    this.totalCount = this.programs.length;
    this.pendingCount = this.programs.filter(p => p.status === ProgramStatus.Pending).length;
    this.activeCount = this.programs.filter(p => p.status === ProgramStatus.Active).length;
    this.completedCount = this.programs.filter(p => p.status === ProgramStatus.Completed).length;
  }

  toggleSort(key: 'projects' | 'tasks') {
    if (this.sortKey !== key) { this.sortKey = key; this.sortDir = 'desc'; }
    else if (this.sortDir === 'desc') { this.sortDir = 'asc'; }
    else { this.sortKey = 'none'; this.sortDir = 'none'; }
  }

  get sortedPrograms(): Program[] {
    let result = [...this.programs];
    if (this.sortKey !== 'none' && this.sortDir !== 'none') {
      const field = this.sortKey === 'projects' ? 'projectsCount' : 'tasksCount';
      result.sort((a, b) => {
        const av = a[field] ?? 0, bv = b[field] ?? 0;
        return this.sortDir === 'asc' ? av - bv : bv - av;
      });
    }
    return result;
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.sortedPrograms.length / this.pageSize));
  }

  get pagedPrograms(): Program[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.sortedPrograms.slice(start, start + this.pageSize);
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  goToPage(p: number) {
    if (p >= 1 && p <= this.totalPages) this.currentPage = p;
  }

  get kanbanColumns() {
    const statuses = [ProgramStatus.Pending, ProgramStatus.Active, ProgramStatus.Completed, ProgramStatus.Rejected];
    return statuses.map(status => ({
      status,
      meta: getStatusMeta(status),
      programs: this.sortedPrograms.filter(p => p.status === status)
    }));
  }

  statusMeta(status: number) { return getStatusMeta(status); }

  initials(name?: string): string {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    return (parts[0]?.[0] || '') + (parts[1]?.[0] || '');
  }

  openCreatePage() { this.router.navigate(['/programs/create']); }
  openEditPage(program: Program) { this.router.navigate(['/programs/edit', program.id]); }
  viewProgramDetails(id: number) { this.router.navigate(['/programs/details', id]); }

  deleteProgram(id: number) {
    if (confirm(this.t.confirmDelete)) {
      this.isLoading = true;
      this.programService.deleteProgram(id).subscribe({
        next: () => { this.programService.triggerSuccessToast(); this.loadPrograms(); },
        error: () => { this.isLoading = false; this.programService.triggerErrorToast(); this.cdr.detectChanges(); }
      });
    }
  }
}