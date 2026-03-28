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
          <h3>Unreviewed / Review Queue (<span class="count-review">0</span>)</h3>
          <ul class="review"></ul>
        </div>

        <div class="mod-section">
          <h3>Follow-up (Tag + Flags) (<span class="count-followup">0</span>)</h3>
          <ul class="followup"></ul>
        </div>

      </div>
    `;

    document.querySelector("#main-outlet")?.prepend(container);

    await Promise.all([
      loadLatest(container),
      loadReview(container),
      loadFollowUp(container),
    ]);
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

      // Count (use total_rows if available)
      countEl.textContent =
        data.topic_list?.total_rows || topics.length;

      if (!topics.length) {
        list.innerHTML = "<li>No latest posts</li>";
        return;
      }

      topics.forEach((t) => {
        list.innerHTML += `
          <li>
            <a href="/t/${t.slug}/${t.id}">
              ${t.title}
            </a>
          </li>
        `;
      });
    } catch (e) {
      console.error("Latest fetch failed", e);
    }
  }

  // -----------------------
  // Review Queue
  // -----------------------
  async function loadReview(container) {
    const list = container.querySelector(".review");
    const countEl = container.querySelector(".count-review");

    if (!list || !countEl) return;

    try {
      const res = await fetch("/review.json");
      const data = await res.json();

      const items = data.reviewables || [];

      // Count (use meta if available)
      countEl.textContent =
        data.meta?.total || items.length;

      if (!items.length) {
        list.innerHTML = "<li>No items in review queue</li>";
        return;
      }

      items.forEach((r) => {
        list.innerHTML += `
          <li>
            <a href="/review">
              ${r.type.replace("Reviewable", "")} (${r.status})
            </a>
          </li>
        `;
      });
    } catch (e) {
      console.error("Review fetch failed", e);
    }
  }

  // -----------------------
  // Follow-up (Tag + Flags)
  // -----------------------
  async function loadFollowUp(container) {
    const list = container.querySelector(".followup");
    const countEl = container.querySelector(".count-followup");

    if (!list || !countEl) return;

    try {
      // TAG BASED (Search API)
      const tagRes = await fetch("/search.json?q=tags:follow-up");
      const tagData = await tagRes.json();

      const tagTopics = tagData.topics || [];
      const tagCount =
        tagData.grouped_search_result?.total_count ||
        tagTopics.length;

      // FLAG BASED
      const reviewRes = await fetch(
        "/review.json?type=ReviewableFlaggedPost"
      );
      const reviewData = await reviewRes.json();

      const flagged = reviewData.reviewables || [];
      const flagCount =
        reviewData.meta?.total || flagged.length;

      // Total count
      countEl.textContent = tagCount + flagCount;

      if (!tagTopics.length && !flagged.length) {
        list.innerHTML = "<li>No follow-up items</li>";
        return;
      }

      // Render tag-based
      tagTopics.forEach((t) => {
        list.innerHTML += `
          <li>
            <a href="/t/${t.slug}/${t.id}">
              🏷 ${t.title}
            </a>
          </li>
        `;
      });

      // Render flagged
      flagged.forEach((r) => {
        list.innerHTML += `
          <li>
            <a href="/review">
              🚩 Flagged Post (${r.status})
            </a>
          </li>
        `;
      });

    } catch (e) {
      console.error("Follow-up fetch failed", e);
    }
  }
});
