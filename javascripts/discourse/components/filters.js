import { searchUsers, searchByTag, getCategory } from "../lib/api";
import { debounce } from "../lib/utils";

export function setupFilters(container) {
  const input = container.querySelector(".user-input");
  const suggestions = container.querySelector(".user-suggestions");
  const results = container.querySelector(".user-results");

  input.addEventListener("input", debounce(async () => {
    const val = input.value.trim();
    if (val.length < 2) return;

    const data = await searchUsers(val);
    suggestions.innerHTML = (data.users || []).map(u =>
      `<li data-u="${u.username}">${u.username}</li>`
    ).join("");
  }));

  suggestions.addEventListener("click", async (e) => {
    const li = e.target.closest("li");
    if (!li) return;

    const username = li.dataset.u;
    input.value = username;
    suggestions.innerHTML = "";

    const res = await fetch(`/search.json?q=%40${username}`);
    const data = await res.json();

    results.innerHTML = (data.topics || []).map(t =>
      `<li><a href="/t/${t.slug}/${t.id}">${t.title}</a></li>`
    ).join("");
  });

  // TAG
  container.querySelector(".tag-btn").onclick = async () => {
    const val = container.querySelector(".tag-input").value;
    const data = await searchByTag(val);

    container.querySelector(".tag-results").innerHTML =
      (data.topics || []).map(t =>
        `<li><a href="/t/${t.slug}/${t.id}">${t.title}</a></li>`
      ).join("");
  };

  // CATEGORY
  container.querySelector(".cat-btn").onclick = async () => {
    const val = container.querySelector(".cat-input").value;
    const data = await getCategory(val);

    const topics = data.topic_list?.topics || [];

    container.querySelector(".cat-results").innerHTML =
      topics.map(t =>
        `<li><a href="/t/${t.slug}/${t.id}">${t.title}</a></li>`
      ).join("");
  };
}
