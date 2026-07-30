import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login';
import { ForgotPasswordComponent } from './auth/forgot-password/forgot-password';
import { LayoutComponent } from './layout/layout';
import { DashboardComponent } from './dashboard/dashboard';
import { PortfoliosComponent } from './portfolios/portfolios.component';
import { CreatePortfolioComponent } from './portfolios/create/create-portfolio';
import { PortfolioDetailsComponent } from './portfolios/details/portfolio-details';

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
    path: '',
    component: LayoutComponent,
    children: [
      {
        path: 'dashboard',
        component: DashboardComponent
      },
      {
        path: 'portfolios',
        component: PortfoliosComponent
      },
      {
        path: 'portfolios/create',
        component: CreatePortfolioComponent
      },
      {
        path: 'portfolios/edit/:id',
        component: CreatePortfolioComponent
      },
      {
        path: 'portfolios/details/:id',
        component: PortfolioDetailsComponent
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'auth/login'
  }
];
