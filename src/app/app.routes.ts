import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login';
import { ForgotPasswordComponent } from './auth/forgot-password/forgot-password';
import { LayoutComponent } from './layout/layout';
import { DashboardComponent } from './dashboard/dashboard';
import { PortfoliosComponent } from './portfolios/portfolios.component';
import { CreatePortfolioComponent } from './portfolios/create/create-portfolio';
import { PortfolioDetailsComponent } from './portfolios/details/portfolio-details';
import { ProjectsComponent } from './projects/projects.component';
import { CreateProjectComponent } from './projects/create/create-project';
import { ProjectDetailsComponent } from './projects/details/project-details';
import { CreateTaskComponent } from './tasks/create/create-task';
import { TasksComponent } from './tasks/tasks.component';

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
      },
      {
        path: 'projects',
        component: ProjectsComponent
      },
      {
        path: 'projects/create',
        component: CreateProjectComponent
      },
      {
        path: 'projects/edit/:id',
        component: CreateProjectComponent
      },
      {
        path: 'projects/details/:id',
        component: ProjectDetailsComponent
      },
      {
        path: 'projects/details/:projectId/tasks/create',
        component: CreateTaskComponent
      },
      {
        path: 'projects/details/:projectId/tasks/edit/:id',
        component: CreateTaskComponent
      },
      {
        path: 'tasks',
        component: TasksComponent
      },
      {
        path: 'tasks/create',
        component: CreateTaskComponent
      },
      {
        path: 'tasks/edit/:id',
        component: CreateTaskComponent
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'auth/login'
  }
];
