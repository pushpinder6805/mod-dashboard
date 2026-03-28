export function initDashboard() {
  const container = document.createElement("div");
  container.className = "mod-dashboard";

  container.innerHTML = `
    <h2>Moderator Dashboard</h2>
    <div class="mod-grid"></div>
  `;

  return container;
}

export function renderAll(container, data) {
  const grid = container.querySelector(".mod-grid");

  grid.appendChild(renderLatest(data.latest));
  grid.appendChild(renderReview(data));
  grid.appendChild(renderFollowUp(data));
  grid.appendChild(renderNeedsAttention(data));
}

function renderLatest(data) {
  const el = createSection("Latest Posts");

  const topics = data.topic_list?.topics || [];

  el.querySelector("ul").innerHTML = topics.map(t =>
    `<li><a href="/t/${t.slug}/${t.id}">${t.title}</a></li>`
  ).join("");

  return el;
}
