// ============================================================
//  EDIT ME — this is all the content on the site.
// ============================================================

const INTERESTS = [
  { emoji: "🎧", title: "Music",  color: "var(--blue-light)",   link: "music.html", blurb: "my current top 10 →" },
  { emoji: "💻", title: "Coding", color: "var(--orange)",       link: "coding.html", blurb: "my projects →" },
  { emoji: "🎮", title: "Gaming", color: "var(--orange-light)", link: "games.html", blurb: "fave games & steam →" },
  { emoji: "🖼️", title: "Gallery", color: "var(--blue-dark)", ink: "#eef6ff", link: "gallery.html", blurb: "images & nfts →" },
];

const STATUSES = [
  "vibing",
  "listening to music",
  "writing code w/ claude",
  "procrastinating",
  "probably gaming",
  "hi",
  "jorkin it a lil",
  "larping",
  "Studying",
];

const FACTS = [
  "My first website was literally just the word 'hi' ✌️",
  "Roblox, Crimson Desert and Marathon are my go-to games right now.",
  "Apple Music only. No Spotify in this house.",
  "I wiped my old website completely to start fresh with this one. (claude did that too 🫥)",
  "This site was built together with Claude.",
  "The little orange guy at the bottom of the page never stops walking.",
  "My Steam name is rderg. Add me!",
  "Currently studying Physics @ TUM"
];

const BURST_EMOJI = ["✨", "💙", "🧡", "😸", "🐲"];

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

// --- sticker board (each sticker opens its page) ---
const board = document.getElementById("board");
INTERESTS.forEach((item) => {
  const el = document.createElement("a");
  el.className = "sticker sticker-link";
  el.href = item.link;
  el.style.setProperty("--accent", item.color);
  if (item.ink) el.style.setProperty("--accent-ink", item.ink);
  el.style.setProperty("--rand", `${(Math.random() * 10 - 5).toFixed(1)}deg`);
  el.innerHTML = `
    <div class="sticker-inner">
      <div class="sticker-face sticker-front">
        <div class="sticker-emoji">${item.emoji}</div>
        <p class="sticker-title">${item.title}</p>
        <p class="sticker-sub">${item.blurb}</p>
      </div>
    </div>`;
  board.appendChild(el);
});

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
