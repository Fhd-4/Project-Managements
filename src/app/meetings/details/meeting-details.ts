import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ProjectService, ProjectMeeting } from '../../projects/project.service';

type LangCode = 'ar' | 'en';

@Component({
  selector: 'app-meeting-details',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './meeting-details.html',
  styleUrl: './meeting-details.scss'
})
export class MeetingDetailsComponent implements OnInit {
  currentLang: LangCode = 'ar';
  isLoading: boolean = true;
  projectId: number | null = null;
  meetingId: number | null = null;
  meeting: ProjectMeeting | null = null;
  project: any = null;
  attachedFiles: Array<{ name: string, progress: number, size: string, type: string, path?: string }> = [];

  // Edit Members Modal
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
      meetingDetailsTitle: 'تفاصيل الاجتماع',
      statusLabel: 'الحالة:',
      descriptionHeader: 'الوصف',
      documentsHeader: 'المستندات:',
      membersHeader: 'دعوة الأعضاء:',
      editBtn: 'تعديل',
      deleteBtn: 'حذف',
      closeBtn: 'إغلاق',
      noAttachment: 'لا يوجد مرفقات لهذا الاجتماع.',
      searchPlaceholder: 'البحث عن اسم العضو...',
      cancelBtn: 'إلغاء',
      inviteBtn: 'دعوة',
      noMembersSelected: 'لم يتم اختيار أعضاء بعد',
      successToast: 'تم تحديث الاجتماع بنجاح!'
    },
    en: {
      langLabel: 'العربية',
      meetingDetailsTitle: 'Meeting Details',
      statusLabel: 'Status:',
      descriptionHeader: 'Description',
      documentsHeader: 'Documents:',
      membersHeader: 'Members Invite:',
      editBtn: 'Edit',
      deleteBtn: 'Delete',
      closeBtn: 'Close',
      noAttachment: 'No attachments for this meeting.',
      searchPlaceholder: 'Search for member name...',
      noMembersSelected: 'No members selected',
      cancelBtn: 'Cancel',
      inviteBtn: 'Invite',
      successToast: 'Meeting updated successfully!'
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

      const meetIdStr = params.get('meetingId');
      if (meetIdStr) {
        this.meetingId = parseInt(meetIdStr, 10);
        this.loadMeetingDetails(this.meetingId);
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
      next: (data) => {
        this.meeting = data;
        
        // Parse attached files
        if (data.attachedFiles) {
          try {
            this.attachedFiles = JSON.parse(data.attachedFiles);
          } catch {
            this.attachedFiles = [];
          }
        } else {
          this.attachedFiles = [];
        }

        // Setup members checkboxes
        const names = (data.invitedMembers || '').split(',').map(n => n.trim());
        this.membersDirectory.forEach(m => {
          m.selected = names.includes(m.name);
        });

        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching meeting details', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  updateMeetingStatus(newStatus: string) {
    if (!this.meeting || !this.meetingId) return;

    this.meeting.status = newStatus;
    const payload = {
      title: this.meeting.title,
      date: this.meeting.date,
      time: this.meeting.time,
      meetingLink: this.meeting.meetingLink,
      description: this.meeting.description,
      status: newStatus,
      invitedMembers: this.meeting.invitedMembers,
      attachedFiles: this.meeting.attachedFiles,
      projectId: this.meeting.projectId
    };

    this.projectService.updateMeeting(this.meetingId, payload).subscribe({
      next: () => {
        this.projectService.triggerSuccessToast();
        this.cdr.detectChanges();
      },
      error: () => {
        this.projectService.triggerErrorToast();
      }
    });
  }

  openMemberModal() {
    const names = (this.meeting?.invitedMembers || '').split(',').map(n => n.trim());
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
    if (!this.meeting || !this.meetingId) return;

    const selected = this.membersDirectory.filter(m => m.selected).map(m => m.name);
    const newMembersList = selected.join(', ');

    this.meeting.invitedMembers = newMembersList;
    
    const payload = {
      title: this.meeting.title,
      date: this.meeting.date,
      time: this.meeting.time,
      meetingLink: this.meeting.meetingLink,
      description: this.meeting.description,
      status: this.meeting.status,
      invitedMembers: newMembersList || null,
      attachedFiles: this.meeting.attachedFiles,
      projectId: this.meeting.projectId
    };

    this.projectService.updateMeeting(this.meetingId, payload).subscribe({
      next: () => {
        this.projectService.triggerSuccessToast();
        this.closeMemberModal();
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
    const member = this.membersDirectory.find(m => m.name === name.trim());
    return member?.avatarClass || 'FO';
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
      this.router.navigate([`/projects/details/${this.projectId}`], { queryParams: { tab: 'Meetings' } });
    } else {
      this.router.navigate(['/projects']);
    }
  }
}
