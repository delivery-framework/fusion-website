/* ============================================================
   Fusion — shared site script
   ============================================================ */

/* ---------- Helpers ---------- */
const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/* ---------- Hero tokamak (continuous field lines on a spinning torus) ---------- */
(() => {
  const canvas = $('#heroCanvas');
  if (!canvas || !canvas.getContext) return null;
  const ctx = canvas.getContext('2d');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  const R = 3.0, TUBE = 0.8; // torus major/minor radius, world units
  const WINDS = 6;           // poloidal turns per toroidal loop — each line is a closed (1,6) torus knot
  const LINES = Math.min(window.innerWidth, window.innerHeight) < 768 ? 14 : 26;
  const SEGS = 220;          // sample points per line
  const BANDS = 5, WLVL = 4; // depth bands × wave-brightness levels = style LUT buckets
  const bandA = [0.08, 0.12, 0.18, 0.3, 0.5];  // far rim floor stays ≥ old baseline
  const bandW = [1, 1.05, 1.15, 1.35, 1.65];
  const INTRO = 2.5;         // ignition draw-in on first view, seconds
  let W = 0, H = 0, raf = 0, visible = false, last = 0, colors = [], lut = [];
  let t0 = null, lastT = 30; // animation clock starts on first visible frame

  const lines = [];
  for (let i = 0; i < LINES; i++) {
    lines.push({
      th0: (i / LINES) * Math.PI * 2,
      rr: TUBE * (0.97 + Math.random() * 0.06),
      c: i % 3,
      p1: i * 2.399, p2: i * 4.71,  // golden-angle wave phases so bands don't align across lines
      delay: (i / LINES) * 1.3,     // ignition stagger sweeps around the ring
    });
  }

  function hexToRgb(hex) {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
    if (!m) return '71,85,105';
    const n = parseInt(m[1], 16);
    return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
  }

  function refreshColors() {
    const cs = getComputedStyle(document.body);
    colors = ['--torus-1', '--torus-2', '--torus-3'].map(v => hexToRgb(cs.getPropertyValue(v)));
    // lut[color][band*WLVL+level]: continuous-ish depth grading × traveling-wave brightness
    lut = colors.map(c => {
      const arr = [];
      for (let b = 0; b < BANDS; b++) {
        for (let l = 0; l < WLVL; l++) {
          const mult = 0.35 + 0.9 * (l + 0.5) / WLVL;
          arr.push(`rgba(${c},${Math.min(1, bandA[b] * mult).toFixed(3)})`);
        }
      }
      return arr;
    });
  }

  const ptx = new Float32Array(SEGS + 1);
  const pty = new Float32Array(SEGS + 1);
  const ptd = new Float32Array(SEGS + 1); // normalized depth per point
  const ptbk = new Uint8Array(SEGS + 1);  // style-LUT bucket per point

  // --- flare: every 6-9s a hot comet races one full loop of a random field line ---
  const FLARE_DUR = 2.4, TAIL = 0.16;
  let flareLine = null, flareStart = 0, flareEnv = 0, flareHead = 0, nextFlareAt = 4.2;

  function updateFlare(time) {
    if (!flareLine && time >= nextFlareAt) {
      flareLine = lines[(Math.random() * LINES) | 0];
      flareStart = nextFlareAt; // anchor to schedule so a late frame lands mid-envelope
    }
    if (flareLine) {
      const u = (time - flareStart) / FLARE_DUR;
      if (u >= 1) {
        flareLine = null; flareEnv = 0;
        nextFlareAt = Math.max(flareStart + 6 + Math.random() * 3, time + 4);
      } else {
        flareEnv = u < 0.15 ? Math.sin((u / 0.15) * Math.PI / 2) : Math.pow(1 - (u - 0.15) / 0.85, 1.4);
        flareHead = u; // the head runs exactly one loop over the flare
      }
    }
  }

  const easeOut = u => 1 - Math.pow(1 - u, 3);

  // Full redraw every frame. Two brightness waves travel along each closed field
  // line (quantized into the style LUT so strokes stay batched), depth grades both
  // alpha and width, and the whole torus drifts a few pixels like it's floating.
  function drawFrame(time) {
    lastT = time;
    ctx.clearRect(0, 0, W, H);
    const A = 0.75 + 0.05 * Math.sin(time * 0.24); // precession wobble
    const cosA = Math.cos(A), sinA = Math.sin(A);
    const spin = time * 0.132, flow = time * 0.6;
    const s = Math.min(W, H) / 7.8;
    const cx = W * 0.74 + 4 * Math.sin(time * 0.21) + 3 * Math.sin(time * 0.087);
    const cy = H * 0.45 + 3.5 * Math.sin(time * 0.16 + 1.3) + 2.5 * Math.sin(time * 0.06);
    const wt1 = time * 0.55, wt2 = time * 0.35;
    ctx.globalCompositeOperation = 'lighter'; // crossings add up like glow
    for (const ln of lines) {
      // ignition: each line draws itself in once, with a bright ember at the tip
      const frac = time >= INTRO + 1.3 ? 1 : easeOut(Math.min(1, Math.max(0, (time - ln.delay) / 1.2)));
      if (frac === 0) continue;
      const jMax = Math.round(SEGS * frac);
      let used = 0;
      for (let j = 0; j <= jMax; j++) {
        const t = (j / SEGS) * Math.PI * 2;
        const th = ln.th0 + spin + t;
        const ph = flow + WINDS * t;
        const ring = R + ln.rr * Math.cos(ph);
        const x = ring * Math.cos(th);
        const z = ring * Math.sin(th);
        const y = ln.rr * Math.sin(ph);
        ptx[j] = cx + x * s;
        pty[j] = cy + (z * sinA - y * cosA) * s;
        const d = (y * sinA + z * cosA) - R * Math.sin(th) * cosA; // depth vs tube centreline
        const dn = Math.min(1, Math.max(0, (d + 0.9) / 1.8));
        ptd[j] = dn;
        let band = (dn * BANDS) | 0; if (band >= BANDS) band = BANDS - 1;
        // two waves traveling in opposite directions; integer frequencies keep the wrap seamless
        const w = 0.8 + 0.45 * (0.5 * Math.sin(2 * t - wt1 + ln.p1) + 0.5 * Math.sin(3 * t + wt2 + ln.p2));
        let lvl = ((w - 0.35) / 0.9 * WLVL) | 0;
        if (lvl < 0) lvl = 0; else if (lvl >= WLVL) lvl = WLVL - 1;
        const bk = band * WLVL + lvl;
        ptbk[j] = bk;
        used |= 1 << bk;
      }
      const style = lut[ln.c];
      for (let bk = 0; bk < BANDS * WLVL; bk++) {
        if (!((used >> bk) & 1)) continue;
        ctx.strokeStyle = style[bk];
        ctx.lineWidth = bandW[bk >> 2];
        ctx.beginPath();
        for (let j = 0; j < jMax; j++) {
          if (ptbk[j] === bk) { ctx.moveTo(ptx[j], pty[j]); ctx.lineTo(ptx[j + 1], pty[j + 1]); }
        }
        ctx.stroke();
      }
      if (frac > 0.02 && frac < 1) {
        const tipX = ptx[jMax], tipY = pty[jMax];
        const g = ctx.createRadialGradient(tipX, tipY, 0, tipX, tipY, 6);
        g.addColorStop(0, 'rgba(235,253,255,0.9)');
        g.addColorStop(0.4, `rgba(${colors[ln.c]},0.5)`);
        g.addColorStop(1, `rgba(${colors[ln.c]},0)`);
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(tipX, tipY, 6, 0, Math.PI * 2); ctx.fill();
      }
      if (ln === flareLine && flareEnv > 0.01 && frac === 1) drawFlare();
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  // Comet riding the flared line: depth-aware tapered tail + hot gradient head.
  // Uses the line's freshly computed points, so it must run inside that line's turn.
  function drawFlare() {
    const headJ = flareHead * SEGS;
    const tailN = TAIL * SEGS;
    for (let k = 0; k < tailN; k++) {
      let j = Math.floor(headJ - k);
      if (j < 0) j += SEGS; // wrap on the closed line
      const j1 = j + 1 > SEGS ? 0 : j + 1;
      const taper = Math.pow(1 - k / tailN, 2);
      const dg = 0.35 + 0.65 * ptd[j]; // fade when the comet passes behind the torus
      const aa = flareEnv * taper * dg;
      ctx.strokeStyle = `rgba(${colors[flareLine.c]},${(aa * 0.22).toFixed(3)})`;
      ctx.lineWidth = 7;
      ctx.beginPath(); ctx.moveTo(ptx[j], pty[j]); ctx.lineTo(ptx[j1], pty[j1]); ctx.stroke();
      ctx.strokeStyle = `rgba(220,250,255,${(aa * 0.6).toFixed(3)})`;
      ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.moveTo(ptx[j], pty[j]); ctx.lineTo(ptx[j1], pty[j1]); ctx.stroke();
    }
    const hj = Math.min(SEGS, Math.floor(headJ));
    const hx = ptx[hj], hy = pty[hj];
    const dg = 0.35 + 0.65 * ptd[hj];
    const g = ctx.createRadialGradient(hx, hy, 0, hx, hy, 9);
    g.addColorStop(0, `rgba(240,254,255,${(0.95 * flareEnv * dg).toFixed(3)})`);
    g.addColorStop(0.45, `rgba(${colors[flareLine.c]},${(0.55 * flareEnv * dg).toFixed(3)})`);
    g.addColorStop(1, `rgba(${colors[flareLine.c]},0)`);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(hx, hy, 9, 0, Math.PI * 2); ctx.fill();
  }

  // Time-based clock (not frame-counted): identical speed at any refresh rate.
  function step() {
    const now = performance.now() / 1000;
    if (t0 === null) t0 = now;
    const time = now - t0;
    updateFlare(time);
    drawFrame(time);
  }

  // cap at ~60fps so 120Hz displays don't run double speed at double cost
  function loop(ts) {
    raf = requestAnimationFrame(loop);
    if (ts - last < 15) return;
    last = ts;
    step();
  }
  function start() { if (!raf && visible && !reduced.matches) raf = requestAnimationFrame(loop); }
  function stop() { cancelAnimationFrame(raf); raf = 0; }

  function resize() {
    // iOS fires resize while scrolling (URL bar collapse); skip if dimensions are unchanged
    if (canvas.clientWidth === W && canvas.clientHeight === H && W > 0) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (reduced.matches) drawFrame(30);       // static, post-ignition frame
    else if (t0 !== null) drawFrame(lastT);
    // else: stay blank so the ignition draw-in is the first thing seen
  }

  refreshColors();
  resize();
  // ResizeObserver catches hero height changes with no window resize (web font load, content swap)
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(resize).observe(canvas);
  else window.addEventListener('resize', resize);

  new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    visible ? start() : stop();
  }).observe(canvas.parentElement);

  if (reduced.addEventListener) reduced.addEventListener('change', () => {
    stop();
    if (reduced.matches) drawFrame(30);
    else start();
  });

})();

/* ---------- Wire up ---------- */
document.addEventListener('DOMContentLoaded', () => {
  $('#year').textContent = new Date().getFullYear();
  if (window.lucide && window.lucide.createIcons) window.lucide.createIcons();

  /* Mark the current page in the header nav and in the mobile menu. Hash links
     are skipped, so same-page section links (home, services) never all light
     up at once. */
  $$('header nav a, header .menu a').forEach((a) => {
    if (!a.hash && a.pathname === location.pathname) a.setAttribute('aria-current', 'page');
  });
});
