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

  // Local fallback mock data to ensure the frontend is testable immediately
  private mockPortfolios: Portfolio[] = [
    {
      id: 1,
      nameAr: 'محفظة تطوير البنية التحتية',
      nameEn: 'Infrastructure Development Portfolio',
      descriptionAr: 'مشاريع تطوير شبكات الاتصالات والسيرفرات الرئيسية بالمؤسسة.',
      descriptionEn: 'Projects focused on upgrading enterprise networks and core server systems.',
      budget: 1500000,
      startDate: '2026-01-01T00:00:00',
      endDate: '2026-12-31T00:00:00',
      status: 'Active',
      ownerName: 'Fahd',
      projectsCount: 5,
      programsCount: 2
    },
    {
      id: 2,
      nameAr: 'محفظة التحول الرقمي',
      nameEn: 'Digital Transformation Portfolio',
      descriptionAr: 'مشاريع رقمنة الخدمات الداخلية وبناء البوابات الإلكترونية.',
      descriptionEn: 'Digitizing internal workflows and launching public e-portals.',
      budget: 3500000,
      startDate: '2026-03-01T00:00:00',
      endDate: '2027-06-30T00:00:00',
      status: 'Active',
      ownerName: 'Fahd',
      projectsCount: 12,
      programsCount: 4
    },
    {
      id: 3,
      nameAr: 'محفظة أبحاث الأمن السيبراني',
      nameEn: 'Cybersecurity Research Portfolio',
      descriptionAr: 'مشاريع دراسة الثغرات الأمنية وتأمين الأنظمة السحابية.',
      descriptionEn: 'Cloud infrastructure security audits and vulnerability researches.',
      budget: 850000,
      startDate: '2025-01-01T00:00:00',
      endDate: '2025-12-31T00:00:00',
      status: 'Completed',
      ownerName: 'Admin User',
      projectsCount: 3,
      programsCount: 1
    }
  ];

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
  getAllPortfolios(): Observable<Portfolio[]> {
    return this.http.get<Portfolio[]>(this.apiUrl, { headers: this.getHeaders() }).pipe(
      catchError(err => {
        console.warn('API Offline. Serving local mock portfolios.', err);
        return of(this.mockPortfolios);
      })
    );
  }

  // Get portfolio by ID
  getPortfolioDetails(id: number): Observable<Portfolio> {
    return this.http.get<Portfolio>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() }).pipe(
      catchError(err => {
        console.warn(`API Offline. Serving mock details for portfolio ${id}.`);
        const p = this.mockPortfolios.find(item => item.id === id);
        return p ? of(p) : throwError(() => new Error('Portfolio not found'));
      })
    );
  }

  // Create new portfolio
  createPortfolio(portfolio: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, portfolio, { headers: this.getHeaders() }).pipe(
      catchError(err => {
        console.warn('API Offline. Simulating local portfolio creation.');
        const newPortfolio: Portfolio = {
          ...portfolio,
          id: this.mockPortfolios.length + 1,
          ownerName: localStorage.getItem('auth_userName') || 'Fahd',
          projectsCount: 0,
          programsCount: 0
        };
        this.mockPortfolios.unshift(newPortfolio);
        return of({ succeeded: true, message: 'Created successfully (mock)', data: newPortfolio });
      })
    );
  }

  // Update existing portfolio
  updatePortfolio(id: number, portfolio: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, portfolio, { headers: this.getHeaders() }).pipe(
      catchError(err => {
        console.warn(`API Offline. Simulating local update for portfolio ${id}.`);
        const index = this.mockPortfolios.findIndex(item => item.id === id);
        if (index > -1) {
          this.mockPortfolios[index] = {
            ...this.mockPortfolios[index],
            ...portfolio
          };
          return of({ succeeded: true, message: 'Updated successfully (mock)' });
        }
        return throwError(() => new Error('Portfolio not found'));
      })
    );
  }

  // Delete portfolio
  deletePortfolio(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() }).pipe(
      catchError(err => {
        console.warn(`API Offline. Simulating local deletion of portfolio ${id}.`);
        this.mockPortfolios = this.mockPortfolios.filter(item => item.id !== id);
        return of({ succeeded: true, message: 'Deleted successfully (mock)' });
      })
    );
  }

  // Get statistics for the dashboard
  getDashboardStats(): Observable<any> {
    return this.getAllPortfolios().pipe(
      map(portfolios => {
        const totalBudget = portfolios.reduce((sum, p) => sum + p.budget, 0);
        const activeCount = portfolios.filter(p => p.status === 'Active').length;
        const totalProjects = portfolios.reduce((sum, p) => sum + (p.projectsCount || 0), 0);
        
        const completedCount = portfolios.filter(p => p.status === 'Completed').length;
        const rate = portfolios.length > 0 ? Math.round((completedCount / portfolios.length) * 100) : 0;

        return {
          totalPortfolios: portfolios.length,
          activePortfolios: activeCount,
          totalProjects: totalProjects,
          completionRate: rate,
          totalBudget: totalBudget
        };
      })
    );
  }
}
