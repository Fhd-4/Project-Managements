import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
// Updated to a relative path to look back into the main app/ directory root context
import { API_CONFIG } from '../api.config'; 

export interface ProjectSummary {
  id: number;
  name: string;
  managerName?: string;
  status: number;
  budget: number;
  startDate?: string;
  endDate?: string;
  tasksCount?: number;
  membersCount?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private readonly apiUrl = `${API_CONFIG.baseUrl}/Projects`;

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

  getProjectsByProgram(programId: number): Observable<ProjectSummary[]> {
    if (!isPlatformBrowser(this.platformId)) {
      return of([]);
    }
    const params = new HttpParams().set('programId', programId);
    return this.http.get<ProjectSummary[]>(`${this.apiUrl}/all`, { headers: this.getHeaders(), params }).pipe(
      catchError(() => {
        console.warn('API Offline or endpoint mismatch. Serving empty projects list.');
        return of([]);
      })
    );
  }
}
