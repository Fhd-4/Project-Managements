import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ProjectService, Project, ChangeRequest } from '../../projects/project.service';

type LangCode = 'ar' | 'en';

interface ApprovalStep {
  name: string;
  role: string;
  avatar: string;
  status: 'Pending' | 'Approved' | 'Refusing';
  date: string;
}

interface CommentItem {
  author: string;
  role: string;
  avatar: string;
  date: string;
  content: string;
}

@Component({
  selector: 'app-change-request-details',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './change-request-details.html',
  styleUrl: './change-request-details.scss'
})
export class ChangeRequestDetailsComponent implements OnInit {
  currentLang: LangCode = 'ar';
  isLoading: boolean = true;
  requestId: number | null = null;
  statusVal: number = 1;
  request: ChangeRequest | null = null;
  project: Project | null = null;

  // Metadata parameters
  changeType: string = 'Digital Product';
  priority: string = 'Medium';
  portfolioName: string = '';
  programName: string = '';
  programOwner: string = 'Faisal Al-Otaibi';
  programManager: string = 'Mahmoud Salah';
  programSponsor: string = 'Omar Al-Harbi';
  currentBudget: number = 0;
  proposedBudget: number = 0;
  currentDeadline: string = '';
  proposedDeadline: string = '';
  currentScope: string = '';
  proposedScope: string = '';
  currentResources: string = '';
  proposedResources: string = '';
  actualDescription: string = '';

  // Reviewers Flow (Figma mockup Image 4)
  reviewers: ApprovalStep[] = [
    { name: 'Salman Ahmed', role: 'PMO', avatar: 'FO', status: 'Pending', date: '2026-5-10' },
    { name: 'Faisal Al-Otaibi', role: 'Portfolio Owner', avatar: 'FO', status: 'Pending', date: '2026-5-10' },
    { name: 'Omar Al-Harbi', role: 'Portfolio Sponsor', avatar: 'OH', status: 'Approved', date: '2026-5-10' },
    { name: 'Mahmoud Salah', role: 'Portfolio Manager', avatar: 'MS', status: 'Refusing', date: '2026-5-10' }
  ];

  // Attached files list
  attachedFiles: Array<{ name: string, progress: number, size: string, type: string, path?: string }> = [];

  // Comments (Figma mockup Image 5)
  comments: CommentItem[] = [];
  newCommentText: string = '';

  // Translations
  translations = {
    ar: {
      detailsTitle: 'تفاصيل الطلب',
      sectionInfo: 'معلومات التغيير',
      lblDate: 'التاريخ:',
      lblType: 'نوع التغيير:',
      lblRequestedBy: 'مقدم الطلب:',
      lblRequestId: 'معرف الطلب:',
      lblPriority: 'الأولوية:',
      lblStatus: 'الحالة:',
      lblPortfolio: 'اسم المحفظة:',
      lblProgram: 'اسم البرنامج:',
      sectionReason: 'سبب التغيير',
      sectionApproval: 'الاعتمادات والمراجعة',
      sectionVs: 'الوضع الحالي مقابل المقترح',
      lblCurrent: 'الحالي',
      lblProposed: 'المقترح',
      lblBudget: 'الميزانية',
      lblDeadline: 'التاريخ النهائي',
      lblScope: 'النطاق',
      lblResources: 'الموارد',
      sectionImpact: 'تحليل الأثر / التفاصيل',
      sectionAttach: 'المرفقات والمستندات المرفقة',
      sectionComment: 'التعليقات والمناقشة',
      writeCommentPlaceholder: 'اكتب هنا...',
      btnSendComment: 'إرسال',
      toastSuccessStatus: 'تم تحديث حالة طلب التغيير بنجاح!',
      toastErrorStatus: 'فشل تحديث حالة الطلب.'
    },
    en: {
      detailsTitle: 'Request Details',
      sectionInfo: 'Change Information',
      lblDate: 'Date:',
      lblType: 'Change Type:',
      lblRequestedBy: 'Requested By:',
      lblRequestId: 'Request ID:',
      lblPriority: 'Priority:',
      lblStatus: 'Status:',
      lblPortfolio: 'Portfolio Name:',
      lblProgram: 'Program Name:',
      sectionReason: 'Change Reason',
      sectionApproval: 'Approval Flow',
      sectionVs: 'Current VS Proposed',
      lblCurrent: 'Current',
      lblProposed: 'Proposed',
      lblBudget: 'Budget',
      lblDeadline: 'Deadline',
      lblScope: 'Scope',
      lblResources: 'Resources',
      sectionImpact: 'Impact Analysis',
      sectionAttach: 'Attachments',
      sectionComment: 'Add Comment',
      writeCommentPlaceholder: 'Write Here',
      btnSendComment: 'Send',
      toastSuccessStatus: 'Change request status updated successfully!',
      toastErrorStatus: 'Failed to update request status.'
    }
  };

  constructor(
    private router: Router,
    private route: ActivatedRoute,
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
    this.route.paramMap.subscribe(params => {
      const idStr = params.get('id');
      if (idStr) {
        const id = parseInt(idStr, 10);
        if (!isNaN(id)) {
          this.requestId = id;
          this.loadRequestDetails(id);
        }
      }
    });
  }

  get t() {
    return this.translations[this.currentLang];
  }

  get isRtl(): boolean {
    return this.currentLang === 'ar';
  }

  loadRequestDetails(id: number) {
    this.isLoading = true;
    this.projectService.getChangeRequestDetails(id).subscribe({
      next: (req) => {
        this.request = req;
        this.statusVal = req.status;
        
        // Parse metadata inside description
        const meta = this.parseDescription(req.description);
        this.changeType = meta.type;
        this.priority = meta.priority;
        this.portfolioName = meta.portfolioName;
        this.programName = meta.programName;
        this.programOwner = meta.programOwner;
        this.programManager = meta.programManager;
        this.programSponsor = meta.programSponsor;
        this.currentBudget = parseFloat(meta.currentBudget) || 0;
        this.proposedBudget = parseFloat(meta.proposedBudget) || 0;
        this.currentDeadline = meta.currentDeadline;
        this.proposedDeadline = meta.proposedDeadline;
        this.currentScope = meta.currentScope;
        this.proposedScope = meta.proposedScope;
        this.currentResources = meta.currentResources;
        this.proposedResources = meta.proposedResources;
        this.actualDescription = meta.actualDescription;

        // Dynamic update of reviewers list based on metadata
        this.reviewers = [
          { name: 'Salman Ahmed', role: 'PMO', avatar: 'FO', status: 'Pending', date: '2026-5-10' },
          { name: this.programOwner || 'Faisal Al-Otaibi', role: 'Portfolio Owner', avatar: 'FO', status: 'Pending', date: '2026-5-10' },
          { name: this.programSponsor || 'Omar Al-Harbi', role: 'Portfolio Sponsor', avatar: 'OH', status: 'Approved', date: '2026-5-10' },
          { name: this.programManager || 'Mahmoud Salah', role: 'Portfolio Manager', avatar: 'MS', status: 'Refusing', date: '2026-5-10' }
        ];

        if (req.attachedFiles) {
          try {
            this.attachedFiles = JSON.parse(req.attachedFiles);
          } catch {
            this.attachedFiles = [];
          }
        }

        // Load project name
        this.projectService.getProjectDetails(req.projectId).subscribe({
          next: (proj) => {
            this.project = proj;
            this.loadComments();
            this.isLoading = false;
            this.cdr.detectChanges();
          },
          error: () => {
            this.loadComments();
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

  parseDescription(description: string) {
    const meta = {
      type: 'Digital Product',
      priority: 'Medium',
      portfolioName: '',
      programName: '',
      programOwner: 'Faisal Al-Otaibi',
      programManager: 'Mahmoud Salah',
      programSponsor: 'Omar Al-Harbi',
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
        else if (line.startsWith('PortfolioName:')) meta.portfolioName = line.replace('PortfolioName:', '').trim();
        else if (line.startsWith('ProgramName:')) meta.programName = line.replace('ProgramName:', '').trim();
        else if (line.startsWith('ProgramOwner:')) meta.programOwner = line.replace('ProgramOwner:', '').trim();
        else if (line.startsWith('ProgramManager:')) meta.programManager = line.replace('ProgramManager:', '').trim();
        else if (line.startsWith('ProgramSponsor:')) meta.programSponsor = line.replace('ProgramSponsor:', '').trim();
        else if (line.startsWith('CurrentBudget:')) meta.currentBudget = line.replace('CurrentBudget:', '').trim();
        else if (line.startsWith('ProposedBudget:')) meta.proposedBudget = line.replace('ProposedBudget:', '').trim();
        else if (line.startsWith('CurrentDeadline:')) meta.currentDeadline = line.replace('CurrentDeadline:', '').trim();
        else if (line.startsWith('ProposedDeadline:')) meta.proposedDeadline = line.replace('ProposedDeadline:', '').trim();
        else if (line.startsWith('CurrentScope:')) meta.currentScope = line.replace('CurrentScope:', '').trim();
        else if (line.startsWith('ProposedScope:')) meta.proposedScope = line.replace('ProposedScope:', '').trim();
        else if (line.startsWith('CurrentResources:')) meta.currentResources = line.replace('CurrentResources:', '').trim();
        else if (line.startsWith('ProposedResources:')) meta.proposedResources = line.replace('ProposedResources:', '').trim();
      });

      const descIndex = lines.findIndex(l => l.startsWith('Description:'));
      if (descIndex !== -1) {
        meta.actualDescription = lines.slice(descIndex).join('\n').replace('Description:', '').trim();
      }
    } catch (e) {
      console.error('Error parsing description metadata', e);
    }

    return meta;
  }

  getStatusLabel(status: number): string {
    const s = Number(status);
    if (s === 1) return 'Pending';
    if (s === 2) return 'Approved';
    return 'Rejected';
  }

  saveUpdates() {
    if (!this.request || !this.requestId) return;
    this.isLoading = true;

    // Format description metadata payload
    const descriptionPayload = 
`Type: ${this.changeType}
Priority: ${this.priority}
PortfolioName: ${this.portfolioName}
ProgramName: ${this.programName}
ProgramOwner: ${this.programOwner}
ProgramManager: ${this.programManager}
ProgramSponsor: ${this.programSponsor}
CurrentBudget: ${this.currentBudget}
ProposedBudget: ${this.proposedBudget}
CurrentDeadline: ${this.currentDeadline}
ProposedDeadline: ${this.proposedDeadline}
CurrentScope: ${this.currentScope}
ProposedScope: ${this.proposedScope}
CurrentResources: ${this.currentResources}
ProposedResources: ${this.proposedResources}
Description: ${this.actualDescription}`;

    const payload = {
      title: this.request.title,
      description: descriptionPayload,
      reason: this.request.reason,
      impactCost: this.request.impactCost,
      impactTimeDays: this.request.impactTimeDays,
      projectId: this.request.projectId,
      attachedFiles: this.request.attachedFiles || '[]'
    };

    // First update priority (inside description)
    this.projectService.updateChangeRequest(this.requestId, payload).subscribe({
      next: () => {
        // Then update status
        const statusObs = Number(this.statusVal) === 2 
          ? this.projectService.approveChangeRequest(this.requestId!) 
          : Number(this.statusVal) === 3 
            ? this.projectService.rejectChangeRequest(this.requestId!) 
            : this.projectService.updateChangeRequest(this.requestId!, { ...payload, status: 1 }); // Pending
        
        statusObs.subscribe({
          next: () => {
            this.projectService.triggerSuccessToast();
            this.loadRequestDetails(this.requestId!);
          },
          error: (err) => {
            console.error('Failed to update status', err);
            this.projectService.triggerErrorToast();
            this.isLoading = false;
            this.cdr.detectChanges();
          }
        });
      },
      error: (err) => {
        console.error('Failed to update request info', err);
        this.projectService.triggerErrorToast();
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  updateRequestStatus(statusValue: number) {
    if (!this.requestId) return;

    if (statusValue === 2) {
      this.projectService.approveChangeRequest(this.requestId).subscribe({
        next: () => {
          this.projectService.triggerSuccessToast();
          if (this.request) this.request.status = 2;
          this.statusVal = 2;
          this.cdr.detectChanges();
        },
        error: () => {
          this.projectService.triggerErrorToast();
        }
      });
    } else if (statusValue === 3) {
      this.projectService.rejectChangeRequest(this.requestId).subscribe({
        next: () => {
          this.projectService.triggerSuccessToast();
          if (this.request) this.request.status = 3;
          this.statusVal = 3;
          this.cdr.detectChanges();
        },
        error: () => {
          this.projectService.triggerErrorToast();
        }
      });
    }
  }

  // Reviewer box interactive toggle (premium feature)
  toggleReviewerStatus(index: number) {
    const r = this.reviewers[index];
    if (r.status === 'Pending') r.status = 'Approved';
    else if (r.status === 'Approved') r.status = 'Refusing';
    else r.status = 'Pending';
    this.cdr.detectChanges();
  }

  // Comments loading and persistence
  loadComments() {
    if (!this.requestId) return;
    this.projectService.getComments(this.requestId).subscribe({
      next: (res) => {
        this.comments = res.map(c => ({
          author: c.userName || 'Abdallah Othman',
          role: 'Project Manager',
          avatar: (c.userName || 'Abdallah Othman').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(),
          date: new Date(c.createdDate).toISOString().split('T')[0],
          content: c.text
        }));
        this.cdr.detectChanges();
      }
    });
  }

  addComment() {
    if (!this.newCommentText.trim() || !this.requestId) return;

    this.projectService.addComment(this.requestId, this.newCommentText).subscribe({
      next: () => {
        this.newCommentText = '';
        this.loadComments();
      },
      error: (err) => {
        console.error('Failed to add comment', err);
        this.projectService.triggerErrorToast();
      }
    });
  }

  // Add Attachments from details view page
  onFileSelected(event: any) {
    const files = event.target.files as FileList;
    if (!files || files.length === 0) return;

    this.isLoading = true;
    this.projectService.uploadChangeRequestFiles(files).subscribe({
      next: (res) => {
        const currentList = [...this.attachedFiles];
        for (let i = 0; i < res.length; i++) {
          currentList.push({
            name: res[i].originalName,
            progress: 100,
            size: '0 KB',
            type: res[i].originalName.split('.').pop() || 'file',
            path: res[i].filePath
          });
        }
        this.updateRequestAttachments(currentList);
      },
      error: () => {
        // Fallback for LocalStorage
        const currentList = [...this.attachedFiles];
        for (let i = 0; i < files.length; i++) {
          const f = files[i];
          currentList.push({
            name: f.name,
            progress: 100,
            size: `${(f.size / 1024).toFixed(1)} KB`,
            type: f.name.split('.').pop() || 'file',
            path: ''
          });
        }
        this.updateRequestAttachments(currentList);
      }
    });
  }

  updateRequestAttachments(newFilesList: any[]) {
    if (!this.request || !this.requestId) return;

    // Gather payload metadata
    const descriptionPayload = 
`Type: ${this.changeType}
Priority: ${this.priority}
PortfolioName: ${this.portfolioName}
ProgramName: ${this.programName}
ProgramOwner: ${this.programOwner}
ProgramManager: ${this.programManager}
ProgramSponsor: ${this.programSponsor}
CurrentBudget: ${this.currentBudget}
ProposedBudget: ${this.proposedBudget}
CurrentDeadline: ${this.currentDeadline}
ProposedDeadline: ${this.proposedDeadline}
CurrentScope: ${this.currentScope}
ProposedScope: ${this.proposedScope}
CurrentResources: ${this.currentResources}
ProposedResources: ${this.proposedResources}
Description: ${this.actualDescription}`;

    const payload = {
      title: this.request.title,
      description: descriptionPayload,
      reason: this.request.reason,
      impactCost: this.request.impactCost,
      impactTimeDays: this.request.impactTimeDays,
      projectId: this.request.projectId,
      attachedFiles: JSON.stringify(newFilesList)
    };

    this.projectService.updateChangeRequest(this.requestId, payload).subscribe({
      next: () => {
        this.projectService.triggerSuccessToast();
        this.loadRequestDetails(this.requestId!);
      },
      error: () => {
        this.projectService.triggerErrorToast();
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
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
    this.router.navigate(['/change-requests']);
  }
}
