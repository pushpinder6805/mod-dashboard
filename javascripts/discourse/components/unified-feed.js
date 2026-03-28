import { getLatest, getReviewed, getFollowUp, getFlags } from "../lib/api";
import { updateTags } from "./actions";

export async function renderDashboard() {
  const container = document.createElement("div");
  container.className = "mod-dashboard";

  container.innerHTML = `
    <h2>Moderator Dashboard</h2>

    <div class="mod-section">
      <h3>Needs Attention</h3>
      <ul class="mod-feed"></ul>
    </div>

    <div class="mod-section filters">
      <h3>Filters</h3>

      <input class="user-input" placeholder="Search user..." />
      <ul class="user-suggestions"></ul>
      <ul class="user-results"></ul>

      <input class="tag-input" placeholder="Search tag..." />
      <button class="tag-btn">Search</button>
      <ul class="tag-results"></ul>

      <input class="cat-input" placeholder="Search category..." />
      <button class="cat-btn">Search</button>
      <ul class="cat-results"></ul>
    </div>
  `;

  document.querySelector("#main-outlet")?.prepend(container);

  const list = container.querySelector(".mod-feed");

  const [latest, reviewed, followup] = await Promise.all([
    getLatest(),
    getReviewed(),
    getFollowUp()
  ]);

  const reviewedIds = new Set((reviewed.topics || []).map(t => t.id));
  const followIds = new Set((followup.topics || []).map(t => t.id));

  const topics = latest.topic_list?.topics || [];

  const feed = topics.map(t => {
    let priority = 3;
    let label = "Normal";

    if (followIds.has(t.id)) {
      priority = 2;
      label = "Follow-up";
    }

    if (!reviewedIds.has(t.id)) {
      priority = 1;
      label = "Unreviewed";
    }

    return { ...t, priority, label };
  });

  feed.sort((a, b) => a.priority - b.priority);

  list.innerHTML = feed.map(t => `
    <li>
      <a href="/t/${t.slug}/${t.id}">${t.title}</a>

      <span class="badge priority-${t.priority}">
        ${t.label}
      </span>

      <button class="mark-reviewed" data-id="${t.id}">
        ✔
      </button>
    </li>
  `).join("");

  // ACTIONS
  container.addEventListener("click", async (e) => {
    const btn = e.target.closest(".mark-reviewed");
    if (!btn) return;

    await updateTags(btn.dataset.id, ["reviewed"]);
    btn.innerText = "Done";
  });

  return container;
}
