import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { root } from "./env.mjs";

export { root };

export const paths = {
  titles: resolve(root, "src/data/catalog/titles.json"),
  characters: resolve(root, "src/data/catalog/characters.json"),
  actors: resolve(root, "src/data/catalog/actors.json"),
  franchises: resolve(root, "src/data/catalog/franchises.json"),
};

export const POSTER_SIZE = "w500";
export const PROFILE_SIZE = "w185";

const api = process.env.TMDB_API_BASE ?? "https://api.themoviedb.org/3";
const token = process.env.TMDB_ACCESS_TOKEN;
const key = process.env.TMDB_API_KEY;

export function requireCredentials() {
  if (token || key) return;
  console.error(
    "Set TMDB_API_KEY (v3 key) or TMDB_ACCESS_TOKEN (v4 read token) first —\n" +
    "in the environment or in .env at the repo root.\n" +
    "Both live at https://www.themoviedb.org/settings/api",
  );
  process.exit(1);
}

export const sleep = (ms) => new Promise((wake) => setTimeout(wake, ms));

export async function tmdb(path, params = {}) {
  const url = new URL(api + path);
  for (const [name, value] of Object.entries(params))
    url.searchParams.set(name, value);
  if (!token && key) url.searchParams.set("api_key", key);

  const response = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (response.status === 429) {
    await sleep(2000);
    return tmdb(path, params);
  }
  if (!response.ok) {
    const error = new Error(`HTTP ${response.status} on ${path}`);
    error.status = response.status;
    throw error;
  }
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

export function normalize(name) {
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

export function searchQuery(title) {
  return title.replace(/\s*[—–-]\s*Season\s*\d+\s*$/i, "").trim();
}

export function seasonOf(title) {
  const match = /Season\s*(\d+)\s*$/i.exec(title);
  return match ? Number(match[1]) : null;
}

export function slugify(text) {
  return (
    text
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "") || "unnamed"
  );
}

export function uniqueId(base, taken) {
  if (!taken.has(base)) return base;
  for (let n = 2; ; n += 1) {
    const candidate = `${base}_${n}`;
    if (!taken.has(candidate)) return candidate;
  }
}

export function datasetText(text, keepDashes = false) {
  if (keepDashes) return text;
  return text

    .replace(/ [-\u2010\u2011] /g, " — ")
    .replace(/[-\u2010\u2011]/g, "_");
}

export function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

export function writeJson(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

export function entryBlock(value) {
  const eol = JSON.stringify(value, null, 2).includes("\r\n") ? "\r\n" : "\n";
  return JSON.stringify(value, null, 2)
    .split(eol)
    .map((line) => `  ${line}`)
    .join(eol);
}

export function parseArgs(argv, valueOptions = []) {
  const takesValue = new Set(valueOptions);
  const flags = new Set();
  const options = new Map();
  const positionals = [];

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) {
      positionals.push(arg);
      continue;
    }
    const [name, inline] = arg.slice(2).split(/=(.*)/s);
    if (inline !== undefined) {
      options.set(name, inline);
      continue;
    }
    if (takesValue.has(name)) {
      const next = argv[index + 1];
      if (next === undefined || next.startsWith("--")) {
        console.error(`--${name} needs a value`);
        process.exit(1);
      }
      options.set(name, next);
      index += 1;
      continue;
    }
    flags.add(name);
  }

  return { flags, options, positionals };
}
