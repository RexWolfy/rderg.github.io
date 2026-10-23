// ============================================================
//  EDIT ME — this is all the content on the site.
// ============================================================

const INTERESTS = [
  // A sticker with `link` opens that page instead of flipping.
  { emoji: "🎧", title: "Music",  color: "var(--blue-light)",   link: "music.html", blurb: "my current top 10 →" },
  { emoji: "💻", title: "Coding", color: "var(--orange)",       link: "coding.html", blurb: "my projects →" },
  { emoji: "🎮", title: "Gaming", color: "var(--orange-light)", link: "games.html", blurb: "fave games & steam →" },
  { emoji: "🖼️", title: "Gallery", color: "var(--blue-dark)", ink: "#eef6ff", link: "gallery.html", blurb: "my art & nfts →" },
];

const STATUSES = [
  "vibing",
  "listening to music",
  "writing code",
  "procrastinating",
  "probably gaming",
];

const FACTS = [
  "My first website was literally just the word 'hi' ✌️",
  "This whole site's color scheme comes from my fursona.",
  "Roblox, Crimson Desert and Marathon are my go-to games right now.",
  "B2U by Dillon Francis & Marten Hørger is my #1 song at the moment.",
  "Me and my friends run our own Minecraft server on a VPS.",
  "I make art and NFTs. They live in the gallery.",
  "Apple Music only. No Spotify in this house.",
  "I wiped my old website completely to start fresh with this one.",
  "This site was built together with Claude.",
  "The little orange guy at the bottom of the page never stops walking.",
  "You can drag the stickers around. They don't snap back.",
  "My Steam name is rderg. Add me!",
];

const BURST_EMOJI = ["✨", "🎉", "⭐", "💥", "💙", "🧡", "✌️"];

// ============================================================
//  The fun stuff below — no need to touch it.
// ============================================================

const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

// --- bouncy name letters ---
const heroName = document.getElementById("heroName");
heroName.innerHTML = [...heroName.textContent]
  .map((ch) => `<span aria-hidden="true">${ch}</span>`)
  .join("");
heroName.addEventListener("click", (e) => {
  const letter = e.target.closest("span");
  if (!letter) return;
  letter.classList.remove("boing");
  void letter.offsetWidth; // restart the animation
  letter.classList.add("boing");
});

// --- rotating status ---
const rotator = document.getElementById("rotator");
let statusIndex = 0;
setInterval(() => {
  rotator.classList.add("out");
  setTimeout(() => {
    statusIndex = (statusIndex + 1) % STATUSES.length;
    rotator.textContent = STATUSES[statusIndex];
    rotator.classList.remove("out");
  }, 200);
}, 2200);

// --- ticker (doubled so the loop is seamless) ---
const tickerItems = INTERESTS
  .map((i) => `<span>${i.emoji} ${i.title.toUpperCase()}</span>`).join("");
document.getElementById("tickerTrack").innerHTML = tickerItems + tickerItems + tickerItems + tickerItems;

// --- sticker board ---
const board = document.getElementById("board");
INTERESTS.forEach((item) => {
  const el = document.createElement(item.link ? "a" : "div");
  el.className = "sticker";
  el.style.setProperty("--accent", item.color);
  if (item.ink) el.style.setProperty("--accent-ink", item.ink);
  el.style.setProperty("--rand", `${(Math.random() * 10 - 5).toFixed(1)}deg`);

  if (item.link) {
    el.href = item.link;
    el.draggable = false;
    el.classList.add("sticker-link");
    el.innerHTML = `
      <div class="sticker-inner">
        <div class="sticker-face sticker-front">
          <div class="sticker-emoji">${item.emoji}</div>
          <p class="sticker-title">${item.title}</p>
          <p class="sticker-sub">${item.blurb}</p>
        </div>
      </div>`;
  } else {
    el.tabIndex = 0;
    el.setAttribute("role", "button");
    el.setAttribute("aria-label", `${item.title} — flip for details`);
    el.innerHTML = `
      <div class="sticker-inner">
        <div class="sticker-face sticker-front">
          <div class="sticker-emoji">${item.emoji}</div>
          <p class="sticker-title">${item.title}</p>
        </div>
        <div class="sticker-face sticker-back">
          <h3>${item.emoji} ${item.title}</h3>
          <p>${item.blurb}</p>
        </div>
      </div>`;
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        el.classList.toggle("flipped");
      }
    });
  }
  board.appendChild(el);
  makeDraggable(el);
});

// Drag with a mouse; a click without moving flips the card (or opens its link).
function makeDraggable(el) {
  const canDrag = matchMedia("(pointer: fine)").matches;
  let start = null;
  let moved = false;
  let offset = { x: 0, y: 0 };

  el.addEventListener("pointerdown", (e) => {
    if (!canDrag) return;
    start = { x: e.clientX - offset.x, y: e.clientY - offset.y };
    moved = false;
    el.setPointerCapture(e.pointerId);
  });

  el.addEventListener("pointermove", (e) => {
    if (!start) return;
    const x = e.clientX - start.x;
    const y = e.clientY - start.y;
    if (!moved && Math.hypot(x - offset.x, y - offset.y) < 5) return;
    moved = true;
    el.classList.add("dragging");
    offset = { x, y };
    el.style.setProperty("--dx", `${x}px`);
    el.style.setProperty("--dy", `${y}px`);
  });

  el.addEventListener("pointerup", () => {
    start = null;
    el.classList.remove("dragging");
  });

  el.addEventListener("click", (e) => {
    if (moved) {
      moved = false;
      e.preventDefault();
      return;
    }
    if (!el.href) el.classList.toggle("flipped");
  });
}

// --- random facts ---
const factEl = document.getElementById("fact");
let lastFact = -1;
document.getElementById("factBtn").addEventListener("click", (e) => {
  let i;
  do { i = Math.floor(Math.random() * FACTS.length); } while (i === lastFact && FACTS.length > 1);
  lastFact = i;
  factEl.textContent = FACTS[i];
  factEl.classList.remove("pop");
  void factEl.offsetWidth;
  factEl.classList.add("pop");
  burst(e.clientX, e.clientY, 14);
});

// --- emoji bursts on click ---
function burst(x, y, count = 8) {
  if (reducedMotion) return;
  for (let i = 0; i < count; i++) {
    const p = document.createElement("span");
    p.className = "burst";
    p.textContent = BURST_EMOJI[Math.floor(Math.random() * BURST_EMOJI.length)];
    const angle = Math.random() * Math.PI * 2;
    const dist = 60 + Math.random() * 90;
    p.style.left = `${x - 11}px`;
    p.style.top = `${y - 11}px`;
    p.style.setProperty("--x", `${Math.cos(angle) * dist}px`);
    p.style.setProperty("--y", `${Math.sin(angle) * dist}px`);
    p.style.setProperty("--r", `${Math.random() * 720 - 360}deg`);
    document.body.appendChild(p);
    p.addEventListener("animationend", () => p.remove());
  }
}

document.addEventListener("click", (e) => {
  if (e.target.closest("button, a, .sticker, iframe")) return;
  burst(e.clientX, e.clientY);
});
