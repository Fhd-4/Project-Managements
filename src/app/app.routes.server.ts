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
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
