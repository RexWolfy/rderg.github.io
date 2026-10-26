// ============================================================
//  LUCKY 777 DELUXE, the big slot machine on /slots.
//  Five reels, ten lines, play money only. Pressing spin heats the
//  machine up, and the hotter it runs the more every win pays, but
//  mash it past 100 and it blows up. Everything (art, sounds,
//  explosions) is made in code: there are no image or audio files.
//  Add ?rig to the address for buttons that force the next result.
// ============================================================

(() => {

const START_BALANCE = 1000;
const BUY_AMOUNT = 1000;           // what one tap on the balance "buys", for $0.00
const BETS = [10, 20, 50, 100, 200, 500, 1000];
const VOLUME = 0.5;                // 0–1, for every sound

// Overheating. Every press of spin adds a little heat, quick presses add a
// lot more, and it cools off on its own once you stop. 100 = boom.
const HEAT_PER_PRESS = 1;          // a calm press
const HEAT_PER_MASH = 4;           // extra for a press right on the heels of the last one
const MASH_WINDOW = 600;           // ms between presses that still counts as mashing
const HEAT_MAX_RATE = 45;          // heat per second at most (holding space down)
const COOL_RATE = 7;               // heat per second lost while you leave it alone
const BROKEN_FOR = 6000;           // ms the machine stays broken after it blows up
const REPAIR_BILL = 10;            // blowing it up costs this many bets

// The hotter it runs, the more it pays: every win is multiplied by the bonus
// of the stage the spin started in. So keep it hot, just not too hot.
const HEAT_STAGES = [
  { from: 0,  bonus: 1,  name: "cool",     color: "#3df5ff" },
  { from: 35, bonus: 2,  name: "warm",     color: "#ffe23d" },
  { from: 60, bonus: 3,  name: "hot!",     color: "#ff8a3d" },
  { from: 82, bonus: 5,  name: "CRITICAL", color: "#ff3d3d" },
  { from: 92, bonus: 10, name: "MELTDOWN", color: "#ffffff" },
];

// Reels: speed in symbols per second, and when each one stops (ms after the press).
const SPIN_SPEED = 26;
const FIRST_STOP = 600;
const STOP_GAP = 170;
const TEASE_TIME = 1100;           // extra spin on a reel that could still make 7s

// weight = how many of each symbol sit on every reel strip. pays are per line bet.
const SYMBOLS = {
  cherry:  { weight: 8, pays: { 2: 2, 3: 8, 4: 20, 5: 60 } },
  lemon:   { weight: 9, pays: { 3: 8, 4: 20, 5: 60 } },
  grape:   { weight: 8, pays: { 3: 10, 4: 30, 5: 100 } },
  bell:    { weight: 7, pays: { 3: 15, 4: 50, 5: 150 } },
  bar:     { weight: 6, pays: { 3: 20, 4: 75, 5: 250 } },
  diamond: { weight: 5, pays: { 3: 25, 4: 100, 5: 300 } },
  dragon:  { weight: 4, pays: { 3: 50, 4: 200, 5: 750 } },
  seven:   { weight: 4, pays: { 3: 60, 4: 300, 5: 2000 } },
  wild:    { weight: 2, pays: { 3: 60, 4: 300, 5: 1500 } },
};

// rows top (0) to bottom (2), one per reel
const LINES = [
  [1, 1, 1, 1, 1], [0, 0, 0, 0, 0], [2, 2, 2, 2, 2], [0, 1, 2, 1, 0], [2, 1, 0, 1, 2],
  [1, 0, 0, 0, 1], [1, 2, 2, 2, 1], [0, 0, 1, 2, 2], [2, 2, 1, 0, 0], [1, 0, 1, 2, 1],
];
const LINE_COLORS = ["#3df5ff", "#ff3dbb", "#b6ff3d", "#ff8a3d", "#ffe23d", "#c58bff", "#ff3d6e", "#3dffb0", "#ff9df0", "#9dd6ff"];

// Wins are sorted by how many bets they pay back. With these odds, at ×1 heat:
// a third of spins win something, NICE 1 in 16, BIG 1 in 80, MEGA 1 in 400.
// The heat bonus pushes the same wins up into the bigger tiers.
const TIERS = [
  { name: "none" },
  { name: "tiny",    min: 0 },
  { name: "small",   min: 1 },
  { name: "nice",    min: 3 },
  { name: "big",     min: 10,  banner: "BIG WIN",  count: 2400 },
  { name: "mega",    min: 30,  banner: "MEGA WIN", count: 4000 },
  { name: "jackpot", min: 100, banner: "JACKPOT",  count: 6000 },
];

const SPIN_LINES = ["spinning…", "come on…", "no whammies…", "big money…", "feeling lucky…", "here we go…"];
const LOSE_LINES = ["nothing. the house thanks you.", "nope. spin again?", "the dragons are laughing", "rerolling destiny…", "statistically due. (you are not)", "zero. zip. nada."];
const NEAR_LINES = ["so close", "noooo so close", "the 7s betrayed you", "one more. surely."];
const TINY_LINES = ["lil win", "a crumb", "pocket change", "technically a win", "it's something"];
const SMALL_LINES = ["win!", "we eating", "money money", "nice little win"];
const NICE_SHOUTS = ["NICE!", "SWEET!", "AYY!", "LET'S GO!", "SPICY!", "COOKING!"];
const BOOM_LINES = ["you broke it.", "warranty void.", "machine.exe has stopped working", "this is why we can't have nice things"];
const KICK_WORDS = ["*clunk*", "ow", "rude", "still broken", "bonk", "patience"];
const RECEIPTS = [
  "purchase complete",
  "thank you for your purchase",
  "valued customer detected",
  "VIP status unlocked",
  "🐋 whale alert",
  "our accountants are concerned",
  "infinite money glitch (legal)",
];
// one strip of duct tape per explosion, up to five
const TAPES = [
  { css: "left: -22px; top: 70px", rot: -32, text: "DO NOT MASH" },
  { css: "right: -24px; top: 110px", rot: 28, text: "" },
  { css: "left: 34%; bottom: -8px", rot: -3, text: "fixed :)" },
  { css: "right: 14%; top: -10px", rot: 6, text: "" },
  { css: "left: -16px; bottom: 80px", rot: 18, text: "srsly" },
];
const NEON = ["#3df5ff", "#ff8a3d", "#ff3dbb", "#b6ff3d", "#ffe23d", "#c58bff"];

// ============================================================

const $ = (id) => document.getElementById(id);
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (list) => list[Math.floor(Math.random() * list.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const mod = (n, m) => ((n % m) + m) % m;
const fmt = (n) => Math.round(n).toLocaleString("en-US");
const easeOutCubic = (t) => 1 - (1 - t) ** 3;
const easeOutBack = (t, s = 1.3) => 1 + (s + 1) * (t - 1) ** 3 + s * (t - 1) ** 2;
const reducedMotion = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
const AMOUNT = reducedMotion ? 0.35 : 1; // fewer particles for reduced motion

// localStorage can be missing or blocked (private windows), so never trust it.
// Same "rderg." prefix as the rest of the site, so the sound setting is shared.
const store = {
  get(key, fallback) {
    try {
      const v = localStorage.getItem(`rderg.${key}`);
      return v === null ? fallback : JSON.parse(v);
    } catch (e) {
      return fallback;
    }
  },
  set(key, value) {
    try { localStorage.setItem(`rderg.${key}`, JSON.stringify(value)); } catch (e) {}
  },
};

const cabinet = $("cabinet");
const win = $("window");
const led = $("led");
const spinBtn = $("spin");
const spinLabel = $("spinLabel");
const moneyBtn = $("money");
const balanceEl = $("balance");
const betEl = $("bet");
const autoBtn = $("auto");
const paylines = $("paylines");
const banner = $("banner");
const bannerTitle = $("bannerTitle");
const bannerAmount = $("bannerAmount");
const bannerBonus = $("bannerBonus");
const cracks = $("cracks");
const heatBar = $("heatBar");
const tempEl = $("temp");
const heatStageEl = $("heatStage");
const bonusEl = $("bonus");
const pops = $("pops");
const toastEl = $("toast");
const shakeEl = $("shake");

// ============================================================
//  Sounds, synthesised with the Web Audio API
// ============================================================

let soundOn = store.get("sound", true) !== false;
let ctx = null;
let master = null;
let noiseBuf = null;

function audio() {
  if (!soundOn) return null;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  if (!ctx) {
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = VOLUME;
    // the explosion plus a dozen coins at once would clip without this
    master.connect(ctx.createDynamicsCompressor()).connect(ctx.destination);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = noiseBuf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

// one beep: a waveform sliding from `freq` to `to` with a quick fade out
function tone({ type = "square", freq, to = freq, at = 0, dur = 0.1, vol = 0.08 }) {
  const t0 = ctx.currentTime + at;
  const osc = ctx.createOscillator(), gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (to !== freq) osc.frequency.exponentialRampToValueAtTime(to, t0 + dur);
  gain.gain.setValueAtTime(vol, t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain).connect(master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

// a burst of filtered noise, for thuds, hisses and booms
function noise({ at = 0, dur = 0.2, vol = 0.1, freq = 800, to = freq, filter = "lowpass" }) {
  const t0 = ctx.currentTime + at;
  const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), gain = ctx.createGain();
  src.buffer = noiseBuf;
  f.type = filter;
  f.frequency.setValueAtTime(freq, t0);
  if (to !== freq) f.frequency.exponentialRampToValueAtTime(to, t0 + dur);
  gain.gain.setValueAtTime(vol, t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(f).connect(gain).connect(master);
  src.start(t0, Math.random() * 1.5, dur + 0.05);
}

const SCALE = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.51, 1567.98, 1760, 2093, 2349.32];

const SFX = {
  spin() { noise({ dur: 0.35, vol: 0.07, freq: 400, to: 2600, filter: "bandpass" }); },
  tick() { tone({ freq: 1900, dur: 0.012, vol: 0.012 }); },
  land(i) { tone({ type: "sine", freq: 170 - i * 12, to: 55, dur: 0.14, vol: 0.2 }); noise({ dur: 0.05, vol: 0.05, freq: 1200 }); },
  clink() { tone({ type: "triangle", freq: 1568, dur: 0.18, vol: 0.06 }); tone({ type: "triangle", freq: 2349, at: 0.03, dur: 0.22, vol: 0.04 }); },
  boing() { tone({ type: "sine", freq: 300, to: 900, dur: 0.15, vol: 0.08 }); },
  tease(sec) { tone({ type: "sawtooth", freq: 180, to: 760, dur: sec, vol: 0.03 }); tone({ type: "sine", freq: 80, to: 160, dur: sec, vol: 0.1 }); },
  note(n) {
    const f = SCALE[Math.min(n, SCALE.length - 1)];
    tone({ type: "triangle", freq: f, dur: 0.35, vol: 0.07 });
    tone({ type: "sine", freq: f * 2, dur: 0.2, vol: 0.025 });
  },
  coin() {
    const f = rand(1900, 2400);
    tone({ type: "sine", freq: f, dur: 0.06, vol: 0.035 });
    tone({ type: "sine", freq: f * 1.5, at: 0.04, dur: 0.12, vol: 0.03 });
  },
  count(p) { tone({ freq: 600 + p * 900, dur: 0.03, vol: 0.018 }); },
  stamp() { noise({ dur: 0.18, vol: 0.2, freq: 2500, to: 200 }); tone({ type: "sine", freq: 160, to: 50, dur: 0.25, vol: 0.22 }); },
  fanfare(tier) {
    const n = 3 + tier;
    for (let i = 0; i < n; i++) {
      const f = SCALE[(i * 2) % SCALE.length] * (i * 2 >= SCALE.length ? 2 : 1);
      tone({ freq: f, at: i * 0.08, dur: 0.16, vol: 0.03 });
      tone({ type: "triangle", freq: f, at: i * 0.08, dur: 0.3, vol: 0.05 });
    }
    if (tier >= 5) [523.25, 659.25, 783.99, 1046.5].forEach((f) => tone({ type: "sawtooth", freq: f, at: n * 0.08, dur: 1.4, vol: 0.018 }));
  },
  bells() { for (let i = 0; i < 16; i++) tone({ type: "triangle", freq: i % 2 ? 2637 : 2093, at: 0.6 + i * 0.11, dur: 0.12, vol: 0.035 }); },
  near() { tone({ type: "triangle", freq: 392, to: 370, dur: 0.28, vol: 0.08 }); tone({ type: "triangle", freq: 370, to: 290, at: 0.3, dur: 0.6, vol: 0.08 }); },
  buzz() { tone({ freq: 110, dur: 0.3, vol: 0.05 }); tone({ freq: 117, dur: 0.3, vol: 0.05 }); },
  press() { tone({ freq: 240, to: 170, dur: 0.04, vol: 0.025 }); },
  buy() {
    tone({ freq: 90, dur: 0.06, vol: 0.05 });
    noise({ dur: 0.08, vol: 0.12, freq: 3000, filter: "highpass" });
    [1318.5, 1760, 2637].forEach((f, i) => tone({ type: "triangle", freq: f, at: 0.09 + i * 0.07, dur: 0.45, vol: 0.06 }));
  },
  warn() { tone({ freq: 880, dur: 0.08, vol: 0.04 }); tone({ freq: 880, at: 0.14, dur: 0.08, vol: 0.04 }); },
  hiss() { noise({ dur: 0.45, vol: 0.035, freq: 3500, filter: "highpass" }); },
  pop() { noise({ dur: 0.3, vol: 0.22, freq: 2600, to: 150 }); tone({ type: "sine", freq: 220, to: 50, dur: 0.22, vol: 0.2 }); },
  boom() {
    noise({ dur: 2.4, vol: 0.7, freq: 1800, to: 40 });
    tone({ type: "sine", freq: 95, to: 24, dur: 1.6, vol: 0.6 });
    tone({ type: "sawtooth", freq: 60, to: 20, dur: 0.8, vol: 0.12 });
    noise({ at: 0.05, dur: 0.6, vol: 0.25, freq: 5000, to: 600, filter: "bandpass" });
    for (let i = 0; i < 16; i++) noise({ at: 0.3 + Math.random() * 1.8, dur: 0.04, vol: rand(0.04, 0.1), freq: 3000, filter: "highpass" });
    tone({ type: "sine", freq: 3100, at: 0.25, dur: 2.8, vol: 0.012 }); // ears ringing
  },
  crackle() { noise({ dur: 0.03, vol: 0.07, freq: 4000, filter: "highpass" }); },
  clunk() { tone({ type: "sine", freq: 120, to: 60, dur: 0.12, vol: 0.22 }); noise({ dur: 0.15, vol: 0.08, freq: 600 }); },
  boot() {
    tone({ type: "sine", freq: 110, to: 880, dur: 0.6, vol: 0.08 });
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone({ type: "triangle", freq: f, at: 0.6 + i * 0.08, dur: 0.3, vol: 0.05 }));
  },
  whistle() { tone({ type: "sine", freq: rand(500, 700), to: rand(1500, 2100), dur: 0.55, vol: 0.02 }); },
  bang() { noise({ dur: 0.5, vol: 0.16, freq: 3000, to: 200 }); },
};

function play(name, ...args) {
  if (audio()) SFX[name](...args);
}

// the critical-heat siren keeps going until it cools down or blows up
let siren = null;
function setSiren(on) {
  if (on && !siren && audio()) {
    const osc = ctx.createOscillator(), lfo = ctx.createOscillator(), depth = ctx.createGain(), gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.value = 760;
    lfo.frequency.value = 2.4;
    depth.gain.value = 240;
    lfo.connect(depth).connect(osc.frequency);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.025, ctx.currentTime + 0.15);
    osc.connect(gain).connect(master);
    osc.start();
    lfo.start();
    siren = { osc, lfo, gain };
  } else if (!on && siren) {
    const t = ctx.currentTime;
    siren.gain.gain.setTargetAtTime(0.0001, t, 0.05);
    siren.osc.stop(t + 0.3);
    siren.lfo.stop(t + 0.3);
    siren = null;
  }
}

const soundBtn = $("soundBtn");
function showSound() {
  soundBtn.textContent = soundOn ? "♪ sound on" : "♪ sound off";
  soundBtn.setAttribute("aria-pressed", soundOn);
}
soundBtn.addEventListener("click", () => {
  if (soundOn) setSiren(false);
  soundOn = !soundOn;
  store.set("sound", soundOn);
  showSound();
  if (soundOn && heatStage >= 3) setSiren(true);
});
showSound();

// ============================================================
//  Particles, on one canvas over the whole page
// ============================================================

const fx = $("fx");
const g = fx.getContext("2d");
let W = 0, H = 0;

function resizeFx() {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  W = innerWidth;
  H = innerHeight;
  fx.width = Math.round(W * dpr);
  fx.height = Math.round(H * dpr);
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
}

const parts = [];
const MAX_PARTS = reducedMotion ? 500 : 2000;

function add(p) {
  if (parts.length >= MAX_PARTS) return;
  parts.push(Object.assign({ age: 0, life: 1, vx: 0, vy: 0, g: 0, drag: 0, rot: 0, vr: 0, size: 4, alpha: 1 }, p));
  wake();
}

function rgba(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`;
}

// soft round blobs for fire, smoke and glows, drawn once per colour
const sprites = {};
function sprite(color) {
  if (!sprites[color]) {
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const x = c.getContext("2d"), grad = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, rgba(color, 1));
    grad.addColorStop(0.3, rgba(color, 0.7));
    grad.addColorStop(0.65, rgba(color, 0.18));
    grad.addColorStop(1, rgba(color, 0));
    x.fillStyle = grad;
    x.fillRect(0, 0, 64, 64);
    sprites[color] = c;
  }
  return sprites[color];
}

const FIRE = ["#fff4d0", "#ffe23d", "#ff8a3d", "#ff3d3d", "#5e1818"];

function blob(color, x, y, r) {
  g.drawImage(sprite(color), x - r, y - r, r * 2, r * 2);
}

function drawPart(p, t) { // t: 0 at birth, 1 at death
  const k = 1 - t;
  switch (p.type) {
    case "fire": {
      g.globalCompositeOperation = "lighter";
      g.globalAlpha = Math.min(1, k * 1.5) * p.alpha;
      blob(FIRE[Math.min(FIRE.length - 1, Math.floor(t * FIRE.length))], p.x, p.y, p.size * (0.5 + k * 0.7));
      break;
    }
    case "smoke": {
      g.globalCompositeOperation = "source-over";
      g.globalAlpha = p.alpha * Math.sin(Math.PI * t);
      blob(p.color, p.x, p.y, p.size * (1 + t * p.grow));
      break;
    }
    case "glow":
    case "ember": {
      g.globalCompositeOperation = "lighter";
      g.globalAlpha = p.alpha * k * k;
      blob(p.color, p.x, p.y, p.size);
      break;
    }
    case "spark":
    case "rocket": {
      g.globalCompositeOperation = "lighter";
      g.globalAlpha = p.type === "rocket" ? 1 : k;
      g.strokeStyle = p.color;
      g.lineWidth = p.size;
      g.beginPath();
      g.moveTo(p.x, p.y);
      g.lineTo(p.x - p.vx * 0.035, p.y - p.vy * 0.035);
      g.stroke();
      break;
    }
    case "ring": {
      const r = p.r0 + (p.r1 - p.r0) * easeOutCubic(t);
      g.globalCompositeOperation = "lighter";
      g.globalAlpha = k;
      g.strokeStyle = p.color;
      g.lineWidth = p.size * k + 0.5;
      g.beginPath();
      g.arc(p.x, p.y, r, 0, Math.PI * 2);
      g.stroke();
      break;
    }
    case "drop":
    case "bubble": {
      g.globalCompositeOperation = "source-over";
      g.globalAlpha = Math.min(1, k * 2);
      g.beginPath();
      g.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      if (p.type === "drop") {
        g.fillStyle = p.color;
        g.fill();
      } else {
        g.strokeStyle = p.color;
        g.lineWidth = 2;
        g.stroke();
      }
      break;
    }
    case "glint": {
      const s = p.size * Math.sin(Math.PI * t);
      g.globalCompositeOperation = "lighter";
      g.globalAlpha = 1;
      g.fillStyle = p.color;
      g.beginPath();
      g.moveTo(p.x, p.y - s); g.lineTo(p.x + s * 0.18, p.y); g.lineTo(p.x, p.y + s); g.lineTo(p.x - s * 0.18, p.y);
      g.moveTo(p.x - s, p.y); g.lineTo(p.x, p.y + s * 0.18); g.lineTo(p.x + s, p.y); g.lineTo(p.x, p.y - s * 0.18);
      g.fill();
      break;
    }
    case "coin":
    case "fly": {
      const w = Math.abs(Math.cos(p.rot)) * p.size + 1, h = p.size;
      g.globalCompositeOperation = "source-over";
      g.globalAlpha = Math.min(1, k * 4);
      g.fillStyle = "#ffd23d";
      g.strokeStyle = "#a8740f";
      g.lineWidth = 1.5;
      g.beginPath();
      g.ellipse(p.x, p.y, w / 2, h / 2, 0, 0, Math.PI * 2);
      g.fill();
      g.stroke();
      if (w > p.size * 0.4) {
        g.fillStyle = "#fff6c0";
        g.beginPath();
        g.ellipse(p.x - w * 0.14, p.y - h * 0.16, w * 0.14, h * 0.14, 0, 0, Math.PI * 2);
        g.fill();
      }
      break;
    }
    case "confetti":
    case "debris": {
      const flip = Math.abs(Math.cos(p.age * (p.wob || 8)));
      g.globalCompositeOperation = "source-over";
      g.globalAlpha = Math.min(1, k * 3);
      g.fillStyle = p.color;
      g.save();
      g.translate(p.x, p.y);
      g.rotate(p.rot);
      if (p.type === "confetti") {
        g.fillRect(-p.size / 2, (-p.size / 4) * flip, p.size, (p.size / 2) * flip + 0.5);
      } else {
        g.beginPath();
        g.moveTo(-p.size / 2, -p.size / 3);
        g.lineTo(p.size / 2, -p.size / 5);
        g.lineTo(0, p.size / 2);
        g.fill();
        if (p.edge) {
          g.strokeStyle = p.edge;
          g.lineWidth = 1.5;
          g.stroke();
        }
      }
      g.restore();
      break;
    }
  }
}

function stepPart(p, dt) {
  p.age += dt;
  if (p.age < 0) return true; // still waiting for its delay
  if (p.age >= p.life) {
    if (p.onDone) p.onDone(p);
    return false;
  }
  if (p.type === "fly" || p.type === "rocket") {
    // follows a curve from where it started to its target
    const t = p.age / p.life, e = p.type === "fly" ? t * t * (3 - 2 * t) : easeOutCubic(t), u = 1 - e;
    const x = u * u * p.x0 + 2 * u * e * p.cx + e * e * p.x1;
    const y = u * u * p.y0 + 2 * u * e * p.cy + e * e * p.y1;
    p.vx = (x - p.x) / Math.max(dt, 0.001);
    p.vy = (y - p.y) / Math.max(dt, 0.001);
    p.x = x;
    p.y = y;
    p.rot += p.vr * dt;
    if (p.type === "rocket" && Math.random() < 0.7) add({ type: "ember", x, y, vy: rand(20, 60), life: 0.4, size: 5, color: "#ffb43d", alpha: 0.8 });
    return true;
  }
  const d = Math.exp(-p.drag * dt);
  p.vx *= d;
  p.vy = p.vy * d + p.g * dt;
  p.x += p.vx * dt + (p.type === "confetti" ? Math.sin(p.age * 5 + p.rot) * 40 * dt : 0);
  p.y += p.vy * dt;
  p.rot += p.vr * dt;
  return true;
}

let drewLast = false;
function drawParts(dt) {
  if (!parts.length && !drewLast) return false;
  g.clearRect(0, 0, W, H);
  let n = 0;
  for (const p of parts) {
    if (!stepPart(p, dt)) continue;
    parts[n++] = p;
    if (p.age >= 0) drawPart(p, p.age / p.life);
  }
  parts.length = n;
  g.globalAlpha = 1;
  g.globalCompositeOperation = "source-over";
  drewLast = n > 0;
  return true;
}

// emitters spawn particles every `every` ms for a while (smoke plumes, coin rain…)
const emitters = [];
function emit(every, duration, fn, tag = "") {
  emitters.push({ every, until: performance.now() + duration, acc: every, fn, tag });
  wake();
}
function stopEmitters(tag) {
  for (let i = emitters.length - 1; i >= 0; i--) if (emitters[i].tag === tag) emitters.splice(i, 1);
}
function runEmitters(now, dt) {
  for (let i = emitters.length - 1; i >= 0; i--) {
    const e = emitters[i];
    e.acc += dt * 1000;
    while (e.acc >= e.every) {
      e.acc -= e.every;
      e.fn();
    }
    if (now > e.until) emitters.splice(i, 1);
  }
  return emitters.length > 0;
}

// --- shake + flash ---
let trauma = 0;
function shake(amount) {
  if (reducedMotion) return;
  trauma = Math.min(1, trauma + amount);
  wake();
}
function updateShake(dt) {
  if (trauma <= 0) return false;
  trauma = Math.max(0, trauma - dt * 1.3);
  const s = trauma * trauma;
  shakeEl.style.transform = trauma
    ? `translate(${rand(-1, 1) * 28 * s}px, ${rand(-1, 1) * 22 * s}px) rotate(${rand(-1, 1) * 2 * s}deg)`
    : "";
  return true;
}

function flash(color, strength) {
  if (reducedMotion) return;
  const el = $("flash");
  el.style.transition = "none";
  el.style.background = color;
  el.style.opacity = strength;
  void el.offsetWidth;
  el.style.transition = "opacity .7s ease-out";
  el.style.opacity = 0;
}

// --- effect recipes ---
const n = (count) => Math.max(1, Math.round(count * AMOUNT));

function sparks(x, y, color, count, speed = 400, gravity = 500) {
  for (let i = 0; i < n(count); i++) {
    const a = rand(0, Math.PI * 2), v = rand(speed * 0.3, speed);
    add({ type: "spark", x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: gravity, drag: 1.5, life: rand(0.35, 0.8), size: rand(1.5, 2.6), color });
  }
}

function ring(x, y, color, r1 = 80, size = 4, life = 0.6, delay = 0) {
  add({ type: "ring", x, y, r0: 6, r1, size, life, color, age: -delay });
}

function puffSmoke(x, y, dark, count = 1) {
  for (let i = 0; i < count; i++) {
    add({
      type: "smoke", x: x + rand(-10, 10), y, vx: rand(-25, 25), vy: rand(-110, -50), g: -15, drag: 0.7,
      life: rand(1.2, 2.2), size: rand(12, 24), grow: 2.4, color: dark ? "#3d3846" : "#e4e6f2", alpha: dark ? 0.55 : 0.25,
    });
  }
}

function blast(x, y, scale = 1) {
  add({ type: "glow", x, y, size: 120 * scale, life: 0.35, color: "#ffe9a8", alpha: 1 });
  for (let i = 0; i < n(60 * scale); i++) {
    const a = rand(0, Math.PI * 2), v = rand(40, 520) * Math.sqrt(scale);
    add({ type: "fire", x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: -80, drag: 2.4, life: rand(0.45, 1.1), size: rand(14, 40) * Math.sqrt(scale) });
  }
  sparks(x, y, "#ffd23d", 30 * scale, 900 * Math.sqrt(scale), 600);
  ring(x, y, "#fff2c0", 120 * scale, 6);
  for (let i = 0; i < n(6 * scale); i++) puffSmoke(x + rand(-30, 30) * scale, y + rand(-20, 20) * scale, true);
}

function coinBurst(x, y, count, up = false) {
  for (let i = 0; i < n(count); i++) {
    const a = up ? rand(-Math.PI * 0.85, -Math.PI * 0.15) : rand(0, Math.PI * 2), v = rand(250, up ? 900 : 650);
    add({ type: "coin", x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 120, g: 1300, drag: 0.4, life: rand(1.4, 2.4), size: rand(12, 20), vr: rand(8, 16) });
  }
}

function rainCoin() {
  add({ type: "coin", x: rand(0, W), y: -20, vx: rand(-60, 60), vy: rand(150, 420), g: 800, life: 3, size: rand(12, 22), vr: rand(6, 14) });
}

// coins that fly into the balance; each one that lands gets a ding
let lastDing = 0;
function coinsToBalance(x, y, count, spread = 0) {
  const r = moneyBtn.getBoundingClientRect();
  const tx = r.left + 24, ty = r.top + r.height / 2;
  for (let i = 0; i < count; i++) {
    const x0 = x + rand(-spread, spread), y0 = y + rand(-spread, spread);
    add({
      type: "fly", x: x0, y: y0, x0, y0, x1: tx, y1: ty,
      cx: (x0 + tx) / 2 + rand(-160, 160), cy: Math.min(y0, ty) - rand(80, 240),
      life: rand(0.55, 0.9), age: -i * 0.035, size: rand(13, 18), vr: rand(10, 18),
      onDone: () => {
        const now = performance.now();
        if (now - lastDing > 45) {
          lastDing = now;
          play("coin");
          bump(moneyBtn);
        }
      },
    });
  }
}

function firework(x, y, color) {
  play("bang");
  add({ type: "glow", x, y, size: 90, life: 0.4, color, alpha: 1 });
  const count = n(70);
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 + rand(-0.05, 0.05), v = rand(160, 420);
    add({ type: "spark", x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 160, drag: 1.3, life: rand(0.9, 1.6), size: rand(1.5, 2.6), color });
  }
  for (let i = 0; i < n(8); i++) add({ type: "glint", x: x + rand(-60, 60), y: y + rand(-60, 60), size: rand(8, 14), life: rand(0.4, 0.8), age: -rand(0.2, 0.6), color: "#ffffff" });
}

function rocket(x, color) {
  play("whistle");
  const y0 = H + 10, x1 = x + rand(-80, 80), y1 = rand(H * 0.1, H * 0.42);
  add({ type: "rocket", x, y: y0, x0: x, y0, x1, y1, cx: x, cy: (y0 + y1) / 2, life: rand(0.7, 1), size: 3, color: "#fff2c0", onDone: () => firework(x1, y1, color) });
}

function confettiCannon(fromLeft) {
  const x = fromLeft ? -10 : W + 10, dir = fromLeft ? 1 : -1;
  for (let i = 0; i < n(70); i++) {
    add({
      type: "confetti", x, y: H * rand(0.6, 0.95), vx: dir * rand(250, 800), vy: rand(-1100, -500), g: 650, drag: 1.4,
      life: rand(2.2, 3.6), size: rand(7, 12), vr: rand(-10, 10), rot: rand(0, 6), wob: rand(6, 14), color: pick(NEON),
    });
  }
}

// a different splash for every symbol that wins
const HIT_FX = {
  cherry: (x, y) => juice(x, y, "#ff3d6e"),
  lemon: (x, y) => juice(x, y, "#ffe23d"),
  grape: (x, y) => {
    for (let i = 0; i < n(9); i++) add({ type: "bubble", x: x + rand(-20, 20), y: y + rand(-10, 15), vx: rand(-30, 30), vy: rand(-140, -60), drag: 0.6, life: rand(0.7, 1.2), size: rand(3, 7), color: "#c58bff" });
  },
  bell: (x, y) => { ring(x, y, "#ffc53d", 60, 4, 0.55); ring(x, y, "#ffc53d", 60, 4, 0.55, 0.15); },
  bar: (x, y) => sparks(x, y, "#ff8a3d", 18, 420, 300),
  diamond: (x, y) => {
    for (let i = 0; i < n(8); i++) add({ type: "glint", x: x + rand(-34, 34), y: y + rand(-30, 30), size: rand(8, 16), life: rand(0.5, 0.8), age: -rand(0, 0.4), color: "#dffcff" });
  },
  dragon: (x, y) => emit(22, 450, () => add({ type: "fire", x: x + 16, y: y - 4, vx: rand(280, 480), vy: rand(-60, 40), g: -60, drag: 1.6, life: rand(0.35, 0.6), size: rand(8, 20) }), "win"),
  seven: (x, y) => { coinBurst(x, y, 6); sparks(x, y, "#ff3d3d", 16); },
  wild: (x, y) => {
    for (let i = 0; i < n(18); i++) {
      const a = rand(0, Math.PI * 2), v = rand(120, 340);
      add({ type: "confetti", x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 100, g: 450, drag: 1.6, life: rand(0.8, 1.4), size: rand(5, 9), rot: rand(0, 6), vr: rand(-8, 8), color: pick(NEON) });
    }
  },
};

function juice(x, y, color) {
  add({ type: "glow", x, y, size: 40, life: 0.3, color, alpha: 0.8 });
  for (let i = 0; i < n(14); i++) {
    const a = rand(-Math.PI, 0), v = rand(120, 380);
    add({ type: "drop", x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 1100, life: rand(0.5, 0.9), size: rand(2.2, 4.5), color });
  }
}

function center(el) {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

function bump(el, cls = "bump") {
  el.classList.remove(cls);
  void el.offsetWidth;
  el.classList.add(cls);
}

// (removed on a timer, not on animationend: with reduced motion there's no animation to end)
function popText(x, y, text, color, big = false) {
  const el = document.createElement("div");
  el.className = big ? "s7-pop big" : "s7-pop";
  el.textContent = text;
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  el.style.color = color;
  pops.appendChild(el);
  setTimeout(() => el.remove(), 1150);
}

function stamp(text, color, small = false) {
  const el = document.createElement("p");
  el.className = small ? "s7-stamp small" : "s7-stamp";
  el.textContent = text;
  el.style.setProperty("--c", color);
  win.appendChild(el);
  setTimeout(() => el.remove(), 1250);
  play("stamp");
}

let toastTimer = 0;
function toast(html) {
  toastEl.innerHTML = html;
  toastEl.classList.add("on");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("on"), 2800);
}

function say(text, kind = "") {
  led.textContent = text;
  led.className = `s7-led ${kind}`;
}

// ============================================================
//  Symbols: tiny pixel art, one <path> per colour
// ============================================================

function pixelArt(rows, colors) {
  const paths = {};
  rows.forEach((row, y) => [...row].forEach((ch, x) => {
    if (colors[ch]) paths[ch] = `${paths[ch] || ""}M${x} ${y}h1v1h-1z`;
  }));
  const body = Object.entries(paths).map(([ch, d]) => `<path fill="${colors[ch]}" d="${d}"/>`).join("");
  return `<svg viewBox="0 0 ${rows[0].length} ${rows.length}" shape-rendering="crispEdges" aria-hidden="true">${body}</svg>`;
}

const ART = {
  cherry: pixelArt([
    "........ggg.",
    ".......gg...",
    "......g.g...",
    ".....g..g...",
    "....g...g...",
    "...g....g...",
    "..g....rrr..",
    ".rrr..rrrrr.",
    "rwrrr.rwrrr.",
    "rrrrr.rrrrd.",
    "rrrrd..rdd..",
    ".rdd........",
  ], { g: "#b6ff3d", r: "#ff3d6e", w: "#ffd0dc", d: "#c41f50" }),
  lemon: pixelArt([
    "......gg....",
    "....yyyy....",
    "..yyyyyyyy..",
    ".ywwyyyyyyy.",
    "yywyyyyyyyyy",
    "yyyyyyyyyyyy",
    ".yyyyyyyyyo.",
    "..yyyyyyoo..",
    "....yyoo....",
  ], { y: "#ffe23d", w: "#fffbd0", o: "#d9a21c", g: "#b6ff3d" }),
  grape: pixelArt([
    "......gg...",
    ".....g.....",
    "..vvvvvvv..",
    ".vwvdvwvdv.",
    ".vvvvvvvvv.",
    "..vdvwvdvv.",
    "..vvvvvvv..",
    "...vwvdv...",
    "...vvvvv...",
    "....vdv....",
    ".....v.....",
  ], { v: "#c58bff", w: "#f1e4ff", d: "#7d4dd6", g: "#b6ff3d" }),
  bell: pixelArt([
    ".....oo.....",
    "....yyyy....",
    "...yyyyyy...",
    "...ywyyyy...",
    "..yywyyyyy..",
    "..ywyyyyyy..",
    "..yyyyyyyy..",
    ".yyyyyyyyyy.",
    "yyyyyyyyyyyy",
    "oooooooooooo",
    ".....oo.....",
  ], { y: "#ffc53d", w: "#fff3c0", o: "#ff8a3d" }),
  diamond: pixelArt([
    "..cccccccc..",
    ".cwwcccccbc.",
    "cwccccccccbc",
    "cccccccccccc",
    ".ccccccccbc.",
    "..ccccccbc..",
    "...cccccc...",
    "....cccc....",
    ".....cc.....",
  ], { c: "#3df5ff", w: "#e6feff", b: "#1a9fc0" }),
  dragon: pixelArt([
    "..h.........",
    "..hh........",
    ".gggggg.....",
    "gggggwgg....",
    "ggggggggggg.",
    "ggggggggggg.",
    "ggggg.t.t.t.",
    ".ggggggggg..",
    ".gggggg.....",
    "..gggg......",
  ], { g: "#ff3dbb", h: "#ffe23d", w: "#ffffff", t: "#ffffff" }),
  // the little orange guy from the footer, making his >  < face
  wild: pixelArt([
    ".............",
    "..ccccccccc..",
    "..cecccccec..",
    "ccccecccecccc",
    "ccceccccceccc",
    "..ccccccccc..",
    "..ccccccccc..",
    "...c.c.c.c...",
    "...c.c.c.c...",
  ], { c: "#d97757", e: "#07060c" }),
};

function symbolHTML(id) {
  if (id === "seven") return "<span>7</span>";
  if (id === "bar") return "<span>BAR</span>";
  if (id === "wild") return `${ART.wild}<span class="s7-wild-tag">WILD</span>`;
  return ART[id];
}

// ============================================================
//  Reels
// ============================================================

function shuffle(list) {
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

const strips = Array.from({ length: 5 }, () =>
  shuffle(Object.entries(SYMBOLS).flatMap(([id, s]) => Array(s.weight).fill(id))));

let cellH = 88;

// each reel draws only the 5 cells around what's visible, moved with transforms
const reels = [...win.querySelectorAll(".s7-reel")].map((el, i) => {
  const cells = Array.from({ length: 5 }, () => {
    const c = document.createElement("div");
    c.className = "s7-cell";
    el.appendChild(c);
    return c;
  });
  return { el, i, cells, pos: Math.floor(Math.random() * strips[i].length), v: 0, phase: "stopped" };
});

function drawReel(r) {
  const strip = strips[r.i];
  const base = Math.floor(r.pos);
  r.cells.forEach((cell, k) => {
    const j = base - 1 + k;
    const idx = mod(j, strip.length);
    if (cell.idx !== idx) {
      cell.idx = idx;
      cell.dataset.sym = strip[idx];
      cell.innerHTML = `<div class="s7-sym s7-${strip[idx]}">${symbolHTML(strip[idx])}</div>`;
    }
    cell.style.transform = `translateY(${(j - r.pos) * cellH}px)`;
  });
}

// once a reel has stopped, row 0–2 is always cell 1–3
const cellAt = (reel, row) => reels[reel].cells[row + 1];

function measure() {
  cellH = reels[0].el.clientHeight / 3;
  reels.forEach(drawReel);
}

function gridAt(stops) {
  return stops.map((s, r) => [0, 1, 2].map((row) => strips[r][(s + row) % strips[r].length]));
}

function evaluate(grid, bet, bonus = 1) {
  const lineBet = (bet / LINES.length) * bonus;
  const wins = [];
  LINES.forEach((rows, line) => {
    const syms = rows.map((row, r) => grid[r][row]);
    let lead = 0;
    while (lead < 5 && syms[lead] === "wild") lead++;
    let best = null;
    if (lead >= 3) best = { sym: "wild", count: lead, mult: SYMBOLS.wild.pays[lead] };
    if (lead < 5) {
      // wilds count as whatever comes first after them
      const sym = syms[lead];
      let count = lead;
      while (count < 5 && (syms[count] === sym || syms[count] === "wild")) count++;
      const mult = SYMBOLS[sym].pays[count] || 0;
      if (mult && (!best || mult > best.mult)) best = { sym, count, mult };
    }
    if (best) wins.push({ line, ...best, amount: best.mult * lineBet, cells: rows.slice(0, best.count).map((row, r) => [r, row]) });
  });
  const total = wins.reduce((sum, w) => sum + w.amount, 0);
  const jackpot = wins.some((w) => w.sym === "seven" && w.count === 5);
  const x = total / bet;
  let tier = 0;
  if (total) TIERS.forEach((t, i) => { if (i && x >= t.min) tier = i; });
  if (jackpot) tier = 6;
  // two 7s (or wilds) to start a line, then nothing: so close
  const near = !total && LINES.some((rows) => {
    const two = [grid[0][rows[0]], grid[1][rows[1]]];
    return two.every((s) => s === "seven" || s === "wild") && two.includes("seven");
  });
  return { wins, total, tier, jackpot, near };
}

// a reel spins longer when every reel before it shows a 7 or a wild (and at least two 7s)
function teasePlan(grid) {
  return grid.map((_, k) => {
    if (k < 2) return false;
    const before = grid.slice(0, k);
    return before.every((col) => col.some((s) => s === "seven" || s === "wild"))
      && before.flat().filter((s) => s === "seven").length >= 2;
  });
}

// ============================================================
//  Money
// ============================================================

const saved = store.get("slots777", {}) || {};
const stats = Object.assign({ spins: 0, wins: 0, won: 0, biggest: 0, booms: 0, repairs: 0, bought: 0, buys: 0, streak: 0 }, saved.stats);
let balance = Number.isFinite(saved.balance) ? saved.balance : START_BALANCE;
let betIdx = Math.max(0, BETS.indexOf(saved.bet));
let shown = balance;
let tween = null;
let streak = 0;

function save() {
  store.set("slots777", { balance, bet: BETS[betIdx], stats });
}

// the number on the balance rolls towards the real one
function rollBalance(ms) {
  tween = { from: shown, to: balance, start: performance.now(), ms: Math.max(1, ms) };
  moneyBtn.classList.toggle("empty", balance < BETS[0]);
  moneyBtn.setAttribute("aria-label", `Balance: ${fmt(balance)} coins. Tap to buy ${fmt(BUY_AMOUNT)} more for free.`);
  wake();
}
function updateMoney(now) {
  if (!tween) return false;
  const t = clamp((now - tween.start) / tween.ms, 0, 1);
  shown = tween.from + (tween.to - tween.from) * easeOutCubic(t);
  balanceEl.textContent = fmt(shown);
  if (t >= 1) tween = null;
  return true;
}

moneyBtn.addEventListener("click", (e) => {
  stats.buys++;
  stats.bought += BUY_AMOUNT;
  balance += BUY_AMOUNT;
  save();
  rollBalance(900);
  renderStats();
  play("buy");
  // coins pour in from above the button
  const r = moneyBtn.getBoundingClientRect();
  const x = e.clientX || r.left + r.width / 2;
  coinsToBalance(x, r.top - 140, 14, 70);
  const line = stats.buys <= RECEIPTS.length ? RECEIPTS[stats.buys - 1] : pick(RECEIPTS.slice(3));
  toast(`${line} · <b>+${fmt(BUY_AMOUNT)}</b> coins · charged <b>$0.00</b>`);
  if (state === "idle" && balance >= BETS[betIdx]) say("topped up. go get 'em", "win");
});

function setBet(i) {
  betIdx = clamp(i, 0, BETS.length - 1);
  betEl.textContent = fmt(BETS[betIdx]);
  $("betDown").disabled = betIdx === 0;
  $("betUp").disabled = betIdx === BETS.length - 1;
  renderPaytable();
  save();
}
$("betDown").addEventListener("click", () => { setBet(betIdx - 1); play("press"); });
$("betUp").addEventListener("click", () => { setBet(betIdx + 1); play("press"); });

function broke() {
  // drop the bet to whatever is still affordable, if anything is
  const fits = BETS.filter((b) => b <= balance);
  if (fits.length) {
    setBet(BETS.indexOf(fits[fits.length - 1]));
    toast(`low on coins · bet lowered to <b>${fmt(BETS[betIdx])}</b>`);
    return startSpin();
  }
  setAuto(false);
  play("buzz");
  bump(moneyBtn, "nag");
  say("out of coins · tap your balance to buy more (it's free)", "warn");
}

// ============================================================
//  Heat
// ============================================================

let heat = 0;
let heatStage = 0;
let lastPress = -1e9;
let litSegs = -1;
let smokeAcc = 0;
let popAcc = 0;

const stageAt = (h) => HEAT_STAGES.reduce((found, s, i) => (h >= s.from ? i : found), 0);

// each segment takes the colour of the stage it sits in, so you can see where the zones start
heatBar.innerHTML = Array.from({ length: 24 }, (_, i) => `<i style="--seg: ${HEAT_STAGES[stageAt(((i + 0.5) / 24) * 100)].color}"></i>`).join("");
const segs = [...heatBar.children];

const vents = [...cabinet.querySelectorAll(".s7-vent")];

function addHeat(now) {
  const gap = now - lastPress;
  lastPress = now;
  const mash = clamp((MASH_WINDOW - gap) / (MASH_WINDOW - 150), 0, 1);
  heat = Math.min(100, heat + Math.min(HEAT_PER_PRESS + HEAT_PER_MASH * mash, (HEAT_MAX_RATE * gap) / 1000));
  showHeat();
  wake();
}

function showHeat() {
  const lit = Math.round((heat / 100) * segs.length);
  if (lit !== litSegs) {
    litSegs = lit;
    segs.forEach((s, i) => s.classList.toggle("on", i < lit));
    heatBar.setAttribute("aria-valuenow", Math.round(heat));
  }
  tempEl.textContent = `${Math.round(20 + heat * 9.8)}°C`;

  const stage = state === "broken" ? 0 : stageAt(heat);
  if (stage === heatStage) return;
  const hotter = stage > heatStage;
  heatStage = stage;
  const { bonus, name } = HEAT_STAGES[stage];
  cabinet.classList.toggle("heat-warm", stage === 1);
  cabinet.classList.toggle("heat-hot", stage === 2);
  cabinet.classList.toggle("heat-crit", stage >= 3);
  cabinet.classList.toggle("heat-melt", stage === 4);
  heatStageEl.textContent = name;
  bonusEl.textContent = `×${bonus}`;
  bonusEl.setAttribute("aria-label", `Wins pay ${bonus} times`);
  bump(bonusEl);
  setSiren(stage >= 3);
  if (!hotter) return;
  if (stage === 1) say("warming up · wins pay ×2", "warn");
  if (stage === 2) {
    play("warn");
    say("⚠ running hot · wins pay ×3", "warn");
  }
  if (stage === 3) say("!! critical · wins pay ×5 · careful !!", "crit");
  if (stage === 4) say("☢ meltdown · ×10 · one more and it blows", "crit");
}

// steam, smoke, sparks and little pops, getting worse the hotter it runs
function updateHeat(now, dt) {
  if (state === "broken") return updateBroken(now, dt);
  if (heat <= 0) return false;
  if (now - lastPress > 500) heat = Math.max(0, heat - COOL_RATE * dt);
  showHeat();
  if (heatStage >= 1) {
    smokeAcc += dt;
    if (smokeAcc > [0, 0.5, 0.2, 0.1, 0.06][heatStage]) {
      smokeAcc = 0;
      const v = pick(vents).getBoundingClientRect();
      puffSmoke(rand(v.left, v.right), v.top, heatStage >= 2);
      if (heatStage >= 2 && Math.random() < 0.45) edgeSparks();
      if (heatStage >= 2 && Math.random() < 0.15) play("hiss");
    }
  }
  if (heatStage >= 3) {
    popAcc += dt;
    if (popAcc > (heatStage === 4 ? 0.22 : 0.4)) {
      popAcc = 0;
      const p = edgePoint();
      blast(p.x, p.y, 0.3);
      play("pop");
      shake(0.12);
    }
  }
  return true;
}

function edgePoint() {
  const r = cabinet.getBoundingClientRect();
  const side = Math.floor(Math.random() * 4);
  const u = Math.random();
  if (side === 0) return { x: r.left + u * r.width, y: r.top };
  if (side === 1) return { x: r.right, y: r.top + u * r.height };
  if (side === 2) return { x: r.left + u * r.width, y: r.bottom };
  return { x: r.left, y: r.top + u * r.height };
}

function edgeSparks() {
  const p = edgePoint();
  sparks(p.x, p.y, pick(["#ffd23d", "#ff8a3d", "#ffffff"]), 8, 320, 900);
}

// ============================================================
//  KABOOM
// ============================================================

let brokenAt = 0;
let lastCount = 0;

function explode() {
  const now = performance.now();
  // a spin that was still going is lost, and the repairs aren't free
  const bill = Math.min(balance, REPAIR_BILL * BETS[betIdx]);
  balance -= bill;
  rollBalance(900);
  clearWin();
  setAuto(false);
  stats.booms++;
  stats.repairs += bill;
  save();
  renderStats();

  state = "broken";
  brokenAt = now;
  lastCount = 0;
  heat = 100;
  showHeat();
  heatStageEl.textContent = "fried";
  cabinet.classList.remove("s7-spinning", "s7-win", "s7-party");
  cabinet.classList.add("s7-broken");
  spinLabel.textContent = "BROKEN";
  makeCracks();
  // a few sign letters survive and flicker
  const letters = [...$("sign").children];
  letters.forEach((l) => l.classList.toggle("alive", Math.random() < 0.3));
  // the reels jam where they are and the symbols get knocked loose
  reels.forEach((r) => {
    r.phase = "stopped";
    r.pos = mod(Math.round(r.pos), strips[r.i].length);
    r.el.classList.remove("s7-fast", "s7-tease");
    drawReel(r);
    r.cells.forEach((c) => {
      const sym = c.firstElementChild;
      if (sym) sym.style.transform = `translate(${rand(-10, 10)}px, ${rand(6, 30)}px) rotate(${rand(-45, 45)}deg)`;
    });
  });

  play("boom");
  flash("#ffffff", 0.9);
  shake(1);
  say(bill ? `💥 ${pick(BOOM_LINES)} · repairs −${fmt(bill)}` : `💥 ${pick(BOOM_LINES)}`, "broken");
  if (bill) {
    const m = center(moneyBtn);
    setTimeout(() => popText(m.x, m.y - 20, `−${fmt(bill)} repairs`, "#ff3d3d", true), 500);
  }

  const r = cabinet.getBoundingClientRect();
  const x = r.left + r.width / 2, y = r.top + r.height * 0.4;
  blast(x, y, 2.6);
  ring(x, y, "#ffffff", Math.max(r.width, r.height), 10, 0.7);
  ring(x, y, "#ff8a3d", Math.max(r.width, r.height) * 1.3, 8, 0.9, 0.1);
  // shards of neon glass and dark metal
  for (let i = 0; i < n(46); i++) {
    const a = rand(0, Math.PI * 2), v = rand(250, 1000);
    const glass = Math.random() < 0.55;
    add({
      type: "debris", x: x + rand(-r.width / 3, r.width / 3), y: y + rand(-r.height / 4, r.height / 4),
      vx: Math.cos(a) * v, vy: Math.sin(a) * v - 250, g: 1400, drag: 0.5, life: rand(1.6, 2.8),
      size: rand(8, 22), vr: rand(-14, 14), rot: rand(0, 6),
      color: glass ? rgba(pick(NEON), 0.75) : pick(["#2a2340", "#3a3150", "#1a1626"]), edge: glass ? "#ffffff" : null,
    });
  }
  coinBurst(x, y, 28);
  // a couple of smaller bangs right after the big one
  [220, 480, 800].forEach((ms) => setTimeout(() => {
    if (state !== "broken") return;
    blast(x + rand(-r.width / 2, r.width / 2), y + rand(-r.height / 3, r.height / 3), rand(0.6, 1));
    play("pop");
    shake(0.3);
  }, ms));
  // and then it smoulders
  emit(70, BROKEN_FOR - 800, () => {
    const c = cabinet.getBoundingClientRect();
    puffSmoke(rand(c.left + 20, c.right - 20), c.top + rand(0, c.height * 0.5), true);
  }, "broken");

  if (stats.booms === 1) setTimeout(() => toast("achievement unlocked: <b>broke the machine</b>"), 900);
  wake();
}

function updateBroken(now, dt) {
  const t = (now - brokenAt) / BROKEN_FOR;
  heat = Math.max(20, 100 - 80 * t);
  showHeat();
  const left = Math.ceil((BROKEN_FOR - (now - brokenAt)) / 1000);
  if (left !== lastCount && now - brokenAt > 1600) {
    lastCount = left;
    say(`err 0xB00M · cooling down… ${Math.max(1, left)}`, "broken");
  }
  if (Math.random() < dt * 1.6) {
    edgeSparks();
    play("crackle");
  }
  if (t >= 1) reboot();
  return true;
}

function makeCracks() {
  const w = win.clientWidth, h = win.clientHeight;
  const cx = rand(w * 0.3, w * 0.7), cy = rand(h * 0.3, h * 0.7);
  let d = "";
  for (let i = 0; i < 10; i++) {
    let a = (i / 10) * Math.PI * 2 + rand(-0.3, 0.3), x = cx, y = cy;
    const step = (rand(0.4, 1) * Math.max(w, h) * 0.75) / 6;
    d += `M${cx.toFixed(1)} ${cy.toFixed(1)}`;
    for (let s = 0; s < 6; s++) {
      a += rand(-0.5, 0.5);
      x += Math.cos(a) * step;
      y += Math.sin(a) * step;
      d += `L${x.toFixed(1)} ${y.toFixed(1)}`;
    }
  }
  // the ring of short cracks round the impact
  for (let i = 0; i < 12; i++) {
    const a = rand(0, Math.PI * 2), r = rand(24, 50);
    d += `M${(cx + Math.cos(a) * r).toFixed(1)} ${(cy + Math.sin(a) * r).toFixed(1)}L${(cx + Math.cos(a + 0.5) * r * 1.1).toFixed(1)} ${(cy + Math.sin(a + 0.5) * r * 1.1).toFixed(1)}`;
  }
  cracks.setAttribute("viewBox", `0 0 ${w} ${h}`);
  cracks.innerHTML = `<path d="${d}"/><circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${rand(10, 16).toFixed(1)}"/>`;
}

function reboot() {
  state = "booting";
  stopEmitters("broken");
  heat = 20;
  heatStageEl.textContent = "cool";
  cabinet.classList.remove("s7-broken");
  cabinet.classList.add("s7-booting");
  cracks.innerHTML = "";
  reels.forEach((r) => {
    r.cells.forEach((c) => { c.idx = -1; });
    drawReel(r);
  });
  showTapes();
  play("boot");
  say("rebooting…", "spin");
  spinLabel.textContent = "BOOTING";
  setTimeout(() => {
    cabinet.classList.remove("s7-booting");
    spinLabel.textContent = "SPIN";
    state = "idle";
    say("boot ok ✓ · try not to do that again", "win");
  }, 1300);
}

function showTapes() {
  $("tapes").innerHTML = TAPES.slice(0, stats.booms)
    .map((t) => `<span class="s7-tape" style="${t.css}; --rot: ${t.rot}deg; transform: rotate(${t.rot}deg)">${t.text}</span>`)
    .join("");
}

// ============================================================
//  Spinning
// ============================================================

let state = "idle"; // idle | spinning | showing | broken | booting
let spin = null;
let celebration = null;
let counter = null;
let tickAcc = 0;
let rigNext = null;
let timers = [];

function later(ms, fn) {
  timers.push(setTimeout(fn, ms));
}

function clearWin() {
  timers.forEach(clearTimeout);
  timers = [];
  stopEmitters("win");
  paylines.innerHTML = "";
  win.querySelectorAll(".s7-stamp").forEach((s) => s.remove());
  reels.forEach((r) => r.cells.forEach((c) => c.classList.remove("s7-hit", "s7-near", "s7-landed")));
  banner.className = "s7-banner";
  cabinet.classList.remove("s7-win", "s7-party");
  celebration = null;
  counter = null;
}

function randomStops() {
  return strips.map((s) => Math.floor(Math.random() * s.length));
}

function startSpin() {
  const bet = BETS[betIdx];
  if (balance < bet) return broke();
  clearWin();
  balance -= bet;
  stats.spins++;
  save();
  rollBalance(250);

  // the heat bonus is locked in when the spin starts
  const bonus = HEAT_STAGES[heatStage].bonus;
  const stops = rigNext ? rigged(rigNext, bonus) : randomStops();
  if (rigNext) showRig(null);
  const grid = gridAt(stops);
  const tease = teasePlan(grid);
  const now = performance.now();
  spin = { bet, bonus, stops, grid, tease, res: evaluate(grid, bet, bonus), slammed: false, teased: tease.some(Boolean) };

  let at = now + FIRST_STOP;
  reels.forEach((r, i) => {
    if (i) at += STOP_GAP + (tease[i] ? TEASE_TIME : 0);
    r.phase = "windup";
    r.t0 = now;
    r.p0 = r.pos;
    r.v = 0;
    r.vmax = SPIN_SPEED;
    r.stopAt = at;
    r.el.classList.remove("s7-tease");
  });
  state = "spinning";
  cabinet.classList.add("s7-spinning");
  say(bonus > 1 ? `${pick(SPIN_LINES)} ×${bonus}` : pick(SPIN_LINES), "spin");
  play("spin");
  wake();
}

// pressing again mid-spin stops every reel right away
function slam() {
  spin.slammed = true;
  const now = performance.now();
  let k = 0;
  reels.forEach((r) => {
    if (r.phase !== "windup" && r.phase !== "spin") return;
    r.phase = "spin";
    r.v = r.vmax;
    r.stopAt = now + k++ * 45;
    r.el.classList.remove("s7-tease");
  });
}

function updateReels(now, dt) {
  let moving = false;
  reels.forEach((r) => {
    if (r.phase === "stopped") return;
    moving = true;
    if (r.phase === "windup") {
      // a little kick upwards before it drops
      const t = (now - r.t0) / 120;
      if (t < 1) r.pos = r.p0 + 0.28 * Math.sin((t * Math.PI) / 2);
      else r.phase = "spin";
    }
    if (r.phase === "spin") {
      r.v = Math.min(r.vmax, r.v + 90 * dt);
      r.pos -= r.v * dt;
      if (r.pos < 0) r.pos += strips[r.i].length;
      r.el.classList.toggle("s7-fast", r.v > 12);
      if (now >= r.stopAt && r.v >= r.vmax * 0.6) beginStop(r, now);
    }
    if (r.phase === "stopping") {
      const u = Math.min(1, (now - r.s0) / r.sDur);
      r.pos = r.sFrom - r.sDist * easeOutBack(u);
      if (u > 0.3) r.el.classList.remove("s7-fast");
      if (u >= 1) {
        r.pos = spin.stops[r.i];
        r.phase = "stopped";
        drawReel(r);
        landed(r);
        return;
      }
    }
    drawReel(r);
  });
  if (moving) {
    tickAcc += dt;
    if (tickAcc > 0.06) {
      tickAcc = 0;
      play("tick");
    }
  }
  return moving;
}

function beginStop(r, now) {
  // The reel is a blur at this point, so it quietly jumps to 3 symbols
  // above where it has to land, then eases in with a little bounce.
  r.pos = spin.stops[r.i] + 3 + (r.pos % 1);
  r.sFrom = r.pos;
  r.sDist = r.pos - spin.stops[r.i];
  r.s0 = now;
  r.sDur = Math.max(160, ((4.3 * r.sDist) / r.v) * 1000);
  r.phase = "stopping";
}

function landed(r) {
  play("land", r.i);
  bump(r.el, "s7-thud");
  r.el.classList.remove("s7-tease");
  const col = spin.grid[r.i];
  col.forEach((s, row) => {
    if (s === "seven" || s === "wild") bump(cellAt(r.i, row), "s7-landed");
  });
  if (col.includes("seven")) play("clink");
  if (col.includes("wild")) play("boing");
  if (r.i === 4) return finishSpin();
  // the next reel teases if it could still make a line of 7s
  const next = r.i + 1;
  if (spin.tease[next] && !spin.slammed && reels[next].phase !== "stopped") {
    reels.slice(next).forEach((x) => { x.vmax = SPIN_SPEED * 1.35; });
    reels[next].el.classList.add("s7-tease");
    play("tease", Math.max(0.3, (reels[next].stopAt - performance.now() + 500) / 1000));
    say(next >= 4 ? "!!! …" : "ooh…", "near");
  }
}

function finishSpin() {
  const { res } = spin;
  cabinet.classList.remove("s7-spinning");
  state = "idle";
  if (res.total) {
    balance += res.total;
    stats.wins++;
    stats.won += res.total;
    stats.biggest = Math.max(stats.biggest, res.total);
    streak++;
    stats.streak = Math.max(stats.streak, streak);
  } else {
    streak = 0;
  }
  save();
  renderStats();
  present(res);
}

// ============================================================
//  Win effects, by tier
// ============================================================

const LINE_GAP = 160;

function present(res) {
  const { tier, wins, total } = res;
  if (!tier) {
    if (res.near || spin.teased) nearMiss();
    else say(pick(LOSE_LINES), "lose");
    rollBalance(200);
    return queueAuto(450);
  }

  // every winning line, one after another, each a note higher
  wins.forEach((w, i) => later(i * LINE_GAP, () => showLine(w, i, tier)));
  const linesDone = wins.length * LINE_GAP;
  const sum = spin.bonus > 1 ? `+${fmt(total)} (×${spin.bonus})` : `+${fmt(total)}`;
  const mid = center(win);

  if (spin.bonus > 1) later(linesDone, () => {
    const b = center(bonusEl);
    popText(b.x, b.y - 24, `×${spin.bonus} heat bonus`, HEAT_STAGES[stageAt(heat)].color, true);
    bump(bonusEl);
  });

  if (streak >= 3) later(linesDone + 200, () => {
    const c = center(led);
    popText(c.x, c.y - 30, `🔥 ${streak} in a row`, "#ff8a3d", true);
  });

  if (tier === 1) {
    say(`${pick(TINY_LINES)} ${sum}`, "win");
    rollBalance(700);
    later(linesDone, () => coinsToBalance(mid.x, mid.y, 3, 40));
    flashBulbs(900);
    return queueAuto(900);
  }

  if (tier === 2) {
    say(`${pick(SMALL_LINES)} ${sum}`, "win");
    rollBalance(1000);
    later(linesDone, () => {
      stamp("WIN!", "#b6ff3d", true);
      coinsToBalance(mid.x, mid.y, 8, 60);
      sparkleFrame(10);
    });
    flashBulbs(1500);
    return queueAuto(1300);
  }

  if (tier === 3) {
    say(`${pick(NICE_SHOUTS)} ${sum}`, "big");
    rollBalance(1400);
    later(linesDone, () => {
      stamp(pick(NICE_SHOUTS), "#ff3dbb");
      play("fanfare", 3);
      shake(0.25);
      ring(mid.x, mid.y, "#ff3dbb", win.clientWidth * 0.7, 6, 0.7);
      ring(mid.x, mid.y, "#3df5ff", win.clientWidth * 0.5, 4, 0.6, 0.12);
      const r = win.getBoundingClientRect();
      coinBurst(mid.x, r.bottom - 10, 26, true);
      later(500, () => coinsToBalance(mid.x, mid.y, 12, 80));
      sparkleFrame(16);
    });
    cabinet.classList.add("s7-party");
    later(2200, () => cabinet.classList.remove("s7-party"));
    return queueAuto(2000);
  }

  // the big ones hold the machine until the count-up is done (a press skips it)
  state = "showing";
  celebration = { skipped: false };
  later(linesDone + 150, () => bigWin(res));
}

function showLine(w, i, tier) {
  const color = LINE_COLORS[w.line];
  drawPayline(w.line, color);
  w.cells.forEach(([r, row], k) => {
    const cell = cellAt(r, row);
    cell.classList.add("s7-hit");
    cell.style.setProperty("--hit", color);
    later(k * 60, () => {
      const c = center(cell);
      HIT_FX[w.sym](c.x, c.y);
    });
  });
  play("note", i + (tier >= 3 ? 3 : 0));
  const last = center(cellAt(...w.cells[w.cells.length - 1]));
  popText(last.x, last.y - 10, `+${fmt(w.amount)}`, color, tier >= 3);
}

function drawPayline(line, color) {
  const pts = LINES[line].map((row, r) => {
    const el = reels[r].el;
    return [el.offsetLeft + el.offsetWidth / 2, el.offsetTop + (row + 0.5) * cellH];
  });
  const w = win.clientWidth;
  const d = `M0 ${pts[0][1]}${pts.map(([x, y]) => `L${x} ${y}`).join("")}L${w} ${pts[4][1]}`;
  paylines.setAttribute("viewBox", `0 0 ${w} ${win.clientHeight}`);
  paylines.insertAdjacentHTML("beforeend", `<path d="${d}" pathLength="1" stroke="${color}" style="color: ${color}"/>`);
}

function flashBulbs(ms) {
  cabinet.classList.add("s7-win");
  later(ms, () => cabinet.classList.remove("s7-win"));
}

// little stars twinkling round the edge of the glass
function sparkleFrame(count) {
  const r = win.getBoundingClientRect();
  for (let i = 0; i < n(count); i++) {
    const p = Math.random() < 0.5
      ? { x: rand(r.left, r.right), y: Math.random() < 0.5 ? r.top : r.bottom }
      : { x: Math.random() < 0.5 ? r.left : r.right, y: rand(r.top, r.bottom) };
    add({ type: "glint", ...p, size: rand(10, 18), life: rand(0.5, 0.9), age: -rand(0, 0.5), color: pick(["#ffffff", "#ffe23d", "#3df5ff"]) });
  }
}

function nearMiss() {
  say(pick(NEAR_LINES), "near");
  play("near");
  reels.forEach((r, i) => spin.grid[i].forEach((s, row) => {
    if (s === "seven") cellAt(i, row).classList.add("s7-near");
  }));
  shake(0.08);
  const r = reels[4].el.getBoundingClientRect();
  later(250, () => puffSmoke(r.left + r.width / 2, r.top + r.height / 2, false, 3));
}

// BIG WIN, MEGA WIN, JACKPOT: a banner with the amount counting up
function bigWin(res) {
  const info = TIERS[res.tier];
  const tier = res.tier;
  banner.className = `s7-banner on ${info.name}`;
  bannerTitle.textContent = tier === 6 && !res.jackpot ? "ULTRA WIN" : info.banner;
  bannerAmount.textContent = "0";
  bannerBonus.textContent = spin.bonus > 1 ? `×${spin.bonus} heat bonus` : "";
  say(`${bannerTitle.textContent} +${fmt(res.total)}`, "big");
  counter = { start: performance.now() - (celebration.skipped ? info.count : 0), ms: info.count, to: res.total, lastTick: 0, done: () => bigWinDone(res) };
  rollBalance(info.count);
  cabinet.classList.add("s7-party");
  play("fanfare", tier);
  if (tier === 6) play("bells");

  emit([0, 0, 0, 0, 70, 40, 20][tier], info.count, rainCoin, "win");
  const rockets = [0, 0, 0, 0, 4, 10, 18][tier];
  for (let i = 0; i < rockets; i++) later((i * info.count) / rockets + rand(0, 250), () => rocket(rand(W * 0.1, W * 0.9), pick(NEON)));
  shake([0, 0, 0, 0, 0.35, 0.55, 0.8][tier]);
  if (tier >= 5) flash(tier === 6 ? "#ffd23d" : "#ff3dbb", tier === 6 ? 0.55 : 0.3);
  if (tier === 6) [0, 1500, 3000].forEach((ms) => later(ms, () => { confettiCannon(true); confettiCannon(false); }));
  const mid = center(win);
  ring(mid.x, mid.y, "#ffe23d", W * 0.6, 8, 0.9);
  wake();
}

function bigWinDone(res) {
  bannerAmount.textContent = fmt(res.total);
  play("stamp");
  shake(0.3);
  stopEmitters("win");
  const c = center(bannerAmount);
  coinsToBalance(c.x, c.y, 20, 50);
  sparks(c.x, c.y, "#ffe23d", 40, 600, 400);
  later(1600, endCelebration);
}

function endCelebration() {
  banner.classList.remove("on");
  cabinet.classList.remove("s7-party");
  stopEmitters("win");
  celebration = null;
  if (state === "showing") state = "idle";
  queueAuto(500);
}

function updateCounter(now) {
  if (!counter) return false;
  const t = clamp((now - counter.start) / counter.ms, 0, 1);
  bannerAmount.textContent = fmt(counter.to * (1 - (1 - t) ** 2));
  if (t < 1 && now - counter.lastTick > 70) {
    counter.lastTick = now;
    play("count", t);
  }
  if (t >= 1) {
    const done = counter.done;
    counter = null;
    done();
  }
  return true;
}

// ============================================================
//  The spin button (and space bar)
// ============================================================

let autoOn = false;
let autoTimer = 0;

function setAuto(on) {
  autoOn = on;
  autoBtn.classList.toggle("on", on);
  autoBtn.setAttribute("aria-pressed", on);
  if (!on) clearTimeout(autoTimer);
}
function queueAuto(ms) {
  if (!autoOn) return;
  clearTimeout(autoTimer);
  autoTimer = setTimeout(() => { if (autoOn && state === "idle") startSpin(); }, ms);
}
autoBtn.addEventListener("click", () => {
  setAuto(!autoOn);
  play("press");
  if (autoOn && state === "idle") startSpin();
});

function press() {
  const now = performance.now();
  if (state === "broken" || state === "booting") return kick();
  addHeat(now);
  if (heat >= 100) return explode();
  clearTimeout(autoTimer);
  if (state === "spinning") return slam();
  if (state === "showing") {
    // first press skips the count-up, the next one spins again
    if (celebration && !celebration.skipped) {
      celebration.skipped = true;
      if (counter) counter.start = now - counter.ms;
      return;
    }
    endCelebration();
  }
  startSpin();
}

function kick() {
  play("clunk");
  shake(0.15);
  const c = center(spinBtn);
  sparks(c.x, c.y - 20, "#ffd23d", 10, 300, 900);
  popText(c.x + rand(-40, 40), c.y - 30, pick(KICK_WORDS), "#ff8a3d");
}

spinBtn.addEventListener("click", press);

document.addEventListener("keydown", (e) => {
  if (e.code !== "Space") return;
  const t = e.target;
  if (t !== spinBtn && t !== document.body && t.closest("button, a, input, textarea, select, summary")) return;
  e.preventDefault();
  press();
});
// stop the browser "clicking" a focused spin button on keyup too
document.addEventListener("keyup", (e) => {
  if (e.code === "Space" && e.target === spinBtn) e.preventDefault();
});

// ============================================================
//  Stats, paytable, ?rig
// ============================================================

function renderStats() {
  $("stats").innerHTML = [
    ["spins", fmt(stats.spins)],
    ["biggest win", fmt(stats.biggest)],
    ["total won", fmt(stats.won)],
    ["best streak", fmt(stats.streak)],
    ["explosions", `${fmt(stats.booms)}${stats.repairs ? ` <small class="bad">(−${fmt(stats.repairs)})</small>` : ""}`],
    ["coins bought", `${fmt(stats.bought)} <small>($0.00)</small>`],
  ].map(([k, v]) => `<span class="s7-chip">${k} <b>${v}</b></span>`).join("");
}

function renderPaytable() {
  const lineBet = BETS[betIdx] / LINES.length;
  $("pays").innerHTML = Object.entries(SYMBOLS).reverse().map(([id, s]) => `
    <div class="s7-pay">
      <div class="s7-sym s7-${id}">${symbolHTML(id)}</div>
      <div class="s7-pay-rows">${Object.entries(s.pays).reverse().map(([k, m]) => `${k}× <b>${fmt(m * lineBet)}</b>`).join("<br>")}</div>
    </div>`).join("");
}

$("lines").innerHTML = LINES.map((rows, i) => {
  const cells = [0, 1, 2].map((row) => rows.map((r) => `<i${r === row ? ' class="on"' : ""}></i>`).join("")).join("");
  return `<div class="s7-line"><div class="s7-line-grid" style="--c: ${LINE_COLORS[i]}">${cells}</div>line ${i + 1}</div>`;
}).join("");

// ?rig shows buttons that pick what the next spin lands on
function rigged(want, bonus) {
  if (want === "jackpot") {
    // a 7 on the middle row of every reel
    return strips.map((s) => {
      const sevens = s.map((id, i) => (id === "seven" ? i : -1)).filter((i) => i >= 0);
      return mod(pick(sevens) - 1, s.length);
    });
  }
  // (some tiers can't happen at a high heat bonus, so give up after a while)
  for (let i = 0; i < 100000; i++) {
    const stops = randomStops(), grid = gridAt(stops), res = evaluate(grid, 10, bonus);
    const ok = want === "near"
      ? !res.total && teasePlan(grid).some(Boolean)
      : TIERS[res.tier].name === want;
    if (ok) return stops;
  }
  return randomStops();
}

const rig = $("rig");
function showRig(want) {
  rigNext = want;
  rig.querySelectorAll("button").forEach((b) => b.classList.toggle("on", b.dataset.want === want));
}
if (new URLSearchParams(location.search).has("rig")) {
  rig.hidden = false;
  rig.innerHTML = `next spin: ${["tiny", "small", "nice", "big", "mega", "jackpot", "near"]
    .map((w) => `<button type="button" data-want="${w}">${w}</button>`).join("")}<button type="button" data-want="boom">boom now</button>`;
  rig.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    if (b.dataset.want === "boom") {
      if (state !== "broken" && state !== "booting") explode();
      return;
    }
    showRig(rigNext === b.dataset.want ? null : b.dataset.want);
  });
}

// ============================================================
//  Main loop: only runs while something is moving
// ============================================================

let raf = 0;
let lastFrame = 0;

function wake() {
  if (raf) return;
  lastFrame = performance.now();
  raf = requestAnimationFrame(frame);
}

function frame(now) {
  const dt = Math.min(0.05, (now - lastFrame) / 1000);
  lastFrame = now;
  let busy = updateReels(now, dt);
  busy = updateHeat(now, dt) || busy;
  busy = updateMoney(now) || busy;
  busy = updateCounter(now) || busy;
  busy = runEmitters(now, dt) || busy;
  busy = updateShake(dt) || busy;
  busy = drawParts(dt) || busy;
  raf = busy ? requestAnimationFrame(frame) : 0;
}

// --- start up ---
$("sign").innerHTML = [..."LUCKY 777"].map((ch) => `<span${ch === "7" ? ' class="seven"' : ""}>${ch === " " ? "&nbsp;" : ch}</span>`).join("");
cabinet.querySelectorAll(".s7-bulbs").forEach((row) => {
  row.innerHTML = Array.from({ length: 22 }, (_, i) => `<span class="s7-bulb" style="--i: ${i}"></span>`).join("");
});

resizeFx();
measure();
setBet(betIdx);
balanceEl.textContent = fmt(balance);
rollBalance(1);
renderStats();
showTapes();
if (balance < BETS[0]) say("out of coins · tap your balance to buy more (it's free)", "warn");

window.addEventListener("resize", () => {
  resizeFx();
  measure();
});

})();
