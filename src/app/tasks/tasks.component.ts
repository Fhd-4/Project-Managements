import { Component, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProjectService, ProjectTask } from '../projects/project.service';

type LangCode = 'ar' | 'en';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tasks.component.html',
  styleUrl: './tasks.component.scss'
})
export class TasksComponent implements OnInit, OnDestroy {
  currentLang: LangCode = 'ar';
  searchQuery: string = '';
  statusFilter: string = 'All';

  tasks: ProjectTask[] = [];
  isLoading: boolean = true;

  // Stats
  totalTasks: number = 0;
  todoCount: number = 0;
  inprogressCount: number = 0;
  inreviewCount: number = 0;
  doneCount: number = 0;

  // Toasts
  showSuccessToast: boolean = false;
  showErrorToast: boolean = false;

  translations = {
    ar: {
      title: 'المهام',
      searchPlaceholder: 'البحث عن كل شيء',
      createBtn: 'إضافة مهمة',
      totalTasks: 'إجمالي المهام',
      todo: 'المستلمة',
      inprogress: 'قيد التنفيذ',
      inreview: 'قيد المراجعة',
      done: 'المكتملة',
      noData: 'لا توجد بيانات حالياً',
      noDataSub: 'يرجى الضغط على إضافة جديد لإنشاء مهمة جديدة',
      thName: 'اسم المهمة',
      thProject: 'المشروع',
      thDueDate: 'تاريخ الاستحقاق',
      thAssignTo: 'إسناد إلى',
      thProgress: 'التقدم',
      thStatus: 'الحالة',
      thActions: 'الإجراءات',
      statusAll: 'الحالة'
    },
    en: {
      title: 'Tasks',
      searchPlaceholder: 'Search for everything',
      createBtn: 'Create Task',
      totalTasks: 'Total Tasks',
      todo: 'To Do',
      inprogress: 'In Progress',
      inreview: 'In Review',
      done: 'Done',
      noData: 'No data right now',
      noDataSub: 'Please click on create new to create new task',
      thName: 'Task Name',
      thProject: 'Project',
      thDueDate: 'Due Date',
      thAssignTo: 'Assign to',
      thProgress: 'Progress',
      thStatus: 'Status',
      thActions: 'Actions',
      statusAll: 'Status'
    }
  };

  constructor(
    private projectService: ProjectService,
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
    this.loadTasks();

    this.projectService.successToast$.subscribe(val => {
      this.showSuccessToast = val;
      this.cdr.detectChanges();
    });

    this.projectService.errorToast$.subscribe(val => {
      this.showErrorToast = val;
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy() {
    this.projectService.isCreatePageActive = false;
  }

  get t() {
    return this.translations[this.currentLang];
  }

  get isRtl(): boolean {
    return this.currentLang === 'ar';
  }

  loadTasks() {
    this.isLoading = true;
    this.projectService.getTasks(undefined, this.statusFilter || undefined, this.searchQuery || undefined).subscribe({
      next: (data) => {
        this.tasks = data || [];
        this.calculateStats();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading tasks', err);
        this.tasks = [];
        this.calculateStats();
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  calculateStats() {
    this.totalTasks = this.tasks.length;
    this.todoCount = this.tasks.filter(t => t.status === 'To Do').length;
    this.inprogressCount = this.tasks.filter(t => t.status === 'In Progress').length;
    this.inreviewCount = this.tasks.filter(t => t.status === 'In Review').length;
    this.doneCount = this.tasks.filter(t => t.status === 'Done').length;
  }

  onSearch() {
    this.loadTasks();
  }

  onStatusFilterChange() {
    this.loadTasks();
  }

  editTask(task: ProjectTask, event: MouseEvent) {
    event.stopPropagation();
    this.router.navigate([`/projects/details/${task.projectId}/tasks/edit/${task.id}`]);
  }

  deleteTask(id: number, event: MouseEvent) {
    event.stopPropagation();
    if (confirm(this.currentLang === 'ar' ? 'هل أنت متأكد من حذف هذه المهمة؟' : 'Are you sure you want to delete this task?')) {
      this.projectService.deleteTask(id).subscribe({
        next: () => {
          this.projectService.triggerSuccessToast();
          this.loadTasks();
        },
        error: (err) => {
          console.error('Error deleting task', err);
          this.projectService.triggerErrorToast();
        }
      });
    }
  }

  navigateToCreate() {
    // If no project context, route to general task creation `/tasks/create`
    this.router.navigate(['/tasks/create']);
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    return new Date(dateStr).toISOString().split('T')[0];
  }

  getInitials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  getAssigneeColorClass(name: string): string {
    const map: Record<string, string> = {
      'Abdallah Othman': 'FO',
      'Faisal Al-Otaibi': 'OH',
      'Omar Al-Harbi': 'MS',
      'Mahmoud Salah': 'FO',
      'Omar Mostafa': 'OH',
      'Faisal Al-Sharif': 'MS'
    };
    return map[name] || 'FO';
  }

  getTaskProgressPercent(status: string): number {
    const s = status?.toLowerCase() || '';
    if (s === 'done') return 100;
    if (s === 'in review' || s === 'inreview') return 75;
    if (s === 'in progress' || s === 'inprogress') return 50;
    return 0;
  }

  getTaskStatusClass(status: string): string {
    const s = status?.toLowerCase() || '';
    if (s === 'todo') return 'task-status-todo';
    if (s === 'in progress' || s === 'inprogress') return 'task-status-inprogress';
    if (s === 'in review' || s === 'inreview') return 'task-status-inreview';
    if (s === 'done') return 'task-status-done';
    return '';
  }

  getTaskStatusLabel(status: string): string {
    const s = status?.toLowerCase() || '';
    if (this.currentLang === 'ar') {
      if (s === 'todo') return 'المستلمة';
      if (s === 'in progress' || s === 'inprogress') return 'قيد التنفيذ';
      if (s === 'in review' || s === 'inreview') return 'قيد المراجعة';
      if (s === 'done') return 'المكتملة';
      return status;
    } else {
      return status;
    }
  }
}
