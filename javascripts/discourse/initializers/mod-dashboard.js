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
          <h3>Latest Posts</h3>
          <ul class="latest"></ul>
        </div>

        <div class="mod-section">
          <h3>Unreviewed / Review Queue</h3>
          <ul class="review"></ul>
        </div>

        <div class="mod-section">
          <h3>Follow-up (Tag + Flags)</h3>
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
    if (!list) return;

    try {
      const res = await fetch("/latest.json");
      const data = await res.json();

      const topics = data.topic_list?.topics || [];

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
    if (!list) return;

    try {
      const res = await fetch("/review.json");
      const data = await res.json();

      const items = data.reviewables || [];

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
    if (!list) return;

    try {
      // ---------------- TAG BASED (FIXED USING SEARCH API)
      const tagRes = await fetch("/search.json?q=tags:follow-up");
      const tagData = await tagRes.json();

      const tagTopics = tagData.topics || [];

      tagTopics.forEach((t) => {
        list.innerHTML += `
          <li>
            <a href="/t/${t.slug}/${t.id}">
              🏷 ${t.title}
            </a>
          </li>
        `;
      });

      // ---------------- FLAG BASED (FROM REVIEW QUEUE)
      const reviewRes = await fetch(
        "/review.json?type=ReviewableFlaggedPost"
      );
      const reviewData = await reviewRes.json();

      const flagged = reviewData.reviewables || [];

      flagged.forEach((r) => {
        list.innerHTML += `
          <li>
            <a href="/review">
              🚩 Flagged Post (${r.status})
            </a>
          </li>
        `;
      });

      if (!tagTopics.length && !flagged.length) {
        list.innerHTML = "<li>No follow-up items</li>";
      }
    } catch (e) {
      console.error("Follow-up fetch failed", e);
    }
  }
});
