import { Routes } from '@angular/router';
import { authGuard, adminGuard, guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/menu/menu.component').then(m => m.MenuComponent),
  },
  {
    path: 'mis-pedidos',
    canActivate: [authGuard],
    loadComponent: () => import('./features/mis-pedidos/mis-pedidos.component').then(m => m.MisPedidosComponent),
  },
  {
    path: 'auth',
    canActivate: [guestGuard],
    children: [
      { path: 'login', loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent) },
      { path: 'register', loadComponent: () => import('./features/auth/register.component').then(m => m.RegisterComponent) },
      { path: '', redirectTo: 'login', pathMatch: 'full' },
    ],
  },
  {
    path: 'admin',
    canActivate: [authGuard, adminGuard],
    children: [
      { path: '', loadComponent: () => import('./features/admin/admin-dashboard.component').then(m => m.AdminDashboardComponent) },
      { path: 'viandas', loadComponent: () => import('./features/admin/viandas/admin-viandas.component').then(m => m.AdminViandasComponent) },
      { path: 'comidas', loadComponent: () => import('./features/admin/comidas/admin-comidas.component').then(m => m.AdminComidasComponent) },
      { path: 'pedidos', loadComponent: () => import('./features/admin/pedidos/admin-pedidos.component').then(m => m.AdminPedidosComponent) },
    ],
  },
  { path: '**', redirectTo: '' },
];