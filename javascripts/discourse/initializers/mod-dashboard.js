import { apiInitializer } from "discourse/lib/api";

export default apiInitializer("0.11", (api) => {
  api.onPageChange(async (url) => {
    if (!url.includes("/review")) return;

    const user = api.getCurrentUser();
    if (!user || !(user.staff || user.admin)) return;

    if (document.querySelector(".mod-dashboard")) return;

    const container = document.createElement("div");
    container.className = "mod-dashboard";

    container.innerHTML = `
      <h2>Moderator Dashboard</h2>

      <div class="mod-grid">

        <div class="mod-section">
          <h3>Latest Posts (<span class="count-latest">0</span>)</h3>
          <ul class="latest"></ul>
        </div>

        <div class="mod-section">
          <h3>Review Status (<span class="count-review">0</span>)</h3>
          <ul class="review"></ul>
        </div>

        <div class="mod-section">
          <h3>Follow-up (Tag + Flags) (<span class="count-followup">0</span>)</h3>
          <ul class="followup"></ul>
        </div>

        <!-- USER SEARCH -->
        <div class="mod-section">
          <h3>Search by Username</h3>
          <input class="filter-user-input" placeholder="Search username..." />
          <ul class="filter-user-suggestions"></ul>
          <ul class="filter-user-results"></ul>
        </div>

        <!-- TAG SEARCH -->
        <div class="mod-section">
          <h3>Search by Tag</h3>
          <input class="filter-tag-input" placeholder="Enter tag" />
          <button class="filter-tag-btn">Search</button>
          <ul class="filter-tag-results"></ul>
        </div>

        <!-- CATEGORY SEARCH -->
        <div class="mod-section">
          <h3>Search by Category</h3>
          <input class="filter-cat-input" placeholder="Enter category slug" />
          <button class="filter-cat-btn">Search</button>
          <ul class="filter-cat-results"></ul>
        </div>

      </div>
    `;

    document.querySelector("#main-outlet")?.prepend(container);

    await Promise.all([
      loadLatest(container),
      loadReview(container),
      loadFollowUp(container),
    ]);

    setupFilters(container);
  });

  // -----------------------
  // Latest
  // -----------------------
  async function loadLatest(container) {
    const list = container.querySelector(".latest");
    const countEl = container.querySelector(".count-latest");

    const res = await fetch("/latest.json");
    const data = await res.json();

    const topics = data.topic_list?.topics || [];
    countEl.textContent = data.topic_list?.total_rows || topics.length;

    list.innerHTML = topics.map(t => `
      <li><a href="/t/${t.slug}/${t.id}">${t.title}</a></li>
    `).join("");
  }

  // -----------------------
  // Review Status
  // -----------------------
  async function loadReview(container) {
    const list = container.querySelector(".review");
    const countEl = container.querySelector(".count-review");

    const latestRes = await fetch("/latest.json");
    const latestData = await latestRes.json();
    const topics = latestData.topic_list?.topics || [];

    const reviewedRes = await fetch("/search.json?q=tags:reviewed");
    const reviewedData = await reviewedRes.json();
    const reviewedIds = new Set((reviewedData.topics || []).map(t => t.id));

    countEl.textContent = topics.length;

    list.innerHTML = topics.map(t => {
      const isReviewed = reviewedIds.has(t.id);
      return `
        <li>
          <a href="/t/${t.slug}/${t.id}">${t.title}</a>
          <span class="review-status ${isReviewed ? "reviewed" : "unreviewed"}">
            ${isReviewed ? "Reviewed" : "Unreviewed"}
          </span>
        </li>
      `;
    }).join("");
  }

  // -----------------------
  // Follow-up
  // -----------------------
  async function loadFollowUp(container) {
    const list = container.querySelector(".followup");
    const countEl = container.querySelector(".count-followup");

    const tagRes = await fetch("/search.json?q=tags:follow-up");
    const tagData = await tagRes.json();

    const reviewRes = await fetch("/review.json?type=ReviewableFlaggedPost");
    const reviewData = await reviewRes.json();

    const tagTopics = tagData.topics || [];
    const flagged = reviewData.reviewables || [];

    countEl.textContent = tagTopics.length + flagged.length;

    list.innerHTML = `
      ${tagTopics.map(t => `<li><a href="/t/${t.slug}/${t.id}">🏷 ${t.title}</a></li>`).join("")}
      ${flagged.map(() => `<li><a href="/review">🚩 Flagged Post</a></li>`).join("")}
    `;
  }

  // -----------------------
  // Filters
  // -----------------------
  function setupFilters(container) {

    // USER AUTOCOMPLETE
    const input = container.querySelector(".filter-user-input");
    const suggestions = container.querySelector(".filter-user-suggestions");
    const results = container.querySelector(".filter-user-results");

    let timer;

    input?.addEventListener("input", () => {
      const term = input.value.trim();

      clearTimeout(timer);

      if (term.length < 2) {
        suggestions.innerHTML = "";
        return;
      }

      timer = setTimeout(async () => {
        const res = await fetch(`/u/search/users.json?term=${term}`);
        const data = await res.json();

        const users = data.users || [];

        suggestions.innerHTML = users.map(u => `
          <li class="user-suggestion" data-username="${u.username}">
            ${u.username}
          </li>
        `).join("");
      }, 300);
    });

    suggestions?.addEventListener("click", async (e) => {
      const li = e.target.closest(".user-suggestion");
      if (!li) return;

      const username = li.dataset.username;
      input.value = username;
      suggestions.innerHTML = "";
      results.innerHTML = "Loading...";

      const res = await fetch(`/search.json?q=%40${username}`);
      const data = await res.json();

      results.innerHTML = (data.topics || []).map(t => `
        <li><a href="/t/${t.slug}/${t.id}">${t.title}</a></li>
      `).join("") || "<li>No posts found</li>";
    });

    // TAG SEARCH
    container.querySelector(".filter-tag-btn")?.addEventListener("click", async () => {
      const val = container.querySelector(".filter-tag-input").value.trim();
      const list = container.querySelector(".filter-tag-results");

      list.innerHTML = "Loading...";

      const res = await fetch(`/search.json?q=tags:${val}`);
      const data = await res.json();

      list.innerHTML = (data.topics || []).map(t =>
        `<li><a href="/t/${t.slug}/${t.id}">${t.title}</a></li>`
      ).join("") || "<li>No results</li>";
    });

    // CATEGORY SEARCH
    container.querySelector(".filter-cat-btn")?.addEventListener("click", async () => {
      const val = container.querySelector(".filter-cat-input").value.trim();
      const list = container.querySelector(".filter-cat-results");

      list.innerHTML = "Loading...";

      const res = await fetch(`/c/${val}.json`);
      const data = await res.json();

      const topics = data.topic_list?.topics || [];

      list.innerHTML = topics.map(t =>
        `<li><a href="/t/${t.slug}/${t.id}">${t.title}</a></li>`
      ).join("") || "<li>No results</li>";
    });
  }
});
