import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../api.config';

export interface LoginPayload {
  phone: string;
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.auth.login}`;

  constructor(private http: HttpClient) {}

  login(payload: LoginPayload): Observable<any> {
    return this.http.post<any>(this.apiUrl, {
      phoneNumber: payload.phone,
      password: payload.password
    });
  }

  saveSession(response: any) {
    if (response && response.token) {
      localStorage.setItem('auth_token', response.token);
      localStorage.setItem('auth_userName', response.username || '');
      localStorage.setItem('auth_phone', response.phoneNumber || '');
      if (response.user) {
        localStorage.setItem('auth_userId', response.user.id || '');
      }
    }
  }

  isLoggedIn(): boolean {
    if (typeof window !== 'undefined' && window.localStorage) {
      return !!localStorage.getItem('auth_token');
    }
    return false;
  }

  logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_userName');
    localStorage.removeItem('auth_phone');
    localStorage.removeItem('auth_userId');
  }
}
