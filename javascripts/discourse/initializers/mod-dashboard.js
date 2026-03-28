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
    const res = await fetch("/latest.json");
    const data = await res.json();

    const list = container.querySelector(".latest");

    data.topic_list.topics.forEach((t) => {
      list.innerHTML += `
        <li>
          <a href="/t/${t.slug}/${t.id}">
            ${t.title}
          </a>
        </li>
      `;
    });
  }

  // -----------------------
  // Review Queue
  // -----------------------
  async function loadReview(container) {
    const res = await fetch("/review.json");
    const data = await res.json();

    const list = container.querySelector(".review");

    data.reviewables.forEach((r) => {
      const topicId = r.topic_id || r.target_id;

      list.innerHTML += `
        <li>
          <a href="/review">
            ${r.type.replace("Reviewable", "")} 
            (${r.status})
          </a>
        </li>
      `;
    });
  }

  // -----------------------
  // Follow-up (Tag + Flags)
  // -----------------------
  async function loadFollowUp(container) {
    const list = container.querySelector(".followup");

    // 1. Tag-based
    const tagRes = await fetch("/tags/follow-up.json");
    const tagData = await tagRes.json();

    tagData.topic_list.topics.forEach((t) => {
      list.innerHTML += `
        <li>
          <a href="/t/${t.slug}/${t.id}">
            🏷 ${t.title}
          </a>
        </li>
      `;
    });

    // 2. Flag-based (from review queue)
    const reviewRes = await fetch("/review.json?type=ReviewableFlaggedPost");
    const reviewData = await reviewRes.json();

    reviewData.reviewables.forEach((r) => {
      list.innerHTML += `
        <li>
          <a href="/review">
            🚩 Flagged Post (${r.status})
          </a>
        </li>
      `;
    });
  }
});
