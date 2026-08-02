import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { API_CONFIG } from '../api.config';

// ---------------------------------------------------------------------------
// Status enum — confirmed mapping (int stored on backend, everything else is
// derived client-side from this single field).
// ---------------------------------------------------------------------------
export enum ProgramStatus {
  Active = 1,   // "In Progress"
  Completed = 2,
  Pending = 3,
  Rejected = 4
}

export interface StatusMeta {
  label: string;
  color: string;   // hex, matches design spec
  cssClass: string; // tailwind-ish class hook for templates
  progress: number; // fallback ring/percentage when API doesn't return one
}

export const PROGRAM_STATUS_MAP: Record<number, StatusMeta> = {
  1: { label: 'In Progress', color: '#2563EB', cssClass: 'status-active', progress: 70 },
  2: { label: 'Completed', color: '#16A34A', cssClass: 'status-completed', progress: 100 },
  3: { label: 'Pending', color: '#EA580C', cssClass: 'status-pending', progress: 0 },
  4: { label: 'Rejected', color: '#DC2626', cssClass: 'status-rejected', progress: 0 }
};

export function getStatusMeta(status: number): StatusMeta {
  return PROGRAM_STATUS_MAP[status] ?? { label: 'Unknown', color: '#6B7280', cssClass: 'status-unknown', progress: 0 };
}

// ---------------------------------------------------------------------------
// Models — shaped from the Swagger response for GET /api/Programs (list)
// and GET /api/Programs/{id}. NOTE: the API does not return managerId on
// read, only managerName — see README notes at bottom of this file re: edit
// pre-fill limitations.
// ---------------------------------------------------------------------------
export interface Program {
  id: number;
  name: string;
  description?: string;
  budget: number;
  status: number;
  progressPercentage?: number;
  sponsorName?: string;
  managerName?: string;
  portfolioName?: string;
  portfolioId: number;
  createdDate?: string;
  attachedDocumentUrls?: string[];
  projectsCount?: number;
  tasksCount?: number;
}

export interface ProgramCreatePayload {
  name: string;
  description?: string;
  budget: number;
  status: number;
  portfolioId: number;
  sponsorName?: string;
  managerId?: string;
  attachedUrls?: string[];
}

export interface ProgramUpdatePayload {
  name: string;
  description?: string;
  budget: number;
  status: number;
  progressPercentage?: number;
  sponsorName?: string;
  managerId?: string;
  attachedUrls?: string[];
}

export interface ProgramFilters {
  portfolioId?: number;
  keyword?: string;
  status?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ProgramService {
  private readonly apiUrl = `${API_CONFIG.baseUrl}/Programs`;

  successToast$ = new BehaviorSubject<boolean>(false);
  errorToast$ = new BehaviorSubject<boolean>(false);

  triggerSuccessToast() {
    this.successToast$.next(true);
    setTimeout(() => this.successToast$.next(false), 4000);
  }

  triggerErrorToast() {
    this.errorToast$.next(true);
    setTimeout(() => this.errorToast$.next(false), 4000);
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

  private getMockPrograms(): Program[] {
    return [
      {
        id: 1,
        name: 'Smart Systems Program',
        description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
        budget: 10000000,
        status: 3,
        progressPercentage: 0,
        sponsorName: 'Omar Al-Harbi',
        managerName: 'Mahmoud Salah',
        portfolioName: 'Digital Products Portfolio',
        portfolioId: 1,
        createdDate: '2026-05-10T00:00:00Z',
        attachedDocumentUrls: [],
        projectsCount: 50,
        tasksCount: 50
      }
    ];
  }

  // Get all programs (standalone, top-level — supports keyword/status/portfolioId filters)
  getAllPrograms(filters?: ProgramFilters): Observable<Program[]> {
    if (!isPlatformBrowser(this.platformId)) {
      return of(this.getMockPrograms());
    }

    let params = new HttpParams();
    if (filters?.portfolioId) params = params.set('portfolioId', filters.portfolioId);
    if (filters?.keyword) params = params.set('keyword', filters.keyword);
    if (filters?.status !== undefined && filters.status !== null) params = params.set('status', filters.status);

    return this.http.get<Program[]>(this.apiUrl, { headers: this.getHeaders(), params }).pipe(
      catchError(() => {
        console.warn('API Offline. Serving mock programs.');
        return of(this.getMockPrograms());
      })
    );
  }

  getProgramDetails(id: number): Observable<Program> {
    if (!isPlatformBrowser(this.platformId)) {
      return of(this.getMockPrograms()[0]);
    }
    return this.http.get<Program>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() }).pipe(
      catchError(() => {
        console.warn('API Offline. Serving mock program details.');
        return of(this.getMockPrograms()[0]);
      })
    );
  }

  createProgram(payload: ProgramCreatePayload): Observable<Program> {
    return this.http.post<Program>(this.apiUrl, payload, { headers: this.getHeaders() });
  }

  updateProgram(id: number, payload: ProgramUpdatePayload): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, payload, { headers: this.getHeaders() });
  }

  deleteProgram(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }

  // NOTE: Programs has no dedicated /upload endpoint in the Swagger doc provided.
  // Per your instruction, this reuses Portfolios/upload — flagged as a backend
  // TODO at the bottom of this delivery in case you'd rather have a
  // Programs-specific storage path.
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
    return this.http.post<any>(`${API_CONFIG.baseUrl}/Portfolios/upload`, formData, { headers });
  }
}