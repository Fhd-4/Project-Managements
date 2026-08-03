import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { catchError } from 'rxjs/operators';
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

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private readonly projectsUrl = `${API_CONFIG.baseUrl}/Projects`;
  private readonly tasksUrl = `${API_CONFIG.baseUrl}/ProjectTasks`;

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
}
