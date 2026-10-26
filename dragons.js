// ============================================================
//  ASCII dragons flying around the top of the home page.
//
//  Long serpent dragons rasterised cell by cell onto a character
//  grid (inspired by github.com/stackedlol/ascii-sharks): bright
//  skin gets sparse glyphs, shadow gets dense ones, and they leave
//  a fading wake of dots behind them. They fly in a lane above or
//  below the name and bend around it. Hovering one makes it glow.
// ============================================================

(() => {

const DRAGON_COUNT = 4; // 0–5

// smallest first so the big ones are drawn on top.
// lane -1 flies above the name and text, lane 1 below it.
const DRAGON_TYPES = [
  { color: "#b6ff3d", accent: "#ff8a3d", size: 0.46, dir: -1, lane: -1, speed: 44, start: 0.75 },
  { color: "#ffe23d", accent: "#ff3d6e", size: 0.5,  dir: 1,  lane: 1,  speed: 50, start: 0.3 },
  { color: "#ff3dbb", accent: "#3df5ff", size: 0.64, dir: 1,  lane: 1,  speed: 80, start: 0.1 },
  { color: "#ff8a3d", accent: "#ffe23d", size: 0.8,  dir: -1, lane: 1,  speed: 58, start: 0.55 },
  { color: "#3df5ff", accent: "#ff3dbb", size: 1,    dir: 1,  lane: -1, speed: 70, start: 0.62 },
];
// which dragons show for a given count (the big cyan one first)
const DRAGON_PRIORITY = [4, 2, 3, 0, 1];

// ============================================================

const SPINE_N = 56;
const SKIN_RAMP = ":;t%SX8#@";
const EDGE_GLYPHS = ".',`";
const MANE_GLYPHS = "~)}%";
const TUFT_GLYPHS = "*%~;";
const BELLY = [255, 236, 204];
const WHITE = [255, 255, 255];
const HORN = [255, 233, 168];

function hexRgb(h) {
  const n = parseInt(h.slice(1), 16);
  return [n >> 16, (n >> 8) & 255, n & 255];
}
function mixWhite(rgb, t) {
  return rgb.map((c) => Math.round(c + (255 - c) * t));
}
function smooth(a, b, x) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}
function lerp(a, b, t) {
  return a + (b - a) * t;
}
// a soft max(0, v), so bodies bend around the text instead of snapping
function softPos(v) {
  return 0.5 * (v + Math.sqrt(v * v + 576));
}
function hash3(a, b, c) {
  let h = (Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263) + Math.imul(c | 0, 1442695041)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
function slopeGlyph(dx, dy) {
  const ax = Math.abs(dx), ay = Math.abs(dy);
  if (ay < ax * 0.42) return "-";
  if (ax < ay * 0.42) return "|";
  return dx * dy < 0 ? "/" : "\\";
}

// body half-thickness along the dragon, s = 0 at the snout, 1 at the tail tip
function dragonRadius(s) {
  if (s < 0.05) return lerp(0.38, 0.85, smooth(0, 0.05, s));
  if (s < 0.1) return lerp(0.85, 1, smooth(0.05, 0.1, s));
  if (s < 0.17) return lerp(1, 0.6, smooth(0.1, 0.17, s));
  if (s < 0.3) return lerp(0.6, 0.95, smooth(0.17, 0.3, s));
  if (s < 0.88) return lerp(0.95, 0.16, smooth(0.3, 0.88, s));
  return lerp(0.16, 0.55, Math.sin(smooth(0.88, 1, s) * Math.PI));
}

class DragonSky {
  constructor(canvas, avoidEl) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.avoidEl = avoidEl;
    this.avoid = null;
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.still = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    this.mouse = null;
    this.visible = true;
    this.t = 0;
    this.last = 0;
    this.frameNo = 0;
    this.styles = new Map();
    this.shown = new Set(DRAGON_PRIORITY.slice(0, DRAGON_COUNT));
    this.dragons = DRAGON_TYPES.map((cfg, k) => ({
      cfg, k, rgb: hexRgb(cfg.color), acc: hexRgb(cfg.accent), glow: 0,
      pts: new Float32Array((SPINE_N + 1) * 2),
    }));
    this.measure();
    this.resize();
    this.dragons.forEach((d) => this.spawn(d, true));
    this.frame = this.frame.bind(this);

    if (window.ResizeObserver) new ResizeObserver(() => this.resize()).observe(canvas.parentElement);
    else window.addEventListener("resize", () => this.resize());
    if (window.IntersectionObserver) {
      new IntersectionObserver((entries) => { this.visible = entries[0].isIntersecting; }).observe(canvas);
    }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { this.measure(); this.resize(); });
    requestAnimationFrame(this.frame);
  }

  measure() {
    this.font = '700 12px "JetBrains Mono", ui-monospace, Menlo, monospace';
    this.ctx.font = this.font;
    this.cw = Math.max(5, this.ctx.measureText("M").width);
    this.ch = 13;
  }

  resize() {
    const box = this.canvas.parentElement.getBoundingClientRect();
    this.W = Math.max(1, box.width);
    this.H = Math.max(1, box.height);
    this.canvas.width = Math.round(this.W * this.dpr);
    this.canvas.height = Math.round(this.H * this.dpr);
    this.cols = Math.ceil(this.W / this.cw);
    this.rows = Math.ceil(this.H / this.ch);
    const n = this.cols * this.rows;
    this.best = new Float32Array(n).fill(Infinity);
    this.cellS = new Float32Array(n);
    this.cellV = new Float32Array(n);
    this.wake = new Float32Array(n);
    this.wakeOf = new Uint8Array(n);
    this.stamp = new Uint32Array(n);
    this.touched = [];
    this.measureAvoid();
  }

  // the name + tagline + buttons block, padded, in canvas coordinates
  measureAvoid() {
    if (!this.avoidEl) { this.avoid = null; return; }
    const c = this.canvas.getBoundingClientRect(), r = this.avoidEl.getBoundingClientRect(), pad = 26;
    this.avoid = { x0: r.left - c.left - pad, x1: r.right - c.left + pad, y0: r.top - c.top - pad, y1: r.bottom - c.top + pad };
  }

  spawn(d, initial) {
    const c = d.cfg, scale = this.W < 700 ? 0.7 : 1;
    d.R = 30 * c.size * scale;
    d.L = 620 * c.size * scale;
    d.seg = d.L / SPINE_N;
    d.jit = initial ? 0 : Math.random() - 0.5;
    d.ampF = 0.65 + Math.random() * 0.35;
    d.l1 = 120 + Math.random() * 60;
    d.l2 = 38 + Math.random() * 16;
    d.l3 = d.L * 0.16;
    d.p1 = Math.random() * 6.283;
    d.p2 = Math.random() * 6.283;
    d.speed = c.speed * (0.85 + Math.random() * 0.3);
    d.u = initial ? c.start * (this.W + d.L + 80) : 0;
  }

  // Follow-the-leader: every spine node sits on the same wavy track the head
  // already flew. Each dragon swoops inside its lane, and any part of it
  // passing over the text bends away from it.
  spine(d) {
    const c = d.cfg, p = d.pts, H = this.H, av = this.avoid;
    const gapTop = av ? Math.max(0, av.y0) : H * 0.4, gapBot = av ? Math.min(H, av.y1) : H * 0.6;
    const top = c.lane < 0 ? 0 : gapBot, bot = c.lane < 0 ? gapTop : H;
    const half = Math.max(0, (bot - top) / 2);
    const base = (top + bot) / 2 + d.jit * half * 0.3;
    const A1 = Math.max(0, Math.min(H * 0.12, half - d.R * 1.7 - 12)) * d.ampF, A2 = 14 * c.size, A3 = 8 * c.size;
    const x0 = c.dir > 0 ? -40 : this.W + 40;
    for (let i = 0; i <= SPINE_N; i++) {
      const u = d.u - i * d.seg;
      const x = x0 + c.dir * u;
      let y = base + A1 * Math.sin(u / d.l1 + d.p1) + A2 * Math.sin(u / d.l2 + d.p2) + A3 * Math.sin(u / d.l3 + this.t * 2.2);
      if (av) {
        const wx = smooth(av.x0 - 160, av.x0, x) * (1 - smooth(av.x1, av.x1 + 160, x));
        if (wx > 0) {
          const r = d.R * dragonRadius(i / SPINE_N);
          if (c.lane < 0) y -= wx * softPos(y - (av.y0 - r - d.R * 1.1 - 10));
          else y += wx * softPos(av.y1 + r + d.R * 1.3 + 10 - y);
        }
      }
      p[2 * i] = x;
      p[2 * i + 1] = y;
    }
  }

  offscreen(d) {
    const tailX = d.pts[2 * SPINE_N];
    return d.cfg.dir > 0 ? tailX > this.W + d.R * 2 : tailX < -d.R * 2;
  }

  frameAt(d, s) {
    const p = d.pts;
    const f = Math.min(SPINE_N - 0.001, Math.max(0, s * SPINE_N));
    const i = Math.floor(f), t = f - i;
    const x = p[2 * i] + (p[2 * i + 2] - p[2 * i]) * t;
    const y = p[2 * i + 1] + (p[2 * i + 3] - p[2 * i + 1]) * t;
    let fx = p[2 * i] - p[2 * i + 2], fy = p[2 * i + 1] - p[2 * i + 3];
    const len = Math.hypot(fx, fy) || 1;
    fx /= len; fy /= len;
    let nx = fy, ny = -fx;
    if (ny > 0) { nx = -nx; ny = -ny; }
    return { x, y, fx, fy, nx, ny };
  }

  hovered(d) {
    const m = this.mouse;
    if (!m) return false;
    const p = d.pts;
    for (let i = 0; i <= SPINE_N; i++) {
      const dx = p[2 * i] - m.x, dy = p[2 * i + 1] - m.y, r = d.R * dragonRadius(i / SPINE_N) + 16;
      if (dx * dx + dy * dy < r * r) return true;
    }
    return false;
  }

  // nearest spine segment for every cell around the body: depth, position along it, and which side
  rasterize(d) {
    const p = d.pts, R = d.R, cw = this.cw, ch = this.ch, edge = cw * 0.9;
    for (let i = 0; i < SPINE_N; i++) {
      const ax = p[2 * i], ay = p[2 * i + 1], bx = p[2 * i + 2], by = p[2 * i + 3];
      const dx = bx - ax, dy = by - ay, len2 = dx * dx + dy * dy || 1, l = Math.sqrt(len2);
      let nx = -dy / l, ny = dx / l;
      if (ny > 0) { nx = -nx; ny = -ny; }
      const rm = R * Math.max(dragonRadius(i / SPINE_N), dragonRadius((i + 1) / SPINE_N)) + edge;
      const c0 = Math.max(0, Math.floor((Math.min(ax, bx) - rm) / cw)), c1 = Math.min(this.cols - 1, Math.floor((Math.max(ax, bx) + rm) / cw));
      const r0 = Math.max(0, Math.floor((Math.min(ay, by) - rm) / ch)), r1 = Math.min(this.rows - 1, Math.floor((Math.max(ay, by) + rm) / ch));
      for (let row = r0; row <= r1; row++) {
        const cy = (row + 0.5) * ch;
        for (let col = c0; col <= c1; col++) {
          const cx = (col + 0.5) * cw;
          let t = ((cx - ax) * dx + (cy - ay) * dy) / len2;
          t = t < 0 ? 0 : t > 1 ? 1 : t;
          const ex = cx - (ax + dx * t), ey = cy - (ay + dy * t);
          const s = (i + t) / SPINE_N, r = R * dragonRadius(s);
          const key = Math.sqrt(ex * ex + ey * ey) - r;
          if (key > edge) continue;
          const idx = row * this.cols + col;
          if (key < this.best[idx]) {
            if (this.best[idx] === Infinity) this.touched.push(idx);
            this.best[idx] = key;
            this.cellS[idx] = s;
            this.cellV[idx] = (ex * nx + ey * ny) / Math.max(r, 1);
          }
        }
      }
    }
  }

  style(rgb, a) {
    const q = Math.max(0, Math.min(20, Math.round(a * 20)));
    const key = ((rgb[0] * 256 + rgb[1]) * 256 + rgb[2]) * 32 + q;
    let s = this.styles.get(key);
    if (!s) {
      if (this.styles.size > 4000) this.styles.clear();
      s = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${q / 20})`;
      this.styles.set(key, s);
    }
    return s;
  }

  cell(col, row, glyph, rgb, a) {
    if (col < 0 || row < 0 || col >= this.cols || row >= this.rows || a < 0.03) return;
    this.stamp[row * this.cols + col] = this.frameNo;
    this.ctx.fillStyle = this.style(rgb, a);
    this.ctx.fillText(glyph, col * this.cw, row * this.ch + 1);
  }

  put(x, y, glyph, rgb, a) {
    this.cell(Math.floor(x / this.cw), Math.floor(y / this.ch), glyph, rgb, a);
  }

  line(x, y, dx, dy, len, rgb, a) {
    const steps = Math.max(1, Math.ceil(len / (this.cw * 0.8))), g = slopeGlyph(dx, dy);
    for (let k = 1; k <= steps; k++) this.put(x + dx * len * k / steps, y + dy * len * k / steps, g, rgb, a * (1 - k / (steps * 2.2)));
  }

  drawDragon(d) {
    const ctx = this.ctx, c = d.cfg, g = d.glow, k = d.k, R = d.R;
    const depth = 0.55 + 0.45 * c.size, boost = 1 + 0.6 * g;
    const col = mixWhite(d.rgb, 0.32 * g), acc = mixWhite(d.acc, 0.25 * g);
    const tq = Math.floor(this.t * 6);
    ctx.shadowColor = c.color;
    ctx.shadowBlur = g > 0.02 ? (3 + 16 * g) * this.dpr : 0;

    for (let n = 0; n < this.touched.length; n++) {
      const idx = this.touched[n];
      const key = this.best[idx], s = this.cellS[idx], v = this.cellV[idx];
      this.best[idx] = Infinity;
      const row = (idx / this.cols) | 0, cx = idx - row * this.cols;
      const su = Math.floor(s * SPINE_N * 2.5), sb = Math.floor((v + 1) * 2.5);
      const h = hash3(su, sb, k);
      let glyph, rgb = col, a;
      if (key > 0) {
        glyph = EDGE_GLYPHS[(h * EDGE_GLYPHS.length) | 0];
        a = 0.34 * (1 - key / (this.cw * 0.9));
      } else {
        const vn = v > 1 ? 1 : v < -1 ? -1 : v;
        const b = 0.12 + 0.62 * (vn + 1) / 2 + 0.26 * Math.sqrt(1 - vn * vn);
        a = 0.4 + 0.6 * b;
        if (s > 0.86) {
          glyph = TUFT_GLYPHS[(hash3(su, sb, tq + k) * TUFT_GLYPHS.length) | 0];
          rgb = acc;
        } else if (s > 0.075 && s < 0.2 && vn > 0.35) {
          glyph = MANE_GLYPHS[(hash3(su, sb, tq + k) * MANE_GLYPHS.length) | 0];
          rgb = acc;
        } else if (vn < -0.5 && s > 0.12 && s < 0.84) {
          glyph = su % 2 ? "=" : "-";
          rgb = BELLY;
          a = 0.45 + 0.3 * b;
        } else {
          const gi = Math.round((1 - b) * (SKIN_RAMP.length - 1) + (h - 0.5) * 1.6);
          glyph = SKIN_RAMP[Math.max(0, Math.min(SKIN_RAMP.length - 1, gi))];
          if (hash3(su, sb, tq * 7 + k) < 0.035) { glyph = "*"; rgb = acc; }
        }
        if (s > 0.3) { this.wake[idx] = Math.max(this.wake[idx], 0.5 * depth); this.wakeOf[idx] = k; }
      }
      this.cell(cx, row, glyph, rgb, Math.min(1, a * depth * boost));
    }
    this.touched.length = 0;

    const fa = Math.min(1, 0.9 * depth * boost);
    // spines along the back
    for (let s = 0.15; s < 0.86; s += 0.055) {
      const f = this.frameAt(d, s), r = R * dragonRadius(s), hgt = R * 0.45 * (1 - s * 0.5) + this.ch * 0.4;
      this.put(f.x + f.nx * (r + hgt), f.y + f.ny * (r + hgt), "^", acc, fa);
    }
    // horns, swept back
    [[0.085, 1.5], [0.112, 1.1]].forEach(([s, len]) => {
      const f = this.frameAt(d, s), r = R * dragonRadius(s);
      const dx = -f.fx * 0.75 + f.nx * 0.65, dy = -f.fy * 0.75 + f.ny * 0.65;
      const l = Math.hypot(dx, dy) || 1;
      this.line(f.x + f.nx * r * 0.85, f.y + f.ny * r * 0.85, dx / l, dy / l, len * R, HORN, fa);
    });
    // whiskers trailing from the snout
    const tip = this.frameAt(d, 0), r0 = R * dragonRadius(0.02), K = Math.max(4, Math.round(10 * c.size));
    [-1, 1].forEach((side) => {
      for (let j = 1; j <= K; j++) {
        const back = j * this.cw * 0.95, wav = Math.sin(this.t * 4 + j * 0.8 + side) * 3 * c.size;
        const off = side * (r0 + j * 1.6) + wav;
        this.put(tip.x - tip.fx * back * 0.7 + tip.nx * off, tip.y - tip.fy * back * 0.7 + tip.ny * off, "~", acc, fa * (1 - j / (K + 2)));
      }
    });
    // little legs with claws
    [0.27, 0.62].forEach((s) => {
      const f = this.frameAt(d, s), r = R * dragonRadius(s);
      let dx = -f.nx * 0.85 - f.fx * 0.5, dy = -f.ny * 0.85 - f.fy * 0.5;
      const l = Math.hypot(dx, dy) || 1, len = R * 0.95;
      dx /= l; dy /= l;
      const bx = f.x - f.nx * r * 0.75, by = f.y - f.ny * r * 0.75;
      this.line(bx, by, dx, dy, len, col, fa);
      this.put(bx + dx * len + f.fx * this.cw, by + dy * len + f.fy * this.cw, "w", HORN, fa);
    });
    // the eye
    const e = this.frameAt(d, 0.055), er = R * dragonRadius(0.055);
    this.put(e.x + e.nx * er * 0.32, e.y + e.ny * er * 0.32, c.size > 0.7 ? "O" : "o", WHITE, 1);
    ctx.shadowBlur = 0;
  }

  drawWake(dt) {
    const decay = Math.pow(0.04, dt);
    for (let idx = 0; idx < this.wake.length; idx++) {
      const w = this.wake[idx];
      if (w < 0.03) { this.wake[idx] = 0; continue; }
      this.wake[idx] = w * decay;
      if (this.stamp[idx] === this.frameNo) continue;
      const row = (idx / this.cols) | 0;
      this.cell(idx - row * this.cols, row, w > 0.32 ? ":" : ".", this.dragons[this.wakeOf[idx]].rgb, w * 0.75);
    }
  }

  frame(now) {
    requestAnimationFrame(this.frame);
    if (!this.visible) { this.last = now; return; }
    if (now - this.last < 32) return; // ~30 fps is plenty for ASCII
    const dt = this.last ? Math.min(0.05, (now - this.last) / 1000) : 0.033;
    this.last = now;
    if (!this.still) this.t += dt;
    this.frameNo++;
    if (this.frameNo % 15 === 0) this.measureAvoid();
    const ctx = this.ctx;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.W, this.H);
    ctx.font = this.font;
    ctx.textBaseline = "top";
    this.dragons.forEach((d) => {
      if (!this.shown.has(d.k)) return;
      if (!this.still) d.u += d.speed * dt;
      this.spine(d);
      if (this.offscreen(d)) { this.spawn(d, false); this.spine(d); }
      d.glow += ((this.hovered(d) ? 1 : 0) - d.glow) * Math.min(1, dt * 9);
      this.rasterize(d);
      this.drawDragon(d);
    });
    this.drawWake(dt);
  }
}

const canvas = document.getElementById("sky");
if (!canvas || !canvas.getContext) return;

const sky = new DragonSky(canvas, document.getElementById("heroText"));
const hero = canvas.parentElement;
const point = (e) => {
  const box = canvas.getBoundingClientRect();
  sky.mouse = { x: e.clientX - box.left, y: e.clientY - box.top };
};
hero.addEventListener("pointermove", point);
hero.addEventListener("pointerdown", point);
hero.addEventListener("pointerleave", () => { sky.mouse = null; });

})();
