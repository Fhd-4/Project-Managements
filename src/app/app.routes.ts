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
import { CreateMeetingComponent } from './meetings/create/create-meeting';
import { MeetingDetailsComponent } from './meetings/details/meeting-details';
import { TaskDetailsComponent } from './tasks/details/task-details';
import { ProgramsComponent } from './programs/programs.component';
import { ProgramCreateComponent } from './programs/create/program create.component';
import { ProgramDetailsComponent } from './programs/details/program details.component';
import { PlansComponent } from './plans/plans.component';
import { PlansCreateComponent } from './plans/create/plans-create.component';
import { ChangeRequestsComponent } from './change-requests/change-requests.component';
import { CreateChangeRequestComponent } from './change-requests/create/create-change-request';
import { ChangeRequestDetailsComponent } from './change-requests/details/change-request-details';
import { UsersComponent } from './users/users.component';
import { CreateUserComponent } from './users/create/create-user.component';
import { UserProfileDetailsComponent } from './users/profile/user-profile-details.component';


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
      
      // 👈 إضافة مسارات إدارة البرامج الجديدة هنا لتظهر داخل الـ Layout
      {
        path: 'programs',
        component: ProgramsComponent
      },
      {
        path: 'programs/create',
        component: ProgramCreateComponent
      },
      {
        path: 'programs/edit/:id',
        component: ProgramCreateComponent
      },
      {
        path: 'programs/details/:id',
        component: ProgramDetailsComponent
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
      },
      {
        path: 'projects/details/:projectId/meetings/create',
        component: CreateMeetingComponent
      },
      {
        path: 'projects/details/:projectId/meetings/edit/:meetingId',
        component: CreateMeetingComponent
      },
      {
        path: 'projects/details/:projectId/meetings/details/:meetingId',
        component: MeetingDetailsComponent
      },
      {
        path: 'projects/details/:projectId/tasks/details/:id',
        component: TaskDetailsComponent
      },
      {
        path: 'tasks/details/:id',
        component: TaskDetailsComponent
      },
      {
        path: 'plans',
        component: PlansComponent
      },
      {
        path: 'plans/create',
        component: PlansCreateComponent
      },
      {
        path: 'plans/edit/:id',
        component: PlansCreateComponent
      },
      { path: 'change-requests',
        component: ChangeRequestsComponent
      },
      {
        path: 'change-requests/create',
        component: CreateChangeRequestComponent
      },
      {
        path: 'change-requests/edit/:id',
        component: CreateChangeRequestComponent
      },
      {
        path: 'change-requests/details/:id',
        component: ChangeRequestDetailsComponent
      },
      {
        path: 'users',
        component: UsersComponent
      },
      {
        path: 'users/create',
        component: CreateUserComponent
      },
      {
        path: 'users/profile/:id',
        component: UserProfileDetailsComponent
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'auth/login'
  }
];
