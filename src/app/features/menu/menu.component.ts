import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ViandaService } from '../../core/services/vianda.service';
import { PedidoService } from '../../core/services/pedido.service';
import { AuthService } from '../../core/services/auth.service';
import { Vianda, PedidoTamano } from '../../core/models/index';
import { PedidoExtra } from '../../core/services/pedido.service';

interface ExtraItem {
  id: string;
  tipo: 'empanada' | 'pizza';
  sabor: string;
  precio: number;
  cantidad: number;
}

const EMPANADAS = [
  'Carne suave', 'Carne a cuchillo', 'Atún',
  'Queso y cebolla', 'Jamón y queso', 'Pollo'
];
const PIZZAS = ['Queso', 'Queso y cebolla'];

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">

      <!-- HERO -->
      <header class="hero">
        <div class="hero__glow"></div>
        <div class="hero__inner">
          <div class="hero__brand">
            <span class="brand-not">NOT</span><span class="brand-tupper">TUPPER</span>
          </div>
          <p class="hero__sub">Freezá tu semana con comida real 🍱</p>
          <div class="hero__chips">
            <div class="chip">
              <span class="chip__label">5 viandas · 300g</span>
              <span class="chip__price">$35.000</span>
            </div>
            <div class="chip chip--outline">
              <span class="chip__label">5 viandas · 500g</span>
              <span class="chip__price">$45.000</span>
            </div>
          </div>
        </div>
      </header>

      <div class="layout">

        <!-- COLUMNA PRINCIPAL -->
        <div class="col-main">

          <!-- VIANDAS -->
          <section class="block">
            <div class="block__head">
              <h2 class="block__title">Menú de la semana</h2>
              <p class="block__sub">Pedidos hasta el miércoles · Entrega el finde</p>
            </div>

            @if (loading()) {
              <div class="viandas-list">
                @for (i of [1,2]; track i) {
                  <div class="vianda-sk">
                    <div class="sk" style="height:18px;width:80px;border-radius:10px"></div>
                    <div class="sk" style="height:24px;width:60%"></div>
                    <div class="sk" style="height:14px;width:90%"></div>
                    <div class="sk" style="height:14px;width:70%"></div>
                  </div>
                }
              </div>
            } @else if (viandas().length === 0) {
              <div class="empty">
                <span class="empty__icon">🍽️</span>
                <p class="empty__msg">No hay menú disponible por el momento.</p>
                <p class="empty__hint">¡Volvé pronto para ver las novedades!</p>
              </div>
            } @else {
              <div class="viandas-list">
                @for (v of viandas(); track v.id; let i = $index) {
                  <div class="vianda-row"
                       [class.vianda-row--veg]="v.tipo === 'VEGETARIANA'"
                       [class.vianda-row--selected]="selectedVianda()?.id === v.id"
                       [style.animation-delay]="(i * 0.08) + 's'"
                       (click)="selectVianda(v)">

                    <div class="vianda-row__left">
                      <span class="tipo-pill" [class.tipo-pill--veg]="v.tipo === 'VEGETARIANA'">
                        {{ v.tipo === 'COMUN' ? '🍖 Común' : '🥦 Vegetariana' }}
                      </span>
                      <h3 class="vianda-row__nombre">{{ v.nombre }}</h3>
                      @if (v.comidas && v.comidas.length > 0) {
                        <p class="vianda-row__comidas">
                          @for (c of v.comidas; track c.id; let last = $last) {
                            {{ c.nombre }}@if (!last) { · }
                          }
                        </p>
                      }
                      @if (v.observaciones) {
                        <p class="vianda-row__obs">{{ v.observaciones }}</p>
                      }
                    </div>

                    <div class="vianda-row__right">
                      @if (selectedVianda()?.id === v.id) {
                        <span class="tick" [class.tick--veg]="v.tipo === 'VEGETARIANA'">✓</span>
                      } @else {
                        <span class="select-hint">Elegir</span>
                      }
                    </div>

                  </div>
                }
              </div>
            }
          </section>

          <!-- EXTRAS -->
          <section class="block">
            <div class="block__head">
              <h2 class="block__title">También podés pedir</h2>
              <p class="block__sub">Empanadas y pizzas caseras · Se suman al pedido o se piden por separado</p>
            </div>

            <div class="extras-grid">
              <!-- EMPANADAS -->
              <div class="extra-block">
                <div class="extra-block__head">
                  <span class="extra-block__emoji">🥟</span>
                  <div>
                    <p class="extra-block__name">Empanadas</p>
                    <p class="extra-block__price">$7.500 la media docena</p>
                  </div>
                </div>
                @for (s of empanadas; track s) {
                  <div class="sabor-row">
                    <span class="sabor-row__name">{{ s }}</span>
                    <div class="counter">
                      <button class="counter__btn" (click)="decrementar('empanada', s)">−</button>
                      <span class="counter__val">{{ extras['empanada:' + s] || 0 }}</span>
                      <button class="counter__btn counter__btn--plus" (click)="incrementar('empanada', s)">+</button>
                    </div>
                  </div>
                }
              </div>

              <!-- PIZZAS -->
              <div class="extra-block">
                <div class="extra-block__head">
                  <span class="extra-block__emoji">🍕</span>
                  <div>
                    <p class="extra-block__name">Pizzas</p>
                    <p class="extra-block__price">$10.000 por pizza</p>
                  </div>
                </div>
                @for (s of pizzas; track s) {
                  <div class="sabor-row">
                    <span class="sabor-row__name">{{ s }}</span>
                    <div class="counter">
                      <button class="counter__btn" (click)="decrementar('pizza', s)">−</button>
                      <span class="counter__val">{{ extras['pizza:' + s] || 0 }}</span>
                      <button class="counter__btn counter__btn--plus" (click)="incrementar('pizza', s)">+</button>
                    </div>
                  </div>
                }
              </div>
            </div>
          </section>

        </div>

        <!-- PANEL STICKY -->
        <aside class="col-aside">
          <div class="panel" [class.panel--veg]="selectedVianda()?.tipo === 'VEGETARIANA'"
               [class.panel--empty]="!selectedVianda() && !tieneExtras()">

            @if (!selectedVianda() && !tieneExtras()) {
              <div class="panel__placeholder">
                <p class="panel__placeholder-title">Tu pedido</p>
                <p class="panel__placeholder-hint">Elegí una vianda o agregá extras para empezar</p>
              </div>
            } @else {
              <h3 class="panel__title">Tu pedido</h3>

              @if (selectedVianda()) {
                <div class="panel__section">
                  <p class="panel__label">Vianda</p>
                  <p class="panel__vianda-nombre">{{ selectedVianda()!.nombre }}</p>
                  <span class="tipo-pill" [class.tipo-pill--veg]="selectedVianda()!.tipo === 'VEGETARIANA'" style="font-size:0.7rem">
                    {{ selectedVianda()!.tipo === 'COMUN' ? '🍖 Común' : '🥦 Vegetariana' }}
                  </span>

                  <p class="panel__label" style="margin-top:16px">Tamaño</p>
                  <div class="tamanos">
                    <button class="tam-btn" [class.tam-btn--active]="tamano() === 'CHICA'"
                            [class.tam-btn--veg]="selectedVianda()!.tipo === 'VEGETARIANA'"
                            (click)="tamano.set('CHICA')">
                      <span class="tam-btn__size">CHICA</span>
                      <span class="tam-btn__price">$35.000</span>
                      <span class="tam-btn__g">~300g</span>
                    </button>
                    <button class="tam-btn" [class.tam-btn--active]="tamano() === 'GRANDE'"
                            [class.tam-btn--veg]="selectedVianda()!.tipo === 'VEGETARIANA'"
                            (click)="tamano.set('GRANDE')">
                      <span class="tam-btn__size">GRANDE</span>
                      <span class="tam-btn__price">$45.000</span>
                      <span class="tam-btn__g">~500g</span>
                    </button>
                  </div>
                </div>
              }

              @if (tieneExtras()) {
                <div class="panel__section">
                  <p class="panel__label">Extras</p>
                  @for (e of extrasSeleccionados(); track e.id) {
                    <div class="panel__extra-row">
                      <span>{{ e.cantidad }}× {{ e.tipo === 'empanada' ? 'Emp.' : 'Pizza' }} {{ e.sabor }}</span>
                      <span class="panel__extra-price">{{ "$" + (e.precio * e.cantidad).toLocaleString("es-AR") }}</span>
                    </div>
                  }
                </div>
              }

              <div class="panel__total">
                <span>Total</span>
                <span class="panel__total-val">{{ "$" + totalEstimado().toLocaleString("es-AR") }}</span>
              </div>

              <div class="panel__section">
                <p class="panel__label">Observaciones</p>
                <textarea class="panel__textarea" [(ngModel)]="observaciones"
                          placeholder="Sin sal, sin cebolla, alergia..."></textarea>
              </div>

              <button class="btn-confirm" [disabled]="loadingPedido()"
                      [class.btn-confirm--veg]="selectedVianda()?.tipo === 'VEGETARIANA'"
                      (click)="confirmar()">
                {{ loadingPedido() ? 'Enviando...' : '✅ Confirmar y enviar por WhatsApp' }}
              </button>

              <a [href]="whatsappConsultaUrl()" target="_blank" class="btn-consult">
                💬 Solo consultar
              </a>

              <button class="btn-clear" (click)="cancelar()">Limpiar</button>

              @if (feedbackMsg()) {
                <div class="panel__feedback" [class.panel__feedback--ok]="feedbackOk()">
                  {{ feedbackMsg() }}
                </div>
              }
            }
          </div>
        </aside>

      </div>
    </div>
  `,
  styles: [`
    :host {
      --gold: #c9a84c;
      --gold-dim: rgba(201,168,76,0.15);
      --gold-glow: rgba(201,168,76,0.2);
      --veg: #6ab04c;
      --veg-dim: rgba(106,176,76,0.15);
      --veg-glow: rgba(106,176,76,0.2);
      --bg: #0f0c08;
      --bg-card: #161210;
      --border: #252018;
      --text: #f0ece0;
      --muted: #7a7268;
    }

    /* ── Hero ─────────────────────────────────────────── */
    .hero {
      position: relative; overflow: hidden;
      background: var(--bg);
      border-bottom: 1px solid rgba(201,168,76,0.1);
      padding: 28px 0 24px;
    }
    .hero__glow {
      position: absolute; inset: 0; pointer-events: none;
      background: radial-gradient(ellipse 70% 120% at 50% -10%, rgba(201,168,76,0.1) 0%, transparent 60%);
    }
    .hero__inner {
      position: relative; z-index: 1;
      max-width: 1100px; margin: 0 auto;
      padding: 0 32px; text-align: center;
    }
    .hero__brand {
      font-family: 'Bebas Neue', sans-serif;
      font-size: clamp(3rem, 8vw, 5.5rem);
      letter-spacing: 0.03em; line-height: 1;
      display: inline-flex; gap: 4px;
    }
    .brand-not    { color: var(--text); }
    .brand-tupper { color: var(--gold); text-shadow: 0 0 30px rgba(201,168,76,0.3); }
    .hero__sub {
      color: var(--muted); font-size: 0.9rem; margin-top: 6px; letter-spacing: 0.05em;
    }
    .hero__chips {
      display: inline-flex; gap: 10px; margin-top: 14px; flex-wrap: wrap; justify-content: center;
    }
    .chip {
      display: flex; align-items: center; gap: 10px;
      padding: 8px 20px; border-radius: 32px;
      background: rgba(201,168,76,0.08);
      border: 1.5px solid rgba(201,168,76,0.3);
    }
    .chip--outline { background: transparent; }
    .chip__label { font-size: 0.78rem; color: var(--muted); font-weight: 700; letter-spacing: 0.06em; }
    .chip__price { font-family: 'Bebas Neue', sans-serif; font-size: 1.1rem; color: var(--gold); letter-spacing: 0.04em; }

    /* ── Layout dos columnas ───────────────────────────── */
    .layout {
      max-width: 1100px; margin: 0 auto;
      padding: 32px 32px 80px;
      display: grid;
      grid-template-columns: 1fr 320px;
      gap: 32px;
      align-items: start;
    }

    /* ── Bloques de sección ───────────────────────────── */
    .block { display: flex; flex-direction: column; gap: 20px; }
    .block + .block { margin-top: 40px; }
    .block__head { }
    .block__title {
      font-family: 'Bebas Neue', sans-serif;
      font-size: 1.4rem; color: var(--text); letter-spacing: 0.06em;
    }
    .block__sub { color: var(--muted); font-size: 0.82rem; margin-top: 3px; }

    /* ── Viandas lista ───────────────────────────────── */
    .viandas-list { display: flex; flex-direction: column; gap: 10px; }

    .vianda-row {
      display: flex; align-items: center; justify-content: space-between;
      padding: 18px 20px; border-radius: 12px; cursor: pointer;
      border: 1.5px solid var(--border); background: var(--bg-card);
      transition: border-color 0.18s, background 0.18s, transform 0.12s;
      animation: fadeUp 0.4s ease both;
      gap: 16px;
    }
    .vianda-row:hover { border-color: rgba(201,168,76,0.35); transform: translateX(3px); }
    .vianda-row--veg:hover { border-color: rgba(106,176,76,0.35); }
    .vianda-row--selected { border-color: var(--gold) !important; background: rgba(201,168,76,0.04) !important; }
    .vianda-row--selected.vianda-row--veg { border-color: var(--veg) !important; background: rgba(106,176,76,0.04) !important; }

    .vianda-row__left { flex: 1; min-width: 0; }
    .tipo-pill {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 2px 10px; border-radius: 12px; font-size: 0.72rem;
      font-weight: 800; letter-spacing: 0.06em;
      background: var(--gold-dim); color: var(--gold); margin-bottom: 6px;
    }
    .tipo-pill--veg { background: var(--veg-dim); color: var(--veg); }
    .vianda-row__nombre {
      font-family: 'Bebas Neue', sans-serif;
      font-size: 1.25rem; color: var(--text); letter-spacing: 0.02em; line-height: 1.1;
      margin-bottom: 4px;
    }
    .vianda-row__comidas {
      font-size: 0.82rem; color: var(--muted); line-height: 1.5;
    }
    .vianda-row__obs {
      font-size: 0.78rem; color: #5a5450; margin-top: 4px; font-style: italic;
    }
    .vianda-row__right { flex-shrink: 0; }
    .tick {
      width: 28px; height: 28px; border-radius: 50%;
      background: var(--gold); color: #1a1209;
      display: flex; align-items: center; justify-content: center;
      font-weight: 900; font-size: 0.9rem;
    }
    .tick--veg { background: var(--veg); color: #0a150a; }
    .select-hint {
      font-size: 0.72rem; letter-spacing: 0.1em; color: #3a3530;
      font-weight: 700; text-transform: uppercase;
    }

    /* ── Skeleton ────────────────────────────────────── */
    .vianda-sk { padding: 20px; border-radius: 12px; border: 1.5px solid var(--border); background: var(--bg-card); display: flex; flex-direction: column; gap: 10px; }
    .sk { border-radius: 6px; background: linear-gradient(90deg, #1e1a14 25%, #2a2418 50%, #1e1a14 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; }

    /* ── Extras ──────────────────────────────────────── */
    .extras-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

    .extra-block {
      border: 1.5px solid var(--border); border-radius: 12px;
      background: var(--bg-card); overflow: hidden;
    }
    .extra-block__head {
      display: flex; align-items: center; gap: 12px;
      padding: 14px 16px; border-bottom: 1px solid var(--border);
      background: rgba(201,168,76,0.03);
    }
    .extra-block__emoji { font-size: 1.5rem; }
    .extra-block__name { font-family: 'Bebas Neue', sans-serif; font-size: 1.1rem; color: var(--text); letter-spacing: 0.04em; }
    .extra-block__price { font-size: 0.72rem; color: var(--gold); font-weight: 700; margin-top: 1px; }

    .sabor-row {
      display: flex; align-items: center; justify-content: space-between;
      padding: 9px 16px; border-bottom: 1px solid #1a1710;
    }
    .sabor-row:last-child { border-bottom: none; }
    .sabor-row__name { font-size: 0.83rem; color: #b8b0a0; }

    .counter { display: flex; align-items: center; gap: 8px; }
    .counter__btn {
      width: 26px; height: 26px; border-radius: 6px;
      border: 1px solid #2e2820; background: none;
      color: var(--muted); font-size: 1rem; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: all 0.1s; line-height: 1;
    }
    .counter__btn:hover { border-color: var(--gold); color: var(--gold); }
    .counter__btn--plus:hover { background: var(--gold-dim); }
    .counter__val { width: 18px; text-align: center; font-size: 0.88rem; font-weight: 700; color: var(--text); }

    /* ── Panel aside ─────────────────────────────────── */
    .col-aside { position: sticky; top: 80px; }

    .panel {
      background: var(--bg-card); border: 1.5px solid var(--border);
      border-radius: 16px; padding: 24px;
      display: flex; flex-direction: column; gap: 16px;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    .panel--empty { border-color: #1e1c18; }
    .panel:not(.panel--empty) { border-color: rgba(201,168,76,0.35); box-shadow: 0 0 24px rgba(201,168,76,0.05); }
    .panel--veg:not(.panel--empty) { border-color: rgba(106,176,76,0.35); box-shadow: 0 0 24px rgba(106,176,76,0.05); }

    .panel__placeholder {
      text-align: center; padding: 28px 16px;
      display: flex; flex-direction: column; gap: 8px;
    }
    .panel__placeholder-title {
      font-family: 'Bebas Neue', sans-serif; font-size: 1.3rem;
      color: #3a3530; letter-spacing: 0.06em;
    }
    .panel__placeholder-hint { color: #3a3530; font-size: 0.82rem; line-height: 1.5; }

    .panel__title { font-family: 'Bebas Neue', sans-serif; font-size: 1.3rem; color: var(--text); letter-spacing: 0.05em; }
    .panel__label { font-size: 0.68rem; font-weight: 800; letter-spacing: 0.14em; text-transform: uppercase; color: var(--muted); margin-bottom: 8px; display: block; }
    .panel__section { display: flex; flex-direction: column; }
    .panel__vianda-nombre { font-family: 'Bebas Neue', sans-serif; font-size: 1.15rem; color: var(--text); letter-spacing: 0.02em; margin-bottom: 6px; }

    .tamanos { display: flex; gap: 8px; margin-top: 2px; }
    .tam-btn {
      flex: 1; padding: 12px 8px; border-radius: 10px;
      border: 1.5px solid var(--border); background: var(--bg);
      cursor: pointer; transition: all 0.15s;
      display: flex; flex-direction: column; align-items: center; gap: 1px;
    }
    .tam-btn:hover { border-color: rgba(201,168,76,0.3); }
    .tam-btn--active { border-color: var(--gold) !important; background: rgba(201,168,76,0.06); }
    .tam-btn--active.tam-btn--veg { border-color: var(--veg) !important; background: rgba(106,176,76,0.06); }
    .tam-btn__size { font-family: 'Bebas Neue', sans-serif; font-size: 1rem; color: var(--text); letter-spacing: 0.06em; }
    .tam-btn__price { font-size: 0.78rem; color: var(--gold); font-weight: 700; }
    .tam-btn--veg .tam-btn__price { color: var(--veg); }
    .tam-btn__g { font-size: 0.68rem; color: var(--muted); }

    .panel__extra-row { display: flex; justify-content: space-between; font-size: 0.83rem; color: #b8b0a0; padding: 3px 0; }
    .panel__extra-price { color: var(--gold); font-weight: 700; }

    .panel__total {
      display: flex; justify-content: space-between; align-items: baseline;
      padding: 12px 0; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border);
      font-size: 0.75rem; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted); font-weight: 700;
    }
    .panel__total-val { font-family: 'Bebas Neue', sans-serif; font-size: 1.6rem; color: var(--gold); }
    .panel--veg .panel__total-val { color: var(--veg); }

    .panel__textarea {
      width: 100%; background: var(--bg); border: 1px solid var(--border);
      border-radius: 8px; color: var(--text); font-size: 0.83rem;
      padding: 10px 12px; resize: none; height: 64px; outline: none;
      font-family: 'Nunito', sans-serif; transition: border-color 0.15s;
    }
    .panel__textarea:focus { border-color: var(--gold); }
    .panel__textarea::placeholder { color: #3a3530; }

    .btn-confirm {
      width: 100%; padding: 13px; border-radius: 8px; border: none;
      font-family: 'Bebas Neue', sans-serif; font-size: 1.05rem; letter-spacing: 0.08em;
      cursor: pointer; transition: all 0.15s;
      background: var(--gold); color: #1a1209;
    }
    .btn-confirm:hover { filter: brightness(1.1); transform: translateY(-1px); }
    .btn-confirm--veg { background: var(--veg); color: #0a150a; }
    .btn-confirm:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

    .btn-consult {
      display: block; text-align: center; padding: 10px;
      border-radius: 8px; border: 1px solid #2e2820;
      color: var(--muted); font-size: 0.83rem; font-weight: 700;
      text-decoration: none; transition: all 0.15s;
    }
    .btn-consult:hover { border-color: #4a4438; color: var(--text); }

    .btn-clear {
      width: 100%; padding: 8px; background: none; border: none;
      color: #3a3530; font-size: 0.78rem; cursor: pointer;
      font-family: 'Nunito', sans-serif; transition: color 0.15s;
    }
    .btn-clear:hover { color: var(--muted); }

    .panel__feedback { padding: 10px 14px; border-radius: 8px; font-size: 0.83rem; font-weight: 700; background: rgba(224,80,80,0.1); color: #e05050; }
    .panel__feedback--ok { background: rgba(106,176,76,0.1); color: var(--veg); }

    /* ── Empty ───────────────────────────────────────── */
    .empty { text-align: center; padding: 48px 24px; }
    .empty__icon { font-size: 2.5rem; display: block; margin-bottom: 10px; }
    .empty__msg { font-family: 'Bebas Neue', sans-serif; font-size: 1.2rem; color: var(--muted); letter-spacing: 0.04em; }
    .empty__hint { font-size: 0.82rem; color: #4a4438; margin-top: 4px; }

    /* ── Animaciones ─────────────────────────────────── */
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(10px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes shimmer {
      0%   { background-position: -200% 0; }
      100% { background-position:  200% 0; }
    }

    /* ── Mobile ──────────────────────────────────────── */
    @media (max-width: 768px) {
      .layout {
        grid-template-columns: 1fr;
        padding: 24px 16px 60px;
        gap: 0;
      }
      .col-aside { position: static; order: -1; margin-bottom: 28px; }
      .extras-grid { grid-template-columns: 1fr; }
      .hero__inner { padding: 0 20px; }
    }
  `]
})
export class MenuComponent implements OnInit {
  empanadas = EMPANADAS;
  pizzas    = PIZZAS;

  viandas        = signal<Vianda[]>([]);
  selectedVianda = signal<Vianda | null>(null);
  tamano         = signal<PedidoTamano>('CHICA');
  loading        = signal(true);
  loadingPedido  = signal(false);
  feedbackMsg    = signal('');
  feedbackOk     = signal(false);
  observaciones  = '';

  extras: Record<string, number> = {};

  constructor(
    private viandaService: ViandaService,
    private pedidoService: PedidoService,
    public  auth: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.viandaService.getAll(true).subscribe({
      next: v => { this.viandas.set(v); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  selectVianda(v: Vianda): void {
    this.selectedVianda.set(this.selectedVianda()?.id === v.id ? null : v);
    this.feedbackMsg.set('');
  }

  getCantidad(tipo: string, sabor: string): number {
    return this.extras[tipo + ':' + sabor] ?? 0;
  }

  incrementar(tipo: string, sabor: string): void {
    const key = tipo + ':' + sabor;
    this.extras = { ...this.extras, [key]: (this.extras[key] ?? 0) + 1 };
  }

  decrementar(tipo: string, sabor: string): void {
    const key = tipo + ':' + sabor;
    const cur = this.extras[key] ?? 0;
    if (cur > 0) this.extras = { ...this.extras, [key]: cur - 1 };
  }

  tieneExtras(): boolean {
    return Object.values(this.extras).some(v => v > 0);
  }

  extrasSeleccionados(): ExtraItem[] {
    return Object.entries(this.extras)
      .filter(([, cant]) => cant > 0)
      .map(([key, cant]) => {
        const [tipo, sabor] = key.split(':');
        return { id: key, tipo: tipo as 'empanada' | 'pizza', sabor, precio: tipo === 'empanada' ? 7500 : 10000, cantidad: cant };
      });
  }

  totalEstimado(): number {
    let total = 0;
    if (this.selectedVianda()) total += this.tamano() === 'CHICA' ? 35000 : 45000;
    Object.entries(this.extras).filter(([,v]) => v > 0).forEach(([key, cant]) => {
      const tipo = key.split(':')[0];
      total += (tipo === 'empanada' ? 7500 : 10000) * cant;
    });
    return total;
  }

  cancelar(): void {
    this.selectedVianda.set(null);
    this.extras = {};
    this.observaciones = '';
    this.feedbackMsg.set('');
  }

  confirmar(): void {
    if (!this.auth.isLogged()) { this.router.navigate(['/auth/login']); return; }
    const v = this.selectedVianda();
    if (v) {
      this.loadingPedido.set(true);
      const extrasArr: PedidoExtra[] = this.extrasSeleccionados().map(e => ({
        tipo: e.tipo, sabor: e.sabor, cantidad: e.cantidad
      }));
      this.pedidoService.crear(v.id, this.tamano(), this.observaciones || undefined, extrasArr.length ? extrasArr : undefined).subscribe({
        next: () => {
          this.loadingPedido.set(false);
          window.open(this.whatsappPedidoUrl(), '_blank');
          this.cancelar();
        },
        error: () => {
          this.loadingPedido.set(false);
          this.feedbackMsg.set('❌ Hubo un error. Intentá de nuevo.');
          this.feedbackOk.set(false);
        }
      });
    } else {
      // Solo extras sin vianda
      const extrasArr: PedidoExtra[] = this.extrasSeleccionados().map(e => ({
        tipo: e.tipo, sabor: e.sabor, cantidad: e.cantidad
      }));
      this.loadingPedido.set(true);
      this.pedidoService.crear(null as any, 'CHICA', this.observaciones || undefined, extrasArr).subscribe({
        next: () => {
          this.loadingPedido.set(false);
          window.open(this.whatsappPedidoUrl(), '_blank');
          this.cancelar();
        },
        error: () => {
          this.loadingPedido.set(false);
          this.feedbackMsg.set('❌ Hubo un error. Intentá de nuevo.');
          this.feedbackOk.set(false);
        }
      });
    }
  }

  whatsappPedidoUrl(): string {
    const v = this.selectedVianda();
    const u = this.auth.user();
    const nl = '%0A';
    let msg = '🍱 *Pedido NotTupper*' + nl + nl;
    msg += '👤 *Cliente:* ' + (u?.nombre ?? '') + ' ' + (u?.apellido ?? '') + nl;
    msg += '📍 *Zona:* ' + (u?.zona ?? '') + nl;
    msg += '📱 *Celular:* ' + (u?.celular ?? '') + nl + nl;
    if (v) {
      const tipo = v.tipo === 'COMUN' ? 'Común' : 'Vegetariana';
      const tam = this.tamano() === 'CHICA' ? '300g · $35.000' : '500g · $45.000';
      msg += '🥘 *Vianda:* ' + v.nombre + ' (' + tipo + ')' + nl;
      msg += '📦 *Tamaño:* ' + tam + nl;
    }
    const extras = this.extrasSeleccionados();
    if (extras.length > 0) {
      msg += nl + '🥟 *Extras:*' + nl;
      extras.forEach(e => {
        msg += '  · ' + e.cantidad + '× ' + (e.tipo === 'empanada' ? 'Empanada' : 'Pizza') + ' ' + e.sabor + ' ($' + (e.precio * e.cantidad).toLocaleString('es-AR') + ')' + nl;
      });
    }
    msg += nl + '💰 *Total:* $' + this.totalEstimado().toLocaleString('es-AR');
    if (this.observaciones) msg += nl + '📝 ' + this.observaciones;
    return 'https://wa.me/5491167353868?text=' + msg;
  }

  whatsappConsultaUrl(): string {
    return 'https://wa.me/5491167353868?text=Hola%20NotTupper!%20Quiero%20consultar%20sobre%20el%20men%C3%BA%20%F0%9F%8D%B1';
  }
}