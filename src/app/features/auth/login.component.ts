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
      background: #0f0c08;
      background-image:
        radial-gradient(ellipse 60% 50% at 50% 100%, rgba(201,168,76,0.07) 0%, transparent 70%);
    }

    .auth-card {
      width: 100%; max-width: 420px;
      background: #161210;
      border: 1px solid #2a2520;
      border-radius: 20px;
      padding: 40px 36px;
      display: flex; flex-direction: column; gap: 0;
    }

    .auth-brand {
      font-family: 'Bebas Neue', sans-serif;
      font-size: 2.4rem; letter-spacing: 0.06em;
      text-align: center; line-height: 1;
      margin-bottom: 4px;
    }
    .auth-brand__not    { color: #f0ece0; }
    .auth-brand__tupper { color: #c9a84c; }

    .auth-sub {
      text-align: center; font-size: 0.7rem; letter-spacing: 0.3em;
      color: #6a6460; font-weight: 700; margin-bottom: 32px;
    }

    .auth-title {
      font-family: 'Bebas Neue', sans-serif;
      font-size: 1.4rem; color: #f0ece0; letter-spacing: 0.05em;
      margin-bottom: 24px;
    }

    .auth-form { display: flex; flex-direction: column; gap: 16px; }

    .field { display: flex; flex-direction: column; gap: 6px; }
    .field__label {
      font-size: 0.72rem; font-weight: 800; letter-spacing: 0.12em;
      text-transform: uppercase; color: #9a9080;
    }
    .field__input {
      background: #0f0c08; border: 1.5px solid #2a2520;
      border-radius: 8px; color: #f0ece0;
      font-size: 1rem; padding: 12px 14px;
      transition: border-color 0.2s; outline: none; width: 100%;
      font-family: 'Nunito', sans-serif;
    }
    .field__input:focus { border-color: #c9a84c; }
    .field__input::placeholder { color: #4a4440; }

    .auth-error {
      background: rgba(224,80,80,0.1); border: 1px solid rgba(224,80,80,0.3);
      color: #e07070; padding: 10px 14px; border-radius: 8px; font-size: 0.88rem;
    }

    .btn-submit {
      margin-top: 4px; padding: 14px;
      background: #c9a84c; color: #1a1209;
      border: none; border-radius: 8px;
      font-family: 'Bebas Neue', sans-serif; font-size: 1.2rem; letter-spacing: 0.12em;
      cursor: pointer; transition: all 0.15s; width: 100%;
    }
    .btn-submit:hover { background: #e8c76a; transform: translateY(-1px); }
    .btn-submit:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

    .auth-footer {
      text-align: center; margin-top: 24px; color: #6a6460; font-size: 0.88rem;
    }
    .auth-footer a { color: #c9a84c; font-weight: 700; text-decoration: none; }
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