import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
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
  sponsorName?: string;
  managerName?: string;
  category?: string;
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

  private getMockPortfolios(): Portfolio[] {
    return [
      {
        id: 1,
        nameAr: 'محفظة المنتجات الرقمية',
        nameEn: 'Digital Products Portfolio',
        descriptionAr: 'محفظة تهدف لتطوير وتحسين المنتجات الرقمية والتطبيقات.',
        descriptionEn: 'A portfolio aimed at developing and optimizing digital products and apps.',
        budget: 10000000,
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString(),
        status: 'Active',
        ownerName: 'Faisal Al-Otaibi',
        sponsorName: 'Omar Al-Harbi',
        managerName: 'Mahmoud Salah',
        category: 'Execution',
        createdDate: '2026-05-10T00:00:00Z',
        projectsCount: 15,
        programsCount: 3
      },
      {
        id: 2,
        nameAr: 'محفظة البنية التحتية',
        nameEn: 'Infrastructure Portfolio',
        descriptionAr: 'تحديث وتطوير البنية التحتية والخوادم وسحابة الحوسبة.',
        descriptionEn: 'Upgrading infrastructure, servers, and cloud computing.',
        budget: 5000000,
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString(),
        status: 'OnHold',
        ownerName: 'Omar Al-Harbi',
        sponsorName: 'Faisal Al-Otaibi',
        managerName: 'Mahmoud Salah',
        category: 'Strategic',
        createdDate: '2026-06-01T00:00:00Z',
        projectsCount: 8,
        programsCount: 2
      }
    ];
  }

  // Get all portfolios
  getAllPortfolios(sortBy?: string): Observable<Portfolio[]> {
    if (!isPlatformBrowser(this.platformId)) {
      return of(this.getMockPortfolios());
    }

    let url = this.apiUrl;
    if (sortBy) {
      url += `?sortBy=${sortBy}`;
    }
    return this.http.get<Portfolio[]>(url, { headers: this.getHeaders() }).pipe(
      catchError(err => {
        console.warn('API Offline. Serving mock portfolios.');
        return of(this.getMockPortfolios());
      })
    );
  }

  // Get portfolio by ID
  getPortfolioDetails(id: number): Observable<Portfolio> {
    if (!isPlatformBrowser(this.platformId)) {
      const mock = this.getMockPortfolios().find(p => p.id === id);
      return of(mock || this.getMockPortfolios()[0]);
    }

    return this.http.get<Portfolio>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() }).pipe(
      catchError(err => {
        console.warn('API Offline. Serving mock details.');
        const mock = this.getMockPortfolios().find(p => p.id === id);
        return of(mock || this.getMockPortfolios()[0]);
      })
    );
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
    if (!isPlatformBrowser(this.platformId)) {
      // SSR: return zeroes - will re-fetch on client
      return of({
        totalPortfolios: 0,
        totalPrograms: 0,
        totalProjects: 0,
        totalBudget: 0
      });
    }

    return this.http.get<any>(`${API_CONFIG.baseUrl}/Portfolios/stats`, { headers: this.getHeaders() }).pipe(
      map((res: any) => ({
        // Normalize property names (API returns PascalCase)
        totalPortfolios: res.TotalPortfolios ?? res.totalPortfolios ?? 0,
        totalPrograms:   res.TotalPrograms   ?? res.totalPrograms   ?? 0,
        totalProjects:   res.TotalProjects   ?? res.totalProjects   ?? 0,
        totalBudget:     res.TotalBudget     ?? res.totalBudget     ?? 0
      })),
      catchError(err => {
        console.warn('API Offline. Serving 0 stats.');
        return of({
          totalPortfolios: 0,
          totalPrograms: 0,
          totalProjects: 0,
          totalBudget: 0
        });
      })
    );
  }
}
