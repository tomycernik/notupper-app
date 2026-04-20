import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PedidoService } from '../../../core/services/pedido.service';
import { Pedido, PedidoEstado } from '../../../core/models/index';

@Component({
  selector: 'app-admin-pedidos',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="admin-page">
      <div class="admin-page__inner">

        <div class="page-header">
          <div style="display:flex;align-items:center;gap:16px">
            <a routerLink="/admin" class="btn btn--ghost btn--sm">← Volver</a>
            <div>
              <h1>Pedidos</h1>
              <p class="subtitle">{{ pedidos().length }} pedidos en total</p>
              <div class="gold-line"></div>
            </div>
          </div>
          <button class="btn btn--outline btn--sm" (click)="load()">↺ Actualizar</button>
        </div>

        <div class="filter-bar">
          @for (f of estadoFilters; track f.value) {
            <button class="filter-btn" [class.active]="activeFilter() === f.value"
                    (click)="activeFilter.set(f.value)">
              {{ f.label }}
              <span class="filter-count">{{ countByEstado(f.value) }}</span>
            </button>
          }
        </div>

        @if (loading()) {
          <div class="skeleton" style="height:300px; border-radius:12px;"></div>
        } @else {
          <div class="pedidos-list">
            @for (p of filtered(); track p.id) {
              <div class="pedido-row fade-up">
                <div class="pedido-row__main">
                  <div class="pedido-row__user">
                    <strong>{{ p.usuario?.nombre }} {{ p.usuario?.apellido }}</strong>
                    <span class="meta">📍 {{ p.usuario?.zona }}</span>
                    <span class="meta">📱 {{ p.usuario?.celular }}</span>
                  </div>

                  @if (p.vianda) {
                    <div class="pedido-row__vianda">
                      <span class="vianda-name">🍱 {{ p.vianda.nombre }}</span>
                      <span class="badge" [class]="'badge--' + p.vianda.tipo.toLowerCase()">{{ p.vianda.tipo }}</span>
                      <span class="badge badge--chica">{{ p.tamano }}</span>
                    </div>
                  }

                  @if (p.extras && p.extras.length > 0) {
                    <div class="pedido-row__extras">
                      @for (e of p.extras; track e.id) {
                        <span class="extra-chip">
                          {{ e.tipo === 'empanada' ? '🥟' : '🍕' }}
                          {{ e.cantidad }}× {{ e.sabor }}
                        </span>
                      }
                    </div>
                  }

                  @if (p.observaciones) {
                    <p class="pedido-row__obs">📝 {{ p.observaciones }}</p>
                  }
                  <p class="pedido-row__date">{{ formatDate(p.created_at) }}</p>
                </div>

                <div class="pedido-row__right">
                  <span class="badge" [class]="'badge--' + p.estado.toLowerCase()">{{ p.estado }}</span>
                  <div class="pedido-row__actions">
                    @for (s of nextStates(p.estado); track s.value) {
                      <button class="btn btn--outline btn--sm" (click)="cambiarEstado(p, s.value)">
                        {{ s.label }}
                      </button>
                    }
                    <button class="btn btn--danger btn--sm" (click)="confirmDelete(p)">🗑️</button>
                  </div>
                </div>
              </div>
            }
            @empty {
              <div class="empty"><p>No hay pedidos con este estado.</p></div>
            }
          </div>
        }

      </div>
    </div>
  `,
  styles: [`
    .admin-page { padding: 40px 24px; }
    .admin-page__inner { max-width: 1000px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px; margin-bottom: 24px; }

    .filter-bar { display: flex; gap: 8px; margin-bottom: 24px; flex-wrap: wrap; }
    .filter-btn {
      display: flex; align-items: center; gap: 6px;
      padding: 6px 14px; border-radius: 20px; border: 1.5px solid var(--border);
      background: none; color: var(--text-muted); cursor: pointer;
      font-size: 0.85rem; font-weight: 700; font-family: var(--font-body); transition: all 0.15s;
    }
    .filter-btn:hover { border-color: var(--gold); color: var(--text); }
    .filter-btn.active { background: var(--gold); color: var(--color-cream, #F2EBDF); border-color: var(--gold); }
    .filter-count {
      background: rgba(255,255,255,0.15);
      border-radius: 10px; padding: 1px 7px; font-size: 0.75rem;
    }

    .pedidos-list { display: flex; flex-direction: column; gap: 10px; }
    .pedido-row {
      background: var(--bg-card); border: 1px solid var(--border);
      border-radius: var(--radius-md); padding: 18px 20px;
      display: flex; justify-content: space-between; align-items: flex-start;
      gap: 20px; flex-wrap: wrap; transition: border-color 0.2s;
    }
    .pedido-row:hover { border-color: rgba(46,89,53,0.2); }

    .pedido-row__main { display: flex; flex-direction: column; gap: 8px; flex: 1; }
    .pedido-row__user { display: flex; align-items: center; flex-wrap: wrap; gap: 10px; }
    .pedido-row__user strong { font-size: 1rem; }
    .meta { font-size: 0.82rem; color: var(--text-muted); }

    .pedido-row__vianda { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .vianda-name { font-size: 0.9rem; font-weight: 700; color: var(--gold); }

    .pedido-row__extras { display: flex; flex-wrap: wrap; gap: 6px; }
    .extra-chip {
      padding: 3px 10px; border-radius: 12px; font-size: 0.78rem; font-weight: 700;
      background: rgba(46,89,53,0.1); color: var(--gold); border: 1px solid rgba(46,89,53,0.2);
    }

    .pedido-row__obs { font-size: 0.82rem; color: var(--text-muted); }
    .pedido-row__date { font-size: 0.78rem; color: var(--text-muted); }

    .pedido-row__right { display: flex; flex-direction: column; align-items: flex-end; gap: 10px; flex-shrink: 0; }
    .pedido-row__actions { display: flex; gap: 6px; flex-wrap: wrap; justify-content: flex-end; }

    .empty { text-align: center; padding: 60px; color: var(--text-muted); }
  `]
})
export class AdminPedidosComponent implements OnInit {
  pedidos      = signal<Pedido[]>([]);
  loading      = signal(true);
  activeFilter = signal<string>('TODOS');

  estadoFilters = [
    { label: 'Todos',      value: 'TODOS' },
    { label: 'Pendiente',  value: 'PENDIENTE' },
    { label: 'En proceso', value: 'EN_PROCESO' },
    { label: 'Entregado',  value: 'ENTREGADO' },
    { label: 'Cancelado',  value: 'CANCELADO' },
  ];

  filtered = computed(() => {
    const f = this.activeFilter();
    return f === 'TODOS' ? this.pedidos() : this.pedidos().filter(p => p.estado === f);
  });

  countByEstado(estado: string): number {
    return estado === 'TODOS'
      ? this.pedidos().length
      : this.pedidos().filter(p => p.estado === estado).length;
  }

  nextStates(estado: PedidoEstado): { label: string; value: PedidoEstado }[] {
    const map: Record<PedidoEstado, { label: string; value: PedidoEstado }[]> = {
      PENDIENTE:  [{ label: '▶ En proceso', value: 'EN_PROCESO' }, { label: '✗ Cancelar', value: 'CANCELADO' }],
      EN_PROCESO: [{ label: '✓ Entregado', value: 'ENTREGADO' }],
      ENTREGADO:  [],
      CANCELADO:  [],
    };
    return map[estado] ?? [];
  }

  constructor(private pedidoService: PedidoService) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.pedidoService.getAll().subscribe({
      next: p => { this.pedidos.set(p); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  cambiarEstado(p: Pedido, estado: PedidoEstado): void {
    this.pedidoService.actualizarEstado(p.id, estado).subscribe(() => this.load());
  }

  confirmDelete(p: Pedido): void {
    if (confirm(`¿Eliminar el pedido de ${p.usuario?.nombre}?`)) {
      this.pedidoService.delete(p.id).subscribe(() => this.load());
    }
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleString('es-AR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }
}