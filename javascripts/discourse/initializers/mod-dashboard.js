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

      <!-- TOP GRID -->
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

      </div>

      <!-- NEW FILTER GRID -->
      <div class="mod-grid mod-filters">

        <div class="mod-section">
          <h3>Search by Username</h3>
          <input class="filter-user-input" placeholder="Enter username" />
          <button class="filter-user-btn">Search</button>
          <ul class="filter-user-results"></ul>
        </div>

        <div class="mod-section">
          <h3>Search by Tag</h3>
          <input class="filter-tag-input" placeholder="Enter tag (e.g. follow-up)" />
          <button class="filter-tag-btn">Search</button>
          <ul class="filter-tag-results"></ul>
        </div>

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
  // Latest Posts
  // -----------------------
  async function loadLatest(container) {
    const list = container.querySelector(".latest");
    const countEl = container.querySelector(".count-latest");

    if (!list || !countEl) return;

    try {
      const res = await fetch("/latest.json");
      const data = await res.json();

      const topics = data.topic_list?.topics || [];
      countEl.textContent =
        data.topic_list?.total_rows || topics.length;

      list.innerHTML = topics.length
        ? topics.map(t => `
            <li>
              <a href="/t/${t.slug}/${t.id}">
                ${t.title}
              </a>
            </li>
          `).join("")
        : "<li>No latest posts</li>";

    } catch (e) {
      console.error(e);
    }
  }

  // -----------------------
  // Review Status
  // -----------------------
  async function loadReview(container) {
    const list = container.querySelector(".review");
    const countEl = container.querySelector(".count-review");

    if (!list || !countEl) return;

    try {
      const latestRes = await fetch("/latest.json");
      const latestData = await latestRes.json();
      const topics = latestData.topic_list?.topics || [];

      const reviewedRes = await fetch("/search.json?q=tags:reviewed");
      const reviewedData = await reviewedRes.json();
      const reviewedIds = new Set(
        (reviewedData.topics || []).map(t => t.id)
      );

      countEl.textContent = topics.length;

      list.innerHTML = topics.length
        ? topics.map(t => {
            const isReviewed = reviewedIds.has(t.id);
            return `
              <li>
                <a href="/t/${t.slug}/${t.id}">
                  ${t.title}
                </a>
                <span class="review-status ${isReviewed ? "reviewed" : "unreviewed"}">
                  ${isReviewed ? "Reviewed" : "Unreviewed"}
                </span>
              </li>
            `;
          }).join("")
        : "<li>No posts found</li>";

    } catch (e) {
      console.error(e);
    }
  }

  // -----------------------
  // Follow-up
  // -----------------------
  async function loadFollowUp(container) {
    const list = container.querySelector(".followup");
    const countEl = container.querySelector(".count-followup");

    if (!list || !countEl) return;

    try {
      const tagRes = await fetch("/search.json?q=tags:follow-up");
      const tagData = await tagRes.json();
      const tagTopics = tagData.topics || [];

      const reviewRes = await fetch("/review.json?type=ReviewableFlaggedPost");
      const reviewData = await reviewRes.json();
      const flagged = reviewData.reviewables || [];

      countEl.textContent = tagTopics.length + flagged.length;

      list.innerHTML = `
        ${tagTopics.map(t => `
          <li><a href="/t/${t.slug}/${t.id}">🏷 ${t.title}</a></li>
        `).join("")}

        ${flagged.map(() => `
          <li><a href="/review">🚩 Flagged Post</a></li>
        `).join("")}
      ` || "<li>No follow-up items</li>";

    } catch (e) {
      console.error(e);
    }
  }

  // -----------------------
  // Filters
  // -----------------------
  function setupFilters(container) {

    // USER
    container.querySelector(".filter-user-btn")?.addEventListener("click", async () => {
      const val = container.querySelector(".filter-user-input").value.trim();
      const list = container.querySelector(".filter-user-results");
      if (!val || !list) return;

      list.innerHTML = "Loading...";

      const res = await fetch(`/search.json?q=%40${val}`);
      const data = await res.json();

      list.innerHTML = (data.topics || []).map(t =>
        `<li><a href="/t/${t.slug}/${t.id}">${t.title}</a></li>`
      ).join("") || "<li>No results</li>";
    });

    // TAG
    container.querySelector(".filter-tag-btn")?.addEventListener("click", async () => {
      const val = container.querySelector(".filter-tag-input").value.trim();
      const list = container.querySelector(".filter-tag-results");
      if (!val || !list) return;

      list.innerHTML = "Loading...";

      const res = await fetch(`/search.json?q=tags:${val}`);
      const data = await res.json();

      list.innerHTML = (data.topics || []).map(t =>
        `<li><a href="/t/${t.slug}/${t.id}">${t.title}</a></li>`
      ).join("") || "<li>No results</li>";
    });

    // CATEGORY
    container.querySelector(".filter-cat-btn")?.addEventListener("click", async () => {
      const val = container.querySelector(".filter-cat-input").value.trim();
      const list = container.querySelector(".filter-cat-results");
      if (!val || !list) return;

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
