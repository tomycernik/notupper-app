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
      --gold: #c9a84c; --veg: #6ab04c;
      --bg: #0f0c08; --bg-card: #161210;
      --border: #252018; --text: #f0ece0; --muted: #7a7268;
    }
    .page { min-height: 100vh; background: var(--bg); }

    .header { background: var(--bg-card); border-bottom: 1px solid var(--border); padding: 28px 0; }
    .header__inner { max-width: 760px; margin: 0 auto; padding: 0 24px; display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; flex-wrap: wrap; }
    .header__title { font-family: 'Bebas Neue', sans-serif; font-size: 2rem; color: var(--text); letter-spacing: 0.05em; }
    .header__sub { color: var(--muted); font-size: 0.9rem; margin-top: 4px; }
    .header__sub strong { color: var(--text); }
    .btn-volver { padding: 8px 18px; border-radius: 8px; border: 1px solid var(--border); color: var(--muted); font-size: 0.85rem; font-weight: 700; text-decoration: none; transition: all 0.15s; white-space: nowrap; }
    .btn-volver:hover { border-color: var(--gold); color: var(--text); }

    .content { max-width: 760px; margin: 0 auto; padding: 32px 24px 80px; display: flex; flex-direction: column; gap: 40px; }

    .stats { display: grid; grid-template-columns: repeat(3,1fr); gap: 12px; }
    .stat { background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px; padding: 20px 16px; text-align: center; }
    .stat__val { font-family: 'Bebas Neue', sans-serif; font-size: 2.2rem; color: var(--gold); letter-spacing: 0.03em; display: block; }
    .stat__label { font-size: 0.72rem; color: var(--muted); font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }

    .section { display: flex; flex-direction: column; gap: 12px; }
    .section__title { font-family: 'Bebas Neue', sans-serif; font-size: 1.3rem; color: var(--text); letter-spacing: 0.05em; }

    .pedidos-list { display: flex; flex-direction: column; gap: 10px; }
    .pedido-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; transition: border-color 0.2s; }
    .pedido-card:hover { border-color: rgba(201,168,76,0.2); }
    .pedido-card--activo { border-color: rgba(201,168,76,0.3); }
    .pedido-card--cancelado { opacity: 0.45; }
    .pedido-card__bar { height: 3px; }
    .bar--pendiente { background: linear-gradient(90deg, var(--gold) 0%, transparent 80%); }
    .bar--proceso { background: linear-gradient(90deg, var(--veg) 0%, transparent 80%); }
    .pedido-card__body { padding: 16px 20px; }
    .pedido-card__top { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
    .pedido-card__nombre { font-family: 'Bebas Neue', sans-serif; font-size: 1.15rem; color: var(--text); letter-spacing: 0.02em; margin-bottom: 6px; }
    .pedido-card__tags { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 8px; }
    .tag { padding: 2px 10px; border-radius: 12px; font-size: 0.72rem; font-weight: 800; background: rgba(201,168,76,0.12); color: var(--gold); }
    .tag--veg { background: rgba(106,176,76,0.12); color: var(--veg); }
    .tag--neutral { background: rgba(255,255,255,0.06); color: var(--muted); }
    .pedido-card__extras { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
    .extra-chip { padding: 2px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: 700; background: rgba(201,168,76,0.08); color: var(--gold); border: 1px solid rgba(201,168,76,0.15); }
    .extra-chip--dim { background: rgba(255,255,255,0.04); color: var(--muted); border-color: var(--border); }
    .pedido-card__obs { font-size: 0.78rem; color: var(--muted); margin-top: 6px; }
    .pedido-card__fecha { font-size: 0.75rem; color: #4a4438; margin-top: 10px; }

    .estado-badge { padding: 4px 12px; border-radius: 20px; font-size: 0.72rem; font-weight: 800; letter-spacing: 0.06em; white-space: nowrap; flex-shrink: 0; }
    .estado--pendiente { background: rgba(201,168,76,0.15); color: var(--gold); }
    .estado--en_proceso { background: rgba(106,176,76,0.15); color: var(--veg); }
    .estado--entregado { background: rgba(106,176,76,0.1); color: #5a9a4a; }
    .estado--cancelado { background: rgba(224,80,80,0.1); color: #e05050; }

    .skeletons { display: flex; flex-direction: column; gap: 10px; }
    .sk-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px; padding: 20px; display: flex; flex-direction: column; gap: 10px; }
    .sk { border-radius: 6px; background: linear-gradient(90deg, #1e1a14 25%, #2a2418 50%, #1e1a14 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; }
    .sk--title { height: 22px; }
    .sk--line { height: 14px; }

    .empty { text-align: center; padding: 60px 24px; display: flex; flex-direction: column; align-items: center; gap: 12px; }
    .empty__icon { font-size: 3rem; }
    .empty__title { font-family: 'Bebas Neue', sans-serif; font-size: 1.5rem; color: var(--muted); letter-spacing: 0.04em; }
    .empty__sub { color: #4a4438; font-size: 0.9rem; }

    .cta-volver { background: var(--bg-card); border: 1px solid rgba(201,168,76,0.2); border-radius: 14px; padding: 24px 28px; display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; }
    .cta-volver__text { color: var(--muted); font-size: 0.9rem; }
    .btn-primary { padding: 11px 24px; border-radius: 8px; border: none; background: var(--gold); color: #1a1209; font-family: 'Bebas Neue', sans-serif; font-size: 1rem; letter-spacing: 0.08em; cursor: pointer; text-decoration: none; transition: all 0.15s; white-space: nowrap; }
    .btn-primary:hover { filter: brightness(1.1); transform: translateY(-1px); }

    @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
    @media (max-width: 600px) { .cta-volver { flex-direction: column; text-align: center; } }
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
