import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PedidoService } from '../../core/services/pedido.service';
import { AuthService } from '../../core/services/auth.service';
import { Pedido } from '../../core/models/index';

@Component({
  selector: 'app-mis-pedidos',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page">

      <div class="header">
        <div class="header__inner">
          <div>
            <h1 class="header__title">Mis pedidos</h1>
            <p class="header__sub">Hola, <strong>{{ auth.user()?.nombre }}</strong> 👋</p>
          </div>
          <a routerLink="/" class="btn-volver">← Volver al menú</a>
        </div>
      </div>

      <div class="content">

        @if (loading()) {
          <div class="skeletons">
            @for (i of [1,2,3]; track i) {
              <div class="sk-card">
                <div class="sk sk--title"></div>
                <div class="sk sk--line"></div>
                <div class="sk sk--line" style="width:60%"></div>
              </div>
            }
          </div>
        } @else if (pedidos().length === 0) {
          <div class="empty">
            <p class="empty__icon">🍱</p>
            <h2 class="empty__title">Todavía no hiciste ningún pedido</h2>
            <p class="empty__sub">¡El menú de esta semana te espera!</p>
            <a routerLink="/" class="btn-primary">Ver el menú →</a>
          </div>
        } @else {

          <div class="stats">
            <div class="stat">
              <span class="stat__val">{{ pedidos().length }}</span>
              <span class="stat__label">Pedidos totales</span>
            </div>
            <div class="stat">
              <span class="stat__val">{{ pedidosPendientes() }}</span>
              <span class="stat__label">En curso</span>
            </div>
            <div class="stat">
              <span class="stat__val">{{ pedidosEntregados() }}</span>
              <span class="stat__label">Entregados</span>
            </div>
          </div>

          @if (enCurso().length > 0) {
            <div class="section">
              <h2 class="section__title">⏳ En curso</h2>
              <div class="pedidos-list">
                @for (p of enCurso(); track p.id) {
                  <div class="pedido-card pedido-card--activo">
                    <div class="pedido-card__bar"
                         [class.bar--pendiente]="p.estado === 'PENDIENTE'"
                         [class.bar--proceso]="p.estado === 'EN_PROCESO'"></div>
                    <div class="pedido-card__body">
                      <div class="pedido-card__top">
                        <div>
                          @if (p.vianda) {
                            <p class="pedido-card__nombre">{{ p.vianda.nombre }}</p>
                            <div class="pedido-card__tags">
                              <span class="tag" [class.tag--veg]="p.vianda.tipo === 'VEGETARIANA'">
                                {{ p.vianda.tipo === 'COMUN' ? '🍖 Común' : '🥦 Vegetariana' }}
                              </span>
                              <span class="tag tag--neutral">{{ p.tamano }}</span>
                            </div>
                          } @else {
                            <p class="pedido-card__nombre">Solo extras</p>
                          }
                          @if (p.extras && p.extras.length > 0) {
                            <div class="pedido-card__extras">
                              @for (e of p.extras; track e.id) {
                                <span class="extra-chip">{{ e.tipo === 'empanada' ? '🥟' : '🍕' }} {{ e.cantidad }}x {{ e.sabor }}</span>
                              }
                            </div>
                          }
                          @if (p.observaciones) {
                            <p class="pedido-card__obs">📝 {{ p.observaciones }}</p>
                          }
                        </div>
                        <div class="estado-badge" [class]="'estado--' + p.estado.toLowerCase()">
                          {{ estadoLabel(p.estado) }}
                        </div>
                      </div>
                      <p class="pedido-card__fecha">{{ formatDate(p.created_at) }}</p>
                    </div>
                  </div>
                }
              </div>
            </div>
          }

          @if (historial().length > 0) {
            <div class="section">
              <h2 class="section__title">📋 Historial</h2>
              <div class="pedidos-list">
                @for (p of historial(); track p.id) {
                  <div class="pedido-card" [class.pedido-card--cancelado]="p.estado === 'CANCELADO'">
                    <div class="pedido-card__body">
                      <div class="pedido-card__top">
                        <div>
                          @if (p.vianda) {
                            <p class="pedido-card__nombre">{{ p.vianda.nombre }}</p>
                            <div class="pedido-card__tags">
                              <span class="tag" [class.tag--veg]="p.vianda.tipo === 'VEGETARIANA'">
                                {{ p.vianda.tipo === 'COMUN' ? '🍖 Común' : '🥦 Vegetariana' }}
                              </span>
                              <span class="tag tag--neutral">{{ p.tamano }}</span>
                            </div>
                          } @else {
                            <p class="pedido-card__nombre">Solo extras</p>
                          }
                          @if (p.extras && p.extras.length > 0) {
                            <div class="pedido-card__extras">
                              @for (e of p.extras; track e.id) {
                                <span class="extra-chip extra-chip--dim">{{ e.tipo === 'empanada' ? '🥟' : '🍕' }} {{ e.cantidad }}x {{ e.sabor }}</span>
                              }
                            </div>
                          }
                        </div>
                        <div class="estado-badge" [class]="'estado--' + p.estado.toLowerCase()">
                          {{ estadoLabel(p.estado) }}
                        </div>
                      </div>
                      <p class="pedido-card__fecha">{{ formatDate(p.created_at) }}</p>
                    </div>
                  </div>
                }
              </div>
            </div>
          }

          <div class="cta-volver">
            <p class="cta-volver__text">¿Querés repetir? El menú de esta semana ya está disponible 🍱</p>
            <a routerLink="/" class="btn-primary">Ver el menú →</a>
          </div>
        }

      </div>
    </div>
  `,
  styles: [`
    :host {
      --bg: var(--color-cream, #F2EBDF);
      --bg-card: var(--color-white, #FFFFFF);
      --bg-soft: var(--color-cream-soft, #FAF6EE);
      --border: rgba(105, 115, 102, 0.22);
      --border-soft: rgba(105, 115, 102, 0.12);
      --text: var(--color-ink, #0C0D0D);
      --muted: var(--color-sage, #697366);
      --brand: var(--color-forest, #2E5935);
      --brand-dark: var(--color-forest-dark, #1E3D23);
      --brand-dim: rgba(46, 89, 53, 0.10);
      --accent: var(--color-wheat, #D9BC9A);
      --accent-dim: rgba(217, 188, 154, 0.35);
      --danger: #B3443A;

      /* Aliases legacy */
      --gold: var(--brand);
      --veg: var(--brand);
    }

    .page { min-height: 100vh; background: var(--bg); }

    .header {
      background: var(--bg-card);
      border-bottom: 1px solid var(--border);
      padding: 32px 0;
    }
    .header__inner {
      max-width: 760px; margin: 0 auto; padding: 0 24px;
      display: flex; justify-content: space-between;
      align-items: flex-start; gap: 16px; flex-wrap: wrap;
    }
    .header__title {
      font-family: 'Bebas Neue', sans-serif;
      font-size: 2.2rem; color: var(--text);
      letter-spacing: 0.05em;
    }
    .header__sub {
      color: var(--muted); font-size: 0.92rem; margin-top: 6px;
    }
    .header__sub strong { color: var(--brand); }

    .btn-volver {
      padding: 9px 20px; border-radius: 20px;
      border: 1.5px solid var(--brand);
      color: var(--brand);
      font-size: 0.85rem; font-weight: 700;
      text-decoration: none; transition: all 0.15s;
      white-space: nowrap;
      background: transparent;
    }
    .btn-volver:hover {
      background: var(--brand); color: var(--color-cream, #F2EBDF);
    }

    .content {
      max-width: 760px; margin: 0 auto;
      padding: 36px 24px 80px;
      display: flex; flex-direction: column; gap: 40px;
    }

    /* Stats */
    .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
    .stat {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 22px 16px; text-align: center;
      box-shadow: var(--shadow-sm);
    }
    .stat__val {
      font-family: 'Bebas Neue', sans-serif;
      font-size: 2.4rem; color: var(--brand);
      letter-spacing: 0.03em; display: block;
    }
    .stat__label {
      font-size: 0.72rem; color: var(--muted);
      font-weight: 700; letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .section { display: flex; flex-direction: column; gap: 14px; }
    .section__title {
      font-family: 'Bebas Neue', sans-serif;
      font-size: 1.4rem; color: var(--text);
      letter-spacing: 0.05em;
    }

    /* Pedido cards */
    .pedidos-list { display: flex; flex-direction: column; gap: 12px; }
    .pedido-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 14px;
      overflow: hidden;
      transition: border-color 0.2s, box-shadow 0.2s;
      box-shadow: var(--shadow-sm);
    }
    .pedido-card:hover {
      border-color: var(--brand-dim);
      box-shadow: var(--shadow);
    }
    .pedido-card--activo {
      border-color: var(--brand);
    }
    .pedido-card--cancelado { opacity: 0.55; }

    .pedido-card__bar { height: 4px; }
    .bar--pendiente {
      background: linear-gradient(90deg, var(--accent) 0%, transparent 80%);
    }
    .bar--proceso {
      background: linear-gradient(90deg, var(--brand) 0%, transparent 80%);
    }

    .pedido-card__body { padding: 18px 22px; }
    .pedido-card__top {
      display: flex; justify-content: space-between;
      align-items: flex-start; gap: 16px;
    }
    .pedido-card__nombre {
      font-family: 'Bebas Neue', sans-serif;
      font-size: 1.2rem; color: var(--text);
      letter-spacing: 0.02em; margin-bottom: 8px;
    }
    .pedido-card__tags {
      display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 8px;
    }

    .tag {
      padding: 3px 11px; border-radius: 12px;
      font-size: 0.72rem; font-weight: 800;
      background: var(--accent-dim); color: var(--brand-dark);
    }
    .tag--veg { background: var(--brand-dim); color: var(--brand); }
    .tag--neutral {
      background: rgba(105, 115, 102, 0.12); color: var(--muted);
    }

    .pedido-card__extras {
      display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px;
    }
    .extra-chip {
      padding: 3px 11px; border-radius: 12px;
      font-size: 0.78rem; font-weight: 700;
      background: var(--accent-dim); color: var(--brand-dark);
      border: 1px solid transparent;
    }
    .extra-chip--dim {
      background: rgba(105, 115, 102, 0.08); color: var(--muted);
      border-color: var(--border-soft);
    }

    .pedido-card__obs {
      font-size: 0.82rem; color: var(--muted);
      margin-top: 8px; font-style: italic;
    }
    .pedido-card__fecha {
      font-size: 0.75rem; color: var(--muted);
      opacity: 0.7; margin-top: 12px;
    }

    .estado-badge {
      padding: 5px 13px; border-radius: 20px;
      font-size: 0.72rem; font-weight: 800;
      letter-spacing: 0.06em;
      white-space: nowrap; flex-shrink: 0;
    }
    .estado--pendiente  { background: var(--accent-dim); color: var(--brand-dark); }
    .estado--en_proceso { background: var(--brand-dim); color: var(--brand); }
    .estado--entregado  { background: rgba(46, 89, 53, 0.18); color: var(--brand); }
    .estado--cancelado  { background: rgba(179, 68, 58, 0.12); color: var(--danger); }

    /* Skeletons */
    .skeletons { display: flex; flex-direction: column; gap: 12px; }
    .sk-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 22px; display: flex; flex-direction: column; gap: 10px;
    }
    .sk {
      border-radius: 6px;
      background: linear-gradient(90deg,
        var(--bg-soft) 25%,
        rgba(217, 188, 154, 0.25) 50%,
        var(--bg-soft) 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
    }
    .sk--title { height: 22px; }
    .sk--line { height: 14px; }

    /* Empty */
    .empty {
      text-align: center; padding: 70px 24px;
      display: flex; flex-direction: column;
      align-items: center; gap: 14px;
      background: var(--bg-card);
      border: 1.5px dashed var(--border);
      border-radius: 18px;
    }
    .empty__icon { font-size: 3.5rem; }
    .empty__title {
      font-family: 'Bebas Neue', sans-serif;
      font-size: 1.55rem; color: var(--brand);
      letter-spacing: 0.04em;
    }
    .empty__sub { color: var(--muted); font-size: 0.95rem; }

    /* CTA volver */
    .cta-volver {
      background: var(--accent-dim);
      border: 1px solid transparent;
      border-radius: 16px;
      padding: 26px 30px;
      display: flex; justify-content: space-between;
      align-items: center; gap: 16px; flex-wrap: wrap;
    }
    .cta-volver__text {
      color: var(--brand-dark); font-size: 0.95rem;
      font-weight: 600;
    }

    .btn-primary {
      padding: 12px 26px; border-radius: 20px;
      border: none;
      background: var(--brand); color: var(--color-cream, #F2EBDF);
      font-family: 'Bebas Neue', sans-serif;
      font-size: 1.05rem; letter-spacing: 0.08em;
      cursor: pointer; text-decoration: none;
      transition: all 0.15s; white-space: nowrap;
      box-shadow: var(--shadow-sm);
    }
    .btn-primary:hover {
      background: var(--brand-dark);
      transform: translateY(-1px);
      box-shadow: var(--shadow);
    }

    @keyframes shimmer {
      0%   { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }

    @media (max-width: 600px) {
      .cta-volver { flex-direction: column; text-align: center; }
      .stats { grid-template-columns: 1fr 1fr 1fr; gap: 8px; }
      .stat { padding: 16px 10px; }
      .stat__val { font-size: 1.8rem; }
    }
  `]
})
export class MisPedidosComponent implements OnInit {
  pedidos = signal<Pedido[]>([]);
  loading = signal(true);

  enCurso   = () => this.pedidos().filter(p => p.estado === 'PENDIENTE' || p.estado === 'EN_PROCESO');
  historial = () => this.pedidos().filter(p => p.estado === 'ENTREGADO' || p.estado === 'CANCELADO');
  pedidosPendientes = () => this.enCurso().length;
  pedidosEntregados = () => this.pedidos().filter(p => p.estado === 'ENTREGADO').length;

  constructor(private pedidoService: PedidoService, public auth: AuthService) {}

  ngOnInit(): void {
    this.pedidoService.getMisPedidos().subscribe({
      next: p => { this.pedidos.set(p); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  estadoLabel(estado: string): string {
    const map: Record<string, string> = {
      PENDIENTE: '⏳ Pendiente', EN_PROCESO: '🔥 En proceso',
      ENTREGADO: '✅ Entregado', CANCELADO: '✗ Cancelado',
    };
    return map[estado] ?? estado;
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleString('es-AR', {
      day: '2-digit', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }
}
