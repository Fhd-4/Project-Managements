import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, BehaviorSubject, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { API_CONFIG } from '../api.config';

export interface Project {
  id: number;
  name: string;
  description?: string;
  budget: number;
  status: string; // Active, Completed, OnHold, Rejected
  priority: number; // 1 = Low, 2 = Medium, 3 = High
  startDate: string;
  endDate: string;
  managerName: string;
  portfolioName?: string;
  portfolioId: number;
  programName?: string;
  programId?: number;
  attachedFiles?: string;
  createdDate?: string;
  tasksCount?: number;
  membersCount?: number;
  category?: string;
}

export interface ProjectTask {
  id: number;
  title: string;
  description?: string;
  status: string; // "To Do", "In Progress", "In Review", "Done"
  priority: number; // 1 = Low, 2 = Medium, 3 = High
  dueDate?: string;
  createdDate: string;
  projectId: number;
  projectName?: string;
  assigneeName?: string;
  attachedFiles?: string;
}

export interface ProjectMeeting {
  id: number;
  title: string;
  date: string;
  time: string;
  meetingLink?: string;
  description?: string;
  status: string; // Pending, Approved, Completed, Cancelled
  invitedMembers?: string; // Comma-separated names
  attachedFiles?: string;
  projectId: number;
  projectName?: string;
  createdDate?: string;
}

export interface ChangeRequest {
  id: number;
  title: string;
  description: string;
  reason: string;
  impactCost: number;
  impactTimeDays: number;
  status: number; // 1 = Pending, 2 = Approved, 3 = Rejected
  projectId: number;
  projectName?: string;
  requestedById: string;
  requestedByUserName?: string;
  approvedById?: string;
  approvedByUserName?: string;
  requestDate: string;
  actionDate?: string;
  attachedFiles?: string;
}
export interface ChangeRequestComment {
  id: number;
  changeRequestId: number;
  userId: string;
  userName: string;
  text: string;
  createdDate: string;
}
export interface AppUser {
  id: string;
  userName: string;
  email: string;
  phoneNumber: string;
  role: string;
  nameAr?: string;
  nameEn?: string;
  titleAr?: string;
  titleEn?: string;
  createdDate: string;
  isActive: boolean;
}
export interface UserPortfolioDto {
  id: number;
  name: string;
  category: string;
  programsCount: number;
  projectsCount: number;
  progress: number;
  status: string;
}
export interface UserProgramDto {
  id: number;
  name: string;
  category: string;
  projectsCount: number;
  progress: number;
  status: string;
}
export interface UserProjectDto {
  id: number;
  name: string;
  category: string;
  tasksCount: number;
  progress: number;
  status: string;
}
export interface UserProfileDto {
  id: string;
  userName: string;
  email: string;
  phoneNumber: string;
  role: string;
  nameAr?: string;
  nameEn?: string;
  titleAr?: string;
  titleEn?: string;
  createdDate: string;
  isActive: boolean;
  portfolios: UserPortfolioDto[];
  programs: UserProgramDto[];
  projects: UserProjectDto[];
}
export interface ProjectStatusMeta {
  label: string;
  cssClass: string;
}

export function getProjectStatusMeta(status: string): ProjectStatusMeta {
  const s = (status || '').toLowerCase().replace(/[\s_-]/g, '');

  if (s.includes('pending')) {
    return {
      label: status,
      cssClass: 'status-pending'
    };
  }

  if (
    s.includes('progress') ||
    s.includes('active') ||
    s.includes('ontrack')
  ) {
    return {
      label: status,
      cssClass: 'status-active'
    };
  }

  if (s.includes('complete')) {
    return {
      label: status,
      cssClass: 'status-completed'
    };
  }

  if (
    s.includes('reject') ||
    s.includes('cancel') ||
    s.includes('hold')
  ) {
    return {
      label: status,
      cssClass: 'status-rejected'
    };
  }

  return {
    label: status || 'Unknown',
    cssClass: 'status-unknown'
  };
}
@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private readonly projectsUrl = `${API_CONFIG.baseUrl}/Projects`;
  private readonly tasksUrl = `${API_CONFIG.baseUrl}/ProjectTasks`;
  private readonly meetingsUrl = `${API_CONFIG.baseUrl}/ProjectMeetings`;
  private readonly changeRequestsUrl = `${API_CONFIG.baseUrl}/ChangeRequests`;
  private readonly authUrl = `${API_CONFIG.baseUrl}/Auth`;

  isCreatePageActive: boolean = false;
  successToast$ = new BehaviorSubject<boolean>(false);
  errorToast$ = new BehaviorSubject<boolean>(false);

  triggerSuccessToast() {
    this.successToast$.next(true);
    setTimeout(() => {
      this.successToast$.next(false);
    }, 4000);
  }

  triggerErrorToast() {
    this.errorToast$.next(true);
    setTimeout(() => {
      this.errorToast$.next(false);
    }, 4000);
  }

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  private getHeaders(): HttpHeaders {
    let token: string | null = null;
    if (typeof window !== 'undefined' && window.localStorage) {
      token = localStorage.getItem('auth_token');
    }
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    });
  }

  // --- PROJECTS API ---

  getProjects(portfolioId?: number, programId?: number, keyword?: string, status?: string): Observable<Project[]> {
    if (!isPlatformBrowser(this.platformId)) {
      return of([]);
    }
    let url = `${this.projectsUrl}/all`;
    const params: string[] = [];
    if (portfolioId) params.push(`portfolioId=${portfolioId}`);
    if (programId) params.push(`programId=${programId}`);
    if (keyword) params.push(`keyword=${encodeURIComponent(keyword)}`);
    if (status && status !== 'All') params.push(`status=${encodeURIComponent(status)}`);
    
    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }

    return this.http.get<Project[]>(url, { headers: this.getHeaders() }).pipe(
      catchError(err => {
        console.error('Projects API offline.', err);
        return of([]);
      })
    );
  }
  getProjectsByProgram(programId: number): Observable<Project[]> {
  return this.getProjects(undefined, programId);
}
  getProjectDetails(id: number): Observable<Project> {
    if (!isPlatformBrowser(this.platformId)) {
      return of({} as Project);
    }
    return this.http.get<Project>(`${this.projectsUrl}/details/${id}`, { headers: this.getHeaders() });
  }

  createProject(project: any): Observable<any> {
    return this.http.post<any>(`${this.projectsUrl}/create`, project, { headers: this.getHeaders() });
  }

  updateProject(id: number, project: any): Observable<any> {
    return this.http.put<any>(`${this.projectsUrl}/update/${id}`, project, { headers: this.getHeaders() });
  }

  deleteProject(id: number): Observable<any> {
    return this.http.delete<any>(`${this.projectsUrl}/delete/${id}`, { headers: this.getHeaders() });
  }

  uploadFiles(files: FileList): Observable<any> {
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }
    let token: string | null = null;
    if (typeof window !== 'undefined' && window.localStorage) {
      token = localStorage.getItem('auth_token');
    }
    const headers = new HttpHeaders({
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    });
    return this.http.post<any>(`${this.projectsUrl}/upload`, formData, { headers });
  }

  getPrograms(): Observable<any[]> {
    return this.http.get<any[]>(`${API_CONFIG.baseUrl}/Programs`, { headers: this.getHeaders() }).pipe(
      catchError(() => of([]))
    );
  }

  getPortfolios(): Observable<any[]> {
    return this.http.get<any[]>(`${API_CONFIG.baseUrl}/Portfolios`, { headers: this.getHeaders() }).pipe(
      catchError(() => of([]))
    );
  }

  // --- PROJECT TASKS API ---

  getTasks(projectId?: number, status?: string, keyword?: string): Observable<ProjectTask[]> {
    if (!isPlatformBrowser(this.platformId)) {
      return of([]);
    }
    let url = `${this.tasksUrl}/all`;
    const params: string[] = [];
    if (projectId) params.push(`projectId=${projectId}`);
    if (status && status !== 'All') params.push(`status=${encodeURIComponent(status)}`);
    if (keyword) params.push(`keyword=${encodeURIComponent(keyword)}`);
    
    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }

    return this.http.get<ProjectTask[]>(url, { headers: this.getHeaders() }).pipe(
      catchError(err => {
        console.error('Tasks API offline.', err);
        return of([]);
      })
    );
  }

  createTask(task: any): Observable<any> {
    return this.http.post<any>(`${this.tasksUrl}/create`, task, { headers: this.getHeaders() });
  }

  updateTask(id: number, task: any): Observable<any> {
    return this.http.put<any>(`${this.tasksUrl}/update/${id}`, task, { headers: this.getHeaders() });
  }

  deleteTask(id: number): Observable<any> {
    return this.http.delete<any>(`${this.tasksUrl}/delete/${id}`, { headers: this.getHeaders() });
  }

  uploadTaskFiles(files: FileList): Observable<any> {
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }
    let token: string | null = null;
    if (typeof window !== 'undefined' && window.localStorage) {
      token = localStorage.getItem('auth_token');
    }
    const headers = new HttpHeaders({
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    });
    return this.http.post<any>(`${this.tasksUrl}/upload`, formData, { headers });
  }

  // --- PROJECT MEETINGS API ---

  getMeetings(projectId?: number, keyword?: string): Observable<ProjectMeeting[]> {
    if (!isPlatformBrowser(this.platformId)) {
      return of([]);
    }
    let url = `${this.meetingsUrl}/all`;
    const params: string[] = [];
    if (projectId) params.push(`projectId=${projectId}`);
    if (keyword) params.push(`keyword=${encodeURIComponent(keyword)}`);

    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }

    return this.http.get<ProjectMeeting[]>(url, { headers: this.getHeaders() }).pipe(
      catchError(err => {
        console.error('Meetings API offline.', err);
        return of([]);
      })
    );
  }

  getMeetingDetails(id: number): Observable<ProjectMeeting> {
    if (!isPlatformBrowser(this.platformId)) {
      return of({} as ProjectMeeting);
    }
    return this.http.get<ProjectMeeting>(`${this.meetingsUrl}/details/${id}`, { headers: this.getHeaders() });
  }

  createMeeting(meeting: any): Observable<any> {
    return this.http.post<any>(`${this.meetingsUrl}/create`, meeting, { headers: this.getHeaders() });
  }

  updateMeeting(id: number, meeting: any): Observable<any> {
    return this.http.put<any>(`${this.meetingsUrl}/update/${id}`, meeting, { headers: this.getHeaders() });
  }

  deleteMeeting(id: number): Observable<any> {
    return this.http.delete<any>(`${this.meetingsUrl}/delete/${id}`, { headers: this.getHeaders() });
  }

  uploadMeetingFiles(files: FileList): Observable<any> {
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }
    let token: string | null = null;
    if (typeof window !== 'undefined' && window.localStorage) {
      token = localStorage.getItem('auth_token');
    }
    const headers = new HttpHeaders({
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    });
    return this.http.post<any>(`${this.meetingsUrl}/upload`, formData, { headers });
  }

  // --- CHANGE REQUESTS API ---

  private getLocalRequests(): ChangeRequest[] {
    if (typeof window === 'undefined' || !window.localStorage) return [];
    const data = localStorage.getItem('local_change_requests');
    if (!data) {
      const defaults: ChangeRequest[] = [
        {
          id: 101,
          title: 'Database Server Hardware Upgrade',
          description: `Type: Digital Product
Priority: High
PortfolioName: Digital Products Portfolio
ProgramName: Smart Systems Program
ProgramOwner: Faisal Al-Otaibi
ProgramManager: Mahmoud Salah
ProgramSponsor: Omar Al-Harbi
CurrentBudget: 150000
ProposedBudget: 220000
CurrentDeadline: 2026-09-30
ProposedDeadline: 2026-10-15
CurrentScope: Standard migration to shared database host.
ProposedScope: Dedicated SSD server infrastructure with load balancing.
CurrentResources: 2 Engineers part-time
ProposedResources: 4 Engineers full-time
Description: Upgrading memory and hosting storage capacity to handle peak transactional load.`,
          reason: 'Current server is constantly hitting CPU thresholds causing timeouts.',
          impactCost: 70000,
          impactTimeDays: 15,
          status: 1, // Pending
          requestDate: '2026-08-04T12:00:00Z',
          projectId: 1,
          requestedById: 'user-pmo',
          requestedByUserName: 'Salman Ahmed',
          attachedFiles: '[]'
        }
      ];
      localStorage.setItem('local_change_requests', JSON.stringify(defaults));
      return defaults;
    }
    return JSON.parse(data);
  }

  private saveLocalRequests(list: ChangeRequest[]) {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('local_change_requests', JSON.stringify(list));
    }
  }

  getChangeRequests(projectId?: number, keyword?: string): Observable<ChangeRequest[]> {
    if (!isPlatformBrowser(this.platformId)) {
      return of([]);
    }
    let url = `${this.changeRequestsUrl}/all`;
    const params: string[] = [];
    if (projectId) params.push(`projectId=${projectId}`);
    if (keyword) params.push(`keyword=${encodeURIComponent(keyword)}`);

    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }

    return this.http.get<ChangeRequest[]>(url, { headers: this.getHeaders() }).pipe(
      catchError(err => {
        console.warn('ChangeRequests API failed, loading from LocalStorage instead.', err);
        let list = this.getLocalRequests();
        if (projectId) {
          list = list.filter(r => r.projectId === projectId);
        }
        if (keyword) {
          const kw = keyword.toLowerCase();
          list = list.filter(r => r.title.toLowerCase().includes(kw) || r.reason.toLowerCase().includes(kw));
        }
        return of(list);
      })
    );
  }

  getChangeRequestDetails(id: number): Observable<ChangeRequest> {
    if (!isPlatformBrowser(this.platformId)) {
      return of({} as ChangeRequest);
    }
    return this.http.get<ChangeRequest>(`${this.changeRequestsUrl}/details/${id}`, { headers: this.getHeaders() }).pipe(
      catchError(err => {
        console.warn('ChangeRequests API details failed, loading from LocalStorage fallback.', err);
        const list = this.getLocalRequests();
        const found = list.find(r => r.id === id);
        if (found) {
          return of(found);
        }
        return throwError(() => err);
      })
    );
  }

  createChangeRequest(req: any): Observable<any> {
    return this.http.post<any>(`${this.changeRequestsUrl}/create`, req, { headers: this.getHeaders() }).pipe(
      catchError(err => {
        console.warn('ChangeRequests API create failed, saving to LocalStorage instead.', err);
        const list = this.getLocalRequests();
        const newId = list.length > 0 ? Math.max(...list.map(r => r.id || 0)) + 1 : 101;
        const newReq: ChangeRequest = {
          id: newId,
          title: req.title,
          description: req.description,
          reason: req.reason,
          impactCost: req.impactCost || 0,
          impactTimeDays: req.impactTimeDays || 0,
          status: 1, // Pending
          requestDate: new Date().toISOString(),
          projectId: req.projectId,
          requestedById: 'user-pmo',
          requestedByUserName: 'Salman Ahmed',
          attachedFiles: req.attachedFiles || '[]'
        };
        list.push(newReq);
        this.saveLocalRequests(list);
        return of(newReq);
      })
    );
  }

  updateChangeRequest(id: number, req: any): Observable<any> {
    return this.http.put<any>(`${this.changeRequestsUrl}/update/${id}`, req, { headers: this.getHeaders() }).pipe(
      catchError(err => {
        console.warn('ChangeRequests API update failed, saving to LocalStorage instead.', err);
        const list = this.getLocalRequests();
        const index = list.findIndex(r => r.id === id);
        if (index !== -1) {
          list[index].title = req.title;
          list[index].description = req.description;
          list[index].reason = req.reason;
          list[index].attachedFiles = req.attachedFiles || '[]';
          list[index].projectId = req.projectId;
          this.saveLocalRequests(list);
          return of(list[index]);
        }
        return throwError(() => err);
      })
    );
  }

  approveChangeRequest(id: number, approvedById?: string): Observable<any> {
    let url = `${this.changeRequestsUrl}/approve/${id}`;
    if (approvedById) url += `?approvedById=${approvedById}`;
    return this.http.post<any>(url, {}, { headers: this.getHeaders() }).pipe(
      catchError(err => {
        console.warn('ChangeRequests API approve failed, saving status to LocalStorage instead.', err);
        const list = this.getLocalRequests();
        const index = list.findIndex(r => r.id === id);
        if (index !== -1) {
          list[index].status = 2; // Approved
          this.saveLocalRequests(list);
          return of(list[index]);
        }
        return throwError(() => err);
      })
    );
  }

  rejectChangeRequest(id: number, approvedById?: string): Observable<any> {
    let url = `${this.changeRequestsUrl}/reject/${id}`;
    if (approvedById) url += `?approvedById=${approvedById}`;
    return this.http.post<any>(url, {}, { headers: this.getHeaders() }).pipe(
      catchError(err => {
        console.warn('ChangeRequests API reject failed, saving status to LocalStorage instead.', err);
        const list = this.getLocalRequests();
        const index = list.findIndex(r => r.id === id);
        if (index !== -1) {
          list[index].status = 3; // Rejected
          this.saveLocalRequests(list);
          return of(list[index]);
        }
        return throwError(() => err);
      })
    );
  }

  deleteChangeRequest(id: number): Observable<any> {
    return this.http.delete<any>(`${this.changeRequestsUrl}/delete/${id}`, { headers: this.getHeaders() }).pipe(
      catchError(err => {
        console.warn('ChangeRequests API delete failed, deleting from LocalStorage instead.', err);
        let list = this.getLocalRequests();
        list = list.filter(r => r.id !== id);
        this.saveLocalRequests(list);
        return of({ success: true });
      })
    );
  }

  uploadChangeRequestFiles(files: FileList): Observable<any> {
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }
    let token: string | null = null;
    if (typeof window !== 'undefined' && window.localStorage) {
      token = localStorage.getItem('auth_token');
    }
    const headers = new HttpHeaders({
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    });
    return this.http.post<any>(`${this.changeRequestsUrl}/upload`, formData, { headers });
  }

  getComments(requestId: number): Observable<ChangeRequestComment[]> {
    return this.http.get<ChangeRequestComment[]>(`${this.changeRequestsUrl}/${requestId}/comments`, { headers: this.getHeaders() }).pipe(
      catchError(err => {
        console.warn('Comments API failed, loading from LocalStorage instead.', err);
        const list = this.getLocalComments(requestId);
        return of(list);
      })
    );
  }

  addComment(requestId: number, text: string): Observable<ChangeRequestComment> {
    const payload = { changeRequestId: requestId, text };
    return this.http.post<ChangeRequestComment>(`${this.changeRequestsUrl}/comments`, payload, { headers: this.getHeaders() }).pipe(
      catchError(err => {
        console.warn('Comments add API failed, saving to LocalStorage instead.', err);
        const list = this.getLocalComments(requestId);
        const newComment: ChangeRequestComment = {
          id: list.length > 0 ? Math.max(...list.map(c => c.id)) + 1 : 1,
          changeRequestId: requestId,
          userId: 'current-user',
          userName: 'Abdallah Othman',
          text,
          createdDate: new Date().toISOString()
        };
        list.push(newComment);
        this.saveLocalComments(requestId, list);
        return of(newComment);
      })
    );
  }

  private getLocalComments(requestId: number): ChangeRequestComment[] {
    if (typeof window === 'undefined' || !window.localStorage) return [];
    const data = localStorage.getItem(`local_comments_${requestId}`);
    return data ? JSON.parse(data) : [];
  }

  private saveLocalComments(requestId: number, list: ChangeRequestComment[]) {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(`local_comments_${requestId}`, JSON.stringify(list));
    }
  }

  // Users Management APIs
  getUsers(): Observable<AppUser[]> {
    return this.http.get<AppUser[]>(`${this.authUrl}/all-users`, { headers: this.getHeaders() }).pipe(
      map((users: any[]) => {
        const localUsers = this.getLocalUsers();
        return users.map(u => {
          const localEdit = localUsers.find(lu => lu.id === u.id);
          if (localEdit) {
            return {
              ...localEdit,
              createdDate: u.createdDate || localEdit.createdDate || '2026-01-01'
            };
          }
          return {
            id: u.id,
            userName: u.userName,
            email: u.email || `${u.userName?.toLowerCase()}@example.com`,
            phoneNumber: u.phoneNumber || '0561234567',
            role: u.role || 'Member',
            nameAr: u.nameAr || u.userName,
            nameEn: u.nameEn || u.userName,
            titleAr: u.titleAr,
            titleEn: u.titleEn,
            createdDate: u.createdDate || '2026-01-01',
            isActive: u.isActive !== undefined ? u.isActive : true
          };
        });
      }),
      catchError(err => {
        console.warn('getUsers API failed, using LocalStorage fallback.', err);
        return of(this.getLocalUsers());
      })
    );
  }

  createUser(userPayload: any): Observable<any> {
    return this.http.post<any>(`${this.authUrl}/create-user`, userPayload, { headers: this.getHeaders() }).pipe(
      catchError(err => {
        console.warn('createUser API failed, saving locally.', err);
        const users = this.getLocalUsers();
        const newUser: AppUser = {
          id: 'local-' + Math.random().toString(36).substring(2, 9),
          userName: userPayload.username,
          email: userPayload.email,
          phoneNumber: userPayload.phoneNumber,
          role: userPayload.role,
          nameAr: userPayload.nameAr || userPayload.username,
          nameEn: userPayload.nameEn || userPayload.username,
          titleAr: userPayload.titleAr || userPayload.role,
          titleEn: userPayload.titleEn || userPayload.role,
          createdDate: new Date().toISOString().split('T')[0],
          isActive: userPayload.isActive !== false
        };
        users.push(newUser);
        this.saveLocalUsers(users);
        return of({ success: true, userId: newUser.id });
      })
    );
  }

  updateUser(userId: string, userPayload: any): Observable<any> {
    return this.http.put<any>(`${this.authUrl}/update-user/${userId}`, userPayload, { headers: this.getHeaders() }).pipe(
      catchError(err => {
        console.warn('updateUser API failed, saving edit locally.', err);
        const users = this.getLocalUsers();
        const idx = users.findIndex(u => u.id === userId);
        const updatedUser: AppUser = {
          id: userId,
          userName: userPayload.username,
          email: userPayload.email,
          phoneNumber: userPayload.phoneNumber,
          role: userPayload.role,
          nameAr: userPayload.nameAr || userPayload.username,
          nameEn: userPayload.nameEn || userPayload.username,
          titleAr: userPayload.titleAr || userPayload.role,
          titleEn: userPayload.titleEn || userPayload.role,
          createdDate: '2026-01-01',
          isActive: userPayload.isActive !== false
        };

        if (idx !== -1) {
          users[idx] = updatedUser;
        } else {
          users.push(updatedUser);
        }
        this.saveLocalUsers(users);
        return of({ success: true });
      })
    );
  }

  deleteUser(userId: string): Observable<any> {
    return this.http.delete<any>(`${this.authUrl}/delete-user/${userId}`, { headers: this.getHeaders() }).pipe(
      catchError(err => {
        if (err.status === 400 || err.status === 404 || err.status === 403 || err.status === 500) {
          return throwError(() => err);
        }
        console.warn('deleteUser API failed, removing locally.', err);
        let users = this.getLocalUsers();
        users = users.filter(u => u.id !== userId);
        this.saveLocalUsers(users);
        return of({ success: true });
      })
    );
  }

  getUserProfile(userId: string): Observable<UserProfileDto> {
    return this.http.get<UserProfileDto>(`${this.authUrl}/user-profile/${userId}`, { headers: this.getHeaders() }).pipe(
      map((profile: UserProfileDto) => {
        const localUsers = this.getLocalUsers();
        const localEdit = localUsers.find(lu => lu.id === userId);
        return {
          ...profile,
          userName: localEdit?.userName || profile.userName,
          email: localEdit?.email || profile.email || `${profile.userName?.toLowerCase()}@example.com`,
          phoneNumber: localEdit?.phoneNumber || profile.phoneNumber || '0561234567',
          role: localEdit?.role || profile.role || 'Member',
          nameAr: localEdit?.nameAr || profile.nameAr || profile.userName,
          nameEn: localEdit?.nameEn || profile.nameEn || profile.userName,
          titleAr: localEdit?.titleAr || profile.titleAr,
          titleEn: localEdit?.titleEn || profile.titleEn,
          createdDate: profile.createdDate || '2026-01-01',
          isActive: localEdit?.isActive !== undefined ? localEdit.isActive : (profile.isActive !== undefined ? profile.isActive : true)
        };
      }),
      catchError(err => {
        console.warn('getUserProfile API failed, retrieving user details from dynamic list fallback.', err);
        return this.getUsers().pipe(
          map(users => {
            const user = users.find(u => u.id === userId);
            
            const mockPortfolios: UserPortfolioDto[] = [
              { id: 1, name: 'Digital Products Portfolio', category: 'Execution', programsCount: 2, projectsCount: 5, progress: 65, status: 'Active' }
            ];
            const mockPrograms: UserProgramDto[] = [
              { id: 1, name: 'Digital Products Program', category: 'Execution', projectsCount: 5, progress: 70, status: 'Active' }
            ];
            const mockProjects: UserProjectDto[] = [
              { id: 1, name: 'Digital Dashboard Project', category: 'Execution', tasksCount: 12, progress: 80, status: 'Active' }
            ];

            return {
              id: userId,
              userName: user?.userName || 'User',
              email: user?.email || `${user?.userName?.toLowerCase()}@example.com`,
              phoneNumber: user?.phoneNumber || '0561234567',
              role: user?.role || 'Member',
              nameAr: user?.nameAr || user?.userName || 'مستخدم',
              nameEn: user?.nameEn || user?.userName || 'User',
              titleAr: user?.role || 'عضو',
              titleEn: user?.role || 'Member',
              createdDate: user?.createdDate || '2026-1-1',
              isActive: user?.isActive !== false,
              portfolios: user?.role === 'Member' ? [] : mockPortfolios,
              programs: user?.role === 'Member' ? [] : mockPrograms,
              projects: mockProjects
            };
          })
        );
      })
    );
  }

  private getLocalUsers(): AppUser[] {
    if (typeof window === 'undefined' || !window.localStorage) return [];
    const data = localStorage.getItem('local_users');
    return data ? JSON.parse(data) : [];
  }

  private saveLocalUsers(list: AppUser[]) {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('local_users', JSON.stringify(list));
    }
  }
}
