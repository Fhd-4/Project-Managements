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
  {
    path: 'programs/edit/:id',
    renderMode: RenderMode.Server
  },
  // 🟢 تم حذف كلمة /view هنا لتتطابق تماماً مع ملف الـ app.routes.ts الرئيسي
  {
    path: 'programs/:id',
    renderMode: RenderMode.Server
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
