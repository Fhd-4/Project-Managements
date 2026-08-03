import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ProjectService, ProjectTask } from '../../projects/project.service';

type LangCode = 'ar' | 'en';

@Component({
  selector: 'app-task-details',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './task-details.html',
  styleUrl: './task-details.scss'
})
export class TaskDetailsComponent implements OnInit {
  currentLang: LangCode = 'ar';
  isLoading: boolean = true;
  projectId: number | null = null;
  taskId: number | null = null;
  task: ProjectTask | null = null;
  project: any = null;
  attachedFiles: Array<{ name: string, progress: number, size: string, type: string, path?: string }> = [];

  translations = {
    ar: {
      langLabel: 'English',
      taskDetailsTitle: 'تفاصيل المهمة',
      statusLabel: 'الحالة:',
      priorityLabel: 'الأولوية:',
      dueDateLabel: 'تاريخ الاستحقاق:',
      assigneeLabel: 'المسؤول:',
      descriptionHeader: 'الوصف',
      documentsHeader: 'المرفقات:',
      noAttachment: 'لا يوجد مرفقات لهذه المهمة.',
      editBtn: 'تعديل',
      deleteBtn: 'حذف',
      closeBtn: 'إغلاق',
      successToast: 'تم تحديث المهمة بنجاح!'
    },
    en: {
      langLabel: 'العربية',
      taskDetailsTitle: 'Task Details',
      statusLabel: 'Status:',
      priorityLabel: 'Priority:',
      dueDateLabel: 'Due Date:',
      assigneeLabel: 'Assignee:',
      descriptionHeader: 'Description',
      documentsHeader: 'Attached Files:',
      noAttachment: 'No attachments for this task.',
      editBtn: 'Edit',
      deleteBtn: 'Delete',
      closeBtn: 'Close',
      successToast: 'Task updated successfully!'
    }
  };

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private projectService: ProjectService,
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
    this.route.paramMap.subscribe(params => {
      const projIdStr = params.get('projectId');
      if (projIdStr) {
        this.projectId = parseInt(projIdStr, 10);
        this.loadProjectDetails(this.projectId);
      }

      const taskIdStr = params.get('id');
      if (taskIdStr) {
        this.taskId = parseInt(taskIdStr, 10);
        this.loadTaskDetails(this.taskId);
      }
    });
  }

  get t() {
    return this.translations[this.currentLang];
  }

  get isRtl(): boolean {
    return this.currentLang === 'ar';
  }

  toggleLang() {
    this.currentLang = this.currentLang === 'ar' ? 'en' : 'ar';
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('preferred_lang', this.currentLang);
    }
    this.cdr.detectChanges();
  }

  loadProjectDetails(id: number) {
    this.projectService.getProjectDetails(id).subscribe(res => {
      this.project = res;
      this.cdr.detectChanges();
    });
  }

  loadTaskDetails(id: number) {
    this.isLoading = true;
    this.projectService.getTasks(undefined).subscribe({
      next: (taskList) => {
        const found = taskList.find(t => t.id === id);
        if (found) {
          this.task = found;
          if (found.attachedFiles) {
            try {
              this.attachedFiles = JSON.parse(found.attachedFiles);
            } catch {
              this.attachedFiles = [];
            }
          } else {
            this.attachedFiles = [];
          }
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching task details', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  updateTaskStatus(newStatus: string) {
    if (!this.task || !this.taskId) return;

    this.task.status = newStatus;
    const payload = {
      title: this.task.title,
      description: this.task.description,
      status: newStatus,
      priority: this.task.priority,
      dueDate: this.task.dueDate,
      projectId: this.task.projectId,
      assigneeName: this.task.assigneeName,
      attachedFiles: this.task.attachedFiles
    };

    this.projectService.updateTask(this.taskId, payload).subscribe({
      next: () => {
        this.projectService.triggerSuccessToast();
        this.cdr.detectChanges();
      },
      error: () => {
        this.projectService.triggerErrorToast();
      }
    });
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
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const classes = ['FO', 'OH', 'MS'];
    return classes[hash % classes.length];
  }

  getPriorityLabel(priority?: number): string {
    if (priority === 4) return 'Critical';
    if (priority === 3) return 'High';
    if (priority === 2) return 'Medium';
    return 'Low';
  }

  getPriorityClass(priority?: number): string {
    if (priority === 4) return 'critical';
    if (priority === 3) return 'high';
    if (priority === 2) return 'medium';
    return 'low';
  }

  getFileColor(type?: string): string {
    const t = type?.toLowerCase() || '';
    if (t === 'pdf') return '#e53e3e';
    if (t === 'xls' || t === 'xlsx') return '#38a169';
    if (t === 'doc' || t === 'docx') return '#3182ce';
    if (t === 'zip' || t === 'rar') return '#805ad5';
    return '#4a5568';
  }

  downloadFile(path?: string) {
    if (path) {
      window.open(path, '_blank');
    }
  }

  goBack() {
    if (this.projectId) {
      this.router.navigate([`/projects/details/${this.projectId}`], { queryParams: { tab: 'Tasks' } });
    } else {
      this.router.navigate(['/tasks']);
    }
  }
}
