import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, throwError, BehaviorSubject } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { API_CONFIG } from '../api.config';

export interface Portfolio {
  id: number;
  nameAr: string;
  nameEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  budget: number;
  startDate: string;
  endDate: string;
  status: string; // Active, OnHold, Completed, Archived
  ownerId?: string;
  ownerName?: string;
  createdDate?: string;
  projectsCount?: number;
  programsCount?: number;
}

@Injectable({
  providedIn: 'root'
})
export class PortfolioService {
  private readonly apiUrl = `${API_CONFIG.baseUrl}/Portfolios`;
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

  constructor(private http: HttpClient) {}

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

  // Get all portfolios
  getAllPortfolios(sortBy?: string): Observable<Portfolio[]> {
    let url = this.apiUrl;
    if (sortBy) {
      url += `?sortBy=${sortBy}`;
    }
    return this.http.get<Portfolio[]>(url, { headers: this.getHeaders() });
  }

  // Get portfolio by ID
  getPortfolioDetails(id: number): Observable<Portfolio> {
    return this.http.get<Portfolio>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }

  // Create new portfolio
  createPortfolio(portfolio: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, portfolio, { headers: this.getHeaders() });
  }

  // Update existing portfolio
  updatePortfolio(id: number, portfolio: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, portfolio, { headers: this.getHeaders() });
  }

  // Delete portfolio
  deletePortfolio(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }

  // Get statistics for the dashboard
  getDashboardStats(): Observable<any> {
    return this.http.get<any>(`${API_CONFIG.baseUrl}/Dashboard/stats`, { headers: this.getHeaders() }).pipe(
      catchError(err => {
        console.warn('API Offline. Serving mock stats.');
        return of({
          totalPortfolios: 0,
          activePortfolios: 0,
          totalProjects: 0,
          completionRate: 0,
          totalBudget: 0
        });
      })
    );
  }
}
