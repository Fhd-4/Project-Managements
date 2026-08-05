import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ProgramService, Program, getStatusMeta, StatusMeta } from './program.service';

interface Translations {
  title: string;
  subtitle: string;
  listView: string;
  kanbanView: string;
  ganttView: string;
  searchPlaceholder: string;
  createBtn: string;
  noData: string;
  stats: { total: string; pending: string; active: string; completed: string; rejected: string };
  headers: { name: string; description: string; projects: string; tasks: string; progress: string; owner: string; status: string; actions: string };
}

@Component({
  selector: 'app-programs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './programs.component.html',
  styleUrls: ['./programs.component.scss']
})
export class ProgramsComponent implements OnInit, OnDestroy {
  programs: Program[] = [];
  pagedPrograms: Program[] = [];
  isLoading = true;

  viewMode: 'list' | 'kanban' | 'gantt' = 'list';
  searchQuery = '';
  statusFilter: number | null = null;

  currentPage = 1;
  pageSize = 10;
  totalPages = 1;
  pageNumbers: number[] = [];

  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  totalCount = 0;
  pendingCount = 0;
  activeCount = 0;
  completedCount = 0;
  rejectedCount = 0; // Added for the "Need Action" card

  showSuccessToast = false;
  showErrorToast = false;
  private subs = new Subscription();

  isRtl = false;

  statusOptions = [
    { value: null, labelEn: 'All Status', labelAr: 'جميع الحالات' },
    { value: 1, labelEn: 'In Progress', labelAr: 'قيد التنفيذ' },
    { value: 2, labelEn: 'Completed', labelAr: 'مكتملة' },
    { value: 3, labelEn: 'Pending', labelAr: 'قيد الانتظار' },
    { value: 4, labelEn: 'Rejected', labelAr: 'مرفوضة' }
  ];

  translations: Record<'en' | 'ar', Translations> = {
    en: {
      title: 'Programs',
      subtitle: 'monitor a strategic collection of programs and projects',
      listView: 'List',
      kanbanView: 'Kanban',
      ganttView: 'Gantt',
      searchPlaceholder: 'Search for Programs...',
      createBtn: 'Create',
      noData: 'No programs found.',
      stats: { total: 'All Programs', active: 'On Track', pending: 'Pending', completed: 'Completed', rejected: 'Need Action' },
      headers: { name: 'Program Name', description: 'Description', projects: 'Projects', tasks: 'Tasks', progress: 'Progress', owner: 'Owner', status: 'Status', actions: 'Actions' }
    },
    ar: {
      title: 'البرامج',
      subtitle: 'مراقبة مجموعة استراتيجية من البرامج والمشاريع',
      listView: 'قائمة',
      kanbanView: 'كانبان',
      ganttView: 'جانت',
      searchPlaceholder: 'ابحث عن البرامج...',
      createBtn: 'إنشاء',
      noData: 'لا توجد برامج متاحة.',
      stats: { total: 'كل البرامج', active: 'في المسار الصحيح', pending: 'قيد الانتظار', completed: 'مكتملة', rejected: 'بحاجة لإجراء' },
      headers: { name: 'اسم البرنامج', description: 'الوصف', projects: 'المشاريع', tasks: 'المهام', progress: 'التقدم', owner: 'المسؤول', status: 'الحالة', actions: 'الإجراءات' }
    }
  };

  get t(): Translations {
    return this.isRtl ? this.translations.ar : this.translations.en;
  }

  kanbanColumns: { status: number; meta: StatusMeta; programs: Program[] }[] = [];

  constructor(private programService: ProgramService, private router: Router) {}

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem('app_lang');
      this.isRtl = savedLang === 'ar' || document.documentElement.dir === 'rtl';
    }

    this.subs.add(
      this.programService.successToast$.subscribe(val => this.showSuccessToast = val)
    );
    this.subs.add(
      this.programService.errorToast$.subscribe(val => this.showErrorToast = val)
    );

    this.loadPrograms();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  loadPrograms(): void {
    this.isLoading = true;
    const filters = {
      keyword: this.searchQuery.trim() || undefined,
      status: this.statusFilter !== null ? Number(this.statusFilter) : undefined
    };

    this.programService.getAllPrograms(filters).subscribe({
      next: (data) => {
        this.programs = data || [];
        this.calculateStats();
        this.applySortingAndPagination();
        this.buildKanbanColumns();
        this.isLoading = false;
      },
      error: () => {
        this.programs = [];
        this.calculateStats();
        this.applySortingAndPagination();
        this.buildKanbanColumns();
        this.isLoading = false;
      }
    });
  }

  calculateStats(): void {
    this.totalCount = this.programs.length;
    this.activeCount = this.programs.filter(p => p.status === 1).length;
    this.completedCount = this.programs.filter(p => p.status === 2).length;
    this.pendingCount = this.programs.filter(p => p.status === 3).length;
    this.rejectedCount = this.programs.filter(p => p.status === 4).length;
  }

  onSearchChange(): void {
    this.currentPage = 1;
    this.loadPrograms();
  }

  onStatusFilterChange(): void {
    this.currentPage = 1;
    this.loadPrograms();
  }

  toggleSort(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.applySortingAndPagination();
  }

  applySortingAndPagination(): void {
    let result = [...this.programs];

    if (this.sortColumn) {
      result.sort((a, b) => {
        let valA = 0;
        let valB = 0;
        if (this.sortColumn === 'projects') {
          valA = a.projectsCount ?? 0;
          valB = b.projectsCount ?? 0;
        } else if (this.sortColumn === 'tasks') {
          valA = a.tasksCount ?? 0;
          valB = b.tasksCount ?? 0;
        }
        return this.sortDirection === 'asc' ? valA - valB : valB - valA;
      });
    }

    this.totalPages = Math.ceil(result.length / this.pageSize) || 1;
    if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;

    const startIndex = (this.currentPage - 1) * this.pageSize;
    this.pagedPrograms = result.slice(startIndex, startIndex + this.pageSize);

    this.pageNumbers = Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.applySortingAndPagination();
    }
  }

  buildKanbanColumns(): void {
    const statuses = [1, 2, 3, 4]; // Active, Completed, Pending, Rejected
    this.kanbanColumns = statuses.map(st => ({
      status: st,
      meta: getStatusMeta(st),
      programs: this.programs.filter(p => p.status === st)
    }));
  }

  statusMeta(status: number): StatusMeta {
    return getStatusMeta(status);
  }

  initials(name?: string): string {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  openCreatePage(): void {
    this.router.navigate(['/programs/create']);
  }

  openEditPage(p: Program): void {
    this.router.navigate([`/programs/edit/${p.id}`]);
  }

  viewProgramDetails(id: number): void {
    this.router.navigate([`/programs/details/${id}`]);
  }

  deleteProgram(id: number): void {
    const msg = this.isRtl ? 'هل أنت متأكد من حذف هذا البرنامج؟' : 'Are you sure you want to delete this program?';
    if (confirm(msg)) {
      this.programService.deleteProgram(id).subscribe({
        next: () => {
          this.programService.triggerSuccessToast();
          this.loadPrograms();
        },
        error: () => {
          this.programService.triggerErrorToast();
        }
      });
    }
  }
}