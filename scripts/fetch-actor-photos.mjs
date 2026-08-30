import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import "./lib/env.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const actorsPath = resolve(root, "src/data/catalog/actors.json");
const titlesPath = resolve(root, "src/data/catalog/titles.json");

const api = process.env.TMDB_API_BASE ?? "https://api.themoviedb.org/3";
const token = process.env.TMDB_ACCESS_TOKEN;
const key = process.env.TMDB_API_KEY;
const dryRun = process.argv.includes("--dry-run");
const force = process.argv.includes("--force");

const SIZE = "w185";

if (!token && !key) {
  console.error(
    "Set TMDB_API_KEY (v3 key) or TMDB_ACCESS_TOKEN (v4 read token) first.\n" +
      "Both live at https://www.themoviedb.org/settings/api",
  );
  process.exit(1);
}

async function tmdb(path, params = {}) {
  const url = new URL(api + path);
  for (const [name, value] of Object.entries(params))
    url.searchParams.set(name, value);
  if (!token && key) url.searchParams.set("api_key", key);

  const response = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (response.status === 429) {
    await new Promise((wake) => setTimeout(wake, 2000));
    return tmdb(path, params);
  }
  if (!response.ok) throw new Error(`HTTP ${response.status} on ${path}`);
  return response.json();
}

const NUMBER_WORDS = {
  one: "1",
  two: "2",
  three: "3",
  four: "4",
  five: "5",
  six: "6",
  seven: "7",
  eight: "8",
  nine: "9",
  ten: "10",
};

function normalize(name) {
  return name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .split(/season\s*\d/)[0]
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(" ")
    .map((word) => NUMBER_WORDS[word] ?? word)
    .join(" ");
}

const actors = JSON.parse(await readFile(actorsPath, "utf8"));

const titles = JSON.parse(await readFile(titlesPath, "utf8"));

// The entries this dataset already credits each actor in — what a TMDB
// candidate's own credits have to overlap before the match is believed.
const appearances = new Map();
for (const title of titles) {
  for (const credit of title.cast ?? []) {
    if (!credit.actorId) continue;

    const seen = appearances.get(credit.actorId) ?? new Set();
    seen.add(normalize(title.title));
    appearances.set(credit.actorId, seen);
  }
}

function titlesOf(actor) {
  return appearances.get(actor.id) ?? new Set();
}

const results = { written: [], unverified: [], noPhoto: [], notFound: [] };
const pending = actors.filter((actor) => force || !actor.photo);
console.log(`${pending.length} of ${actors.length} actors to look up\n`);

for (const [index, actor] of pending.entries()) {
  const label = `${String(index + 1).padStart(3)}/${pending.length} ${actor.name}`;
  let candidates;
  try {
    candidates =
      (await tmdb("/search/person", { query: actor.name })).results ?? [];
  } catch (cause) {
    console.warn(`! ${label}: ${cause.message}`);
    results.notFound.push(actor.name);
    continue;
  }

  if (candidates.length === 0) {
    console.warn(`? ${label}: no TMDB match`);
    results.notFound.push(actor.name);
    continue;
  }

  const wanted = titlesOf(actor);
  let best = null;

  for (const candidate of candidates.slice(0, 5)) {
    let credits;
    try {
      credits = await tmdb(`/person/${candidate.id}/combined_credits`);
    } catch {
      continue;
    }
    const played = new Set(
      (credits.cast ?? []).map((entry) =>
        normalize(entry.title ?? entry.name ?? ""),
      ),
    );
    let overlap = 0;
    for (const name of wanted) if (played.has(name)) overlap += 1;

    if (!best || overlap > best.overlap) best = { candidate, overlap };

    if (overlap === wanted.size) break;
  }

  const { candidate, overlap } = best ?? {
    candidate: candidates[0],
    overlap: 0,
  };

  if (!candidate.profile_path) {
    console.warn(
      `? ${label}: matched TMDB #${candidate.id} but it has no photo`,
    );
    results.noPhoto.push(actor.name);
    continue;
  }

  actor.photo = `https://image.tmdb.org/t/p/${SIZE}${candidate.profile_path}`;
  const confidence = `${overlap}/${wanted.size} entries`;
  if (overlap === 0) {
    console.warn(
      `~ ${label}: unconfirmed — TMDB #${candidate.id}, ${confidence}`,
    );
    results.unverified.push(
      `${actor.name} → https://www.themoviedb.org/person/${candidate.id}`,
    );
  } else {
    console.log(`↓ ${label} (${confidence})`);
    results.written.push(actor.name);
  }
}

if (!dryRun && results.written.length + results.unverified.length > 0) {
  await writeFile(actorsPath, `${JSON.stringify(actors, null, 2)}\n`);
}

console.log(
  [
    "",
    `done — ${results.written.length} confirmed, ${results.unverified.length} unconfirmed, ` +
      `${results.noPhoto.length} without a photo, ${results.notFound.length} not found`,
    dryRun ? "(--dry-run: nothing written)" : "",
    results.unverified.length
      ? "\nreview these — the name matched but the credits did not:"
      : "",
    ...results.unverified.map((line) => `  ${line}`),
    results.noPhoto.length
      ? `\nno TMDB photo: ${results.noPhoto.join(", ")}`
      : "",
    results.notFound.length
      ? `\nno match, or unreachable: ${results.notFound.join(", ")}`
      : "",
  ]
    .filter(Boolean)
    .join("\n"),
);
