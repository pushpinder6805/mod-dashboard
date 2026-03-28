export async function updateTags(topicId, tags) {
  await fetch(`/t/${topicId}.json`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": document.querySelector("meta[name=csrf-token]").content,
    },
    body: JSON.stringify({ tags }),
  });
}
