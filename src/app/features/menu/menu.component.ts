import { Component, OnInit, signal, HostListener } from '@angular/core';
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

      <!-- TOAST "Ver tu pedido" -->
      @if (mostrarToast()) {
        <div class="toast" (click)="scrollAlPanel()">
          🛒 Tu pedido te espera {{ esMobile() ? '↑ arriba' : '→ al costado' }}
        </div>
      }

      <!-- HERO -->
      <header class="hero">
        <div class="hero__glow"></div>
        <div class="hero__inner">
          <div class="hero__brand">
            <span class="brand-not">NOT</span><span class="brand-tupper">TUPPER</span>
          </div>
          <p class="hero__claim">Abrís el freezer y ya tenés la comida resuelta.</p>
          <p class="hero__tagline">Pedís el miércoles · Recibís el finde · Freezás y listo</p>
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

        <!-- QUIÉNES SOMOS -->
        <div class="quienes">
          <div class="quienes__inner">
            <div class="quienes__left">
              <p class="quienes__label">¿Qué es NotTupper?</p>
              <h2 class="quienes__title">Viandas caseras, ricas y saludables</h2>
              <p class="quienes__desc">Listas en minutos para que comas bien sin cocinar ni pensar el menú. Cocinamos cada semana con ingredientes reales y las entregamos freezadas en tu zona.</p>
              <div class="quienes__checks">
                <span class="check-item">✓ Menú variado todas las semanas</span>
                <span class="check-item">✓ Porciones abundantes</span>
                <span class="check-item">✓ Se entregan freezadas</span>
                <span class="check-item">✓ Ideales para almuerzo o cena</span>
              </div>
            </div>
            <div class="quienes__right">
              <div class="quienes__stat">
                <span class="quienes__stat-val">5</span>
                <span class="quienes__stat-label">viandas por semana</span>
              </div>
              <div class="quienes__stat">
                <span class="quienes__stat-val">🏠</span>
                <span class="quienes__stat-label">Cocina casera</span>
              </div>
              <div class="quienes__social">
                <a href="https://instagram.com/NOTTUPPER" target="_blank" class="quienes__ig">
                  📸 @NOTTUPPER
                </a>
              </div>
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
              <h2 class="block__title">🍱 Menú de la semana</h2>
              <p class="block__sub">Elegí tu vianda y armá tu semana — tocá para seleccionar</p>
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
                        <span class="select-hint">Elegir →</span>
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
              <h2 class="block__title">🥟 También podés pedir</h2>
              <p class="block__sub">Empanadas y pizzas caseras · Suman al pedido o se piden solos</p>
            </div>
            <div class="extras-grid">
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
        <aside class="col-aside" #panelRef>
          <div class="panel"
               [class.panel--active]="selectedVianda() || tieneExtras()"
               [class.panel--veg]="selectedVianda()?.tipo === 'VEGETARIANA'">

            @if (!selectedVianda() && !tieneExtras()) {
              <div class="panel__placeholder">
                <p class="panel__placeholder-title">Tu pedido</p>
                <p class="panel__placeholder-hint">Elegí una vianda o sumá empanadas/pizzas para armar tu pedido</p>
              </div>
            } @else {
              <h3 class="panel__title">Tu pedido 🛒</h3>

              @if (selectedVianda()) {
                <div class="panel__section">
                  <p class="panel__label">Vianda elegida</p>
                  <p class="panel__vianda-nombre">{{ selectedVianda()!.nombre }}</p>
                  <span class="tipo-pill" [class.tipo-pill--veg]="selectedVianda()!.tipo === 'VEGETARIANA'" style="font-size:0.7rem">
                    {{ selectedVianda()!.tipo === 'COMUN' ? '🍖 Común' : '🥦 Vegetariana' }}
                  </span>
                  <p class="panel__label" style="margin-top:16px">¿Cuánto querés?</p>
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
                <span>Total estimado</span>
                <span class="panel__total-val">{{ "$" + totalEstimado().toLocaleString("es-AR") }}</span>
              </div>

              <div class="panel__section">
                <p class="panel__label">Aclaraciones (opcional)</p>
                <textarea class="panel__textarea" [(ngModel)]="observaciones"
                          placeholder="Sin sal, sin cebolla, alergia..."></textarea>
              </div>

              <button class="btn-confirm"
                      [class.btn-confirm--veg]="selectedVianda()?.tipo === 'VEGETARIANA'"
                      [disabled]="loadingPedido()"
                      (click)="confirmar()">
                {{ loadingPedido() ? 'Enviando...' : '💬 Confirmar y pedir por WhatsApp' }}
              </button>

              <button class="btn-clear" (click)="cancelar()">Limpiar selección</button>

              @if (feedbackMsg()) {
                <div class="panel__feedback" [class.panel__feedback--ok]="feedbackOk()">
                  {{ feedbackMsg() }}
                </div>
              }
            }
          </div>
        </aside>


      </div>

      <!-- BOTÓN FLOTANTE WHATSAPP -->
      <a href="https://wa.me/5491167353868?text=Hola%20NotTupper!%20Quiero%20consultar%20sobre%20el%20men%C3%BA%20%F0%9F%8D%B1"
         target="_blank" class="wsp-fab" title="Consultar por WhatsApp">
        <svg viewBox="0 0 24 24" fill="currentColor" width="26" height="26">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </a>
    </div>
  `,
  styles: [`
    :host {
      --gold: #c9a84c;
      --gold-dim: rgba(201,168,76,0.15);
      --veg: #6ab04c;
      --veg-dim: rgba(106,176,76,0.15);
      --bg: #0f0c08;
      --bg-card: #161210;
      --border: #252018;
      --text: #f0ece0;
      --muted: #7a7268;
    }

    /* ── Toast ───────────────────────────────────────── */
    .toast {
      position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
      z-index: 999; background: var(--gold); color: #1a1209;
      padding: 12px 24px; border-radius: 32px;
      font-family: 'Bebas Neue', sans-serif; font-size: 1rem; letter-spacing: 0.08em;
      cursor: pointer; box-shadow: 0 4px 20px rgba(201,168,76,0.4);
      animation: slideUp 0.3s ease both;
      white-space: nowrap;
    }
    @keyframes slideUp {
      from { opacity: 0; transform: translateX(-50%) translateY(16px); }
      to   { opacity: 1; transform: translateX(-50%) translateY(0); }
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
    .hero__sub { color: var(--text); font-size: 1rem; margin-top: 8px; font-weight: 700; }
    .hero__tagline { color: var(--muted); font-size: 0.85rem; margin-top: 4px; }
    .hero__chips {
      display: inline-flex; gap: 10px; margin-top: 16px; flex-wrap: wrap; justify-content: center;
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

    /* ── Layout ───────────────────────────────────────── */
    .layout {
      max-width: 1100px; margin: 0 auto;
      padding: 32px 32px 80px;
      display: grid;
      grid-template-columns: 1fr 320px;
      gap: 32px;
      align-items: start;
    }

    /* ── Bloques ──────────────────────────────────────── */
    .block { display: flex; flex-direction: column; gap: 20px; }
    .block + .block { margin-top: 40px; }
    .block__title { font-family: 'Bebas Neue', sans-serif; font-size: 1.4rem; color: var(--text); letter-spacing: 0.06em; }
    .block__sub { color: var(--muted); font-size: 0.82rem; margin-top: 3px; }

    /* ── Viandas ──────────────────────────────────────── */
    .viandas-list { display: flex; flex-direction: column; gap: 10px; }
    .vianda-row {
      display: flex; align-items: center; justify-content: space-between;
      padding: 18px 20px; border-radius: 12px; cursor: pointer;
      border: 1.5px solid var(--border); background: var(--bg-card);
      transition: border-color 0.18s, background 0.18s, transform 0.12s;
      animation: fadeUp 0.4s ease both; gap: 16px;
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
    .vianda-row__nombre { font-family: 'Bebas Neue', sans-serif; font-size: 1.25rem; color: var(--text); letter-spacing: 0.02em; line-height: 1.1; margin-bottom: 4px; }
    .vianda-row__comidas { font-size: 0.82rem; color: var(--muted); line-height: 1.5; }
    .vianda-row__obs { font-size: 0.78rem; color: #5a5450; margin-top: 4px; font-style: italic; }
    .vianda-row__right { flex-shrink: 0; }
    .tick { width: 28px; height: 28px; border-radius: 50%; background: var(--gold); color: #1a1209; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 0.9rem; }
    .tick--veg { background: var(--veg); color: #0a150a; }
    .select-hint { font-size: 0.72rem; letter-spacing: 0.08em; color: #3a3530; font-weight: 700; }

    /* ── Skeleton ─────────────────────────────────────── */
    .vianda-sk { padding: 20px; border-radius: 12px; border: 1.5px solid var(--border); background: var(--bg-card); display: flex; flex-direction: column; gap: 10px; }
    .sk { border-radius: 6px; background: linear-gradient(90deg, #1e1a14 25%, #2a2418 50%, #1e1a14 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; }

    /* ── Extras ───────────────────────────────────────── */
    .extras-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .extra-block { border: 1.5px solid var(--border); border-radius: 12px; background: var(--bg-card); overflow: hidden; }
    .extra-block__head { display: flex; align-items: center; gap: 12px; padding: 14px 16px; border-bottom: 1px solid var(--border); background: rgba(201,168,76,0.03); }
    .extra-block__emoji { font-size: 1.5rem; }
    .extra-block__name { font-family: 'Bebas Neue', sans-serif; font-size: 1.1rem; color: var(--text); letter-spacing: 0.04em; }
    .extra-block__price { font-size: 0.72rem; color: var(--gold); font-weight: 700; margin-top: 1px; }
    .sabor-row { display: flex; align-items: center; justify-content: space-between; padding: 9px 16px; border-bottom: 1px solid #1a1710; }
    .sabor-row:last-child { border-bottom: none; }
    .sabor-row__name { font-size: 0.83rem; color: #b8b0a0; }
    .counter { display: flex; align-items: center; gap: 8px; }
    .counter__btn { width: 26px; height: 26px; border-radius: 6px; border: 1px solid #2e2820; background: none; color: var(--muted); font-size: 1rem; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.1s; line-height: 1; }
    .counter__btn:hover { border-color: var(--gold); color: var(--gold); }
    .counter__btn--plus:hover { background: var(--gold-dim); }
    .counter__val { width: 18px; text-align: center; font-size: 0.88rem; font-weight: 700; color: var(--text); }

    /* ── Panel ────────────────────────────────────────── */
    .col-aside { position: sticky; top: 80px; }
    .panel {
      background: var(--bg-card); border: 1.5px solid #1e1c18;
      border-radius: 16px; padding: 24px;
      display: flex; flex-direction: column; gap: 16px;
      transition: border-color 0.3s, box-shadow 0.3s;
    }
    .panel--active { border-color: rgba(201,168,76,0.4); box-shadow: 0 0 32px rgba(201,168,76,0.08); }
    .panel--active.panel--veg { border-color: rgba(106,176,76,0.4); box-shadow: 0 0 32px rgba(106,176,76,0.08); }

    .panel__placeholder { text-align: center; padding: 28px 16px; display: flex; flex-direction: column; gap: 8px; }
    .panel__placeholder-title { font-family: 'Bebas Neue', sans-serif; font-size: 1.3rem; color: #3a3530; letter-spacing: 0.06em; }
    .panel__placeholder-hint { color: #3a3530; font-size: 0.82rem; line-height: 1.5; }

    .panel__title { font-family: 'Bebas Neue', sans-serif; font-size: 1.3rem; color: var(--text); letter-spacing: 0.05em; }
    .panel__label { font-size: 0.68rem; font-weight: 800; letter-spacing: 0.14em; text-transform: uppercase; color: var(--muted); margin-bottom: 8px; display: block; }
    .panel__section { display: flex; flex-direction: column; }
    .panel__vianda-nombre { font-family: 'Bebas Neue', sans-serif; font-size: 1.15rem; color: var(--text); letter-spacing: 0.02em; margin-bottom: 6px; }

    .tamanos { display: flex; gap: 8px; margin-top: 2px; }
    .tam-btn { flex: 1; padding: 12px 8px; border-radius: 10px; border: 1.5px solid var(--border); background: var(--bg); cursor: pointer; transition: all 0.15s; display: flex; flex-direction: column; align-items: center; gap: 1px; }
    .tam-btn:hover { border-color: rgba(201,168,76,0.3); }
    .tam-btn--active { border-color: var(--gold) !important; background: rgba(201,168,76,0.06); }
    .tam-btn--active.tam-btn--veg { border-color: var(--veg) !important; background: rgba(106,176,76,0.06); }
    .tam-btn__size { font-family: 'Bebas Neue', sans-serif; font-size: 1rem; color: var(--text); letter-spacing: 0.06em; }
    .tam-btn__price { font-size: 0.78rem; color: var(--gold); font-weight: 700; }
    .tam-btn--veg .tam-btn__price { color: var(--veg); }
    .tam-btn__g { font-size: 0.68rem; color: var(--muted); }

    .panel__extra-row { display: flex; justify-content: space-between; font-size: 0.83rem; color: #b8b0a0; padding: 3px 0; }
    .panel__extra-price { color: var(--gold); font-weight: 700; }

    .panel__total { display: flex; justify-content: space-between; align-items: baseline; padding: 12px 0; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); font-size: 0.75rem; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted); font-weight: 700; }
    .panel__total-val { font-family: 'Bebas Neue', sans-serif; font-size: 1.6rem; color: var(--gold); }
    .panel--veg .panel__total-val { color: var(--veg); }

    .panel__textarea { width: 100%; background: var(--bg); border: 1px solid var(--border); border-radius: 8px; color: var(--text); font-size: 0.83rem; padding: 10px 12px; resize: none; height: 64px; outline: none; font-family: 'Nunito', sans-serif; transition: border-color 0.15s; }
    .panel__textarea:focus { border-color: var(--gold); }
    .panel__textarea::placeholder { color: #3a3530; }

    .btn-confirm { width: 100%; padding: 14px; border-radius: 8px; border: none; font-family: 'Bebas Neue', sans-serif; font-size: 1.1rem; letter-spacing: 0.08em; cursor: pointer; transition: all 0.15s; background: var(--gold); color: #1a1209; }
    .btn-confirm:hover { filter: brightness(1.1); transform: translateY(-1px); }
    .btn-confirm--veg { background: var(--veg); color: #0a150a; }
    .btn-confirm:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

    .btn-clear { width: 100%; padding: 8px; background: none; border: none; color: #3a3530; font-size: 0.78rem; cursor: pointer; font-family: 'Nunito', sans-serif; transition: color 0.15s; }
    .btn-clear:hover { color: var(--muted); }

    .panel__feedback { padding: 10px 14px; border-radius: 8px; font-size: 0.83rem; font-weight: 700; background: rgba(224,80,80,0.1); color: #e05050; }
    .panel__feedback--ok { background: rgba(106,176,76,0.1); color: var(--veg); }

    /* ── Empty ────────────────────────────────────────── */
    .empty { text-align: center; padding: 48px 24px; }
    .empty__icon { font-size: 2.5rem; display: block; margin-bottom: 10px; }
    .empty__msg { font-family: 'Bebas Neue', sans-serif; font-size: 1.2rem; color: var(--muted); letter-spacing: 0.04em; }
    .empty__hint { font-size: 0.82rem; color: #4a4438; margin-top: 4px; }

    /* ── Animaciones ──────────────────────────────────── */
    @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }

    /* ── Mobile ───────────────────────────────────────── */
    /* ── Quiénes somos ───────────────────────────────── */
    .quienes {
      border-top: 1px solid rgba(201,168,76,0.1);
      background: rgba(201,168,76,0.03);
      padding: 32px 0;
      margin-top: 24px;
    }
    .quienes__inner {
      max-width: 1100px; margin: 0 auto; padding: 0 32px;
      display: grid; grid-template-columns: 1fr auto; gap: 40px; align-items: center;
    }
    .quienes__label { font-size: 0.72rem; font-weight: 800; letter-spacing: 0.18em; text-transform: uppercase; color: var(--gold); margin-bottom: 8px; }
    .quienes__title { font-family: 'Bebas Neue', sans-serif; font-size: 1.6rem; color: var(--text); letter-spacing: 0.04em; margin-bottom: 10px; }
    .quienes__desc { color: var(--muted); font-size: 0.88rem; line-height: 1.65; max-width: 520px; margin-bottom: 16px; }
    .quienes__checks { display: flex; flex-direction: column; gap: 6px; }
    .check-item { font-size: 0.85rem; color: #c8c0b0; display: flex; align-items: center; gap: 8px; }
    .check-item::before { content: ''; display: none; }
    .quienes__right { display: flex; flex-direction: column; align-items: center; gap: 20px; }
    .quienes__stat { text-align: center; }
    .quienes__stat-val { font-family: 'Bebas Neue', sans-serif; font-size: 2.4rem; color: var(--gold); letter-spacing: 0.03em; display: block; line-height: 1; }
    .quienes__stat-label { font-size: 0.72rem; color: var(--muted); font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; }
    .quienes__social { margin-top: 4px; }
    .quienes__ig { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 20px; border: 1px solid var(--border); color: var(--muted); font-size: 0.82rem; font-weight: 700; text-decoration: none; transition: all 0.15s; }
    .quienes__ig:hover { border-color: var(--gold); color: var(--text); }

    /* ── WhatsApp FAB ─────────────────────────────────── */
    .wsp-fab {
      position: fixed; bottom: 28px; right: 28px; z-index: 500;
      width: 56px; height: 56px; border-radius: 50%;
      background: #25d366; color: #fff;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 16px rgba(37,211,102,0.4);
      transition: transform 0.2s, box-shadow 0.2s;
      text-decoration: none;
    }
    .wsp-fab:hover { transform: scale(1.1); box-shadow: 0 6px 24px rgba(37,211,102,0.5); }

    /* ── Hero claim ───────────────────────────────────── */
    .hero__claim { color: var(--text); font-size: clamp(1rem, 2.5vw, 1.15rem); font-weight: 700; margin-top: 10px; }

    @media (max-width: 768px) {
      .layout { grid-template-columns: 1fr; padding: 24px 16px 80px; gap: 0; }
      .col-aside { position: static; order: -1; margin-bottom: 28px; }
      .extras-grid { grid-template-columns: 1fr; }
      .hero__inner { padding: 0 20px; }
      .quienes__inner { grid-template-columns: 1fr; gap: 24px; padding: 0 20px; }
      .quienes__right { flex-direction: row; justify-content: flex-start; }
      .wsp-fab { bottom: 20px; right: 20px; width: 50px; height: 50px; }
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
  mostrarToast   = signal(false);
  observaciones  = '';
  extras: Record<string, number> = {};

  private toastTimer: any;

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

  esMobile(): boolean {
    return window.innerWidth <= 768;
  }

  selectVianda(v: Vianda): void {
    const esMisma = this.selectedVianda()?.id === v.id;
    this.selectedVianda.set(esMisma ? null : v);
    this.feedbackMsg.set('');
    if (!esMisma) this.mostrarToastTemporal();
  }

  incrementar(tipo: string, sabor: string): void {
    const key = tipo + ':' + sabor;
    this.extras = { ...this.extras, [key]: (this.extras[key] ?? 0) + 1 };
    this.mostrarToastTemporal();
  }

  decrementar(tipo: string, sabor: string): void {
    const key = tipo + ':' + sabor;
    const cur = this.extras[key] ?? 0;
    if (cur > 0) this.extras = { ...this.extras, [key]: cur - 1 };
  }

  mostrarToastTemporal(): void {
    this.mostrarToast.set(true);
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.mostrarToast.set(false), 4000);
  }

  scrollAlPanel(): void {
    this.mostrarToast.set(false);
    const panel = document.querySelector('.col-aside');
    if (panel) panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
    Object.entries(this.extras).filter(([, v]) => v > 0).forEach(([key, cant]) => {
      total += (key.startsWith('empanada') ? 7500 : 10000) * cant;
    });
    return total;
  }

  cancelar(): void {
    this.selectedVianda.set(null);
    this.extras = {};
    this.observaciones = '';
    this.feedbackMsg.set('');
    this.mostrarToast.set(false);
  }

  confirmar(): void {
    if (!this.auth.isLogged()) { this.router.navigate(['/auth/login']); return; }
    const v = this.selectedVianda();
    const extrasArr: PedidoExtra[] = this.extrasSeleccionados().map(e => ({
      tipo: e.tipo, sabor: e.sabor, cantidad: e.cantidad
    }));

    this.loadingPedido.set(true);

    const pedido$ = v
      ? this.pedidoService.crear(v.id, this.tamano(), this.observaciones || undefined, extrasArr.length ? extrasArr : undefined)
      : this.pedidoService.crear(null, 'CHICA', this.observaciones || undefined, extrasArr);

    pedido$.subscribe({
      next: () => {
        this.loadingPedido.set(false);
        const url = this.whatsappPedidoUrl();
        window.open(url, '_blank');
        this.cancelar();
      },
      error: () => {
        this.loadingPedido.set(false);
        this.feedbackMsg.set('❌ Hubo un error. Intentá de nuevo.');
        this.feedbackOk.set(false);
      }
    });
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
        msg += '  · ' + e.cantidad + 'x ' + (e.tipo === 'empanada' ? 'Empanada' : 'Pizza') + ' ' + e.sabor + ' ($' + (e.precio * e.cantidad).toLocaleString('es-AR') + ')' + nl;
      });
    }
    msg += nl + '💰 *Total:* $' + this.totalEstimado().toLocaleString('es-AR');
    if (this.observaciones) msg += nl + '📝 ' + this.observaciones;
    return 'https://wa.me/5491167353868?text=' + msg;
  }
}