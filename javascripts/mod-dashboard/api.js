export async function fetchLatest() {
  const res = await fetch("/latest.json");
  return res.json();
}

export async function fetchReviewed() {
  const res = await fetch("/search.json?q=tags:reviewed");
  return res.json();
}

export async function fetchFollowUp() {
  const res = await fetch("/search.json?q=tags:follow-up");
  return res.json();
}

export async function fetchFlags() {
  const res = await fetch("/review.json?type=ReviewableFlaggedPost");
  return res.json();
}

export async function loadAllData() {
  const [latest, reviewed, followup, flags] = await Promise.all([
    fetchLatest(),
    fetchReviewed(),
    fetchFollowUp(),
    fetchFlags(),
  ]);

  return { latest, reviewed, followup, flags };
}
