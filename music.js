// ============================================================
//  EDIT ME — your current top 10 songs, #1 first.
//    title   song name
//    artist  who made it
//    plays   optional play count
// ============================================================

const SONGS = [
  { title: "B2U", artist: "Dillon Francis & Marten Hørger" },
  { title: "Song title", artist: "Artist" },
  { title: "Song title", artist: "Artist" },
  { title: "Song title", artist: "Artist" },
  { title: "Song title", artist: "Artist" },
  { title: "Song title", artist: "Artist" },
  { title: "Song title", artist: "Artist" },
  { title: "Song title", artist: "Artist" },
  { title: "Song title", artist: "Artist" },
  { title: "Song title", artist: "Artist" },
];

// ============================================================

document.getElementById("chart").innerHTML = SONGS.slice(0, 10).map((song, i) => `
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
