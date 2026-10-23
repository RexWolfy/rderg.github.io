// ============================================================
//  EDIT ME — your Steam profile and favourite games.
//
//  steamId  the number in the game's Steam store link, e.g.
//           store.steampowered.com/app/413150/  →  413150
//           It pulls in the game's cover picture. Leave it out for
//           games that aren't on Steam and an emoji tile shows instead.
//  emoji    shown when there's no steamId
//  note     optional line about the game
//  hours    optional, e.g. "200+ hrs"
// ============================================================

const STEAM_PROFILE = "https://steamcommunity.com/id/rderg/";

const GAMES = [
  { title: "Roblox",         emoji: "🧱" },
  { title: "Crimson Desert", steamId: 3321460 },
  { title: "Marathon",       steamId: 3065800 },
];

// ============================================================

document.getElementById("steamLink").href = STEAM_PROFILE;

const COLORS = ["var(--blue-dark)", "var(--orange)", "var(--blue-light)", "var(--orange-light)"];
const grid = document.getElementById("gamesGrid");

GAMES.forEach((game, i) => {
  const card = document.createElement(game.steamId ? "a" : "div");
  card.className = "game-card";
  card.style.setProperty("--rand", `${(Math.random() * 4 - 2).toFixed(1)}deg`);
  if (game.steamId) {
    card.href = `https://store.steampowered.com/app/${game.steamId}/`;
    card.target = "_blank";
    card.rel = "noopener";
  }

  const placeholder = `<div class="placeholder game-cover" style="--accent: ${COLORS[i % COLORS.length]}">${game.emoji || "🎮"}</div>`;
  const cover = game.steamId
    ? `<img class="game-cover" src="https://cdn.cloudflare.steamstatic.com/steam/apps/${game.steamId}/header.jpg" alt="" loading="lazy">`
    : placeholder;

  card.innerHTML = `
    ${cover}
    <div class="game-info">
      <div class="game-title-row">
        <h2>${game.title}</h2>
        ${game.hours ? `<span class="tag">${game.hours}</span>` : ""}
      </div>
      ${game.note ? `<p>${game.note}</p>` : ""}
    </div>`;

  // If Steam doesn't have a picture, fall back to the emoji tile.
  const img = card.querySelector("img");
  if (img) img.addEventListener("error", () => { img.outerHTML = placeholder; });

  grid.appendChild(card);
});
