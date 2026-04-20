import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ComidaService } from '../../../core/services/comida.service';
import { Comida, ComidaTipo } from '../../../core/models/index';

@Component({
  selector: 'app-admin-comidas',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="admin-page">
      <div class="admin-page__inner">

        <div class="page-header">
          <div style="display:flex;align-items:center;gap:16px">
            <a routerLink="/admin" class="btn btn--ghost btn--sm">← Volver</a>
            <div>
              <h1>Comidas</h1>
              <p class="subtitle">Catálogo reutilizable de platos</p>
              <div class="gold-line"></div>
            </div>
          </div>
          <button class="btn btn--gold" (click)="openForm(null)">+ Nueva comida</button>
        </div>

        <!-- Filtro -->
        <div class="filter-bar">
          @for (f of filters; track f.value) {
            <button class="filter-btn" [class.active]="activeFilter() === f.value"
                    (click)="activeFilter.set(f.value)">
              {{ f.label }}
            </button>
          }
        </div>

        @if (loading()) {
          <div class="skeleton" style="height:300px; border-radius:12px;"></div>
        } @else {
          <div class="comidas-grid">
            @for (c of filtered(); track c.id) {
              <div class="comida-card fade-up">
                <div class="comida-card__header">
                  <span class="badge" [class]="'badge--' + c.tipo.toLowerCase()">{{ c.tipo }}</span>
                  <span class="badge" [class]="c.activa ? 'badge--en_proceso' : 'badge--cancelado'">
                    {{ c.activa ? 'Activa' : 'Inactiva' }}
                  </span>
                </div>
                <h4 class="comida-card__name">{{ c.nombre }}</h4>
                @if (c.descripcion) {
                  <p class="comida-card__desc">{{ c.descripcion }}</p>
                }
                <div class="comida-card__actions">
                  <button class="btn btn--ghost btn--sm" (click)="toggle(c)">
                    {{ c.activa ? '⏸' : '▶' }}
                  </button>
                  <button class="btn btn--ghost btn--sm" (click)="openForm(c)">✏️</button>
                  <button class="btn btn--danger btn--sm" (click)="confirmDelete(c)">🗑️</button>
                </div>
              </div>
            }
            @empty {
              <p class="empty">No hay comidas para este filtro.</p>
            }
          </div>
        }

        <!-- Modal form -->
        @if (showForm()) {
          <div class="modal-overlay" (click)="closeForm()">
            <div class="modal" (click)="$event.stopPropagation()">
              <h3 class="modal__title">{{ editing() ? 'Editar comida' : 'Nueva comida' }}</h3>

              <div class="form-field">
                <label>Nombre</label>
                <input type="text" [(ngModel)]="formData.nombre" placeholder="Ej: Milanesa de pollo" />
              </div>

              <div class="form-field">
                <label>Descripción</label>
                <input type="text" [(ngModel)]="formData.descripcion"
                       placeholder="Ej: con mil hojas de papa" />
              </div>

              <div class="form-field">
                <label>Tipo</label>
                <select [(ngModel)]="formData.tipo">
                  <option value="COMUN">Común</option>
                  <option value="VEGETARIANA">Vegetariana</option>
                  <option value="AMBAS">Ambas</option>
                </select>
              </div>

              @if (formError()) { <p class="auth-error">{{ formError() }}</p> }

              <div class="modal__actions">
                <button class="btn btn--ghost" (click)="closeForm()">Cancelar</button>
                <button class="btn btn--gold" (click)="save()" [disabled]="saving()">
                  {{ saving() ? 'Guardando...' : 'Guardar' }}
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
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px; margin-bottom: 24px; }

    .filter-bar { display: flex; gap: 8px; margin-bottom: 24px; flex-wrap: wrap; }
    .filter-btn {
      padding: 6px 16px; border-radius: 20px; border: 1.5px solid var(--border);
      background: none; color: var(--text-muted); cursor: pointer; font-size: 0.85rem;
      font-weight: 700; font-family: var(--font-body); transition: all 0.15s;
      &:hover { border-color: var(--gold); color: var(--text); }
      &.active { background: var(--gold); color: var(--color-cream, #F2EBDF); border-color: var(--gold); }
    }

    .comidas-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 14px;
    }

    .comida-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: 18px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      transition: border-color 0.2s;
      &:hover { border-color: rgba(46,89,53,0.3); }

      &__header { display: flex; gap: 6px; }
      &__name { font-family: var(--font-display); font-size: 1.1rem; }
      &__desc { font-size: 0.82rem; color: var(--text-muted); flex: 1; }
      &__actions { display: flex; gap: 6px; margin-top: 4px; }
    }

    .empty { color: var(--text-muted); text-align: center; padding: 40px; grid-column: 1/-1; }

    .modal-overlay {
      position: fixed; inset: 0; z-index: 200;
      background: rgba(0,0,0,0.7);
      display: flex; align-items: center; justify-content: center;
      padding: 24px; backdrop-filter: blur(4px);
    }
    .modal {
      background: var(--bg-card); border: 1px solid var(--border);
      border-radius: var(--radius-lg); padding: 32px; width: 100%; max-width: 440px;
      display: flex; flex-direction: column; gap: 16px;
      animation: fadeUp 0.25s ease both;
    }
    .modal__title { font-family: var(--font-display); font-size: 1.6rem; }
    .modal__actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 8px; }

    .auth-error {
      background: rgba(224,80,80,0.12); border: 1px solid rgba(224,80,80,0.3);
      color: var(--danger); padding: 10px 14px; border-radius: var(--radius-sm); font-size: 0.88rem;
    }
  `]
})
export class AdminComidasComponent implements OnInit {
  comidas    = signal<Comida[]>([]);
  loading    = signal(true);
  saving     = signal(false);
  formError  = signal('');
  showForm   = signal(false);
  editing    = signal<Comida | null>(null);
  activeFilter = signal<string>('TODAS');

  formData: { nombre: string; descripcion: string; tipo: ComidaTipo } = {
    nombre: '', descripcion: '', tipo: 'COMUN'
  };

  filters = [
    { label: 'Todas', value: 'TODAS' },
    { label: 'Común', value: 'COMUN' },
    { label: 'Vegetariana', value: 'VEGETARIANA' },
    { label: 'Ambas', value: 'AMBAS' },
  ];

  filtered = () => {
    const f = this.activeFilter();
    return f === 'TODAS' ? this.comidas() : this.comidas().filter(c => c.tipo === f);
  };

  constructor(private comidaService: ComidaService) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.comidaService.getAll().subscribe({
      next: c => { this.comidas.set(c); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openForm(c: Comida | null): void {
    this.editing.set(c);
    this.formData = c
      ? { nombre: c.nombre, descripcion: c.descripcion ?? '', tipo: c.tipo }
      : { nombre: '', descripcion: '', tipo: 'COMUN' };
    this.formError.set('');
    this.showForm.set(true);
  }

  closeForm(): void { this.showForm.set(false); }

  save(): void {
    if (!this.formData.nombre.trim()) { this.formError.set('El nombre es obligatorio'); return; }
    this.saving.set(true);
    const obs = this.editing()
      ? this.comidaService.update(this.editing()!.id, this.formData)
      : this.comidaService.create(this.formData);

    obs.subscribe({
      next: () => { this.saving.set(false); this.closeForm(); this.load(); },
      error: () => { this.saving.set(false); this.formError.set('Error al guardar'); }
    });
  }

  toggle(c: Comida): void {
    this.comidaService.toggle(c.id).subscribe(() => this.load());
  }

  confirmDelete(c: Comida): void {
    if (confirm(`¿Eliminar "${c.nombre}"?`)) {
      this.comidaService.delete(c.id).subscribe(() => this.load());
    }
  }
}