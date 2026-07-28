import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login';
import { DashboardComponent } from './dashboard/dashboard';
import { ForgotPasswordComponent } from './auth/forgot-password/forgot-password';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'auth/login',
    pathMatch: 'full'
  },
  {
    path: 'auth/login',
    component: LoginComponent
  },
  {
    path: 'auth/forgot-password',
    component: ForgotPasswordComponent
  },
  {
    path: 'dashboard',
    component: DashboardComponent
  },
  {
    path: '**',
    redirectTo: 'auth/login'
  }
];
