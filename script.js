// ============================================================
//  EDIT ME — this is all the content on the home page.
// ============================================================

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
  "feeding the dragons",
];

const FACTS = [
  "My first website was literally just the word 'hi'.",
  "Roblox, Crimson Desert and Marathon are my go-to games right now.",
  "Apple Music only. No Spotify in this house.",
  "I wiped my old website completely to start fresh with this one. (claude did that too)",
  "This site was built together with Claude.",
  "The little orange guy at the bottom of the page never stops walking.",
  "My Steam name is rderg. Add me!",
  "Currently studying Physics @ TUM",
  "There are ASCII dragons flying around the top of this page. Hover one.",
  "The slot machine is completely fair. Mostly.",
];

// Your current top 10 songs, #1 first.
//   title   song name
//   artist  who made it
const SONGS = [
  { title: "B2U", artist: "Dillon Francis & Marten Hørger" },
];

// Your coding projects.
//   name    project name
//   status  optional, e.g. "in progress", "done"
//   about   a sentence or two about it
//   tags    optional list of things it uses
//   link    optional website / GitHub link
const PROJECTS = [
  {
    name: "Minecraft server",
    status: "done",
    about: "A private Minecraft server for me and my friends. We got our own VPS, SSH'd into the Ubuntu box and set the whole thing up from the terminal like real hackers. (The AI did most of the typing. We did most of the panicking.)",
    tags: ["Minecraft", "VPS", "Ubuntu", "SSH"],
  },
  {
    name: "JXR to PNG converter",
    status: "done",
    about: "Turns .jxr images (the JPEG XR format Windows saves HDR screenshots in) into normal PNGs that literally anything can open. Because apparently nobody supports .jxr.",
    tags: ["JXR", "PNG"],
  },
];

// Your favourite games.
//   steamId  the number in the game's Steam store link, e.g.
//            store.steampowered.com/app/413150/  →  413150
//            Leave it out for games that aren't on Steam.
//   note     optional line about the game
const STEAM_PROFILE = "https://steamcommunity.com/id/rderg/";
const GAMES = [
  { title: "Roblox" },
  { title: "Crimson Desert", steamId: 3321460 },
  { title: "Marathon",       steamId: 3065800 },
];

// ============================================================
//  The fun stuff below — no need to touch it.
// ============================================================

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

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

// --- ticker (repeated so the loop is seamless) ---
const TICKER = [
  ["♫ MUSIC", "neon-c"], ["</> CODING", "neon-o"], ["[▶] GAMING", "neon-l"],
  ["Ξ RDERG.ETH", "neon-m"], ["★ 777 ★", "neon-m"], ["~~=> DRAGONS", "neon-c"],
];
const tickerItems = TICKER.map(([label, cls]) => `<span class="${cls}">${esc(label)}</span>`).join("");
document.getElementById("tickerTrack").innerHTML = tickerItems.repeat(4);

// --- collapsible lists ---
const pad = (n) => String(n).padStart(2, "0");

function musicBody() {
  const rows = SONGS.slice(0, 10).map((song, i) => `
    <li class="row">
      <span class="rank">${pad(i + 1)}</span>
      <span class="r-main"><span class="r-title">${esc(song.title)}</span><span class="r-sub">${esc(song.artist)}</span></span>
    </li>`);
  // until all 10 are filled in, one "coming soon" row stands in for the empty slots
  if (SONGS.length < 10) rows.push(`
    <li class="row soon">
      <span class="rank">${pad(SONGS.length + 1)}${SONGS.length < 9 ? "–10" : ""}</span>
      <span class="r-main"><span class="r-title">loading…</span><span class="r-sub">(i just haven't added them yet)</span></span>
    </li>`);
  return `<p class="acc-intro">what's on repeat right now. apple music only.</p><ol class="rows">${rows.join("")}</ol>`;
}

function codingBody() {
  const rows = PROJECTS.map((p, i) => `
    <li class="row">
      <span class="rank">${pad(i + 1)}</span>
      <span class="r-main">
        <span class="r-title">${esc(p.name)}</span>
        ${p.about ? `<p class="r-about">${esc(p.about)}</p>` : ""}
        ${p.tags ? `<span class="tags">${p.tags.map((t) => `<span>${esc(t)}</span>`).join("")}</span>` : ""}
      </span>
      ${p.link ? `<a class="ext" href="${esc(p.link)}">open ↗</a>` : ""}
      ${p.status ? `<span class="pill">${esc(p.status)}${p.status === "done" ? " ✓" : ""}</span>` : ""}
    </li>`);
  return `<p class="acc-intro">*vibe coding. i type what i want, claude types the code.</p><ul class="rows">${rows.join("")}</ul>`;
}

function gamesBody() {
  const rows = GAMES.map((g, i) => `
    <li class="row">
      <span class="rank">${pad(i + 1)}</span>
      <span class="r-main">
        <span class="r-title">${esc(g.title)}</span>
        ${g.note || !g.steamId ? `<span class="r-sub">${esc(g.note || "not on steam")}</span>` : ""}
      </span>
      ${g.steamId ? `<a class="ext" href="https://store.steampowered.com/app/${g.steamId}/">steam ↗</a>` : ""}
    </li>`);
  return `<p class="acc-intro">the ones i keep coming back to.</p><ol class="rows">${rows.join("")}</ol>
    <p class="acc-foot"><a href="${esc(STEAM_PROFILE)}">add me on steam ↗</a></p>`;
}

const LISTS = [
  { id: "music",  title: "Music",  glyph: "♫",           tint: "cyan",   count: "current top 10",             body: musicBody(),  open: true },
  { id: "coding", title: "Coding", glyph: "&lt;/&gt;",   tint: "orange", count: `${PROJECTS.length} projects`, body: codingBody() },
  { id: "games",  title: "Gaming", glyph: "[▶]",         tint: "lime",   count: `${GAMES.length} on rotation`, body: gamesBody() },
];

const listsEl = document.getElementById("lists");
listsEl.innerHTML = LISTS.map((l) => `
  <div class="acc ${l.tint}" id="list-${l.id}">
    <button class="acc-head" type="button" aria-expanded="false" aria-controls="panel-${l.id}">
      <span class="acc-glyph" aria-hidden="true">${l.glyph}</span>
      <span class="acc-title">${l.title}</span>
      <span class="acc-count">${l.count}</span>
      <span class="acc-sign" aria-hidden="true">+</span>
    </button>
    <div class="acc-body" id="panel-${l.id}" hidden>${l.body}</div>
  </div>`).join("");

function setOpen(acc, open) {
  acc.classList.toggle("open", open);
  acc.querySelector(".acc-head").setAttribute("aria-expanded", String(open));
  acc.querySelector(".acc-sign").textContent = open ? "−" : "+";
  acc.querySelector(".acc-body").hidden = !open;
}

LISTS.forEach((l) => {
  const acc = document.getElementById(`list-${l.id}`);
  if (l.open) setOpen(acc, true);
  acc.querySelector(".acc-head").addEventListener("click", () => setOpen(acc, !acc.classList.contains("open")));
});

// nav links open the list they jump to
document.querySelectorAll("[data-open]").forEach((link) => {
  link.addEventListener("click", () => setOpen(document.getElementById(`list-${link.dataset.open}`), true));
});

// --- random facts ---
const factEl = document.getElementById("fact");
let lastFact = -1;
document.getElementById("factBtn").addEventListener("click", () => {
  let i;
  do { i = Math.floor(Math.random() * FACTS.length); } while (i === lastFact && FACTS.length > 1);
  lastFact = i;
  factEl.textContent = FACTS[i];
  // two identical animations, swapped each time, so it replays on every press
  factEl.className = factEl.className === "pop-a" ? "pop-b" : "pop-a";
});

// --- copy the ENS name ---
const copyBtn = document.getElementById("copyEns");
const copyNote = document.getElementById("copyNote");
let copyTimer;
copyBtn.addEventListener("click", () => {
  const show = (label, note) => {
    copyBtn.textContent = label;
    copyNote.textContent = note;
    clearTimeout(copyTimer);
    copyTimer = setTimeout(() => { copyBtn.textContent = "copy"; copyNote.textContent = ""; }, 1600);
  };
  const failed = () => show("couldn't copy", "");
  try {
    navigator.clipboard.writeText("rderg.eth").then(() => show("copied ✓", "rderg.eth copied to clipboard"), failed);
  } catch (e) {
    failed();
  }
});
