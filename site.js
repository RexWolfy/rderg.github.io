// ============================================================
//  Shared by every page: the footer and the little orange guy.
//  Change the footer here once and it updates everywhere.
// ============================================================

(() => {

const GITHUB_URL = "https://github.com/RexWolfy/rderg.github.io";

// ============================================================

const CLAY = "#d97757";
const EYE = "#07060c";

// --- the little orange guy (13 × 9 pixels) ---
// Colours and the starting visibility are set as SVG attributes too, so he
// still looks right if an old cached stylesheet is around.
function rect(x, y, w, h, eye = false) {
  return `<rect${eye ? ` class="walker-eye" fill="${EYE}"` : ""} x="${x}" y="${y}" width="${w}" height="${h}" />`;
}

function body(top, eyes) {
  return rect(2, top, 9, 6) + rect(0, top + 2, 2, 2) + rect(11, top + 2, 2, 2) + eyes;
}

// one walk frame: planted feet reach the ground (y = 9), lifted ones stop a pixel short
function walkFrame(n, top, planted, lifted) {
  const eyes = rect(4, top + 1, 1, 2, true) + rect(8, top + 1, 1, 2, true);
  const legTop = top + 6;
  const legs = planted.map((x) => rect(x, legTop, 1, 9 - legTop)).join("")
    + lifted.map((x) => rect(x, legTop, 1, 8 - legTop)).join("");
  return `<g class="walker-frame f${n}"${n > 1 ? ' opacity="0"' : ""}>${body(top, eyes)}${legs}</g>`;
}

// the ">  <" face, hopping on the spot
function grin() {
  const eyes = [[3, 2], [4, 3], [3, 4], [9, 2], [8, 3], [9, 4]]
    .map(([x, y]) => rect(x, y, 1, 1, true)).join("");
  const legs = [3, 5, 7, 9].map((x) => rect(x, 7, 1, 2)).join("");
  return `<g class="walker-hop">${body(1, eyes)}${legs}</g>`;
}

function walkerSVG() {
  const A = [3, 7], B = [5, 9];
  return `<svg class="walker" viewBox="0 0 13 9" fill="${CLAY}" aria-hidden="true" shape-rendering="crispEdges">
    <g class="walker-auto">
      <g class="walker-walking">
        ${walkFrame(1, 1, A, B)}
        ${walkFrame(2, 0, [...A, ...B], [])}
        ${walkFrame(3, 1, B, A)}
        ${walkFrame(4, 0, [...A, ...B], [])}
      </g>
      <g class="walker-grin" opacity="0">${grin()}</g>
    </g>
    <g class="walker-happy" opacity="0">${grin()}</g>
  </svg>`;
}

// --- footer ---
const footer = document.querySelector(".footer");
if (footer) {
  const isHome = footer.hasAttribute("data-home");
  footer.innerHTML = `
    <div class="walker-lane">
      <button class="walker-move" type="button" aria-label="Say hi to the little guy">${walkerSVG()}</button>
    </div>
    <p class="footer-links">
      ${isHome ? "" : `<a href="/">home</a> <span aria-hidden="true">·</span>`}
      <a href="${GITHUB_URL}">github</a>
      <span aria-hidden="true">·</span>
      made by claude
    </p>`;

  // He paces back and forth on his own. Phones have no hover,
  // so a tap makes him stop and grin for a moment instead.
  const walker = footer.querySelector(".walker-move");
  let cheerTimer;
  walker.addEventListener("click", () => {
    walker.classList.add("cheer");
    clearTimeout(cheerTimer);
    cheerTimer = setTimeout(() => walker.classList.remove("cheer"), 1500);
  });
}

})();
