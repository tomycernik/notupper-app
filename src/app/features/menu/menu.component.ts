import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ViandaService } from '../../core/services/vianda.service';
import { PedidoService } from '../../core/services/pedido.service';
import { AuthService } from '../../core/services/auth.service';
import { Vianda, PedidoTamano } from '../../core/models/index';
import { PedidoExtra } from '../../core/services/pedido.service';

interface ViandaSeleccionada {
  vianda: Vianda;
  tamano: PedidoTamano;
  cantidad: number;
}

interface ExtraItem {
  id: string;
  tipo: 'empanada' | 'pizza';
  sabor: string;
  precio: number;
  cantidad: number;
}

interface PedidoDraftItem {
  viandaId: string;
  tamano: PedidoTamano;
  cantidad: number;
}

interface PedidoDraft {
  viandas: PedidoDraftItem[];
  extras: Record<string, number>;
  observaciones: string;
}

const EMPANADAS = ['Carne suave', 'Carne a cuchillo', 'Atún', 'Queso y cebolla', 'Jamón y queso', 'Pollo'];
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
          <p class="hero__claim">Abrís el freezer y ya tenés la comida resuelta.</p>
          <p class="hero__tagline">Pedís el miércoles · Recibís el finde · Freezás y listo</p>
          <div class="hero__chips">
            <div class="chip"><span class="chip__label">Pack 5 comidas · 300g</span><span class="chip__price">$35.000</span></div>
            <div class="chip chip--outline"><span class="chip__label">Pack 5 comidas · 500g</span><span class="chip__price">$45.000</span></div>
          </div>
          <button class="hero__scroll-btn" (click)="scrollAlMenu()">
            Ver el menú
            <span class="hero__scroll-arrow">↓</span>
          </button>
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
              <div class="quienes__stat"><span class="quienes__stat-val">5</span><span class="quienes__stat-label">comidas por pack</span></div>
              <div class="quienes__stat"><span class="quienes__stat-val">🏠</span><span class="quienes__stat-label">Cocina casera</span></div>
              <a href="https://instagram.com/NOTTUPPER" target="_blank" class="quienes__ig">📸 &#64;NOTTUPPER</a>
            </div>
          </div>
        </div>
      </header>

      <div class="layout" #menuRef>

        <!-- COLUMNA PRINCIPAL -->
        <div class="col-main">

          <!-- VIANDAS -->
          <section class="block">
            <div class="block__head">
              <h2 class="block__title">🍱 Menú de la semana</h2>
              <p class="block__sub">Cada pack tiene 5 comidas — podés pedir uno común, uno vegetariano, o los dos</p>
            </div>

            @if (loading()) {
              <div class="viandas-list">
                @for (i of [1,2]; track i) {
                  <div class="vianda-sk">
                    <div class="sk" style="height:18px;width:80px;border-radius:10px"></div>
                    <div class="sk" style="height:24px;width:60%"></div>
                    <div class="sk" style="height:14px;width:90%"></div>
                  </div>
                }
              </div>
            } @else if (viandas().length === 0) {
              <div class="empty">
                <span class="empty__icon">🍽️</span>
                <p class="empty__msg">No hay menú disponible por el momento.</p>
                <p class="empty__hint">¡Volvé pronto!</p>
              </div>
            } @else {
              <div class="viandas-list">
                @for (v of viandas(); track v.id; let i = $index) {
                  <div class="vianda-row"
                       [class.vianda-row--veg]="v.tipo === 'VEGETARIANA'"
                       [style.animation-delay]="(i * 0.08) + 's'">
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
                      <div class="vianda-row__tamanos">
                        <div class="tam-group">
                          <button class="tam-mini" 
                                  [class.tam-mini--active]="(getCantidadPorTamano(v, 'CHICA')) > 0"
                                  (click)="setTamano(v, 'CHICA')">
                            <span>CHICA</span><span class="tam-mini__price">$35k</span>
                          </button>
                          @if (getCantidadPorTamano(v, 'CHICA') > 0) {
                            <div class="vianda-cnt" style="margin-left: 4px;">
                              <button class="counter__btn" (click)="cambiarCantidadPorTamano(v, 'CHICA', -1)">−</button>
                              <span class="counter__val">{{ getCantidadPorTamano(v, 'CHICA') }}</span>
                              <button class="counter__btn counter__btn--plus" (click)="cambiarCantidadPorTamano(v, 'CHICA', 1)">+</button>
                            </div>
                          }
                        </div>
                        <div class="tam-group">
                          <button class="tam-mini" 
                                  [class.tam-mini--active]="(getCantidadPorTamano(v, 'GRANDE')) > 0"
                                  [class.tam-mini--veg]="v.tipo === 'VEGETARIANA'"
                                  (click)="setTamano(v, 'GRANDE')">
                            <span>GRANDE</span><span class="tam-mini__price">$45k</span>
                          </button>
                          @if (getCantidadPorTamano(v, 'GRANDE') > 0) {
                            <div class="vianda-cnt" style="margin-left: 4px;">
                              <button class="counter__btn" (click)="cambiarCantidadPorTamano(v, 'GRANDE', -1)">−</button>
                              <span class="counter__val">{{ getCantidadPorTamano(v, 'GRANDE') }}</span>
                              <button class="counter__btn counter__btn--plus" (click)="cambiarCantidadPorTamano(v, 'GRANDE', 1)">+</button>
                            </div>
                          }
                        </div>
                      </div>
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
              <p class="block__sub">Empanadas y pizzas caseras · Se suman al pedido o se piden solos</p>
            </div>
            <div class="extras-grid">
              <div class="extra-block">
                <div class="extra-block__head">
                  <span class="extra-block__emoji">🥟</span>
                  <div><p class="extra-block__name">Empanadas</p><p class="extra-block__price">$7.500 la media docena</p></div>
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
                  <div><p class="extra-block__name">Pizzas</p><p class="extra-block__price">$10.000 por pizza</p></div>
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
          <div class="panel"
               [class.panel--active]="viandas_sel().length > 0 || tieneExtras()">

            @if (viandas_sel().length === 0 && !tieneExtras()) {
              <div class="panel__placeholder">
                <p class="panel__placeholder-icon">🛒</p>
                <p class="panel__placeholder-title">Tu pedido aparece acá</p>
                <p class="panel__placeholder-hint">Elegí CHICA o GRANDE en las viandas de arriba para empezar</p>
              </div>
            } @else {
              <h3 class="panel__title">🛒 Tu pedido</h3>

              @if (viandas_sel().length > 0) {
                <div class="panel__section">
                  <p class="panel__label">Viandas ({{ totalPacks() }} pack{{ totalPacks() > 1 ? 's' : '' }})</p>
                  @for (vs of viandas_sel(); track vs.vianda.id + ':' + vs.tamano) {
                    <div class="panel__vianda-item">
                      <div class="panel__vianda-info">
                        <span class="panel__vianda-nombre">{{ vs.cantidad > 1 ? vs.cantidad + '× ' : '' }}{{ vs.vianda.nombre }}</span>
                        <span class="tipo-pill" [class.tipo-pill--veg]="vs.vianda.tipo === 'VEGETARIANA'" style="font-size:0.65rem">
                          {{ vs.vianda.tipo === 'COMUN' ? '🍖' : '🥦' }} {{ vs.tamano }}
                        </span>
                      </div>
                      <div class="panel__vianda-right">
                        <span class="panel__vianda-price">{{ "$" + ((vs.tamano === 'CHICA' ? 35000 : 45000) * vs.cantidad).toLocaleString('es-AR') }}</span>
                        <button class="panel__remove" (click)="quitarViandaEspecifica(vs.vianda, vs.tamano)">✕</button>
                      </div>
                    </div>
                  }
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
                      [class.btn-confirm--veg]="viandas_sel().length === 1 && viandas_sel()[0].vianda.tipo === 'VEGETARIANA'"
                      [disabled]="loadingPedido()"
                      (click)="confirmar()">
                {{ loadingPedido() ? 'Enviando...' : '💬 Confirmar y pedir por WhatsApp' }}
              </button>

              <button class="btn-clear" (click)="cancelar()">Limpiar selección</button>

              @if (feedbackMsg()) {
                <div class="panel__feedback" [class.panel__feedback--ok]="feedbackOk()">{{ feedbackMsg() }}</div>
              }
            }
          </div>
        </aside>

      </div>

      <!-- TOAST -->
      @if (mostrarToast()) {
        <div class="toast" (click)="scrollAlPanel()">
          🛒 Tu pedido {{ esMobile() ? '↓ abajo' : '→ al costado' }}
        </div>
      }

      <!-- BOTÓN FLOTANTE WHATSAPP -->
      <a href="https://wa.me/5491167353868?text=Hola%20NotTupper!%20Quiero%20consultar%20%F0%9F%8D%B1"
         target="_blank" class="wsp-fab" title="Consultar por WhatsApp">
        <svg viewBox="0 0 24 24" fill="currentColor" width="26" height="26">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </a>

    </div>
  `,
  styles: [`
    :host {
      /* Map de tokens locales al sistema global */
      --bg: var(--color-cream, #F2EBDF);
      --bg-card: var(--color-white, #FFFFFF);
      --bg-soft: var(--color-cream-soft, #FAF6EE);
      --border: rgba(105, 115, 102, 0.22);
      --border-soft: rgba(105, 115, 102, 0.12);
      --text: var(--color-ink, #0C0D0D);
      --muted: var(--color-sage, #697366);

      /* Brand primary (antes --gold) */
      --brand: var(--color-forest, #2E5935);
      --brand-dark: var(--color-forest-dark, #1E3D23);
      --brand-dim: rgba(46, 89, 53, 0.10);

      /* Accent cálido: wheat */
      --accent: var(--color-wheat, #D9BC9A);
      --accent-dark: var(--color-wheat-dark, #C4A47E);
      --accent-dim: rgba(217, 188, 154, 0.35);

      /* Común = wheat (cálido, carne); Vegetariana = forest (planta) */
      --comun: var(--brand-dark);
      --comun-dim: var(--accent-dim);
      --veg: var(--brand);
      --veg-dim: var(--brand-dim);

      /* Aliases legacy que sigue usando el template */
      --gold: var(--brand);
      --gold-dim: var(--brand-dim);
    }

    .page { background: var(--bg); min-height: 100vh; }

    /* ── Hero ─────────────────────────────────────────── */
    .hero {
      position: relative;
      overflow: hidden;
      background: var(--bg);
      /* Patrón gingham sutil — guiño al flyer */
      background-image:
        linear-gradient(45deg,  transparent 48%, rgba(217,188,154,0.18) 48% 52%, transparent 52%),
        linear-gradient(-45deg, transparent 48%, rgba(217,188,154,0.18) 48% 52%, transparent 52%);
      background-size: 48px 48px;
      border-bottom: 1px solid var(--border-soft);
    }
    .hero__glow {
      position: absolute; inset: 0; pointer-events: none;
      background: radial-gradient(ellipse 80% 100% at 50% 0%, rgba(242,235,223,0.9) 0%, rgba(242,235,223,0.3) 60%, transparent 100%);
    }
    .hero__inner {
      position: relative; z-index: 1;
      max-width: 1100px; margin: 0 auto;
      padding: 48px 32px 32px;
      text-align: center;
    }
    .hero__brand {
      font-family: 'Bebas Neue', sans-serif;
      font-size: clamp(3rem, 8vw, 5.5rem);
      letter-spacing: 0.03em; line-height: 1;
      display: inline-flex; gap: 4px;
    }
    .brand-not    { color: var(--text); }
    .brand-tupper { color: var(--brand); }

    .hero__claim {
      color: var(--text);
      font-size: clamp(1rem, 2.5vw, 1.2rem);
      font-weight: 700; margin-top: 14px;
    }
    .hero__tagline {
      color: var(--muted);
      font-size: 0.9rem; margin-top: 6px;
    }

    .hero__chips {
      display: flex; gap: 10px; margin-top: 20px;
      flex-wrap: wrap; justify-content: center; margin-bottom: 28px;
    }
    .chip {
      display: flex; align-items: center; gap: 10px;
      padding: 10px 22px; border-radius: 32px;
      background: var(--accent);
      color: var(--brand-dark);
      border: 1.5px solid transparent;
      box-shadow: var(--shadow-sm);
    }
    .chip--outline {
      background: var(--bg-card);
      border-color: var(--accent);
    }
    .chip__label {
      font-size: 0.82rem; font-weight: 700;
      letter-spacing: 0.05em;
      color: var(--brand-dark);
    }
    .chip__price {
      font-family: 'Bebas Neue', sans-serif;
      font-size: 1.15rem; letter-spacing: 0.04em;
      color: var(--brand);
    }
    .chip--outline .chip__label { color: var(--brand); }

    .hero__scroll-btn {
      display: inline-flex; align-items: center; justify-content: center; gap: 8px;
      margin-top: 0; padding: 13px 34px; border-radius: 32px;
      background: var(--brand); color: var(--color-cream, #F2EBDF);
      border: none; cursor: pointer;
      font-family: 'Bebas Neue', sans-serif;
      font-size: 1.05rem; letter-spacing: 0.1em;
      transition: all 0.2s;
      box-shadow: var(--shadow);
    }
    .hero__scroll-btn:hover { background: var(--brand-dark); transform: translateY(-2px); box-shadow: var(--shadow-md); }
    .hero__scroll-arrow { animation: bounce 1.2s infinite; display: inline-block; }
    @keyframes bounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(4px); } }

    /* ── Quiénes somos ───────────────────────────────── */
    .quienes {
      border-top: 1px solid var(--border-soft);
      background: var(--bg-soft);
      padding: 36px 0;
    }
    .quienes__inner {
      max-width: 1100px; margin: 0 auto; padding: 0 32px;
      display: grid; grid-template-columns: 1fr auto;
      gap: 40px; align-items: center;
    }
    .quienes__label {
      font-size: 0.72rem; font-weight: 800;
      letter-spacing: 0.18em; text-transform: uppercase;
      color: var(--brand); margin-bottom: 8px;
    }
    .quienes__title {
      font-family: 'Bebas Neue', sans-serif;
      font-size: 1.7rem; color: var(--text);
      letter-spacing: 0.04em; margin-bottom: 10px;
    }
    .quienes__desc {
      color: var(--muted);
      font-size: 0.95rem; line-height: 1.65;
      max-width: 520px; margin-bottom: 18px;
    }
    .quienes__checks { display: flex; flex-direction: column; gap: 6px; }
    .check-item {
      font-size: 0.9rem; color: var(--text);
    }
    .quienes__right {
      display: flex; flex-direction: column;
      align-items: center; gap: 18px;
    }
    .quienes__stat { text-align: center; }
    .quienes__stat-val {
      font-family: 'Bebas Neue', sans-serif;
      font-size: 2.6rem; color: var(--brand);
      display: block; line-height: 1;
    }
    .quienes__stat-label {
      font-size: 0.72rem; color: var(--muted);
      font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.08em;
    }
    .quienes__ig {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 9px 18px; border-radius: 20px;
      border: 1.5px solid var(--border);
      background: var(--bg-card);
      color: var(--brand); font-size: 0.85rem; font-weight: 700;
      text-decoration: none; transition: all 0.15s;
    }
    .quienes__ig:hover {
      border-color: var(--brand); background: var(--brand-dim);
    }

    /* ── Layout ───────────────────────────────────────── */
    .layout {
      max-width: 1100px; margin: 0 auto;
      padding: 40px 32px 80px;
      display: grid; grid-template-columns: 1fr 320px;
      gap: 32px; align-items: start;
    }
    .block { display: flex; flex-direction: column; gap: 20px; }
    .block + .block { margin-top: 40px; }
    .block__title {
      font-family: 'Bebas Neue', sans-serif;
      font-size: 1.5rem; color: var(--text);
      letter-spacing: 0.06em;
    }
    .block__sub {
      color: var(--muted);
      font-size: 0.88rem; margin-top: 3px;
    }

    /* ── Viandas: wheat card con texto forest (como el flyer) ── */
    .viandas-list { display: flex; flex-direction: column; gap: 12px; }
    .vianda-row {
      display: flex; align-items: center; justify-content: space-between;
      padding: 20px 22px; border-radius: 14px;
      cursor: pointer;
      background: var(--accent);                    /* wheat */
      border: 1.5px solid transparent;
      transition: transform 0.18s, box-shadow 0.18s;
      gap: 16px;
      box-shadow: var(--shadow-sm);
      animation: fadeUp 0.4s ease both;
    }
    .vianda-row:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }
    .vianda-row--veg {
      background: var(--bg-card);
      border-color: var(--brand-dim);
    }
    .vianda-row--veg:hover { border-color: var(--brand); }

    .vianda-row__left { flex: 1; min-width: 0; }
    .tipo-pill {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 3px 11px; border-radius: 12px;
      font-size: 0.72rem; font-weight: 800;
      letter-spacing: 0.06em;
      background: var(--bg-card);
      color: var(--brand-dark);
      margin-bottom: 8px;
    }
    .tipo-pill--veg {
      background: var(--brand); color: var(--color-cream, #F2EBDF);
    }

    .vianda-row__nombre {
      font-family: 'Bebas Neue', sans-serif;
      font-size: 1.35rem; color: var(--brand-dark);
      letter-spacing: 0.02em; line-height: 1.1; margin-bottom: 4px;
    }
    .vianda-row--veg .vianda-row__nombre { color: var(--text); }

    .vianda-row__comidas {
      font-size: 0.85rem;
      color: var(--brand-dark);
      opacity: 0.75;
      line-height: 1.5;
    }
    .vianda-row--veg .vianda-row__comidas { color: var(--muted); opacity: 1; }

    .vianda-row__obs {
      font-size: 0.8rem;
      color: var(--brand-dark); opacity: 0.6;
      margin-top: 4px; font-style: italic;
    }
    .vianda-row--veg .vianda-row__obs { color: var(--muted); opacity: 1; }

    .vianda-row__right { flex-shrink: 0; display: flex; align-items: center; gap: 10px; }

    .vianda-row__tamanos { display: flex; gap: 12px; }
    .tam-group { display: flex; align-items: center; gap: 4px; }
    .vianda-cnt { display: flex; align-items: center; gap: 6px; }

    .tam-mini {
      display: flex; flex-direction: column;
      align-items: center; padding: 9px 14px;
      border-radius: 10px;
      border: 1.5px solid var(--brand-dim);
      background: var(--bg-card);
      cursor: pointer; transition: all 0.15s;
      font-family: 'Bebas Neue', sans-serif;
      font-size: 0.9rem; color: var(--brand-dark);
      letter-spacing: 0.05em; gap: 1px;
    }
    .tam-mini:hover { border-color: var(--brand); }
    .tam-mini--active {
      border-color: var(--brand) !important;
      background: var(--brand);
      color: var(--color-cream, #F2EBDF);
    }
    .tam-mini--active .tam-mini__price { color: var(--accent); }
    .tam-mini__price {
      font-size: 0.72rem; color: var(--brand);
      font-weight: 700; font-family: 'Nunito', sans-serif;
    }

    .tick {
      width: 28px; height: 28px; border-radius: 50%;
      background: var(--brand); color: var(--color-cream, #F2EBDF);
      display: flex; align-items: center; justify-content: center;
      font-weight: 900; font-size: 0.9rem; flex-shrink: 0;
    }

    .select-hint {
      font-size: 0.78rem; letter-spacing: 0.06em;
      color: var(--brand); font-weight: 700; white-space: nowrap;
      border: 1px dashed var(--brand-dim);
      padding: 7px 13px; border-radius: 8px; transition: all 0.15s;
    }
    .vianda-row:hover .select-hint {
      background: var(--brand-dim); border-color: var(--brand);
    }

    /* ── Skeleton ─────────────────────────────────────── */
    .vianda-sk {
      padding: 20px; border-radius: 14px;
      border: 1.5px solid var(--border);
      background: var(--bg-card);
      display: flex; flex-direction: column; gap: 10px;
    }
    .sk {
      border-radius: 6px;
      background: linear-gradient(90deg,
        var(--bg-soft) 25%,
        rgba(217,188,154,0.25) 50%,
        var(--bg-soft) 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
    }

    /* ── Extras ───────────────────────────────────────── */
    .extras-grid {
      display: grid; grid-template-columns: 1fr 1fr; gap: 14px;
    }
    .extra-block {
      border: 1.5px solid var(--border);
      border-radius: 14px;
      background: var(--bg-card);
      overflow: hidden;
      box-shadow: var(--shadow-sm);
    }
    .extra-block__head {
      display: flex; align-items: center; gap: 12px;
      padding: 14px 16px;
      border-bottom: 1px solid var(--border-soft);
      background: var(--accent-dim);
    }
    .extra-block__emoji { font-size: 1.5rem; }
    .extra-block__name {
      font-family: 'Bebas Neue', sans-serif;
      font-size: 1.15rem; color: var(--brand-dark);
      letter-spacing: 0.04em;
    }
    .extra-block__price {
      font-size: 0.75rem; color: var(--brand);
      font-weight: 700; margin-top: 2px;
    }
    .sabor-row {
      display: flex; align-items: center; justify-content: space-between;
      padding: 10px 16px;
      border-bottom: 1px solid var(--border-soft);
    }
    .sabor-row:last-child { border-bottom: none; }
    .sabor-row__name { font-size: 0.88rem; color: var(--text); }

    .counter { display: flex; align-items: center; gap: 8px; }
    .counter__btn {
      width: 28px; height: 28px; border-radius: 7px;
      border: 1px solid var(--border);
      background: var(--bg-card);
      color: var(--muted);
      font-size: 1rem; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: all 0.1s; line-height: 1;
    }
    .counter__btn:hover {
      border-color: var(--brand);
      color: var(--brand); background: var(--brand-dim);
    }
    .counter__btn--plus:hover {
      background: var(--brand); color: var(--color-cream, #F2EBDF);
    }
    .counter__val {
      width: 20px; text-align: center;
      font-size: 0.92rem; font-weight: 700;
      color: var(--text);
    }

    /* ── Panel sticky ─────────────────────────────────── */
    .col-aside { position: sticky; top: 80px; }
    .panel {
      background: var(--bg-card);
      border: 1.5px solid var(--border);
      border-radius: 18px;
      padding: 24px;
      display: flex; flex-direction: column; gap: 16px;
      transition: border-color 0.3s, box-shadow 0.3s;
      box-shadow: var(--shadow-sm);
    }
    .panel--active {
      border-color: var(--brand);
      box-shadow: var(--shadow-md);
    }
    @media (max-width: 768px) {
      .panel--active { animation: panelPulse 0.4s ease; }
    }
    @keyframes panelPulse {
      0%   { box-shadow: 0 0 0 rgba(46,89,53,0); }
      50%  { box-shadow: 0 0 24px rgba(46,89,53,0.25); }
      100% { box-shadow: var(--shadow-md); }
    }

    .panel__placeholder {
      text-align: center; padding: 28px 16px;
      display: flex; flex-direction: column; gap: 8px; align-items: center;
    }
    .panel__placeholder-icon { font-size: 2rem; }
    .panel__placeholder-title {
      font-family: 'Bebas Neue', sans-serif;
      font-size: 1.35rem; color: var(--brand);
      letter-spacing: 0.06em;
    }
    .panel__placeholder-hint {
      color: var(--muted); font-size: 0.85rem; line-height: 1.5;
    }

    .panel__title {
      font-family: 'Bebas Neue', sans-serif;
      font-size: 1.4rem; color: var(--brand);
      letter-spacing: 0.05em;
    }
    .panel__label {
      font-size: 0.68rem; font-weight: 800;
      letter-spacing: 0.14em; text-transform: uppercase;
      color: var(--muted); margin-bottom: 8px; display: block;
    }
    .panel__section { display: flex; flex-direction: column; gap: 6px; }

    .panel__vianda-item {
      display: flex; justify-content: space-between; align-items: center;
      padding: 10px 12px; border-radius: 10px;
      background: var(--accent-dim);
      border: 1px solid transparent;
    }
    .panel__vianda-info { display: flex; flex-direction: column; gap: 4px; }
    .panel__vianda-nombre {
      font-family: 'Bebas Neue', sans-serif;
      font-size: 1rem; color: var(--brand-dark);
      letter-spacing: 0.02em;
    }
    .panel__vianda-right { display: flex; align-items: center; gap: 8px; }
    .panel__vianda-price {
      font-size: 0.85rem; color: var(--brand); font-weight: 700;
    }
    .panel__remove {
      background: none; border: none; color: var(--muted);
      cursor: pointer; font-size: 0.85rem;
      padding: 3px 7px; border-radius: 5px;
      transition: all 0.1s;
    }
    .panel__remove:hover {
      color: var(--danger, #B3443A);
      background: rgba(179, 68, 58, 0.1);
    }

    .panel__extra-row {
      display: flex; justify-content: space-between;
      font-size: 0.85rem; color: var(--text);
      padding: 4px 0;
    }
    .panel__extra-price { color: var(--brand); font-weight: 700; }

    .panel__total {
      display: flex; justify-content: space-between; align-items: baseline;
      padding: 14px 16px;
      margin-top: 4px;
      border-radius: 12px;
      background: var(--accent);
      font-size: 0.78rem; letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--brand-dark); font-weight: 700;
    }
    .panel__total-val {
      font-family: 'Bebas Neue', sans-serif;
      font-size: 1.7rem; color: var(--brand-dark);
      letter-spacing: 0.02em;
    }

    .panel__textarea {
      width: 100%;
      background: var(--bg-soft);
      border: 1px solid var(--border);
      border-radius: 10px;
      color: var(--text); font-size: 0.88rem;
      padding: 11px 13px; resize: none; height: 70px;
      outline: none; font-family: 'Nunito', sans-serif;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .panel__textarea:focus {
      border-color: var(--brand);
      box-shadow: 0 0 0 3px var(--brand-dim);
    }
    .panel__textarea::placeholder { color: var(--muted); opacity: 0.7; }

    .btn-confirm {
      width: 100%; padding: 15px;
      border-radius: 12px; border: none;
      font-family: 'Bebas Neue', sans-serif;
      font-size: 1.15rem; letter-spacing: 0.08em;
      cursor: pointer; transition: all 0.15s;
      background: var(--brand); color: var(--color-cream, #F2EBDF);
      box-shadow: var(--shadow-sm);
    }
    .btn-confirm:hover {
      background: var(--brand-dark);
      transform: translateY(-1px);
      box-shadow: var(--shadow);
    }
    .btn-confirm--veg {
      background: var(--brand); color: var(--color-cream, #F2EBDF);
    }
    .btn-confirm:disabled {
      opacity: 0.5; cursor: not-allowed; transform: none;
    }

    .btn-clear {
      width: 100%; padding: 8px;
      background: none; border: none;
      color: var(--muted); font-size: 0.82rem;
      cursor: pointer; font-family: 'Nunito', sans-serif;
      transition: color 0.15s;
    }
    .btn-clear:hover { color: var(--text); }

    .panel__feedback {
      padding: 10px 14px; border-radius: 8px;
      font-size: 0.85rem; font-weight: 700;
      background: rgba(179, 68, 58, 0.1);
      color: var(--danger, #B3443A);
    }
    .panel__feedback--ok {
      background: var(--brand-dim); color: var(--brand);
    }

    /* ── Toast ────────────────────────────────────────── */
    .toast {
      position: fixed; bottom: 28px; left: 50%;
      transform: translateX(-50%); z-index: 998;
      background: var(--brand); color: var(--color-cream, #F2EBDF);
      padding: 13px 26px; border-radius: 32px;
      font-family: 'Bebas Neue', sans-serif;
      font-size: 1rem; letter-spacing: 0.08em;
      cursor: pointer;
      box-shadow: var(--shadow-lg);
      animation: slideUp 0.3s ease both;
      white-space: nowrap;
    }
    @keyframes slideUp {
      from { opacity: 0; transform: translateX(-50%) translateY(16px); }
      to   { opacity: 1; transform: translateX(-50%) translateY(0); }
    }

    /* ── WhatsApp FAB (alineado a la marca, no al verde WSP oficial) ── */
    .wsp-fab {
      position: fixed; bottom: 28px; right: 28px; z-index: 500;
      width: 58px; height: 58px; border-radius: 50%;
      background: var(--brand); color: var(--color-cream, #F2EBDF);
      display: flex; align-items: center; justify-content: center;
      box-shadow: var(--shadow-lg);
      transition: transform 0.2s, box-shadow 0.2s, background 0.2s;
      text-decoration: none;
    }
    .wsp-fab:hover {
      background: var(--brand-dark);
      transform: scale(1.08);
    }

    /* ── Empty ────────────────────────────────────────── */
    .empty {
      text-align: center; padding: 56px 24px;
      background: var(--bg-card);
      border: 1.5px dashed var(--border);
      border-radius: 16px;
    }
    .empty__icon { font-size: 2.8rem; display: block; margin-bottom: 12px; }
    .empty__msg {
      font-family: 'Bebas Neue', sans-serif;
      font-size: 1.25rem; color: var(--brand);
      letter-spacing: 0.04em;
    }
    .empty__hint {
      font-size: 0.88rem; color: var(--muted); margin-top: 6px;
    }

    /* ── Animaciones ──────────────────────────────────── */
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(10px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }

    /* ── Mobile ───────────────────────────────────────── */
    @media (max-width: 768px) {
      /* Layout */
      .layout { grid-template-columns: 1fr; padding: 20px 16px 100px; gap: 24px; }
      .col-aside { position: static; order: 2; }
      .extras-grid { grid-template-columns: 1fr; }

      /* Hero */
      .hero__inner { padding: 28px 16px 20px; }
      .hero__chips { margin-bottom: 18px; gap: 8px; }
      .hero__chips .chip { padding: 7px 16px; }
      .chip__label { font-size: 0.75rem; }
      .chip__price { font-size: 1.05rem; }
      .hero__scroll-btn { padding: 11px 28px; font-size: 0.95rem; }

      /* Quiénes somos */
      .quienes__inner { grid-template-columns: 1fr; gap: 18px; padding: 0 16px; }
      .quienes__right { flex-direction: row; justify-content: flex-start; gap: 24px; }

      /* FAB */
      .wsp-fab { bottom: 20px; right: 16px; width: 52px; height: 52px; }

      /* Vianda row: en mobile se divide en 2 partes verticalmente */
      .vianda-row {
        flex-direction: column; align-items: stretch;
        gap: 14px; padding: 18px;
        cursor: default;
      }
      .vianda-row:hover { transform: none; }
      .vianda-row__left { flex: 1; }
      .vianda-row__comidas,
      .vianda-row__nombre { white-space: normal; word-break: break-word; }

      /* Botones tamaño: fila completa debajo */
      .vianda-row__right { width: 100%; }
      .vianda-row__tamanos {
        display: grid; grid-template-columns: 1fr 1fr;
        gap: 8px; width: 100%;
      }
      .tam-group {
        display: flex; flex-direction: column;
        gap: 6px; align-items: stretch;
      }
      .tam-mini {
        width: 100%; flex-direction: row; justify-content: space-between;
        padding: 11px 15px; font-size: 0.85rem;
      }
      .tam-mini__price { font-size: 0.75rem; }
      .vianda-cnt {
        display: flex; align-items: center; justify-content: center;
        gap: 6px; background: var(--bg-soft);
        border-radius: 8px; padding: 5px 8px;
      }
      .counter__btn { width: 30px; height: 30px; font-size: 1rem; }
      .counter__val { font-size: 0.98rem; width: 26px; }

      /* Panel */
      .panel { padding: 18px; border-radius: 14px; }
      .panel__placeholder { padding: 18px 12px; }
      .panel__total-val { font-size: 1.5rem; }

      /* Toast */
      .toast { font-size: 0.92rem; padding: 11px 22px; bottom: 20px; }
    }
  `]
})
export class MenuComponent implements OnInit {
  private readonly DRAFT_KEY = 'nt_pedido_draft';

  empanadas = EMPANADAS;
  pizzas    = PIZZAS;

  viandas       = signal<Vianda[]>([]);
  viandas_sel   = signal<ViandaSeleccionada[]>([]);
  loading       = signal(true);
  loadingPedido = signal(false);
  feedbackMsg   = signal('');
  feedbackOk    = signal(false);
  mostrarToast  = signal(false);
  observaciones = '';
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
      next: v => {
        this.viandas.set(v);
        this.restoreDraft(v);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private saveDraft(): void {
    const draft: PedidoDraft = {
      viandas: this.viandas_sel().map(vs => ({
        viandaId: vs.vianda.id,
        tamano: vs.tamano,
        cantidad: vs.cantidad,
      })),
      extras: this.extras,
      observaciones: this.observaciones,
    };
    localStorage.setItem(this.DRAFT_KEY, JSON.stringify(draft));
  }

  private restoreDraft(viandasDisponibles: Vianda[]): void {
    try {
      const raw = localStorage.getItem(this.DRAFT_KEY);
      if (!raw) return;

      const draft = JSON.parse(raw) as PedidoDraft;
      const restauradas: ViandaSeleccionada[] = (draft.viandas ?? [])
        .map(item => {
          const vianda = viandasDisponibles.find(v => v.id === item.viandaId);
          if (!vianda || item.cantidad <= 0) return null;
          return {
            vianda,
            tamano: item.tamano,
            cantidad: item.cantidad,
          } as ViandaSeleccionada;
        })
        .filter((item): item is ViandaSeleccionada => item !== null);

      if (restauradas.length > 0) this.viandas_sel.set(restauradas);
      this.extras = draft.extras ?? {};
      this.observaciones = draft.observaciones ?? '';
      localStorage.removeItem(this.DRAFT_KEY);
    } catch {
      localStorage.removeItem(this.DRAFT_KEY);
    }
  }

  scrollAlMenu(): void {
    const el = document.querySelector('.layout');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  scrollAlPanel(): void {
    this.mostrarToast.set(false);
    const el = document.querySelector('.col-aside');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  esMobile(): boolean { return window.innerWidth <= 768; }

  mostrarToastTemporal(): void {
    this.mostrarToast.set(true);
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.mostrarToast.set(false), 4000);
  }

  isSelected(v: Vianda): boolean {
    return this.viandas_sel().some(vs => vs.vianda.id === v.id);
  }

  getTamano(v: Vianda): PedidoTamano {
    return this.viandas_sel().find(vs => vs.vianda.id === v.id)?.tamano ?? 'CHICA';
  }

  setTamano(v: Vianda, tamano: PedidoTamano): void {
    const existing = this.viandas_sel().find(vs => vs.vianda.id === v.id && vs.tamano === tamano);
    
    if (existing) {
      // Ya existe con este tamaño: incrementar cantidad
      this.viandas_sel.update(list =>
        list.map(vs => vs.vianda.id === v.id && vs.tamano === tamano
          ? { ...vs, cantidad: vs.cantidad + 1 }
          : vs
        )
      );
    } else {
      // No existe con este tamaño: agregar nueva entrada
      this.viandas_sel.update(list => [...list, { vianda: v, tamano, cantidad: 1 }]);
      this.mostrarToastTemporal();
    }
    this.saveDraft();
  }

  toggleVianda(v: Vianda): void {
    // Método ya no se usa - reemplazado por setTamano()
  }

  getCantidadPorTamano(v: Vianda, tamano: PedidoTamano): number {
    return this.viandas_sel().find(vs => vs.vianda.id === v.id && vs.tamano === tamano)?.cantidad ?? 0;
  }

  cambiarCantidadPorTamano(v: Vianda, tamano: PedidoTamano, delta: number): void {
    this.viandas_sel.update(list => {
      const idx = list.findIndex(vs => vs.vianda.id === v.id && vs.tamano === tamano);
      if (idx === -1) return list;
      
      const newCant = list[idx].cantidad + delta;
      
      // Si llega a 0 o menos, quitar la entrada
      if (newCant <= 0) {
        return list.filter((_, i) => i !== idx);
      }
      
      return list.map((vs, i) => i === idx ? { ...vs, cantidad: newCant } : vs);
    });
    this.saveDraft();
  }

  getCantidad(v: Vianda): number {
    return this.viandas_sel().find(vs => vs.vianda.id === v.id)?.cantidad ?? 1;
  }

  cambiarCantidad(v: Vianda, delta: number): void {
    this.viandas_sel.update(list =>
      list.map(vs => vs.vianda.id === v.id
        ? { ...vs, cantidad: Math.max(1, vs.cantidad + delta) }
        : vs
      )
    );
  }

  quitarVianda(v: Vianda): void {
    let removed = false;
    this.viandas_sel.update(list =>
      list.filter(vs => {
        if (!removed && vs.vianda.id === v.id) {
          removed = true;
          return false;
        }
        return true;
      })
    );
  }

  quitarViandaEspecifica(v: Vianda, tamano: PedidoTamano): void {
    this.viandas_sel.update(list =>
      list.filter(vs => !(vs.vianda.id === v.id && vs.tamano === tamano))
    );
    this.saveDraft();
  }

  incrementar(tipo: string, sabor: string): void {
    const key = tipo + ':' + sabor;
    this.extras = { ...this.extras, [key]: (this.extras[key] ?? 0) + 1 };
    this.mostrarToastTemporal();
    this.saveDraft();
  }

  decrementar(tipo: string, sabor: string): void {
    const key = tipo + ':' + sabor;
    const cur = this.extras[key] ?? 0;
    if (cur > 0) {
      this.extras = { ...this.extras, [key]: cur - 1 };
      this.saveDraft();
    }
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

  totalPacks(): number {
    return this.viandas_sel().reduce((sum, vs) => sum + vs.cantidad, 0);
  }

  totalEstimado(): number {
    let total = this.viandas_sel().reduce((sum, vs) => sum + (vs.tamano === 'CHICA' ? 35000 : 45000) * vs.cantidad, 0);
    Object.entries(this.extras).filter(([, v]) => v > 0).forEach(([key, cant]) => {
      total += (key.startsWith('empanada') ? 7500 : 10000) * cant;
    });
    return total;
  }

  cancelar(): void {
    this.viandas_sel.set([]);
    this.extras = {};
    this.observaciones = '';
    this.feedbackMsg.set('');
    this.mostrarToast.set(false);
    localStorage.removeItem(this.DRAFT_KEY);
  }

  confirmar(): void {
    if (!this.auth.isLogged()) {
      this.saveDraft();
      this.router.navigate(['/auth/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }
    const sel = this.viandas_sel();
    const extrasArr: PedidoExtra[] = this.extrasSeleccionados().map(e => ({ tipo: e.tipo, sabor: e.sabor, cantidad: e.cantidad }));

    if (sel.length === 0 && extrasArr.length === 0) return;

    this.loadingPedido.set(true);

    // Si hay múltiples viandas, crear un pedido por cada una (respetando cantidad)
    if (sel.length > 0) {
      const promesas = sel.flatMap((vs, idx) =>
        Array.from({ length: vs.cantidad }, (_, i) =>
          this.pedidoService.crear(
            vs.vianda.id,
            vs.tamano,
            idx === 0 && i === 0 ? (this.observaciones || undefined) : undefined,
            idx === 0 && i === 0 ? (extrasArr.length ? extrasArr : undefined) : undefined
          ).toPromise()
        )
      );

      Promise.all(promesas).then(() => {
        this.loadingPedido.set(false);
        window.open(this.whatsappPedidoUrl(), '_blank');
        this.cancelar();
      }).catch(() => {
        this.loadingPedido.set(false);
        this.feedbackMsg.set('❌ Hubo un error. Intentá de nuevo.');
        this.feedbackOk.set(false);
      });
    } else {
      // Solo extras
      this.pedidoService.crear(null, 'CHICA', this.observaciones || undefined, extrasArr).subscribe({
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
    const u = this.auth.user();
    const nl = '%0A';
    let msg = '🍱 *Pedido NotTupper*' + nl + nl;
    msg += '👤 *Cliente:* ' + (u?.nombre ?? '') + ' ' + (u?.apellido ?? '') + nl;
    msg += '📍 *Zona:* ' + (u?.zona ?? '') + nl;
    msg += '📱 *Celular:* ' + (u?.celular ?? '') + nl + nl;

    const sel = this.viandas_sel();
    if (sel.length > 0) {
      msg += '🥘 *Viandas:*' + nl;
      sel.forEach(vs => {
        const tipo = vs.vianda.tipo === 'COMUN' ? 'Común' : 'Vegetariana';
        const tam = vs.tamano === 'CHICA' ? '300g · $35.000' : '500g · $45.000';
        msg += '  · ' + vs.cantidad + '× ' + vs.vianda.nombre + ' (' + tipo + ') — ' + tam + nl;
      });
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