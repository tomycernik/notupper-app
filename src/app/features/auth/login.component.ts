import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-brand">
          <span class="auth-brand__not">NOT</span><span class="auth-brand__tupper">TUPPER</span>
        </div>
        <p class="auth-sub">FREEZÁ TU SEMANA</p>

        <h2 class="auth-title">Bienvenido de vuelta</h2>

        <div class="auth-form">
          <div class="field">
            <label class="field__label">Email</label>
            <input class="field__input" type="email" [(ngModel)]="email"
                   name="email" placeholder="tu@email.com" />
          </div>
          <div class="field">
            <label class="field__label">Contraseña</label>
            <input class="field__input" type="password" [(ngModel)]="password"
                   name="password" placeholder="••••••••" />
          </div>

          @if (error()) {
            <p class="auth-error">{{ error() }}</p>
          }

          <button class="btn-submit" [disabled]="loading()" (click)="submit()">
            {{ loading() ? 'Ingresando...' : 'INGRESAR' }}
          </button>
        </div>

        <p class="auth-footer">
          ¿No tenés cuenta?
          <a routerLink="/auth/register">Registrarse</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .auth-page {
      min-height: calc(100vh - 64px);
      display: flex; align-items: center; justify-content: center;
      padding: 24px;
      background: var(--color-cream, #F2EBDF);
      /* Gingham sutil de fondo — guiño al flyer */
      background-image:
        linear-gradient(45deg,  transparent 48%, rgba(217,188,154,0.15) 48% 52%, transparent 52%),
        linear-gradient(-45deg, transparent 48%, rgba(217,188,154,0.15) 48% 52%, transparent 52%);
      background-size: 48px 48px;
    }

    .auth-card {
      width: 100%; max-width: 420px;
      background: var(--color-white, #FFFFFF);
      border: 1px solid rgba(105, 115, 102, 0.22);
      border-radius: 20px;
      padding: 40px 36px;
      display: flex; flex-direction: column; gap: 0;
      box-shadow: 0 12px 40px rgba(12, 13, 13, 0.10);
    }

    .auth-brand {
      font-family: 'Bebas Neue', sans-serif;
      font-size: 2.6rem; letter-spacing: 0.06em;
      text-align: center; line-height: 1;
      margin-bottom: 4px;
    }
    .auth-brand__not    { color: var(--color-ink, #0C0D0D); }
    .auth-brand__tupper { color: var(--color-forest, #2E5935); }

    .auth-sub {
      text-align: center;
      font-size: 0.7rem; letter-spacing: 0.3em;
      color: var(--color-sage, #697366);
      font-weight: 700; margin-bottom: 32px;
    }

    .auth-title {
      font-family: 'Bebas Neue', sans-serif;
      font-size: 1.5rem; color: var(--color-ink, #0C0D0D);
      letter-spacing: 0.05em; margin-bottom: 26px;
    }

    .auth-form { display: flex; flex-direction: column; gap: 16px; }

    .field { display: flex; flex-direction: column; gap: 6px; }
    .field__label {
      font-size: 0.72rem; font-weight: 800;
      letter-spacing: 0.12em; text-transform: uppercase;
      color: var(--color-sage, #697366);
    }
    .field__input {
      background: var(--color-cream-soft, #FAF6EE);
      border: 1.5px solid rgba(105, 115, 102, 0.22);
      border-radius: 10px;
      color: var(--color-ink, #0C0D0D);
      font-size: 1rem; padding: 13px 15px;
      transition: border-color 0.2s, box-shadow 0.2s;
      outline: none; width: 100%;
      font-family: 'Nunito', sans-serif;
    }
    .field__input:focus {
      border-color: var(--color-forest, #2E5935);
      box-shadow: 0 0 0 3px rgba(46, 89, 53, 0.12);
      background: var(--color-white, #FFFFFF);
    }
    .field__input::placeholder {
      color: var(--color-sage, #697366); opacity: 0.6;
    }

    .auth-error {
      background: rgba(179, 68, 58, 0.1);
      border: 1px solid rgba(179, 68, 58, 0.25);
      color: #B3443A;
      padding: 11px 14px; border-radius: 10px;
      font-size: 0.88rem;
    }

    .btn-submit {
      margin-top: 6px; padding: 15px;
      background: var(--color-forest, #2E5935);
      color: var(--color-cream, #F2EBDF);
      border: none; border-radius: 12px;
      font-family: 'Bebas Neue', sans-serif;
      font-size: 1.2rem; letter-spacing: 0.12em;
      cursor: pointer; transition: all 0.15s; width: 100%;
      box-shadow: 0 2px 8px rgba(46, 89, 53, 0.15);
    }
    .btn-submit:hover {
      background: var(--color-forest-dark, #1E3D23);
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(46, 89, 53, 0.25);
    }
    .btn-submit:disabled {
      opacity: 0.5; cursor: not-allowed; transform: none;
    }

    .auth-footer {
      text-align: center; margin-top: 26px;
      color: var(--color-sage, #697366); font-size: 0.9rem;
    }
    .auth-footer a {
      color: var(--color-forest, #2E5935);
      font-weight: 700; text-decoration: none;
    }
    .auth-footer a:hover { text-decoration: underline; }
  `]
})
export class LoginComponent {
  email    = '';
  password = '';
  loading  = signal(false);
  error    = signal('');

  constructor(
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  async submit() {
    if (!this.email || !this.password) { this.error.set('Completá todos los campos'); return; }
    this.loading.set(true); this.error.set('');
    this.auth.login({ email: this.email, password: this.password }).subscribe({
      next: () => {
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/';
        this.router.navigateByUrl(returnUrl);
      },
      error: (e: any) => { this.loading.set(false); this.error.set(e.error?.message ?? 'Error al ingresar'); }
    });
  }
}