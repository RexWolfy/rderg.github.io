// ============================================================
//  EDIT ME — your artworks and NFTs.
//
//  1. Drop the image into the "gallery" folder (png, jpg, gif, webp).
//  2. Add an entry below:
//       title   name of the piece
//       type    "art" or "nft"
//       image   path to the file, e.g. "gallery/my-drawing.png"
//               (leave it out and a placeholder tile shows instead)
//       note    optional line of text shown when someone opens it
//       link    optional — e.g. the NFT's marketplace page
//       pixel   true for pixel art, so it stays crisp instead of blurry
// ============================================================

const ITEMS = [
  { title: "#1918", type: "nft", image: "gallery/nft-1918.png", pixel: true },
  { title: "#2493", type: "nft", image: "gallery/nft-2493.png", pixel: true },
  { title: "#7579", type: "nft", image: "gallery/nft-7579.png", pixel: true },
  { title: "#7120", type: "nft", image: "gallery/nft-7120.png", pixel: true },
  { title: "#2820", type: "nft", image: "gallery/nft-2820.png", pixel: true },
  { title: "Specs", type: "nft", image: "gallery/nft-specs.png", pixel: true },
  { title: "#4487", type: "nft", image: "gallery/nft-4487.png", pixel: true },
];

// ============================================================

const PLACEHOLDER_COLORS = ["var(--blue-dark)", "var(--orange)", "var(--blue-light)", "var(--orange-light)"];

const grid = document.getElementById("galleryGrid");
const empty = document.getElementById("galleryEmpty");

function media(item, i) {
  if (item.image) return `<img src="${item.image}" alt="${item.title}" loading="lazy"${item.pixel ? ' class="pixel"' : ""}>`;
  return `<div class="placeholder" style="--accent: ${PLACEHOLDER_COLORS[i % PLACEHOLDER_COLORS.length]}">${item.emoji || "🖼️"}</div>`;
}

const tiles = ITEMS.map((item, i) => {
  const tile = document.createElement("button");
  tile.className = "art-tile";
  tile.dataset.type = item.type;
  tile.style.setProperty("--rand", `${(Math.random() * 4 - 2).toFixed(1)}deg`);
  tile.innerHTML = `
    ${media(item, i)}
    <span class="art-caption">
      <span>${item.title}</span>
      <span class="tag">${item.type === "nft" ? "nft" : "art"}</span>
    </span>`;
  tile.addEventListener("click", () => openLightbox(item, i));
  grid.appendChild(tile);
  return tile;
});

// --- filters ---
document.getElementById("filters").addEventListener("click", (e) => {
  const btn = e.target.closest(".filter");
  if (!btn) return;
  document.querySelectorAll(".filter").forEach((b) => b.classList.toggle("active", b === btn));
  const filter = btn.dataset.filter;
  let shown = 0;
  tiles.forEach((tile) => {
    const match = filter === "all" || tile.dataset.type === filter;
    tile.hidden = !match;
    if (match) shown++;
  });
  empty.hidden = shown > 0;
});
empty.hidden = ITEMS.length > 0;

// --- lightbox ---
const lightbox = document.getElementById("lightbox");
const link = document.getElementById("lightboxLink");

function openLightbox(item, i) {
  document.getElementById("lightboxMedia").innerHTML = media(item, i);
  const tag = document.getElementById("lightboxTag");
  tag.textContent = item.type === "nft" ? "nft" : "art";
  tag.classList.toggle("nft", item.type === "nft");
  document.getElementById("lightboxTitle").textContent = item.title;
  document.getElementById("lightboxNote").textContent = item.note || "";
  link.hidden = !item.link;
  if (item.link) link.href = item.link;
  lightbox.showModal();
}

document.getElementById("lightboxClose").addEventListener("click", () => lightbox.close());
lightbox.addEventListener("click", (e) => {
  if (e.target === lightbox) lightbox.close(); // click on the dark backdrop
});
