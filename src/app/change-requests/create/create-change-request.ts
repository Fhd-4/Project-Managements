import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ProjectService, Project, ChangeRequest } from '../../projects/project.service';
import { PortfolioService } from '../../portfolios/portfolio.service';
import { ProgramService } from '../../programs/program.service';

type LangCode = 'ar' | 'en';

@Component({
  selector: 'app-create-change-request',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './create-change-request.html',
  styleUrl: './create-change-request.scss'
})
export class CreateChangeRequestComponent implements OnInit {
  currentLang: LangCode = 'ar';
  isEditMode: boolean = false;
  requestId: number | null = null;
  projects: Project[] = [];
  selectedProject: Project | null = null;
  portfoliosList: any[] = [];
  programsList: any[] = [];
  membersList: string[] = ['Salman Ahmed', 'Faisal Al-Otaibi', 'Omar Al-Harbi', 'Mahmoud Salah', 'Faisal Al-Sharif'];

  // Form Fields
  title: string = '';
  changeType: string = 'Digital Product';
  projectId: number | null = null;
  portfolioName: string = 'Digital Products Portfolio';
  programName: string = 'Smart Systems Program';
  priority: string = 'Medium';
  reason: string = '';
  description: string = '';
  programOwner: string = 'Faisal Al-Otaibi';
  programManager: string = 'Mahmoud Salah';
  programSponsor: string = 'Omar Al-Harbi';

  // Current vs Proposed parameters
  currentBudget: number = 0;
  proposedBudget: number = 0;
  currentDeadline: string = '';
  proposedDeadline: string = '';
  currentScope: string = '';
  proposedScope: string = '';
  currentResources: string = '';
  proposedResources: string = '';

  // Attachments
  attachedFiles: Array<{ name: string, progress: number, size: string, type: string, path?: string }> = [];
  isDragging: boolean = false;

  // Translations
  translations = {
    ar: {
      createTitle: 'إنشاء طلب تغيير',
      editTitle: 'تعديل طلب تغيير',
      lblTitle: 'عنوان الطلب',
      lblChangeType: 'نوع التغيير',
      lblPortfolio: 'اسم المحفظة',
      lblProject: 'اسم المشروع',
      lblProgram: 'اسم البرنامج',
      lblPriority: 'الأولوية',
      lblReason: 'سبب التغيير',
      lblDescription: 'تحليل الأثر / التفاصيل',
      sectionVs: 'الوضع الحالي مقابل المقترح',
      lblCurrent: 'الحالي',
      lblProposed: 'المقترح',
      lblBudget: 'الميزانية',
      lblDeadline: 'التاريخ النهائي',
      lblScope: 'النطاق',
      lblResources: 'الموارد',
      sectionAttach: 'المرفقات',
      btnSend: 'إرسال الطلب',
      btnCancel: 'إلغاء',
      dragText: 'اسحب وأفلت الملفات هنا أو انقر للاختيار',
      noFileText: 'لا توجد ملفات مرفقة',
      successCreate: 'تم إنشاء طلب التغيير بنجاح!',
      successUpdate: 'تم تحديث طلب التغيير بنجاح!',
      errorSave: 'حدث خطأ أثناء حفظ الطلب.'
    },
    en: {
      createTitle: 'Create Change Request',
      editTitle: 'Edit Change Request',
      lblTitle: 'Request Title',
      lblChangeType: 'Change Type',
      lblPortfolio: 'Portfolio Name',
      lblProject: 'Project Name',
      lblProgram: 'Program Name',
      lblPriority: 'Priority',
      lblReason: 'Change Reason',
      lblDescription: 'Impact Analysis / Description',
      sectionVs: 'Current VS Proposed',
      lblCurrent: 'Current',
      lblProposed: 'Proposed',
      lblBudget: 'Budget',
      lblDeadline: 'Deadline',
      lblScope: 'Scope',
      lblResources: 'Resources',
      sectionAttach: 'Attachments',
      btnSend: 'Send Request',
      btnCancel: 'Cancel',
      dragText: 'Drag & Drop files here or click to upload',
      noFileText: 'No file attach',
      successCreate: 'Change request created successfully!',
      successUpdate: 'Change request updated successfully!',
      errorSave: 'Error occurred while saving change request.'
    }
  };

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    public projectService: ProjectService,
    private portfolioService: PortfolioService,
    private programService: ProgramService,
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
    this.loadAllProjects();
    this.loadPortfoliosAndPrograms();

    this.route.paramMap.subscribe(params => {
      const idStr = params.get('id');
      if (idStr) {
        const id = parseInt(idStr, 10);
        if (!isNaN(id)) {
          this.isEditMode = true;
          this.requestId = id;
          this.loadRequestDetails(id);
        }
      }
    });
  }

  loadPortfoliosAndPrograms() {
    this.portfolioService.getAllPortfolios().subscribe(res => {
      this.portfoliosList = res || [];
      this.cdr.detectChanges();
    });
    this.programService.getAllPrograms().subscribe(res => {
      this.programsList = res || [];
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
      this.projects = res;
      if (this.projectId) {
        this.onProjectChange();
      }
      this.cdr.detectChanges();
    });
  }

  onProjectChange() {
    const found = this.projects.find(p => p.id === Number(this.projectId));
    if (found) {
      this.selectedProject = found;
      this.currentBudget = found.budget;
      this.currentDeadline = found.endDate ? found.endDate.split('T')[0] : '';
      this.currentScope = found.description || '';
      this.currentResources = found.membersCount 
        ? `Resources ${found.membersCount} Team Members` 
        : 'Resources 6 Team Members';
      
      if (found.portfolioName) this.portfolioName = found.portfolioName;
      if (found.programName) this.programName = found.programName;

      // Auto-set defaults for proposed fields if empty
      if (!this.proposedBudget) this.proposedBudget = this.currentBudget;
      if (!this.proposedDeadline) this.proposedDeadline = this.currentDeadline;
      if (!this.proposedScope) this.proposedScope = this.currentScope;
      if (!this.proposedResources) this.proposedResources = this.currentResources;
    } else {
      this.selectedProject = null;
    }
    this.cdr.detectChanges();
  }

  loadRequestDetails(id: number) {
    this.projectService.getChangeRequestDetails(id).subscribe({
      next: (req) => {
        this.title = req.title;
        this.projectId = req.projectId;
        this.reason = req.reason;
        
        // Parse metadata inside description
        const meta = this.parseDescription(req.description);
        this.changeType = meta.type;
        this.priority = meta.priority;
        this.currentBudget = parseFloat(meta.currentBudget) || 0;
        this.proposedBudget = parseFloat(meta.proposedBudget) || 0;
        this.currentDeadline = meta.currentDeadline;
        this.proposedDeadline = meta.proposedDeadline;
        this.currentScope = meta.currentScope;
        this.proposedScope = meta.proposedScope;
        this.currentResources = meta.currentResources;
        this.proposedResources = meta.proposedResources;
        this.description = meta.actualDescription;

        if (req.attachedFiles) {
          try {
            this.attachedFiles = JSON.parse(req.attachedFiles);
          } catch {
            this.attachedFiles = [];
          }
        }

        // Trigger updates for readonly layouts
        this.onProjectChange();
      },
      error: (err) => {
        console.error('Error loading change request details', err);
      }
    });
  }

  parseDescription(description: string) {
    const meta = {
      type: 'Digital Product',
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

      const descIndex = lines.findIndex(l => l.startsWith('Description:'));
      if (descIndex !== -1) {
        meta.actualDescription = lines.slice(descIndex).join('\n').replace('Description:', '').trim();
      }
    } catch (e) {
      console.error('Error parsing description metadata', e);
    }

    return meta;
  }

  // Files uploading handlers
  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragging = true;
  }

  onDragLeave() {
    this.isDragging = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
    if (event.dataTransfer && event.dataTransfer.files.length > 0) {
      this.uploadFiles(event.dataTransfer.files);
    }
  }

  onFileSelected(event: any) {
    if (event.target.files && event.target.files.length > 0) {
      this.uploadFiles(event.target.files);
    }
  }

  uploadFiles(files: FileList) {
    const newFiles: any[] = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const ext = f.name.split('.').pop() || '';
      const localFile = {
        name: f.name,
        progress: 30,
        size: Math.round(f.size / 1024) + ' KB',
        type: ext,
        path: ''
      };
      this.attachedFiles.push(localFile);
      newFiles.push({ file: f, localRef: localFile });
    }
    this.cdr.detectChanges();

    this.projectService.uploadChangeRequestFiles(files).subscribe({
      next: (resList) => {
        resList.forEach((uploaded: any, index: number) => {
          if (index < newFiles.length) {
            const ref = newFiles[index].localRef;
            ref.path = uploaded.filePath;
            ref.progress = 100;
          }
        });
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.warn('File upload API failed, using local mock fallback paths.', err);
        newFiles.forEach(nf => {
          nf.localRef.progress = 100;
          nf.localRef.path = `/uploads/mock_${Date.now()}_${nf.localRef.name}`;
        });
        this.cdr.detectChanges();
      }
    });
  }

  removeFile(index: number, event: MouseEvent) {
    event.stopPropagation();
    this.attachedFiles.splice(index, 1);
    this.cdr.detectChanges();
  }

  getFileColor(type?: string): string {
    const t = type?.toLowerCase() || '';
    if (t === 'pdf') return '#e53e3e';
    if (t === 'xls' || t === 'xlsx') return '#38a169';
    if (t === 'doc' || t === 'docx') return '#3182ce';
    if (t === 'zip' || t === 'rar') return '#805ad5';
    return '#4a5568';
  }

  onSubmit() {
    if (!this.title) {
      alert(this.currentLang === 'ar' ? 'الرجاء إدخال عنوان الطلب' : 'Please enter Request Title');
      return;
    }
    if (!this.projectId) {
      alert(this.currentLang === 'ar' ? 'الرجاء اختيار المشروع' : 'Please select a Project');
      return;
    }
    if (!this.reason) {
      alert(this.currentLang === 'ar' ? 'الرجاء إدخال سبب التغيير' : 'Please enter Change Reason');
      return;
    }

    const targetProjId = Number(this.projectId);
    if (isNaN(targetProjId) || targetProjId <= 0) {
      alert(this.currentLang === 'ar' ? 'معرف المشروع غير صالح.' : 'Invalid Project ID.');
      return;
    }

    // Mathematical calculations
    const impactCost = this.proposedBudget - this.currentBudget;
    
    let impactTimeDays = 0;
    if (this.currentDeadline && this.proposedDeadline) {
      const curDate = new Date(this.currentDeadline);
      const propDate = new Date(this.proposedDeadline);
      const diffMs = propDate.getTime() - curDate.getTime();
      impactTimeDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    }

    // Format metadata inside Description
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
Description: ${this.description}`;

    const payload = {
      title: this.title,
      description: descriptionPayload,
      reason: this.reason,
      impactCost: impactCost,
      impactTimeDays: impactTimeDays,
      projectId: targetProjId,
      attachedFiles: JSON.stringify(this.attachedFiles)
    };

    console.log('Submitting Change Request Payload:', payload);

    if (this.isEditMode && this.requestId) {
      this.projectService.updateChangeRequest(this.requestId, payload).subscribe({
        next: () => {
          this.projectService.triggerSuccessToast();
          this.router.navigate(['/change-requests']);
        },
        error: (err) => {
          console.error('API Error updating change request:', err);
          this.projectService.triggerErrorToast();
          const errMsg = err.error?.message || err.message || 'Unknown error';
          alert(this.currentLang === 'ar' 
            ? `فشل تحديث الطلب. التفاصيل: ${errMsg}` 
            : `Failed to update request. Details: ${errMsg}`);
        }
      });
    } else {
      this.projectService.createChangeRequest(payload).subscribe({
        next: () => {
          this.projectService.triggerSuccessToast();
          this.router.navigate(['/change-requests']);
        },
        error: (err) => {
          console.error('API Error creating change request:', err);
          this.projectService.triggerErrorToast();
          const errMsg = err.error?.message || err.message || 'Unknown error';
          alert(this.currentLang === 'ar' 
            ? `فشل حفظ وإرسال الطلب. التفاصيل: ${errMsg}` 
            : `Failed to save and send request. Details: ${errMsg}`);
        }
      });
    }
  }

  goBack() {
    this.router.navigate(['/change-requests']);
  }
}
