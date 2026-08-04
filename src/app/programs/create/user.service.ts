import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { API_CONFIG } from '../../api.config';

export interface AppUser {
  id: string;
  userName?: string;
  email?: string;
  nameAr?: string;
  nameEn?: string;
  profilePhoto?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly apiUrl = `${API_CONFIG.baseUrl}/Auth`;

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

  getAllUsers(): Observable<AppUser[]> {
    if (!isPlatformBrowser(this.platformId)) return of([]);
    return this.http.get<AppUser[]>(`${this.apiUrl}/all-users`, { headers: this.getHeaders() }).pipe(
      catchError(() => {
        console.warn('API Offline. Serving empty users list.');
        return of([]);
      })
    );
  }

  displayName(u: AppUser, lang: 'ar' | 'en' = 'en'): string {
    return (lang === 'ar' ? u.nameAr : u.nameEn) || u.userName || u.email || u.id;
  }
}