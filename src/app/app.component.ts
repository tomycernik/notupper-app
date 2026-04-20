import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  template: `
    <nav class="navbar">
      <a routerLink="/" class="navbar__brand">
        <span class="brand-not">NOT</span>
        <span class="brand-tupper">TUPPER</span>
      </a>

      <div class="navbar__links">
        <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">Menú</a>
        @if (auth.isLogged() && !auth.isAdmin()) {
          <a routerLink="/mis-pedidos" routerLinkActive="active">Mis pedidos</a>
        }
        @if (auth.isAdmin()) {
          <a routerLink="/admin" routerLinkActive="active">Panel Admin</a>
        }
      </div>

      <div class="navbar__actions">
        @if (auth.isLogged()) {
          <a routerLink="/mis-pedidos" class="navbar__user">{{ auth.user()?.nombre }}</a>
          <button class="btn-nav btn-nav--ghost" (click)="auth.logout()">Salir</button>
        } @else {
          <a routerLink="/auth/login" class="btn-nav btn-nav--outline">Ingresar</a>
          <a routerLink="/auth/register" class="btn-nav btn-nav--accent">Registrarse</a>
        }
      </div>

      <button class="navbar__burger" (click)="mobileOpen = !mobileOpen" [class.open]="mobileOpen">
        <span></span><span></span><span></span>
      </button>
    </nav>

    @if (mobileOpen) {
      <div class="mobile-menu" (click)="mobileOpen = false">
        <a routerLink="/">Menú</a>
        @if (auth.isLogged() && !auth.isAdmin()) {
          <a routerLink="/mis-pedidos">Mis pedidos</a>
        }
        @if (auth.isAdmin()) { <a routerLink="/admin">Panel Admin</a> }
        @if (auth.isLogged()) {
          <button (click)="auth.logout()">Salir</button>
        } @else {
          <a routerLink="/auth/login">Ingresar</a>
          <a routerLink="/auth/register">Registrarse</a>
        }
      </div>
    }

    <main class="main-content">
      <router-outlet />
    </main>
  `,
  styles: [`
    /* Navbar: forest sólido, contenido cream */
    .navbar {
      position: sticky; top: 0; z-index: 100;
      display: flex; align-items: center; gap: 20px;
      padding: 0 32px; height: 64px;
      background: #2E5935;             /* forest */
      border-bottom: 1px solid rgba(217, 188, 154, 0.25);  /* wheat 25% */
      box-shadow: 0 2px 12px rgba(12, 13, 13, 0.06);
    }

    .navbar__brand {
      display: flex; align-items: baseline; gap: 1px;
      font-family: 'Bebas Neue', sans-serif;
      font-size: 1.6rem; letter-spacing: 0.06em;
      text-decoration: none; flex-shrink: 0;
    }
    .brand-not    { color: #F2EBDF; }   /* cream */
    .brand-tupper { color: #D9BC9A; }   /* wheat */

    .navbar__links { display: flex; gap: 2px; flex: 1; }
    .navbar__links a {
      padding: 6px 16px; border-radius: 6px;
      font-weight: 700; font-size: 0.82rem;
      letter-spacing: 0.1em; text-transform: uppercase;
      color: rgba(242, 235, 223, 0.75);       /* cream 75% */
      transition: color 0.2s, background 0.2s;
      text-decoration: none;
    }
    .navbar__links a:hover  { color: #F2EBDF; background: rgba(242, 235, 223, 0.08); }
    .navbar__links a.active {
      color: #F2EBDF;
      box-shadow: inset 0 -2px 0 #D9BC9A;    /* underline wheat */
    }

    .navbar__actions { display: flex; align-items: center; gap: 10px; }
    .navbar__user {
      font-weight: 700; font-size: 0.85rem;
      color: rgba(242, 235, 223, 0.85);
      padding: 0 4px; text-decoration: none;
      transition: color 0.15s;
    }
    .navbar__user:hover { color: #D9BC9A; }

    .btn-nav {
      padding: 7px 18px; border-radius: 20px;
      border: none; font-family: 'Bebas Neue', sans-serif;
      font-size: 1rem; letter-spacing: 0.08em; cursor: pointer;
      transition: all 0.15s; text-decoration: none;
      display: inline-flex; align-items: center;
    }
    .btn-nav--accent {
      background: #D9BC9A; color: #1E3D23;   /* wheat / forest-dark */
    }
    .btn-nav--accent:hover { background: #C4A47E; }
    .btn-nav--outline {
      background: transparent; color: #F2EBDF;
      border: 1.5px solid rgba(242, 235, 223, 0.6);
    }
    .btn-nav--outline:hover { background: rgba(242, 235, 223, 0.1); border-color: #F2EBDF; }
    .btn-nav--ghost {
      background: transparent;
      color: rgba(242, 235, 223, 0.7);
    }
    .btn-nav--ghost:hover { color: #F2EBDF; }

    .navbar__burger {
      display: none; flex-direction: column; gap: 5px;
      background: none; border: none; cursor: pointer;
      padding: 4px; margin-left: auto;
    }
    .navbar__burger span {
      display: block; width: 22px; height: 2px;
      background: #F2EBDF; border-radius: 1px; transition: 0.2s;
    }

    .mobile-menu {
      position: fixed; inset: 64px 0 0 0; z-index: 99;
      background: #2E5935;            /* forest */
      display: flex; flex-direction: column;
      padding: 20px; gap: 4px;
      border-top: 1px solid rgba(217, 188, 154, 0.25);
    }
    .mobile-menu a, .mobile-menu button {
      padding: 14px 16px; border-radius: 8px;
      font-weight: 700; font-size: 1.1rem; letter-spacing: 0.05em;
      color: #F2EBDF; background: none; border: none;
      cursor: pointer; text-align: left;
      font-family: 'Nunito', sans-serif; text-decoration: none;
    }
    .mobile-menu a:hover, .mobile-menu button:hover {
      background: rgba(242, 235, 223, 0.08);
    }

    .main-content { min-height: calc(100vh - 64px); }

    @media (max-width: 640px) {
      .navbar { padding: 0 20px; }
      .navbar__links, .navbar__actions { display: none; }
      .navbar__burger { display: flex; }
    }
  `]
})
export class AppComponent {
  mobileOpen = false;
  constructor(public auth: AuthService) {}
}
