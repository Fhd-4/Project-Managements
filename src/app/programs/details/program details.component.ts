import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ProgramService, Program, getStatusMeta } from '../program.service';

type LangCode = 'ar' | 'en';

@Component({
  selector: 'app-program-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './program details.component.html',
  styleUrl: './program details.component.scss'
})
export class ProgramDetailsComponent implements OnInit {
  currentLang: LangCode = 'ar';
  program: Program | null = null;
  isLoading = true;
  errorMessage = '';

  translations = {
    ar: {
      title: 'تفاصيل البرنامج',
      sponsor: 'راعي البرنامج',
      manager: 'مدير البرنامج',
      projects: 'المشاريع',
      tasks: 'المهام',
      budget: 'الميزانية',
      documents: 'المستندات',
      description: 'الوصف',
      noDocuments: 'لا توجد مستندات مرفقة',
      edit: 'تعديل'
    },
    en: {
      title: 'Program Details',
      sponsor: 'Program Sponsor',
      manager: 'Program Manager',
      projects: 'Projects',
      tasks: 'Tasks',
      budget: 'Budget',
      documents: 'Documents',
      description: 'Description',
      noDocuments: 'No documents attached',
      edit: 'Edit'
    }
  };

  constructor(
    private programService: ProgramService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    if (typeof window !== 'undefined' && window.localStorage) {
      const savedLang = localStorage.getItem('preferred_lang') as LangCode;
      if (savedLang) this.currentLang = savedLang;
    }
  }

  get t() {
    return this.translations[this.currentLang];
  }

  get isRtl(): boolean {
    return this.currentLang === 'ar';
  }

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.errorMessage = 'Invalid program id.';
      this.isLoading = false;
      return;
    }
    this.programService.getProgramDetails(id).subscribe({
      next: (program) => {
        this.program = program;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage = 'Failed to load program.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  get statusMeta() {
    return this.program ? getStatusMeta(this.program.status) : getStatusMeta(0);
  }

  get progress(): number {
    // API doesn't return a reliable progressPercentage on create; fall back
    // to the status-derived value confirmed with you.
    return this.program?.progressPercentage ?? this.statusMeta.progress;
  }

  fileIcon(url: string): string {
    const ext = url.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return '📕';
    if (ext === 'doc' || ext === 'docx') return '📘';
    return '📄';
  }

  fileName(url: string): string {
    return url.split('/').pop() || url;
  }

  editProgram() {
    if (this.program) this.router.navigate(['/programs/edit', this.program.id]);
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString(this.isRtl ? 'ar-SA' : 'en-US', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  formatBudget(val?: number): string {
    return new Intl.NumberFormat('en-US').format(val || 0);
  }
}