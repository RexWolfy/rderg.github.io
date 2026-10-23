// ============================================================
//  EDIT ME — your coding projects.
//    name    project name
//    emoji   icon for the card
//    status  optional, e.g. "in progress", "done"
//    about   a sentence or two about it
//    tags    optional list of things it uses
//    link    optional website / GitHub link
// ============================================================

const PROJECTS = [
  {
    name: "Minecraft server",
    emoji: "⛏️",
    status: "done",
    about: "A private Minecraft server for me and my friends. We got our own VPS, SSH'd into the Ubuntu box and set the whole thing up from the terminal like real hackers. (The AI did most of the typing. We did most of the panicking.)",
    tags: ["Minecraft", "VPS", "Ubuntu", "SSH"],
  },
  {
    name: "JXR to PNG converter",
    emoji: "🖼️",
    status: "done",
    about: "Turns .jxr images (the JPEG XR format Windows saves HDR screenshots in) into normal PNGs that literally anything can open. Because apparently nobody supports .jxr.",
    tags: ["JXR", "PNG"],
  },
];

// ============================================================

const list = document.getElementById("projects");

PROJECTS.forEach((project) => {
  const card = document.createElement("article");
  card.className = "project-card";
  card.innerHTML = `
    <div class="project-head">
      <span class="project-emoji">${project.emoji || "💻"}</span>
      <h3>${project.name}</h3>
      ${project.status ? `<span class="tag${project.status === "done" ? " done" : ""}">${project.status}${project.status === "done" ? " ✓" : ""}</span>` : ""}
    </div>
    <p class="project-about">${project.about || ""}</p>
    ${project.tags ? `<div class="project-tags">${project.tags.map((t) => `<span>${t}</span>`).join("")}</div>` : ""}
    ${project.link ? `<a class="hero-cta" href="${project.link}" target="_blank" rel="noopener">check it out ↗</a>` : ""}`;
  list.appendChild(card);
});
