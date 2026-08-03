import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ProjectService, Project, ProjectTask } from '../../projects/project.service';

type LangCode = 'ar' | 'en';

interface Member {
  name: string;
  avatarClass: string;
  selected: boolean;
}

@Component({
  selector: 'app-create-task',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './create-task.html',
  styleUrl: './create-task.scss'
})
export class CreateTaskComponent implements OnInit {
  currentLang: LangCode = 'ar';
  isEditMode: boolean = false;
  taskId: number | null = null;
  projectId: number | null = null;
  isLoading: boolean = false;

  project: Project | null = null;
  isProjectLocked: boolean = true;
  projectsList: Project[] = [];

  // Form Fields
  title: string = '';
  description: string = '';
  status: string = 'To Do';
  priority: number = 2; // Medium
  startDate: string = '';
  endDate: string = ''; // Maps to DueDate
  assigneeName: string = '';

  // Assign Member Overlay Modal
  isMemberModalOpen: boolean = false;
  memberSearchQuery: string = '';
  membersDirectory: Member[] = [
    { name: 'Omar Mostafa', avatarClass: 'OH', selected: false },
    { name: 'Abdallah Othman', avatarClass: 'FO', selected: false },
    { name: 'Faisal Al-Otaibi', avatarClass: 'OH', selected: false },
    { name: 'Omar Al-Harbi', avatarClass: 'MS', selected: false },
    { name: 'Mahmoud Salah', avatarClass: 'FO', selected: false },
    { name: 'Faisal Al-Sharif', avatarClass: 'MS', selected: false }
  ];

  // Mock File Attachments for UI
  attachedFiles: Array<{ name: string, progress: number, size: string, type: string, path?: string }> = [];

  // Toasts
  showSuccessToast: boolean = false;
  showErrorToast: boolean = false;

  translations = {
    ar: {
      langLabel: 'English',
      createTaskTitle: 'إضافة مهمة',
      editTaskTitle: 'تعديل المهمة',
      lblTaskName: 'اسم المهمة',
      lblStatus: 'الحالة',
      lblPriority: 'الأولوية',
      lblStartDate: 'تاريخ البدء',
      lblEndDate: 'تاريخ الانتهاء',
      lblAssignTo: 'إسناد إلى:',
      lblDescription: 'الوصف',
      lblAttachFile: 'إرفاق ملف',
      lblNoMembers: 'لم يتم اختيار مسؤولين بعد',
      btnCancel: 'إلغاء',
      btnAssign: 'تعيين',
      btnAdd: 'إضافة مهمة',
      btnSave: 'حفظ التعديلات',
      priorityLow: 'منخفض',
      priorityMedium: 'متوسط',
      priorityHigh: 'مرتفع',
      priorityCritical: 'هام جداً',
      searchMembers: 'البحث باسم الموظف...',
      modalTitle: 'تعيين المهمة إلى:'
    },
    en: {
      langLabel: 'العربية',
      createTaskTitle: 'Create Task',
      editTaskTitle: 'Edit Task',
      lblTaskName: 'Task Name',
      lblStatus: 'Status',
      lblPriority: 'Priority',
      lblStartDate: 'Start Date',
      lblEndDate: 'End Date',
      lblAssignTo: 'Assign to:',
      lblDescription: 'Description',
      lblAttachFile: 'Attach File',
      lblNoMembers: 'No members selected',
      btnCancel: 'Cancel',
      btnAssign: 'Assign',
      btnAdd: 'Add Task',
      btnSave: 'Save Changes',
      priorityLow: 'Low',
      priorityMedium: 'Medium',
      priorityHigh: 'High',
      priorityCritical: 'Critical',
      searchMembers: 'Search for member name',
      modalTitle: 'Assign task to:'
    }
  };

  constructor(
    private projectService: ProjectService,
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
  }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const projectIdStr = params.get('projectId');
      const taskIdStr = params.get('id');

      if (projectIdStr) {
        const parsedId = parseInt(projectIdStr, 10);
        if (parsedId > 0) {
          this.projectId = parsedId;
          this.isProjectLocked = true;
          this.loadProjectDetails(parsedId);
        } else {
          this.projectId = null;
          this.isProjectLocked = false;
          this.loadAllProjects();
        }
      } else {
        this.projectId = null;
        this.isProjectLocked = false;
        this.loadAllProjects();
      }

      if (taskIdStr) {
        this.isEditMode = true;
        this.taskId = parseInt(taskIdStr, 10);
        this.loadTaskDetails(this.taskId);
      } else {
        this.isEditMode = false;
        this.taskId = null;
        this.resetForm();
      }
    });

    this.projectService.successToast$.subscribe(val => {
      this.showSuccessToast = val;
      this.cdr.detectChanges();
    });

    this.projectService.errorToast$.subscribe(val => {
      this.showErrorToast = val;
      this.cdr.detectChanges();
    });
  }

  get t() {
    return this.translations[this.currentLang];
  }

  get isRtl(): boolean {
    return this.currentLang === 'ar';
  }

  loadAllProjects() {
    this.projectService.getProjects().subscribe(res => {
      this.projectsList = res || [];
      this.cdr.detectChanges();
    });
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
        const task = taskList.find(t => t.id === id);
        if (task) {
          this.title = task.title;
          this.description = task.description || '';
          this.status = task.status;
          this.priority = task.priority || 2;
          this.endDate = task.dueDate ? task.dueDate.split('T')[0] : '';
          this.startDate = task.createdDate ? task.createdDate.split('T')[0] : '';
          this.assigneeName = task.assigneeName || '';
          this.projectId = task.projectId;

          // Pre-check all assignee matching names in list
          const names = this.assigneeName.split(',').map(n => n.trim());
          this.membersDirectory.forEach(m => {
            m.selected = names.includes(m.name);
          });

          // Load attached files list
          if (task.attachedFiles) {
            try {
              this.attachedFiles = JSON.parse(task.attachedFiles);
            } catch {
              this.attachedFiles = [];
            }
          }
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  resetForm() {
    this.title = '';
    this.description = '';
    this.status = 'To Do';
    this.priority = 2;
    const today = new Date();
    this.startDate = today.toISOString().split('T')[0];
    this.endDate = new Date(today.setDate(today.getDate() + 14)).toISOString().split('T')[0];
    this.assigneeName = '';
    this.membersDirectory.forEach(m => m.selected = false);
    this.attachedFiles = [];
  }

  openMemberModal() {
    this.isMemberModalOpen = true;
    this.cdr.detectChanges();
  }

  closeMemberModal() {
    this.isMemberModalOpen = false;
    this.cdr.detectChanges();
  }

  getFilteredMembers(): Member[] {
    if (!this.memberSearchQuery) return this.membersDirectory;
    return this.membersDirectory.filter(m => 
      m.name.toLowerCase().includes(this.memberSearchQuery.toLowerCase())
    );
  }

  toggleMemberSelection(member: Member) {
    member.selected = !member.selected;
  }

  isAllMembersSelected(): boolean {
    return this.membersDirectory.length > 0 && this.membersDirectory.every(m => m.selected);
  }

  toggleSelectAllMembers() {
    const allSelected = this.isAllMembersSelected();
    this.membersDirectory.forEach(m => m.selected = !allSelected);
  }

  applyAssignment() {
    const selected = this.membersDirectory.filter(m => m.selected).map(m => m.name);
    this.assigneeName = selected.join(', ');
    this.closeMemberModal();
  }

  getInitials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  getAssigneeAvatarClass(name: string): string {
    const member = this.membersDirectory.find(m => m.name === name);
    return 'small-member-avatar ' + (member?.avatarClass || 'FO');
  }

  onFileSelected(event: any) {
    const files = event.target.files;
    if (files && files.length > 0) {
      this.projectService.uploadTaskFiles(files).subscribe({
        next: (res) => {
          if (res) {
            res.forEach((file: any) => {
              this.attachedFiles.push({
                name: file.originalName,
                progress: 100,
                size: 'N/A',
                type: file.originalName.split('.').pop() || 'FILE',
                path: file.filePath
              });
            });
          }
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('File upload failed', err);
          this.projectService.triggerErrorToast();
        }
      });
    }
  }

  removeFile(index: number) {
    this.attachedFiles.splice(index, 1);
    this.cdr.detectChanges();
  }

  formatBudget(val?: number): string {
    if (!val) return '0';
    return new Intl.NumberFormat('en-US').format(val);
  }

  saveTask() {
    if (!this.title || !this.projectId) {
      this.projectService.triggerErrorToast();
      return;
    }

    this.isLoading = true;
    const resolvedDueDate = this.endDate
      ? new Date(this.endDate).toISOString()
      : new Date().toISOString();

    const payload = {
      title: this.title,
      description: this.description,
      status: this.status,
      priority: this.priority,
      dueDate: resolvedDueDate,
      projectId: this.projectId,
      assigneeName: this.assigneeName || null,
      attachedFiles: this.attachedFiles.length > 0 ? JSON.stringify(this.attachedFiles) : null
    };

    if (this.isEditMode && this.taskId !== null) {
      this.projectService.updateTask(this.taskId, payload).subscribe({
        next: () => {
          this.projectService.triggerSuccessToast();
          if (this.isProjectLocked && this.projectId) {
            this.router.navigate(['/projects/details', this.projectId]);
          } else {
            this.router.navigate(['/tasks']);
          }
        },
        error: () => {
          this.isLoading = false;
          this.projectService.triggerErrorToast();
          this.cdr.detectChanges();
        }
      });
    } else {
      this.projectService.createTask(payload).subscribe({
        next: () => {
          this.projectService.triggerSuccessToast();
          if (this.isProjectLocked && this.projectId) {
            this.router.navigate(['/projects/details', this.projectId]);
          } else {
            this.router.navigate(['/tasks']);
          }
        },
        error: () => {
          this.isLoading = false;
          this.projectService.triggerErrorToast();
          this.cdr.detectChanges();
        }
      });
    }
  }

  goBack() {
    if (this.isProjectLocked && this.projectId) {
      this.router.navigate(['/projects/details', this.projectId]);
    } else {
      this.router.navigate(['/tasks']);
    }
  }
}
