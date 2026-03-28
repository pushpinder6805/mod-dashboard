export async function getLatest() {
  return fetch("/latest.json").then(r => r.json());
}

export async function getReviewed() {
  return fetch("/search.json?q=tags:reviewed").then(r => r.json());
}

export async function getFollowUp() {
  return fetch("/search.json?q=tags:follow-up").then(r => r.json());
}

export async function getFlags() {
  return fetch("/review.json?type=ReviewableFlaggedPost").then(r => r.json());
}

export async function searchUsers(term) {
  return fetch(`/u/search/users.json?term=${term}`).then(r => r.json());
}

export async function searchByTag(tag) {
  return fetch(`/search.json?q=tags:${tag}`).then(r => r.json());
}

export async function getCategory(cat) {
  return fetch(`/c/${cat}.json`).then(r => r.json());
}
