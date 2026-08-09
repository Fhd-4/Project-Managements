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
      localStorage.setItem('auth_email', response.email || '');
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
  
  verifyLogin2Fa(userId: string, code: string): Observable<any> {
    const url = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.auth.verifyLogin2Fa}`; // تأكدي أن الـ endpoint موجود في api.config
    return this.http.post<any>(url, {
      userId: userId,
      code: code
    });
  } 
  
  logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_userName');
    localStorage.removeItem('auth_phone');
    localStorage.removeItem('auth_userId');
  }

  forgotPassword(email: string): Observable<any> {
    const url = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.auth.forgotPassword}`;
    return this.http.post<any>(url, { email: email });
  }

  verifyOtp(email: string, token: string): Observable<any> {
    const url = `${API_CONFIG.baseUrl}/Auth/verify-otp`;
    return this.http.post<any>(url, { email: email, token: token });
  }

  resetPassword(email: string, token: string, newPassword: string): Observable<any> {
    const url = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.auth.resetPassword}`;
    return this.http.post<any>(url, {
      email: email,
      token: token,
      newPassword: newPassword
    });
  }

  changePassword(email: string, currentPassword: string, newPassword: string): Observable<any> {
    const url = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.auth.changePassword}`;
    return this.http.post<any>(url, {
      email: email,
      currentPassword: currentPassword,
      newPassword: newPassword
    });
  }
}
