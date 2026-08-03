import { Component, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ProjectService, Project, ProjectTask, ProjectMeeting } from '../project.service';
import { API_CONFIG } from '../../api.config';

type LangCode = 'ar' | 'en';

@Component({
  selector: 'app-project-details',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './project-details.html',
  styleUrl: './project-details.scss'
})
export class ProjectDetailsComponent implements OnInit, OnDestroy {
  currentLang: LangCode = 'ar';
  isLoading: boolean = true;
  project: Project | null = null;
  projectId: number | null = null;

  // Attached files parsed from DB
  attachedFiles: Array<{ name: string, progress: number, size: string, type: string, path?: string }> = [];

  // Tab navigation
  activeTab: string = 'Tasks';
  tabs = ['Tasks', 'Charter', 'Contract', 'Documents', 'Team', 'Meetings', 'Closure Report'];

  // Tasks search & filters
  tasks: ProjectTask[] = [];
  filteredTasks: ProjectTask[] = [];
  taskSearchQuery: string = '';
  taskStatusFilter: string = 'All';
  viewMode: 'list' | 'kanban' = 'list'; // List view by default

  // Meetings search & lists
  projectMeetings: ProjectMeeting[] = [];
  filteredMeetings: ProjectMeeting[] = [];
  meetingSearchQuery: string = '';

  translations = {
    ar: {
      langLabel: 'English',
      budget: 'الميزانية',
      description: 'الوصف',
      officials: 'المسؤولين',
      projectManager: 'مدير المشروع',
      portfolioOwner: 'مالك المحفظة',
      portfolioSponsor: 'راعي المحفظة',
      portfolioManager: 'مدير المحفظة',
      approved: 'تمت الموافقة',
      pending: 'قيد الانتظار',
      refusing: 'مرفوض',
      tasks: 'المهام',
      documents: 'المستندات',
      noTasks: 'لا توجد مهام لهذا المشروع حالياً',
      searchTasks: 'البحث في المهام...',
      allTasksTitle: 'كل المهام',
      thTaskName: 'اسم المهمة',
      thProject: 'المشروع',
      thDueDate: 'تاريخ الاستحقاق',
      thEndDate: 'تاريخ الانتهاء',
      thStatus: 'الحالة',
      thActions: 'الإجراءات',
      colTodo: 'المستلمة',
      colInProgress: 'قيد التنفيذ',
      colInReview: 'قيد المراجعة',
      colDone: 'المكتملة'
    },
    en: {
      langLabel: 'العربية',
      budget: 'Budget',
      description: 'Description',
      officials: 'Officials',
      projectManager: 'Project Manager',
      portfolioOwner: 'Portfolio Owner',
      portfolioSponsor: 'Portfolio Sponsor',
      portfolioManager: 'Portfolio Manager',
      approved: 'Approved',
      pending: 'Pending',
      refusing: 'Refusing',
      tasks: 'Tasks',
      documents: 'Documents',
      noTasks: 'No tasks for this project yet',
      searchTasks: 'Search for everything',
      allTasksTitle: 'All Tasks',
      thTaskName: 'Task Name',
      thProject: 'Project',
      thDueDate: 'Due Date',
      thEndDate: 'End Date',
      thStatus: 'Status',
      thActions: 'Actions',
      colTodo: 'To Do',
      colInProgress: 'In Progress',
      colInReview: 'In Review',
      colDone: 'Done'
    }
  };

  constructor(
    private projectService: ProjectService,
    private cdr: ChangeDetectorRef,
    public router: Router,
    private route: ActivatedRoute
  ) {
    if (typeof window !== 'undefined' && window.localStorage) {
      const savedLang = localStorage.getItem('preferred_lang') as LangCode;
      if (savedLang) {
        this.currentLang = savedLang;
      }
    }
    this.projectService.isCreatePageActive = true;
  }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const idStr = params.get('id');
      if (idStr) {
        const idVal = parseInt(idStr, 10);
        if (!isNaN(idVal)) {
          this.projectId = idVal;
          this.loadProjectDetails(idVal);
          this.loadProjectTasks(idVal);
          this.loadProjectMeetings(idVal);
        }
      }
    });

    this.route.queryParamMap.subscribe(qParams => {
      const activeTab = qParams.get('tab');
      if (activeTab) {
        this.activeTab = activeTab;
      }
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

  loadProjectDetails(id: number) {
    this.isLoading = true;
    this.projectService.getProjectDetails(id).subscribe({
      next: (data) => {
        this.project = data;
        
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
        console.error('Error fetching project details', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadProjectTasks(projectId: number) {
    this.projectService.getTasks(projectId).subscribe({
      next: (data) => {
        this.tasks = data || [];
        this.filterTasks();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching tasks', err);
        this.tasks = [];
        this.filterTasks();
        this.cdr.detectChanges();
      }
    });
  }

  filterTasks() {
    this.filteredTasks = this.tasks.filter(t => {
      const matchKeyword = !this.taskSearchQuery || 
        t.title.toLowerCase().includes(this.taskSearchQuery.toLowerCase()) ||
        (t.description && t.description.toLowerCase().includes(this.taskSearchQuery.toLowerCase()));

      const matchStatus = this.taskStatusFilter === 'All' || t.status === this.taskStatusFilter;

      return matchKeyword && matchStatus;
    });
  }

  onTaskSearch() {
    this.filterTasks();
  }

  onTaskStatusChange() {
    this.filterTasks();
  }

  getKanbanTasks(status: string): ProjectTask[] {
    return this.filteredTasks.filter(t => t.status === status);
  }

  changeViewMode(mode: 'list' | 'kanban') {
    this.viewMode = mode;
    this.cdr.detectChanges();
  }

  selectTab(tab: string) {
    this.activeTab = tab;
    this.cdr.detectChanges();
  }

  formatBudget(val: number): string {
    if (!val) return '0';
    return new Intl.NumberFormat('en-US').format(val);
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

  getAvatarColorClass(name: string): string {
    const map: Record<string, string> = {
      'Abdallah Othman': 'FO',
      'Faisal Al-Otaibi': 'OH',
      'Omar Al-Harbi': 'MS',
      'Mahmoud Salah': 'FO'
    };
    return 'official-avatar ' + (map[name] || 'FO');
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

  downloadFile(filePath?: string) {
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

  getTaskPriorityClass(p: number): string {
    if (p === 1) return 'pri-low';
    if (p === 2) return 'pri-medium';
    if (p === 3) return 'pri-high';
    return '';
  }

  getTaskPriorityLabel(p: number): string {
    if (this.currentLang === 'ar') {
      if (p === 1) return 'منخفض';
      if (p === 2) return 'متوسط';
      return 'مرتفع';
    } else {
      if (p === 1) return 'Low';
      if (p === 2) return 'Medium';
      return 'High';
    }
  }

  navigateToEdit() {
    if (this.projectId) {
      this.router.navigate(['/projects/edit', this.projectId]);
    }
  }

  navigateToCreateTask() {
    if (this.projectId) {
      this.router.navigate([`/projects/details/${this.projectId}/tasks/create`]);
    }
  }

  editTask(taskId: number) {
    if (this.projectId) {
      this.router.navigate([`/projects/details/${this.projectId}/tasks/edit/${taskId}`]);
    }
  }

  deleteTask(taskId: number) {
    if (confirm(this.currentLang === 'ar' ? 'هل أنت متأكد من حذف هذه المهمة؟' : 'Are you sure you want to delete this task?')) {
      this.projectService.deleteTask(taskId).subscribe({
        next: () => {
          this.projectService.triggerSuccessToast();
          if (this.projectId) {
            this.loadProjectTasks(this.projectId);
          }
        },
        error: () => {
          this.projectService.triggerErrorToast();
        }
      });
    }
  }

  getTaskProgressPercent(status: string): number {
    const s = status?.toLowerCase() || '';
    if (s === 'done') return 100;
    if (s === 'in review' || s === 'inreview') return 75;
    if (s === 'in progress' || s === 'inprogress') return 50;
    return 0;
  }

  loadProjectMeetings(projectId: number) {
    this.projectService.getMeetings(projectId).subscribe({
      next: (res) => {
        this.projectMeetings = res || [];
        this.filteredMeetings = [...this.projectMeetings];
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching meetings', err);
        this.projectMeetings = [];
        this.filteredMeetings = [];
        this.cdr.detectChanges();
      }
    });
  }

  onMeetingSearch() {
    if (!this.meetingSearchQuery) {
      this.filteredMeetings = [...this.projectMeetings];
    } else {
      const q = this.meetingSearchQuery.toLowerCase();
      this.filteredMeetings = this.projectMeetings.filter(m =>
        m.title.toLowerCase().includes(q) || (m.description && m.description.toLowerCase().includes(q))
      );
    }
    this.cdr.detectChanges();
  }

  navigateToCreateMeeting() {
    if (this.projectId) {
      this.router.navigate([`/projects/details/${this.projectId}/meetings/create`]);
    }
  }

  navigateToMeetingDetails(meetingId: number) {
    if (this.projectId) {
      this.router.navigate([`/projects/details/${this.projectId}/meetings/details/${meetingId}`]);
    }
  }

  viewTaskDetails(taskId: number) {
    if (this.projectId) {
      this.router.navigate([`/projects/details/${this.projectId}/tasks/details/${taskId}`]);
    }
  }

  deleteMeeting(meetingId: number, event: MouseEvent) {
    event.stopPropagation();
    if (confirm(this.currentLang === 'ar' ? 'هل أنت متأكد من حذف هذا الاجتماع؟' : 'Are you sure you want to delete this meeting?')) {
      this.projectService.deleteMeeting(meetingId).subscribe({
        next: () => {
          this.projectService.triggerSuccessToast();
          if (this.projectId) {
            this.loadProjectMeetings(this.projectId);
          }
        },
        error: () => {
          this.projectService.triggerErrorToast();
        }
      });
    }
  }

  goBack() {
    this.router.navigate(['/projects']);
  }
}
