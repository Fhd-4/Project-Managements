import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Category {
  id?: number;
  name: string;
  assignTo: string;
}

export interface Role {
  id?: string;
  name: string;
  usersCount?: number;
  access?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private apiUrl = environment.apiUrl; 

  constructor(private http: HttpClient) {}

  // --- Categories API ---
  getCategories(keyword?: string): Observable<Category[]> {
    const url = keyword ? `${this.apiUrl}/Categories/all?keyword=${keyword}` : `${this.apiUrl}/Categories/all`;
    return this.http.get<Category[]>(url);
  }

  createCategory(category: Category): Observable<Category> {
    return this.http.post<Category>(`${this.apiUrl}/Categories/create`, category);
  }

  deleteCategory(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/Categories/delete/${id}`);
  }

  // --- Roles API ---
  getRoles(): Observable<Role[]> {
    return this.http.get<Role[]>(`${this.apiUrl}/Auth/roles`);
  }

  createRole(roleName: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/Auth/create-role`, { roleName });
  }

  // --- Security & 2FA API ---
  toggle2Fa(userId: string, enable: boolean): Observable<any> {
    return this.http.post(`${this.apiUrl}/Auth/toggle-2fa`, {
      userId: userId,
      enable: enable
    });
  }

  getTwoFactorStatus(userId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/Auth/2fa-status/${userId}`);
  }
}