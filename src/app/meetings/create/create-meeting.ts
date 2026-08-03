import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ProjectService } from '../../projects/project.service';

type LangCode = 'ar' | 'en';

@Component({
  selector: 'app-create-meeting',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './create-meeting.html',
  styleUrl: './create-meeting.scss'
})
export class CreateMeetingComponent implements OnInit {
  currentLang: LangCode = 'ar';
  isLoading: boolean = false;
  isEditMode: boolean = false;
  projectId: number | null = null;
  meetingId: number | null = null;
  project: any = null;

  // Form Fields
  title: string = '';
  date: string = '';
  time: string = '11:00 am';
  meetingLink: string = '';
  description: string = '';
  status: string = 'Pending';
  invitedMembers: string = '';
  attachedFiles: Array<{ name: string, progress: number, size: string, type: string, path?: string }> = [];

  // Member Modal Selection
  isMemberModalOpen: boolean = false;
  memberSearchQuery: string = '';
  membersDirectory = [
    { name: 'Abdallah Othman', avatarClass: 'FO', selected: false },
    { name: 'Faisal Al-Otaibi', avatarClass: 'OH', selected: false },
    { name: 'Omar Al-Harbi', avatarClass: 'MS', selected: false },
    { name: 'Mahmoud Salah', avatarClass: 'FO', selected: false },
    { name: 'Omar Mostafa', avatarClass: 'OH', selected: false },
    { name: 'Faisal Al-Sharif', avatarClass: 'MS', selected: false }
  ];

  translations = {
    ar: {
      langLabel: 'English',
      createMeetingTitle: 'إضافة اجتماع',
      editMeetingTitle: 'تعديل الاجتماع',
      meetingTitleLabel: 'عنوان الاجتماع',
      meetingDateLabel: 'تاريخ الاجتماع',
      meetingTimeLabel: 'وقت الاجتماع',
      meetingLinkLabel: 'رابط الاجتماع',
      descriptionLabel: 'الوصف',
      membersInviteLabel: 'دعوة الأعضاء',
      attachFileLabel: 'إرفاق ملف',
      dragDropLabel: 'اسحب ملفك هنا لبدء الرفع',
      orLabel: 'أو',
      uploadBtn: 'رفع ملف',
      filesMaxLabel: 'يمكنك رفع حتى 5 ملفات كحد أقصى',
      supportFormatsLabel: 'يدعم فقط صيغ .jpg و .png و .svg وملفات zip',
      noAttachmentLabel: 'لا يوجد مرفقات',
      saveBtn: 'حفظ الاجتماع',
      createBtn: 'إضافة اجتماع',
      writeHerePlaceholder: 'اكتب هنا',
      noMembersSelected: 'لم يتم اختيار أعضاء بعد',
      cancelBtn: 'إلغاء',
      inviteBtn: 'دعوة',
      searchMemberPlaceholder: 'البحث عن اسم العضو...',
      requiredFields: 'يرجى تعبئة الحقول المطلوبة.',
      successToast: 'تمت العملية بنجاح!',
      errorToast: 'حدث خطأ، يرجى المحاولة لاحقاً.'
    },
    en: {
      langLabel: 'العربية',
      createMeetingTitle: 'Create Meeting',
      editMeetingTitle: 'Edit Meeting',
      meetingTitleLabel: 'Meeting Title',
      meetingDateLabel: 'Meeting Date',
      meetingTimeLabel: 'Meeting Time',
      meetingLinkLabel: 'Meeting Link',
      descriptionLabel: 'Description',
      membersInviteLabel: 'Members Invite',
      attachFileLabel: 'Attach File',
      dragDropLabel: 'Drag your file(s) to start uploading',
      orLabel: 'OR',
      uploadBtn: 'Upload',
      filesMaxLabel: 'You can upload up to 5 files max',
      supportFormatsLabel: 'Only support .jpg, .png, .svg and zip files',
      noAttachmentLabel: 'No Attachment',
      saveBtn: 'Save Meeting',
      createBtn: 'Create Meeting',
      writeHerePlaceholder: 'Write Here',
      noMembersSelected: 'No members selected',
      cancelBtn: 'Cancel',
      inviteBtn: 'Invite',
      searchMemberPlaceholder: 'Search for member name...',
      requiredFields: 'Please fill in the required fields.',
      successToast: 'Action completed successfully!',
      errorToast: 'An error occurred, please try again.'
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
    // Extract projectId from path
    this.route.paramMap.subscribe(params => {
      const projIdStr = params.get('projectId');
      if (projIdStr) {
        this.projectId = parseInt(projIdStr, 10);
        this.loadProjectDetails(this.projectId);
      }

      // Check if editing
      const meetIdStr = params.get('meetingId');
      if (meetIdStr) {
        const id = parseInt(meetIdStr, 10);
        if (!isNaN(id)) {
          this.isEditMode = true;
          this.meetingId = id;
          this.loadMeetingDetails(id);
        }
      } else {
        this.isEditMode = false;
        this.meetingId = null;
        this.resetForm();
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

  loadMeetingDetails(id: number) {
    this.isLoading = true;
    this.projectService.getMeetingDetails(id).subscribe({
      next: (meet) => {
        this.title = meet.title;
        this.date = meet.date ? meet.date.split('T')[0] : '';
        this.time = meet.time || '11:00 am';
        this.meetingLink = meet.meetingLink || '';
        this.description = meet.description || '';
        this.status = meet.status || 'Pending';
        this.invitedMembers = meet.invitedMembers || '';
        this.projectId = meet.projectId;

        // Parse files
        if (meet.attachedFiles) {
          try {
            this.attachedFiles = JSON.parse(meet.attachedFiles);
          } catch {
            this.attachedFiles = [];
          }
        }

        // Pre-check selected members
        const names = this.invitedMembers.split(',').map(n => n.trim());
        this.membersDirectory.forEach(m => {
          m.selected = names.includes(m.name);
        });

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
    const today = new Date();
    this.date = today.toISOString().split('T')[0];
    this.time = '11:00 am';
    this.meetingLink = '';
    this.description = '';
    this.status = 'Pending';
    this.invitedMembers = '';
    this.attachedFiles = [];
    this.membersDirectory.forEach(m => m.selected = false);
  }

  // Members Modal handlers
  openMemberModal() {
    // Sync selections
    const names = this.invitedMembers.split(',').map(n => n.trim());
    this.membersDirectory.forEach(m => {
      m.selected = names.includes(m.name);
    });
    this.isMemberModalOpen = true;
    this.cdr.detectChanges();
  }

  closeMemberModal() {
    this.isMemberModalOpen = false;
    this.cdr.detectChanges();
  }

  get filteredMembers() {
    if (!this.memberSearchQuery) return this.membersDirectory;
    const q = this.memberSearchQuery.toLowerCase();
    return this.membersDirectory.filter(m => m.name.toLowerCase().includes(q));
  }

  applyMembers() {
    const selected = this.membersDirectory.filter(m => m.selected).map(m => m.name);
    this.invitedMembers = selected.join(', ');
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

  // File Upload
  triggerFileInput(fileInput: HTMLInputElement) {
    fileInput.click();
  }

  onFileSelected(event: any) {
    const files = event.target.files;
    if (files && files.length > 0) {
      this.projectService.uploadMeetingFiles(files).subscribe({
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

  saveMeeting() {
    if (!this.title || !this.projectId || !this.date) {
      alert(this.t.requiredFields);
      return;
    }

    this.isLoading = true;
    const payload = {
      title: this.title,
      date: new Date(this.date).toISOString(),
      time: this.time,
      meetingLink: this.meetingLink || null,
      description: this.description || null,
      status: this.status,
      invitedMembers: this.invitedMembers || null,
      attachedFiles: this.attachedFiles.length > 0 ? JSON.stringify(this.attachedFiles) : null,
      projectId: this.projectId
    };

    if (this.isEditMode && this.meetingId !== null) {
      this.projectService.updateMeeting(this.meetingId, payload).subscribe({
        next: () => {
          this.isLoading = false;
          this.projectService.triggerSuccessToast();
          this.router.navigate([`/projects/details/${this.projectId}`], { queryParams: { tab: 'Meetings' } });
        },
        error: () => {
          this.isLoading = false;
          this.projectService.triggerErrorToast();
        }
      });
    } else {
      this.projectService.createMeeting(payload).subscribe({
        next: () => {
          this.isLoading = false;
          this.projectService.triggerSuccessToast();
          this.router.navigate([`/projects/details/${this.projectId}`], { queryParams: { tab: 'Meetings' } });
        },
        error: () => {
          this.isLoading = false;
          this.projectService.triggerErrorToast();
        }
      });
    }
  }

  goBack() {
    if (this.projectId) {
      this.router.navigate([`/projects/details/${this.projectId}`], { queryParams: { tab: 'Meetings' } });
    } else {
      this.router.navigate(['/projects']);
    }
  }
}
