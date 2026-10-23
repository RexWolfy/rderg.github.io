// ============================================================
//  Shared by every page: the footer and the little orange guy.
//  Change the footer here once and it updates everywhere.
// ============================================================

(() => {

const GITHUB_URL = "https://github.com/RexWolfy/rderg.github.io";

// ============================================================

// --- the little orange guy (13 × 9 pixels) ---
function rect(x, y, w, h, cls = "") {
  return `<rect${cls ? ` class="${cls}"` : ""} x="${x}" y="${y}" width="${w}" height="${h}" />`;
}

function body(top, eyes) {
  return rect(2, top, 9, 6) + rect(0, top + 2, 2, 2) + rect(11, top + 2, 2, 2) + eyes;
}

// one walk frame: planted feet reach the ground (y = 9), lifted ones stop a pixel short
function walkFrame(n, top, planted, lifted) {
  const eyes = rect(4, top + 1, 1, 2, "walker-eye") + rect(8, top + 1, 1, 2, "walker-eye");
  const legTop = top + 6;
  const legs = planted.map((x) => rect(x, legTop, 1, 9 - legTop)).join("")
    + lifted.map((x) => rect(x, legTop, 1, 8 - legTop)).join("");
  return `<g class="walker-frame f${n}">${body(top, eyes)}${legs}</g>`;
}

// the ">  <" face he makes when you hover or tap him
function happyFrame() {
  const eyes = [[3, 2], [4, 3], [3, 4], [9, 2], [8, 3], [9, 4]]
    .map(([x, y]) => rect(x, y, 1, 1, "walker-eye")).join("");
  const legs = [3, 5, 7, 9].map((x) => rect(x, 7, 1, 2)).join("");
  return `<g class="walker-happy">${body(1, eyes)}${legs}</g>`;
}

function walkerSVG() {
  const A = [3, 7], B = [5, 9];
  return `<svg class="walker" viewBox="0 0 13 9" aria-hidden="true" shape-rendering="crispEdges">
    ${walkFrame(1, 1, A, B)}
    ${walkFrame(2, 0, [...A, ...B], [])}
    ${walkFrame(3, 1, B, A)}
    ${walkFrame(4, 0, [...A, ...B], [])}
    ${happyFrame()}
    <rect class="walker-hitbox" width="13" height="9" />
  </svg>`;
}

// --- footer ---
const footer = document.querySelector(".footer");
if (footer) {
  const isHome = footer.hasAttribute("data-home");
  footer.innerHTML = `
    <p class="footer-walk">
      ${walkerSVG()}
      ${isHome ? "" : `<a href="/">home</a> <span aria-hidden="true">·</span>`}
      <a href="${GITHUB_URL}">github</a>
      <span aria-hidden="true">·</span>
      made by claude
    </p>`;

  // Phones have no hover, so a tap makes him squint for a moment instead.
  const walker = footer.querySelector(".walker");
  let squintTimer;
  walker.addEventListener("click", () => {
    walker.classList.add("squint");
    clearTimeout(squintTimer);
    squintTimer = setTimeout(() => walker.classList.remove("squint"), 1500);
  });
}

})();
