import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ViandaService } from '../../../core/services/vianda.service';
import { ComidaService } from '../../../core/services/comida.service';
import { Vianda, Comida, ViandaTipo } from '../../../core/models/index';

@Component({
  selector: 'app-admin-viandas',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="admin-page">
      <div class="admin-page__inner">

        <div class="page-header">
          <div style="display:flex;align-items:center;gap:16px">
            <a routerLink="/admin" class="btn btn--ghost btn--sm">← Volver</a>
            <div>
              <h1>Viandas</h1>
              <p class="subtitle">Armá el menú de la semana</p>
              <div class="gold-line"></div>
            </div>
          </div>
          <button class="btn btn--gold" (click)="openForm(null)">+ Nueva vianda</button>
        </div>

        <!-- Lista -->
        @if (loading()) {
          <div class="skeleton" style="height:200px; border-radius:12px;"></div>
        } @else {
          <div class="viandas-list">
            @for (v of viandas(); track v.id) {
              <div class="vianda-row fade-up">
                <div class="vianda-row__info">
                  <div class="vianda-row__header">
                    <h3>{{ v.nombre }}</h3>
                    <div class="vianda-row__badges">
                      <span class="badge" [class]="'badge--' + v.tipo.toLowerCase()">{{ v.tipo }}</span>
                      <span class="badge" [class]="v.activo ? 'badge--en_proceso' : 'badge--cancelado'">
                        {{ v.activo ? 'Activo' : 'Inactivo' }}
                      </span>
                    </div>
                  </div>
                  @if (v.comidas && v.comidas.length > 0) {
                    <p class="vianda-row__comidas">
                      {{ getComidasNombres(v) }}
                    </p>
                  }
                </div>
                <div class="vianda-row__actions">
                  <button class="btn btn--outline btn--sm" (click)="openComidas(v)">
                    🍽️ Comidas
                  </button>
                  <button class="btn btn--outline btn--sm" (click)="toggle(v)">
                    {{ v.activo ? '⏸ Desactivar' : '▶ Activar' }}
                  </button>
                  <button class="btn btn--ghost btn--sm" (click)="openForm(v)">✏️</button>
                  <button class="btn btn--danger btn--sm" (click)="confirmDelete(v)">🗑️</button>
                </div>
              </div>
            }
            @empty {
              <p class="empty">No hay viandas creadas aún.</p>
            }
          </div>
        }

        <!-- Modal: Form vianda -->
        @if (showForm()) {
          <div class="modal-overlay" (click)="closeForm()">
            <div class="modal" (click)="$event.stopPropagation()">
              <h3 class="modal__title">{{ editing() ? 'Editar vianda' : 'Nueva vianda' }}</h3>

              <div class="form-field">
                <label>Nombre</label>
                <input type="text" [(ngModel)]="formData.nombre" placeholder="Ej: Milanesa napolitana" />
              </div>
              <div class="modal__row">
                <div class="form-field">
                  <label>Tipo</label>
                  <select [(ngModel)]="formData.tipo">
                    <option value="COMUN">Común</option>
                    <option value="VEGETARIANA">Vegetariana</option>
                  </select>
                </div>

              </div>
              <div class="form-field">
                <label>Observaciones</label>
                <input type="text" [(ngModel)]="formData.observaciones" placeholder="Opcional..." />
              </div>

              @if (formError()) { <p class="auth-error">{{ formError() }}</p> }

              <div class="modal__actions">
                <button class="btn btn--ghost" (click)="closeForm()">Cancelar</button>
                <button class="btn btn--gold" (click)="saveVianda()" [disabled]="saving()">
                  {{ saving() ? 'Guardando...' : 'Guardar' }}
                </button>
              </div>
            </div>
          </div>
        }

        <!-- Modal: Asignar comidas -->
        @if (showComidas()) {
          <div class="modal-overlay" (click)="closeComidas()">
            <div class="modal modal--wide" (click)="$event.stopPropagation()">
              <h3 class="modal__title">Comidas de: {{ selectedVianda()?.nombre }}</h3>
              <p class="modal__sub">Seleccioná las comidas que forman esta vianda (el orden importa)</p>

              <div class="comidas-picker">
                @for (c of allComidas(); track c.id) {
                  <div class="comida-item" [class.comida-item--selected]="isComidasSelected(c.id)"
                       (click)="toggleComida(c.id)">
                    <span class="comida-item__check">{{ isComidasSelected(c.id) ? '✓' : '' }}</span>
                    <div>
                      <p class="comida-item__name">{{ c.nombre }}</p>
                      <span class="badge badge--sm" [class]="'badge--' + c.tipo.toLowerCase()">{{ c.tipo }}</span>
                    </div>
                  </div>
                }
              </div>

              @if (formError()) { <p class="auth-error">{{ formError() }}</p> }

              <div class="modal__actions">
                <button class="btn btn--ghost" (click)="closeComidas()">Cancelar</button>
                <button class="btn btn--gold" (click)="saveComidas()" [disabled]="saving()">
                  {{ saving() ? 'Guardando...' : 'Guardar comidas' }}
                </button>
              </div>
            </div>
          </div>
        }

      </div>
    </div>
  `,
  styles: [`
    .admin-page { padding: 40px 24px; }
    .admin-page__inner { max-width: 900px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px; margin-bottom: 32px; }

    .viandas-list { display: flex; flex-direction: column; gap: 12px; }

    .vianda-row {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: 18px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
      transition: border-color 0.2s;
      &:hover { border-color: rgba(46,89,53,0.3); }
    }

    .vianda-row__header { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 6px; }
    .vianda-row__badges { display: flex; gap: 6px; flex-wrap: wrap; }
    .vianda-row__info h3 { font-family: var(--font-display); font-size: 1.2rem; }
    .vianda-row__comidas { font-size: 0.82rem; color: var(--text-muted); }
    .vianda-row__actions { display: flex; gap: 8px; flex-wrap: wrap; }

    .empty { color: var(--text-muted); text-align: center; padding: 40px; }

    .modal-overlay {
      position: fixed; inset: 0; z-index: 200;
      background: rgba(0,0,0,0.7);
      display: flex; align-items: center; justify-content: center;
      padding: 24px;
      backdrop-filter: blur(4px);
    }

    .modal {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 32px;
      width: 100%;
      max-width: 480px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      animation: fadeUp 0.25s ease both;

      &--wide { max-width: 600px; }
    }

    .modal__title { font-family: var(--font-display); font-size: 1.6rem; }
    .modal__sub   { font-size: 0.88rem; color: var(--text-muted); margin-top: -8px; }
    .modal__row   { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .modal__actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 8px; }

    .comidas-picker {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 10px;
      max-height: 280px;
      overflow-y: auto;
    }

    .comida-item {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      background: var(--bg-elevated);
      border: 1.5px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 10px 12px;
      cursor: pointer;
      transition: border-color 0.15s;

      &--selected { border-color: var(--gold); background: rgba(46,89,53,0.06); }
      &:hover { border-color: rgba(46,89,53,0.4); }
    }

    .comida-item__check {
      width: 20px; height: 20px;
      background: var(--gold); color: var(--color-cream, #F2EBDF);
      border-radius: 50%; font-size: 0.7rem; font-weight: 900;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; opacity: 0; transition: opacity 0.15s;
      .comida-item--selected & { opacity: 1; }
    }

    .comida-item__name { font-size: 0.9rem; font-weight: 700; margin-bottom: 4px; }

    .auth-error {
      background: rgba(224,80,80,0.12);
      border: 1px solid rgba(224,80,80,0.3);
      color: var(--danger);
      padding: 10px 14px;
      border-radius: var(--radius-sm);
      font-size: 0.88rem;
    }
  `]
})
export class AdminViandasComponent implements OnInit {
  viandas   = signal<Vianda[]>([]);
  allComidas = signal<Comida[]>([]);
  loading   = signal(true);
  saving    = signal(false);
  formError = signal('');

  showForm    = signal(false);
  showComidas = signal(false);
  editing     = signal<Vianda | null>(null);
  selectedVianda = signal<Vianda | null>(null);

  selectedComidaIds = signal<string[]>([]);

  formData: { nombre: string; tipo: ViandaTipo; observaciones: string } = {
    nombre: '', tipo: 'COMUN', observaciones: ''
  };

  constructor(private viandaService: ViandaService, private comidaService: ComidaService) {}

  getComidasNombres(v: Vianda): string {
    return (v.comidas ?? []).map((c: Comida) => c.nombre).join(' · ');
  }

  ngOnInit(): void {
    this.load();
    this.comidaService.getAll().subscribe(c => this.allComidas.set(c));
  }

  load(): void {
    this.loading.set(true);
    this.viandaService.getAll().subscribe({
      next: v => { this.viandas.set(v); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openForm(v: Vianda | null): void {
    this.editing.set(v);
    if (v) {
      this.formData = { nombre: v.nombre, tipo: v.tipo, observaciones: v.observaciones ?? '' };
    } else {
      this.formData = { nombre: '', tipo: 'COMUN', observaciones: '' };
    }
    this.formError.set('');
    this.showForm.set(true);
  }

  closeForm(): void { this.showForm.set(false); }

  saveVianda(): void {
    if (!this.formData.nombre.trim()) { this.formError.set('El nombre es obligatorio'); return; }
    this.saving.set(true);

    const obs = this.editing()
      ? this.viandaService.update(this.editing()!.id, this.formData)
      : this.viandaService.create(this.formData);

    obs.subscribe({
      next: () => { this.saving.set(false); this.closeForm(); this.load(); },
      error: () => { this.saving.set(false); this.formError.set('Error al guardar'); }
    });
  }

  toggle(v: Vianda): void {
    this.viandaService.toggle(v.id).subscribe(() => this.load());
  }

  openComidas(v: Vianda): void {
    this.selectedVianda.set(v);
    this.selectedComidaIds.set(v.comidas?.map((c: Comida) => c.id) ?? []);
    this.formError.set('');
    this.showComidas.set(true);
  }

  closeComidas(): void { this.showComidas.set(false); }

  isComidasSelected(id: string): boolean {
    return this.selectedComidaIds().includes(id);
  }

  toggleComida(id: string): void {
    const curr = this.selectedComidaIds();
    this.selectedComidaIds.set(
      curr.includes(id) ? curr.filter(i => i !== id) : [...curr, id]
    );
  }

  saveComidas(): void {
    const v = this.selectedVianda();
    if (!v) return;
    this.saving.set(true);
    const comidas = this.selectedComidaIds().map((comidaId, orden) => ({ comidaId, orden }));
    this.viandaService.asignarComidas(v.id, comidas).subscribe({
      next: () => { this.saving.set(false); this.closeComidas(); this.load(); },
      error: () => { this.saving.set(false); this.formError.set('Error al guardar las comidas'); }
    });
  }

  confirmDelete(v: Vianda): void {
    if (confirm(`¿Eliminar "${v.nombre}"?`)) {
      this.viandaService.delete(v.id).subscribe(() => this.load());
    }
  }
}