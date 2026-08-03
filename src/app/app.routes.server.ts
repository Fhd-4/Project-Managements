import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'portfolios/edit/:id',
    renderMode: RenderMode.Server
  },
  {
    path: 'portfolios/details/:id',
    renderMode: RenderMode.Server
  },
  
  // 👈 إضافة مسارات البرامج الديناميكية للخادم هنا لمنع أخطاء البناء مستقبلاً
  {
    path: 'programs/edit/:id',
    renderMode: RenderMode.Server
  },
  {
    path: 'programs/view/:id',
    renderMode: RenderMode.Server
  },
  {
    path: 'projects/edit/:id',
    renderMode: RenderMode.Server
  },
  {
    path: 'projects/details/:id',
    renderMode: RenderMode.Server
  },
  {
    path: 'projects/details/:projectId/tasks/create',
    renderMode: RenderMode.Server
  },
  {
    path: 'projects/details/:projectId/tasks/edit/:id',
    renderMode: RenderMode.Server
  },
  {
    path: 'tasks',
    renderMode: RenderMode.Server
  },
  {
    path: 'tasks/create',
    renderMode: RenderMode.Server
  },
  {
    path: 'tasks/edit/:id',
    renderMode: RenderMode.Server
  },
  {
    path: 'projects/details/:projectId/meetings/create',
    renderMode: RenderMode.Server
  },
  {
    path: 'projects/details/:projectId/meetings/edit/:meetingId',
    renderMode: RenderMode.Server
  },
  {
    path: 'projects/details/:projectId/meetings/details/:meetingId',
    renderMode: RenderMode.Server
  },
  {
    path: 'projects/details/:projectId/tasks/details/:id',
    renderMode: RenderMode.Server
  },
  {
    path: 'tasks/details/:id',
    renderMode: RenderMode.Server
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
