// ============================================================
//  EDIT ME — your current top 10 songs, #1 first.
//    title   song name
//    artist  who made it
//    plays   optional play count
// ============================================================

const SONGS = [
  { title: "B2U", artist: "Dillon Francis & Marten Hørger" },
];

// ============================================================

const chart = document.getElementById("chart");
chart.innerHTML = SONGS.slice(0, 10).map((song, i) => `
  <li style="--i: ${i}">
    <div class="chart-row${i < 3 ? " podium" : ""}">
      <span class="chart-rank">${i + 1}</span>
      <span class="chart-song">
        <span class="chart-title">${song.title}</span>
        <span class="chart-artist">${song.artist}</span>
      </span>
      ${song.plays ? `<span class="tag">${song.plays} plays</span>` : ""}
    </div>
  </li>`).join("");

// Until all 10 are filled in, show one "coming soon" row instead of empty slots.
if (SONGS.length < 10) {
  chart.insertAdjacentHTML("beforeend", `
    <li style="--i: ${SONGS.length}">
      <div class="chart-row chart-soon">
        <span class="chart-rank">${SONGS.length + 1}–10</span>
        <span class="chart-song">
          <span class="chart-title">loading…</span>
          <span class="chart-artist">(i just haven't added them yet)</span>
        </span>
      </div>
    </li>`);
}
