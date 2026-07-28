import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="padding: 40px; text-align: center; font-family: sans-serif; height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center;">
      <h1 style="color: #007bff; margin-bottom: 10px;">مرحباً بك في لوحة تحكم ProSync</h1>
      <p style="color: #555; font-size: 1.1rem;">لقد قمت بتسجيل الدخول بنجاح باستخدام رقم الجوال!</p>
      <button (click)="logout()" style="padding: 12px 24px; background: #e74c3c; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; margin-top: 20px; transition: 0.2s;">تسجيل الخروج</button>
    </div>
  `
})
export class DashboardComponent {
  constructor(private router: Router) {}

  logout() {
    localStorage.clear();
    this.router.navigate(['/auth/login']);
  }
}
