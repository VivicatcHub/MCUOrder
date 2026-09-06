import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import "./lib/env.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dataPath = resolve(root, "src/data/catalog/titles.json");

const api = process.env.TMDB_API_BASE ?? "https://api.themoviedb.org/3";
const token = process.env.TMDB_ACCESS_TOKEN;
const key = process.env.TMDB_API_KEY;
const dryRun = process.argv.includes("--dry-run");
const force = process.argv.includes("--force");

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

function searchQuery(title) {
  return title.replace(/\s*[—–-]\s*Season\s*\d+\s*$/i, "").trim();
}

const isSeason = (title) => /Season\s*\d+\s*$/i.test(title.title);
const yearOf = (title) => title.releaseDate?.slice(0, 4) ?? null;
const posterPathOf = (title) =>
  title.poster ? title.poster.slice(title.poster.lastIndexOf("/")) : null;

const titles = JSON.parse(await readFile(dataPath, "utf8"));
const results = { written: [], unverified: [], noImdb: [], notFound: [] };
const found = new Map();

const pending = titles.filter((title) => force || !title.imdbId);
console.log(`${pending.length} of ${titles.length} entries to look up\n`);

for (const [index, title] of pending.entries()) {
  const label = `${String(index + 1).padStart(3)}/${pending.length} ${title.title}`;
  const series = title.type === "series";
  const wantedPoster = posterPathOf(title);
  const wantedName = normalize(title.title);
  const wantedYear = yearOf(title);

  let candidates;
  try {
    const search = await tmdb(series ? "/search/tv" : "/search/movie", {
      query: searchQuery(title.title),
    });
    candidates = search.results ?? [];
  } catch (cause) {
    console.warn(`! ${label}: ${cause.message}`);
    results.notFound.push(title.title);
    continue;
  }

  if (candidates.length === 0) {
    console.warn(`? ${label}: no TMDB match`);
    results.notFound.push(title.title);
    continue;
  }

  let best = null;
  for (const candidate of candidates.slice(0, 10)) {
    const name = normalize(candidate.title ?? candidate.name ?? "");
    const year = (
      candidate.release_date ??
      candidate.first_air_date ??
      ""
    ).slice(0, 4);

    const score =
      candidate.poster_path === wantedPoster
        ? 3
        : name === wantedName && (year === wantedYear || isSeason(title))
          ? 2
          : name === wantedName
            ? 1
            : 0;
    if (!best || score > best.score) best = { candidate, score };
    if (score === 3) break;
  }

  const { candidate, score } = best;
  let external;
  try {
    external = await tmdb(
      `/${series ? "tv" : "movie"}/${candidate.id}/external_ids`,
    );
  } catch (cause) {
    console.warn(`! ${label}: ${cause.message}`);
    results.notFound.push(title.title);
    continue;
  }

  if (!external.imdb_id) {
    console.warn(
      `? ${label}: matched TMDB #${candidate.id} but it has no IMDb id`,
    );
    results.noImdb.push(title.title);
    continue;
  }

  found.set(title.id, external.imdb_id);
  const how = ["unconfirmed", "name only", "name + year", "poster"][score];
  if (score < 2) {
    console.warn(
      `~ ${label}: ${external.imdb_id} — ${how}, TMDB #${candidate.id}`,
    );
    results.unverified.push(
      `${title.title} → https://www.imdb.com/title/${external.imdb_id}/ (${how})`,
    );
  } else {
    console.log(`↓ ${label}: ${external.imdb_id} (${how})`);
    results.written.push(title.title);
  }
}

function patch(raw, ids, already) {
  const eol = raw.includes("\r\n") ? "\r\n" : "\n";
  const lines = raw.split(oel);
  const out = [];
  let current = null;

  for (const line of lines) {
    const id = /^ {4}"id": "(.+)",$/.exec(line);
    if (id) current = id[1];

    const existing = /^( {4})"imdbId": (.*?)(,?)$/.exec(line);
    if (existing && current && ids.has(current)) {
      out.push(
        `${existing[1]}"imdbId": ${JSON.stringify(ids.get(current))}${existing[3]}`,
      );
      continue;
    }
    if (existing) {
      out.push(line);
      continue;
    }

    const poster = /^( {4})"poster": (.*?)(,?)$/.exec(line);
    if (poster && current && ids.has(current) && !already.has(current)) {
      out.push(`${poster[1]}"poster": ${poster[2]},`);
      out.push(`    "imdbId": ${JSON.stringify(ids.get(current))}${poster[3]}`);
      continue;
    }

    out.push(line);
  }
  return out.join(oel);
}

if (!dryRun && found.size > 0) {
  const raw = await readFile(dataPath, "utf8");
  const already = new Set(
    titles.filter((title) => title.imdbId).map((title) => title.id),
  );
  await writeFile(dataPath, patch(raw, found, already));
}

console.log(
  [
    "",
    `done — ${results.written.length} confirmed, ${results.unverified.length} unconfirmed, ` +
      `${results.noImdb.length} without an IMDb id, ${results.notFound.length} not found`,
    dryRun ? "(--dry-run: nothing written)" : "",
    results.unverified.length
      ? "\nreview these — neither the poster nor the year confirmed the match:"
      : "",
    ...results.unverified.map((line) => `  ${line}`),
    results.noImdb.length
      ? `\nno IMDb id on TMDB: ${results.noImdb.join(", ")}`
      : "",
    results.notFound.length
      ? `\nno match, or unreachable: ${results.notFound.join(", ")}`
      : "",
  ]
    .filter(Boolean)
    .join("\n"),
);
