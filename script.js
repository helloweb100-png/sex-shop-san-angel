"use strict";
/* ==========================================================================
   Puntos Eróticos Sex Shop · San Ángel, CDMX
   Vanilla JS, sin librerías. Un solo bucle rAF para parallax, progresos y cursor.
   Regla de oro: el contenido es visible por defecto; el JS solo lo mejora.
   ========================================================================== */

/* ---- Configuración (único lugar con el número de WhatsApp) ---- */
const WHATSAPP_NUMBER = "525670096598"; // 52 + 56 70 09 65 98

window.__puntosOk = true; // avisa al <head> de que el script cargó (si no, se quita la clase .js)

/* ---- Utilidades ---- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const root = document.documentElement;
const reducido = root.classList.contains("reducido") ||
  (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
if (reducido) root.classList.add("reducido");
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const tickers = [];            // funciones que corren en el bucle único
const vis = { hero: true };    // estados de visibilidad
const run = (fn) => { try { fn(); } catch (e) { console.error(e); } };
const debounce = (fn, ms = 150) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

/* ==========================================================================
   WhatsApp: todo CTA es <a data-wa="mensaje">
   ========================================================================== */
function waLink(texto) {
  return "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(texto);
}
function setWa(el, mensaje) {
  el.href = waLink(mensaje);
  el.target = "_blank";
  el.rel = "noopener";
}
function initWhatsApp() {
  const els = $$("[data-wa]");
  if (!WHATSAPP_NUMBER) { els.forEach((e) => { e.hidden = true; }); return; }
  els.forEach((e) => setWa(e, e.dataset.wa));
}

/* ==========================================================================
   Hora de CDMX (horario, estado en vivo, día de hoy, dial)
   ========================================================================== */
function ahoraCDMX() {
  try {
    const f = new Intl.DateTimeFormat("en-US", { timeZone: "America/Mexico_City", weekday: "short", hour: "numeric", minute: "numeric", hourCycle: "h23" });
    const o = {};
    f.formatToParts(new Date()).forEach((p) => { o[p.type] = p.value; });
    const dias = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };
    return { dia: dias[o.weekday], min: (parseInt(o.hour, 10) % 24) * 60 + parseInt(o.minute, 10) };
  } catch (e) {
    const d = new Date();
    return { dia: (d.getDay() + 6) % 7, min: d.getHours() * 60 + d.getMinutes() };
  }
}
function initHorarioVivo() {
  const textos = $$("[data-estado-texto]");
  const dias = $$("#dias li");
  const mano = $("#dialMano");
  function actualizar() {
    const { dia, min } = ahoraCDMX();
    const abierto = min >= 720 && min < 1410;
    let t;
    if (abierto) t = "Abierto ahora · hasta las 11:30 pm";
    else if (min >= 1410) t = "Cerrado · abrimos mañana a las 12:00 pm";
    else t = "Cerrado · abrimos a las 12:00 pm";
    textos.forEach((el) => {
      el.textContent = t;
      if (el.parentElement) el.parentElement.classList.toggle("is-cerrado", !abierto);
    });
    dias.forEach((li, i) => li.classList.toggle("hoy", i === dia));
    if (mano) mano.style.setProperty("--ang", ((min / 1440) * 360).toFixed(1) + "deg");
  }
  actualizar();
  setInterval(actualizar, 60000);
}

/* ==========================================================================
   Cargador: tres puntos se unen, anillo de progreso, se parte en dos (≤ 2.5 s)
   ========================================================================== */
function initCargador() {
  const c = $("#cargador");
  if (!c) { root.classList.add("is-listo"); return; }
  const pct = $("#cargadorPct");
  const dur = reducido ? 700 : 1850;
  let hecho = false;
  function contar() {
    if (hecho) return;
    const p = clamp(performance.now() / dur);
    if (pct) pct.textContent = String(Math.round(p * 100)).padStart(2, "0");
    if (p < 1) requestAnimationFrame(contar);
  }
  requestAnimationFrame(contar);
  function salir() {
    if (hecho) return;
    hecho = true;
    if (pct) pct.textContent = "100";
    c.classList.add("is-flash");
    setTimeout(() => {
      c.classList.add("is-saliendo");
      root.classList.add("is-listo");
    }, reducido ? 0 : 100);
    setTimeout(() => { if (c.parentNode) c.parentNode.removeChild(c); }, reducido ? 400 : 620);
  }
  setTimeout(salir, Math.max(0, dur - performance.now()));
}

/* ==========================================================================
   Revelado al scroll: IntersectionObserver + respaldo por geometría
   ========================================================================== */
function initReveal() {
  const els = $$("[data-reveal]");
  if (reducido) { els.forEach((e) => e.classList.add("is-in")); return; }
  const pend = new Set(els);
  const mostrar = (e) => { if (pend.delete(e)) e.classList.add("is-in"); };
  let io = null;
  if ("IntersectionObserver" in window) {
    io = new IntersectionObserver((es) => {
      es.forEach((en) => { if (en.isIntersecting) { mostrar(en.target); io.unobserve(en.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    els.forEach((e) => io.observe(e));
  }
  let raf = 0;
  const geo = () => {
    raf = 0;
    const vh = window.innerHeight, vw = window.innerWidth;
    pend.forEach((e) => {
      const r = e.getBoundingClientRect();
      if (r.bottom > 0 && r.top < vh * 0.96 && r.right > 0 && r.left < vw) mostrar(e);
    });
  };
  const pedir = () => { if (!raf) raf = requestAnimationFrame(geo); };
  addEventListener("scroll", pedir, { passive: true });
  addEventListener("resize", pedir);
  addEventListener("load", pedir);
  setTimeout(geo, 2000);
  setTimeout(geo, 3600);
  geo();
}

/* ==========================================================================
   Navegación: se oculta al bajar, progreso, menú móvil
   ========================================================================== */
function initNav() {
  const nav = $("#nav"), barra = $("#progresoBarra"), burger = $("#burger"), menu = $("#menu");
  if (!nav) return;
  let ultimo = window.scrollY, esperando = false, menuAbierto = false;
  function alScroll() {
    esperando = false;
    const y = window.scrollY, dy = y - ultimo;
    const max = root.scrollHeight - window.innerHeight;
    if (barra) barra.style.transform = "scaleX(" + (max > 0 ? clamp(y / max) : 0).toFixed(4) + ")";
    if (!menuAbierto) {
      if (y > 140 && dy > 6 && !nav.contains(document.activeElement)) nav.classList.add("is-oculto");
      else if (dy < -6 || y < 140) nav.classList.remove("is-oculto");
    }
    ultimo = y;
  }
  addEventListener("scroll", () => { if (!esperando) { esperando = true; requestAnimationFrame(alScroll); } }, { passive: true });
  alScroll();

  if (!burger || !menu) return;
  const enlaces = $$("a", menu);
  function setMenu(v) {
    menuAbierto = v;
    menu.classList.toggle("is-open", v);
    menu.setAttribute("aria-hidden", String(!v));
    burger.setAttribute("aria-expanded", String(v));
    burger.setAttribute("aria-label", v ? "Cerrar menú" : "Abrir menú");
    root.classList.toggle("menu-abierto", v);
    enlaces.forEach((a) => { a.tabIndex = v ? 0 : -1; });
    if (v) { nav.classList.remove("is-oculto"); if (enlaces[0]) enlaces[0].focus({ preventScroll: true }); }
  }
  burger.addEventListener("click", () => setMenu(!menuAbierto));
  menu.addEventListener("click", (e) => { if (e.target === menu || e.target.closest("a")) setMenu(false); });
  addEventListener("keydown", (e) => { if (e.key === "Escape" && menuAbierto) { setMenu(false); burger.focus(); } });
  addEventListener("resize", () => { if (innerWidth >= 1024 && menuAbierto) setMenu(false); });
}

/* ==========================================================================
   Cursor personalizado (solo puntero fino)
   ========================================================================== */
function initCursor() {
  if (reducido || !matchMedia("(hover:hover) and (pointer:fine)").matches) return;
  const anillo = $("#cursorAnillo"), punto = $("#cursorPunto");
  if (!anillo || !punto) return;
  root.classList.add("con-cursor");
  let tx = -100, ty = -100, ax = -100, ay = -100;
  addEventListener("pointermove", (e) => {
    tx = e.clientX; ty = e.clientY;
    punto.style.transform = "translate3d(" + tx + "px," + ty + "px,0)";
  }, { passive: true });
  document.addEventListener("pointerover", (e) => {
    anillo.classList.toggle("es-enlace", !!e.target.closest("a,button,label,input,textarea,summary"));
  });
  tickers.push(() => {
    ax = lerp(ax, tx, 0.18); ay = lerp(ay, ty, 0.18);
    anillo.style.transform = "translate3d(" + ax.toFixed(1) + "px," + ay.toFixed(1) + "px,0)";
  });
}

/* ==========================================================================
   Hero: constelación en canvas
   ========================================================================== */
function initCampo() {
  const c = $("#campo"), hero = $("#inicio");
  if (!c || !hero) return;
  const ctx = c.getContext("2d");
  if (!ctx) return;
  const cols = ["#19C6F5", "#FF2E5B", "#F01E9F", "#A98CFF", "#FFE53D"];
  const ptr = { x: -9999, y: -9999 };
  let W = 0, H = 0, dpr = 1, pts = [];

  function crear() {
    const n = W < 768 ? 40 : Math.min(90, Math.floor(W * H / 14000));
    pts = Array.from({ length: n }, () => {
      const ang = Math.random() * Math.PI * 2, v = 0.15 + Math.random() * 0.25;
      return { x: Math.random() * W, y: Math.random() * H, r: 1.5 + Math.random() * 2.5, a: 0.35 + Math.random() * 0.55,
        c: cols[(Math.random() * cols.length) | 0], vx: Math.cos(ang) * v, vy: Math.sin(ang) * v };
    });
  }
  function medir(forzar) {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const r = hero.getBoundingClientRect();
    const cambioAncho = Math.abs(r.width - W) > 2;
    W = r.width; H = r.height;
    c.width = Math.round(W * dpr); c.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (forzar || cambioAncho || !pts.length) crear();
    if (reducido) dibujar(false);
  }
  function dibujar(mover) {
    ctx.clearRect(0, 0, W, H);
    if (mover) {
      for (const p of pts) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < -10) p.x = W + 10; else if (p.x > W + 10) p.x = -10;
        if (p.y < -10) p.y = H + 10; else if (p.y > H + 10) p.y = -10;
        const dx = p.x - ptr.x, dy = p.y - ptr.y, d = Math.hypot(dx, dy);
        if (d < 160 && d > 0.1) { const f = (1 - d / 160) * 0.9; p.x += dx / d * f; p.y += dy / d * f; }
      }
    }
    ctx.lineWidth = 1;
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i];
      for (let j = i + 1; j < pts.length; j++) {
        const b = pts[j], dx = a.x - b.x, dy = a.y - b.y;
        if (dx > 120 || dx < -120 || dy > 120 || dy < -120) continue;
        const d = Math.hypot(dx, dy);
        if (d < 120) {
          ctx.strokeStyle = "rgba(240,30,159," + ((1 - d / 120) * 0.4).toFixed(3) + ")";
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
      const px = a.x - ptr.x, py = a.y - ptr.y, pd = Math.hypot(px, py);
      if (pd < 160) {
        ctx.strokeStyle = "rgba(25,198,245," + ((1 - pd / 160) * 0.55).toFixed(3) + ")";
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(ptr.x, ptr.y); ctx.stroke();
      }
    }
    for (const p of pts) {
      ctx.globalAlpha = p.a; ctx.fillStyle = p.c;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  medir(true);
  addEventListener("resize", debounce(() => medir(false), 200));
  hero.addEventListener("pointermove", (e) => {
    const r = hero.getBoundingClientRect();
    ptr.x = e.clientX - r.left; ptr.y = e.clientY - r.top;
  }, { passive: true });
  hero.addEventListener("pointerleave", () => { ptr.x = -9999; ptr.y = -9999; });
  if (reducido) return;
  tickers.push(() => { if (vis.hero && !document.hidden) dibujar(true); });
}

/* ==========================================================================
   Hero: inclinación 3D con el puntero, parallax con el scroll, rodillo de palabras
   ========================================================================== */
function initHero() {
  const hero = $("#inicio"), par = $("#heroPar"), incl = $("#inclina");
  if (!hero) return;
  if ("IntersectionObserver" in window) {
    new IntersectionObserver((es) => { vis.hero = es[0].isIntersecting; }, { threshold: 0 }).observe(hero);
  }
  if (reducido) return;
  let tx = 0, ty = 0, cx = 0, cy = 0, sy = window.scrollY;
  hero.addEventListener("pointermove", (e) => {
    const r = hero.getBoundingClientRect();
    ty = ((e.clientX - r.left) / r.width - 0.5) * 16;
    tx = -((e.clientY - r.top) / r.height - 0.5) * 16;
  }, { passive: true });
  hero.addEventListener("pointerleave", () => { tx = 0; ty = 0; });
  tickers.push(() => {
    if (!vis.hero) return;
    cx = lerp(cx, tx, 0.06); cy = lerp(cy, ty, 0.06);
    if (incl) incl.style.transform = "rotateX(" + cx.toFixed(2) + "deg) rotateY(" + cy.toFixed(2) + "deg)";
    sy = lerp(sy, window.scrollY, 0.08);
    if (par) par.style.transform = "translate3d(0," + (sy * 0.25).toFixed(1) + "px,0) scale(" + (1 - 0.15 * clamp(sy / window.innerHeight)).toFixed(3) + ")";
  });
}
function initRodillo() {
  const lista = $("#rodillo");
  if (!lista || reducido) return;
  const items = Array.from(lista.children);
  const clon = items[0].cloneNode(true);
  clon.setAttribute("aria-hidden", "true");
  lista.appendChild(clon);
  let i = 0;
  setInterval(() => {
    if (document.hidden || !vis.hero) return;
    i++;
    lista.style.transform = "translateY(" + (-1.4 * i) + "em)";
    if (i === items.length) {
      setTimeout(() => {
        lista.style.transition = "none";
        lista.style.transform = "translateY(0)";
        i = 0;
        void lista.offsetHeight;
        lista.style.transition = "";
      }, 850);
    }
  }, 2000);
}

/* ==========================================================================
   Cintas cruzadas: marquee que reacciona a la velocidad del scroll
   ========================================================================== */
function initCintas() {
  const cont = $(".cintas");
  const pistas = $$(".cinta__pista");
  if (!pistas.length || reducido) return;
  const items = pistas.map((p) => ({ p, dir: parseFloat(p.dataset.dir) || 1, g: p.firstElementChild, gw: 0, x: 0 }));
  function medir() {
    items.forEach((it) => {
      $$(".cinta__grupo", it.p).slice(1).forEach((n) => n.remove());
      it.gw = it.g.offsetWidth;
      if (!it.gw) return;
      const copias = Math.ceil((window.innerWidth * 1.2) / it.gw) + 1;
      for (let i = 0; i < copias; i++) {
        const cl = it.g.cloneNode(true);
        cl.setAttribute("aria-hidden", "true");
        it.p.appendChild(cl);
      }
    });
  }
  medir();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(medir);
  addEventListener("resize", debounce(medir, 200));
  let visible = true, ultimoY = window.scrollY, sv = 0, sentido = 1;
  if (cont && "IntersectionObserver" in window) {
    new IntersectionObserver((es) => { visible = es[0].isIntersecting; }, { threshold: 0 }).observe(cont);
  }
  tickers.push((t, dt) => {
    const y = window.scrollY, d = y - ultimoY;
    ultimoY = y;
    if (d > 0) sentido = 1; else if (d < 0) sentido = -1;
    sv = lerp(sv, Math.abs(d), 0.12);
    if (!visible) return;
    const vel = 40 + sv * 12;
    items.forEach((it) => {
      if (!it.gw) return;
      it.x += it.dir * sentido * vel * dt / 1000;
      it.x = ((it.x % it.gw) + it.gw) % it.gw;
      it.p.style.transform = "translate3d(" + (-it.x).toFixed(1) + "px,0,0)";
    });
  });
}

/* ==========================================================================
   Manifiesto: las palabras se encienden con el scroll
   ========================================================================== */
function initManifiesto() {
  const sec = $("#manifiesto"), txt = $("#manifTexto"), cta = $("#manifCta");
  if (!sec || !txt) return;
  const palabras = [];
  (function dividir(nodo) {
    Array.from(nodo.childNodes).forEach((n) => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach((s) => {
          if (!s) return;
          if (/^\s+$/.test(s)) { frag.appendChild(document.createTextNode(s)); return; }
          const sp = document.createElement("span");
          sp.className = "w"; sp.textContent = s;
          frag.appendChild(sp); palabras.push(sp);
        });
        n.replaceWith(frag);
      } else if (n.nodeName === "MARK") { dividir(n); }
    });
  })(txt);
  const marcas = $$("mark", txt);
  const fondos = $$(".mf", sec);
  if (reducido) {
    palabras.forEach((w) => w.classList.add("on"));
    marcas.forEach((m) => m.classList.add("on"));
    return;
  }
  let cur = 0;
  tickers.push(() => {
    const r = sec.getBoundingClientRect();
    if (r.bottom < -60 || r.top > window.innerHeight + 60) return;
    const total = r.height - window.innerHeight;
    const objetivo = total > 0 ? clamp(-r.top / total) : 1;
    cur = lerp(cur, objetivo, 0.08);
    const lit = clamp(cur / 0.85) * palabras.length;
    palabras.forEach((w, i) => w.classList.toggle("on", i < lit));
    marcas.forEach((m) => {
      const ws = $$(".w", m);
      m.classList.toggle("on", ws.length > 0 && ws[ws.length - 1].classList.contains("on"));
    });
    if (cta) cta.classList.toggle("visible", cur > 0.92);
    fondos.forEach((f) => {
      const sp = parseFloat(f.dataset.speed) || 0.1;
      f.style.transform = "translate3d(0," + ((cur - 0.5) * sp * -900).toFixed(1) + "px,0)";
    });
  });
}

/* ==========================================================================
   Catálogo: galería horizontal anclada (≥1024) o carrusel nativo (móvil)
   ========================================================================== */
function initCatalogo() {
  const sec = $("#categorias"), pista = $("#pista");
  if (!sec || !pista) return;
  const cards = $$(".tarjeta", pista);
  const artes = cards.map((c) => $(".arte-mov", c));
  const cont = $("#contNum"), barra = $(".catalogo__barra");
  const mq = matchMedia("(min-width:1024px)");
  let hs = false, maxX = 0, offs = [], cur = 0;

  function medir() {
    hs = mq.matches && !reducido && root.classList.contains("js");
    if (hs) {
      pista.style.transform = "";
      sec.style.height = "";
      const sw = pista.scrollWidth;
      maxX = Math.max(0, sw - window.innerWidth);
      sec.style.height = (maxX + window.innerHeight) + "px";
      offs = cards.map((c) => c.offsetLeft + c.offsetWidth / 2);
    } else {
      sec.style.height = "";
      pista.style.transform = "";
      cards.forEach((c) => c.style.removeProperty("--s"));
      artes.forEach((a) => a && a.style.removeProperty("--ax"));
    }
    alScrollNativo();
  }
  function ponerIdx(i, p) {
    if (cont) cont.textContent = String(i + 1).padStart(2, "0");
    if (barra) barra.style.setProperty("--p", clamp(p).toFixed(4));
  }
  function alScrollNativo() {
    if (hs) return;
    const centro = pista.scrollLeft + pista.clientWidth / 2;
    let mejor = 0, md = 1e9;
    cards.forEach((c, i) => {
      const d = Math.abs(c.offsetLeft + c.offsetWidth / 2 - centro);
      if (d < md) { md = d; mejor = i; }
    });
    const max = pista.scrollWidth - pista.clientWidth;
    ponerIdx(mejor, max > 0 ? pista.scrollLeft / max : 0);
  }
  pista.addEventListener("scroll", alScrollNativo, { passive: true });
  medir();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(medir);
  addEventListener("load", medir);
  addEventListener("resize", debounce(medir, 150));
  mq.addEventListener && mq.addEventListener("change", medir);

  tickers.push(() => {
    if (!hs) return;
    const r = sec.getBoundingClientRect();
    if (r.bottom < -100 || r.top > window.innerHeight + 100) return;
    const total = r.height - window.innerHeight;
    const objetivo = total > 0 ? clamp(-r.top / total) : 0;
    cur = lerp(cur, objetivo, 0.08);
    if (Math.abs(cur - objetivo) < 0.0002) cur = objetivo;
    const tx = -cur * maxX;
    pista.style.transform = "translate3d(" + tx.toFixed(1) + "px,0,0)";
    const mitad = window.innerWidth / 2;
    let mejor = 0, md = 1e9;
    cards.forEach((c, i) => {
      const d = (offs[i] + tx - mitad) / mitad, ad = Math.abs(d);
      c.style.setProperty("--s", (0.92 + 0.08 * (1 - clamp(ad))).toFixed(3));
      if (artes[i]) artes[i].style.setProperty("--ax", (clamp(d, -1.5, 1.5) * -40).toFixed(1) + "px");
      if (ad < md) { md = ad; mejor = i; }
    });
    ponerIdx(mejor, cur);
  });

  pista.addEventListener("focusin", (e) => {
    if (!hs) return;
    const card = e.target.closest(".tarjeta");
    if (!card) return;
    const i = cards.indexOf(card);
    const necesario = maxX > 0 ? clamp((offs[i] - window.innerWidth / 2) / maxX) : 0;
    const top = sec.getBoundingClientRect().top + window.scrollY;
    const total = sec.offsetHeight - window.innerHeight;
    window.scrollTo({ top: top + necesario * total, behavior: "auto" });
  });
}

/* ==========================================================================
   Cómo pedir: camino SVG que se dibuja con el scroll, punto líder y nodos
   ========================================================================== */
function initComo() {
  const cuerpo = $("#comoCuerpo");
  if (!cuerpo) return;
  const base = $("#caminoBase"), clip = $("#clipRect"), lider = $("#lider"), nodos = $$(".nodo", cuerpo);
  const marcas = [1 / 6, 0.5, 5 / 6];
  if (reducido || !base || !clip) { nodos.forEach((n) => n.classList.add("on")); if (lider) lider.style.display = "none"; return; }
  const L = base.getTotalLength(), N = 240, xs = [], ys = [];
  for (let i = 0; i <= N; i++) { const p = base.getPointAtLength(L * i / N); xs.push(p.x); ys.push(p.y); }
  function xEn(y) {
    let lo = 0, hi = N;
    while (lo < hi) { const m = (lo + hi) >> 1; if (ys[m] < y) lo = m + 1; else hi = m; }
    const i = Math.max(1, lo);
    const t = clamp((y - ys[i - 1]) / ((ys[i] - ys[i - 1]) || 1));
    return xs[i - 1] + (xs[i] - xs[i - 1]) * t;
  }
  clip.setAttribute("height", "0");
  let cur = 0;
  tickers.push(() => {
    const r = cuerpo.getBoundingClientRect();
    if (r.bottom < -100 || r.top > window.innerHeight + 100) return;
    const objetivo = clamp((window.innerHeight * 0.55 - r.top) / r.height);
    cur = lerp(cur, objetivo, 0.08);
    const y = cur * 1000;
    clip.setAttribute("height", y.toFixed(1));
    lider.style.top = (cur * 100).toFixed(2) + "%";
    lider.style.left = xEn(y).toFixed(2) + "%";
    nodos.forEach((n, i) => n.classList.toggle("on", cur >= marcas[i] - 0.005));
  });
}

/* ==========================================================================
   Bento: inclinación 3D con brillo que sigue al cursor
   ========================================================================== */
function initBento() {
  if (reducido || !matchMedia("(hover:hover) and (pointer:fine)").matches) return;
  $$(".bento__item").forEach((item) => {
    const dentro = $(".bento__in", item);
    if (!dentro) return;
    item.addEventListener("pointermove", (e) => {
      const r = item.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      dentro.style.setProperty("--ry", ((x - 0.5) * 14).toFixed(2) + "deg");
      dentro.style.setProperty("--rx", ((0.5 - y) * 14).toFixed(2) + "deg");
      dentro.style.setProperty("--mx", (x * 100).toFixed(1) + "%");
      dentro.style.setProperty("--my", (y * 100).toFixed(1) + "%");
    });
    item.addEventListener("pointerleave", () => {
      dentro.style.setProperty("--rx", "0deg"); dentro.style.setProperty("--ry", "0deg");
    });
  });
  $$(".domi").forEach((s) => s.pauseAnimations && reducido && s.pauseAnimations());
}

/* ==========================================================================
   Portal: el punto se abre (clip-path en el hijo, nunca en el observado)
   ========================================================================== */
function initPortal() {
  const sec = $("#portal"), esc = $("#portalEsc");
  if (!sec || !esc) return;
  if (reducido) { sec.classList.add("abierto"); return; }
  let cur = 0;
  tickers.push(() => {
    const r = sec.getBoundingClientRect();
    if (r.bottom < -60 || r.top > window.innerHeight + 60) return;
    const total = r.height - window.innerHeight;
    const objetivo = total > 0 ? clamp(-r.top / total) : 1;
    cur = lerp(cur, objetivo, 0.08);
    const e = cur < 0.5 ? 4 * cur * cur * cur : 1 - Math.pow(-2 * cur + 2, 3) / 2;
    const rad = 1.2 + e * (150 - 1.2);
    esc.style.setProperty("--r", rad.toFixed(2) + "%");
    esc.style.setProperty("--p", e.toFixed(3));
    sec.classList.toggle("abierto", rad > 55);
  });
}

/* ==========================================================================
   Guía «Encuentra tu punto»
   ========================================================================== */
function initGuia() {
  const form = $("#guiaForm");
  if (!form) return;
  const qs = $$(".q", form), prog = $$("#gProg li");
  const atras = $("#gAtras"), sig = $("#gSig"), nav = $("#guiaNav");
  const chips = $("#resChips"), wa = $("#resWa"), reinicio = $("#guiaReinicio");
  const BASE = { suave: ["Lubricantes", "Juguetes"], intensidad: ["Vigorizantes", "Retardantes"], sorprender: ["Lencería", "Juguetes"] };
  const MINI = {
    "Juguetes": '<svg viewBox="0 0 40 40" aria-hidden="true"><rect x="12" y="9" width="8" height="22" rx="4" fill="#A98CFF" transform="rotate(-12 16 20)"/><rect x="21" y="12" width="8" height="19" rx="4" fill="#F01E9F" transform="rotate(14 25 21)"/></svg>',
    "Lubricantes": '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M20 8C24 15 29 19 29 24a9 9 0 0 1-18 0c0-5 5-9 9-16Z" fill="#19C6F5"/></svg>',
    "Vigorizantes": '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M20 7L23 17L33 20L23 23L20 33L17 23L7 20L17 17Z" fill="#FFE53D"/></svg>',
    "Retardantes": '<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="11" fill="none" stroke="#F01E9F" stroke-width="3"/><path d="M20 13V20L25 23" stroke="#FFE53D" stroke-width="3" fill="none" stroke-linecap="round"/></svg>',
    "Lencería": '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M6 17C12 9 16 25 21 17S30 9 34 17" fill="none" stroke="#FF2E5B" stroke-width="3" stroke-linecap="round"/><path d="M6 25C12 17 16 33 21 25S30 17 34 25" fill="none" stroke="#F01E9F" stroke-width="3" stroke-linecap="round"/></svg>'
  };
  let paso = 0, animando = false;
  const marcado = (nombre) => $('input[name="' + nombre + '"]:checked', form);

  function actualizar() {
    prog.forEach((li, i) => li.classList.toggle("on", i <= paso));
    if (atras) atras.disabled = paso === 0 || paso === 3;
    if (sig) {
      sig.textContent = paso === 2 ? "Ver mi recomendación" : "Siguiente";
      const nombre = ["quien", "amb", "modo"][paso];
      sig.disabled = paso > 2 || !marcado(nombre);
    }
    if (nav) nav.hidden = paso === 3;
  }
  function ir(n) {
    if (animando || n === paso) return;
    const sale = qs[paso], entra = qs[n];
    animando = true;
    sale.classList.remove("is-activa");
    sale.classList.add("is-sale");
    setTimeout(() => {
      sale.classList.remove("is-sale");
      entra.classList.add("is-activa");
      paso = n; animando = false;
      actualizar();
      entra.setAttribute("tabindex", "-1");
      entra.focus({ preventScroll: true });
    }, reducido ? 0 : 340);
  }
  function resultado() {
    const quien = marcado("quien").value, amb = marcado("amb"), modo = marcado("modo").value;
    let cats = BASE[amb.value].slice();
    if (quien === "de regalo") cats.push("Lencería");
    if (quien === "para los dos") cats.push("Lubricantes");
    cats = Array.from(new Set(cats)).slice(0, 3);
    chips.innerHTML = "";
    cats.forEach((c, i) => {
      const li = document.createElement("li");
      li.style.setProperty("--i", i);
      li.innerHTML = MINI[c] || "";
      const sp = document.createElement("span");
      sp.textContent = c;
      li.appendChild(sp);
      chips.appendChild(li);
    });
    const mensaje = "Hola, busco algo " + quien + ". Quiero " + amb.dataset.txt + ". Me interesa: " + cats.join(", ") + ". Prefiero " + modo + ". ¿Me ayudan?";
    wa.dataset.wa = mensaje;
    if (WHATSAPP_NUMBER) setWa(wa, mensaje);
  }
  form.addEventListener("change", (e) => { if (e.target.type === "radio") actualizar(); });
  form.addEventListener("submit", (e) => e.preventDefault());
  if (sig) sig.addEventListener("click", () => {
    if (paso < 2) ir(paso + 1);
    else if (paso === 2) { resultado(); ir(3); }
  });
  if (atras) atras.addEventListener("click", () => { if (paso > 0 && paso < 3) ir(paso - 1); });
  if (reinicio) reinicio.addEventListener("click", () => {
    form.reset();
    qs.forEach((q) => q.classList.remove("is-activa", "is-sale"));
    qs[0].classList.add("is-activa");
    paso = 0; animando = false;
    actualizar();
  });
  actualizar();
}

/* ==========================================================================
   Horario: cifra con dígitos que ruedan
   ========================================================================== */
function initCifra() {
  const cifra = $("#cifra");
  if (!cifra) return;
  const txt = cifra.textContent.trim();
  cifra.textContent = "";
  const sr = document.createElement("span");
  sr.className = "sr"; sr.textContent = txt;
  cifra.appendChild(sr);
  let k = 0;
  Array.from(txt).forEach((ch) => {
    if (/\d/.test(ch)) {
      const d = document.createElement("span");
      d.className = "dig"; d.setAttribute("aria-hidden", "true");
      const r = document.createElement("span");
      r.className = "dig__r";
      r.style.setProperty("--n", ch);
      r.style.setProperty("--k", k++);
      for (let n = 0; n < 10; n++) { const i = document.createElement("i"); i.textContent = n; r.appendChild(i); }
      d.appendChild(r); cifra.appendChild(d);
    } else {
      const s = document.createElement("span");
      s.className = "sep"; s.setAttribute("aria-hidden", "true");
      s.textContent = ch === " " ? " " : ch;
      cifra.appendChild(s);
    }
  });
}

/* ==========================================================================
   FAQ: acordeón accesible
   ========================================================================== */
function initFaq() {
  const items = $$(".item");
  items.forEach((it) => {
    const b = $("button", it);
    b.addEventListener("click", () => {
      const abre = b.getAttribute("aria-expanded") !== "true";
      items.forEach((o) => { o.classList.remove("abierto"); $("button", o).setAttribute("aria-expanded", "false"); });
      if (abre) { it.classList.add("abierto"); b.setAttribute("aria-expanded", "true"); }
    });
  });
  if (items[0] && root.classList.contains("js")) { items[0].classList.add("abierto"); $("button", items[0]).setAttribute("aria-expanded", "true"); }
}

/* ==========================================================================
   Formulario de contacto → WhatsApp
   ========================================================================== */
function initForm() {
  const f = $("#formContacto");
  if (!f) return;
  const edad = $("#cEdad"), errEdad = $("#errEdad"), errInt = $("#errInteres");
  const estado = $("#cEstado"), enlace = $("#cEstadoLink"), envio = $("#cEnviar"), sin = $("#cSinWa");
  if (!WHATSAPP_NUMBER) { if (envio) envio.hidden = true; if (sin) sin.hidden = false; }
  let intentado = false;
  function validar() {
    errEdad.textContent = ""; errInt.textContent = "";
    edad.removeAttribute("aria-invalid");
    let primero = null;
    const intereses = $$('input[name="interes"]:checked', f);
    const msg = f.elements.mensaje.value.trim();
    if (!intereses.length && !msg) {
      errInt.textContent = "Elige qué te interesa o cuéntanos qué buscas en el mensaje.";
      primero = $('input[name="interes"]', f);
    }
    if (!edad.checked) {
      errEdad.textContent = "Confirma que eres mayor de 18 años para continuar.";
      edad.setAttribute("aria-invalid", "true");
      primero = primero || edad;
    }
    return primero;
  }
  f.addEventListener("input", () => { if (intentado) validar(); });
  f.addEventListener("change", () => { if (intentado) validar(); });
  f.addEventListener("submit", (e) => {
    e.preventDefault();
    intentado = true;
    const error = validar();
    if (error) { error.focus(); return; }
    if (!WHATSAPP_NUMBER) return;
    const nombre = f.elements.nombre.value.trim();
    const intereses = $$('input[name="interes"]:checked', f).map((i) => i.value);
    const modo = $('input[name="modo"]:checked', f);
    const msg = f.elements.mensaje.value.trim();
    let m = "Hola" + (nombre ? ", soy " + nombre : "") + ".";
    if (intereses.length) m += " Me interesa: " + intereses.join(", ") + ".";
    if (modo) m += " Prefiero " + modo.value + ".";
    if (msg) m += " " + msg;
    const url = waLink(m);
    window.open(url, "_blank", "noopener");
    if (enlace) enlace.href = url;
    if (estado) estado.hidden = false;
  });
}

/* ==========================================================================
   Pie: el wordmark se rellena con el espectro
   ========================================================================== */
function initPie() {
  const marca = $("#pieMarca"), arriba = $("#arriba");
  if (arriba) arriba.addEventListener("click", () => window.scrollTo({ top: 0, behavior: reducido ? "auto" : "smooth" }));
  if (!marca || reducido) return;
  const wms = $$(".wm", marca);
  wms.forEach((w) => w.style.setProperty("--f", "0"));
  let cur = 0;
  tickers.push(() => {
    const r = marca.getBoundingClientRect();
    if (r.bottom < -100 || r.top > window.innerHeight + 100) return;
    const objetivo = clamp((window.innerHeight - r.top) / (r.height * 1.6));
    cur = lerp(cur, objetivo, 0.08);
    wms.forEach((w, i) => w.style.setProperty("--f", (clamp(cur * 1.6 - i * 0.35) * 100).toFixed(1)));
  });
}

/* ==========================================================================
   WhatsApp flotante: globo de aviso
   ========================================================================== */
function initFlotante() {
  const g = $("#waGlobo"), x = $("#waGloboX");
  if (!g || !WHATSAPP_NUMBER || window.innerWidth < 1024) return;
  setTimeout(() => { g.hidden = false; setTimeout(() => { g.hidden = true; }, 6000); }, 6000);
  if (x) x.addEventListener("click", () => { g.hidden = true; });
}

/* ==========================================================================
   Pausa de animaciones CSS fuera de pantalla
   ========================================================================== */
function initPausas() {
  if (!("IntersectionObserver" in window)) return;
  const io = new IntersectionObserver((es) => {
    es.forEach((en) => en.target.classList.toggle("fuera", !en.isIntersecting));
  }, { threshold: 0 });
  $$("main > section, .cintas, footer").forEach((s) => io.observe(s));
}

/* ==========================================================================
   Arranque
   ========================================================================== */
[initWhatsApp, initCargador, initReveal, initHorarioVivo, initNav, initCursor, initCampo, initHero,
  initRodillo, initCintas, initManifiesto, initCatalogo, initComo, initBento, initPortal, initGuia,
  initCifra, initFaq, initForm, initPie, initFlotante, initPausas].forEach(run);

if (reducido) {
  $$("svg.domi").forEach((s) => { if (s.pauseAnimations) s.pauseAnimations(); });
}

if (tickers.length && !reducido) {
  let previo = performance.now();
  const bucle = (t) => {
    const dt = Math.min(64, t - previo);
    previo = t;
    for (let i = 0; i < tickers.length; i++) { try { tickers[i](t, dt); } catch (e) { /* un ticker roto no frena a los demás */ } }
    requestAnimationFrame(bucle);
  };
  requestAnimationFrame(bucle);
}
