import { readFile, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { resolve as resolvePath } from "node:path";
import {
  POSTER_SIZE,
  datasetText,
  entryBlock,
  normalize,
  parseArgs,
  paths,
  readJson,
  requireCredentials,
  root,
  slugify,
  tmdb,
  uniqueId,
  writeJson,
} from "./lib/tmdb.mjs";

const { flags, options } = parseArgs(process.argv.slice(2), [
  "query",
  "tmdb",
  "imdb",
  "type",
  "season",
  "year",
  "franchise",
  "franchise-name",
  "accent",
  "index",
  "phase",
  "studio",
  "universe",
  "id",
  "title",
  "synopsis",
  "lore-start",
  "lore-end",
  "lore-note",
]);

const dryRun = flags.has("dry-run");
const keepDashes = flags.has("keep-dashes");
const force = flags.has("force");
const text = (value) => datasetText(value, keepDashes);

function fail(message) {
  console.error(message);
  process.exit(1);
}

requireCredentials();

const titles = readJson(paths.titles);
const franchises = readJson(paths.franchises);

const season = options.has("season") ? Number(options.get("season")) : null;
let kind = options.get("type") ?? (season !== null ? "series" : null);
if (kind !== null && kind !== "movie" && kind !== "series")
  fail('--type must be "movie" or "series"');

async function findRecord() {
  if (options.has("tmdb")) {
    const id = Number(options.get("tmdb"));

    const order = kind === "series" ? ["tv", "movie"] : ["movie", "tv"];
    for (const path of order) {
      try {
        const record = await tmdb(`/${path}/${id}`);
        return { path, record };
      } catch (cause) {
        if (cause.status !== 404) throw cause;
      }
    }
    fail(`TMDB has no movie or show with id ${id}`);
  }

  if (options.has("imdb")) {
    const found = await tmdb(`/find/${options.get("imdb")}`, {
      external_source: "imdb_id",
    });
    const movie = found.movie_results?.[0];
    const show = found.tv_results?.[0];
    const pick = kind === "series" ? (show ?? movie) : (movie ?? show);
    if (!pick) fail(`TMDB knows no entry with IMDb id ${options.get("imdb")}`);
    const path = pick === show ? "tv" : "movie";
    return { path, record: await tmdb(`/${path}/${pick.id}`) };
  }

  if (!options.has("query"))
    fail(
      'Name the entry: --tmdb <id>, --imdb <tt…>, or --query "Title".\n' +
        "Add --franchise <id> for the franchise it belongs to.",
    );

  const path = kind === "series" ? "tv" : "movie";
  const year = options.get("year");
  const search = await tmdb(`/search/${path}`, {
    query: options.get("query"),
    ...(year
      ? path === "tv"
        ? { first_air_date_year: year }
        : { primary_release_year: year }
      : {}),
  });
  const results = search.results ?? [];
  if (results.length === 0)
    fail(`No TMDB ${path} matches "${options.get("query")}"`);

  const wanted = normalize(options.get("query"));
  const yearOf = (result) =>
    (result.release_date ?? result.first_air_date ?? "").slice(0, 4);
  const ranked = [...results].sort((one, two) => scoreOf(two) - scoreOf(one));

  function scoreOf(result) {
    const name = normalize(result.title ?? result.name ?? "");
    return (
      (name === wanted ? 2 : 0) + (year && yearOf(result) === year ? 1 : 0)
    );
  }

  if (ranked.length > 1) {
    console.log(
      `TMDB matches (taking the first — pass --tmdb <id> for another):`,
    );
    for (const result of ranked.slice(0, 5))
      console.log(
        `  ${String(result.id).padStart(7)}  ${result.title ?? result.name} ` +
          `(${yearOf(result) || "?"})`,
      );
    console.log("");
  }

  return { path, record: await tmdb(`/${path}/${ranked[0].id}`) };
}

const { path, record } = await findRecord();
kind = path === "tv" ? "series" : "movie";

const seasonRecord =
  season !== null
    ? await tmdb(`/tv/${record.id}/season/${season}`).catch(() => null)
    : null;
if (season !== null && !seasonRecord)
  fail(`TMDB has no season ${season} of "${record.name}"`);

const franchiseId = options.get("franchise");
if (!franchiseId)
  fail(
    "--franchise <id> is required — it is what colours the card.\n" +
      `known: ${franchises.map((franchise) => franchise.id).join(", ")}\n` +
      'a new one: --franchise ghost_rider --franchise-name "Ghost Rider" --accent "#c2410c"',
  );

let franchise = franchises.find((entry) => entry.id === franchiseId);
const newFranchise = !franchise;
if (!franchise) {
  const name = options.get("franchise-name");
  if (!name)
    fail(
      `No franchise "${franchiseId}" in franchises.json.\n` +
        `known: ${franchises.map((entry) => entry.id).join(", ")}\n` +
        `to add it: --franchise ${franchiseId} --franchise-name "…" --accent "#rrggbb"`,
    );
  franchise = {
    id: franchiseId,
    name: text(name),
    accent: options.get("accent") ?? "#7c5cff",
  };
  franchises.push(franchise);
  console.log(`+ franchise ${franchise.id} (${franchise.accent})`);
}

function studioOf() {
  if (options.has("studio")) return text(options.get("studio"));
  const companies = (record.production_companies ?? [])
    .map((company) => company.name.toLowerCase())
    .join(" | ");
  const networks = (record.networks ?? [])
    .map((network) => network.name)
    .join(" ");
  const animated = (record.genres ?? []).some(
    (genre) => genre.name === "Animation",
  );

  if (/20th century|fox 2000/.test(companies)) return "20th Century Fox";
  if (/sony|columbia|arad/.test(companies)) return "Sony Pictures";
  if (
    /marvel animation/.test(companies) ||
    (animated && /marvel/.test(companies + networks))
  )
    return "Marvel Animation";
  return "Marvel Studios";
}

const studio = studioOf();

const UNIVERSE = {
  "20th Century Fox": "Earth_10005 (Fox X-Men)",
  "Sony Pictures": "Earth_688 (SSU)",
  "Marvel Animation": "Earth_616 (Sacred Timeline)",
  "Marvel Studios": "Earth_616 (Sacred Timeline)",
};
const universe = options.has("universe")
  ? text(options.get("universe"))
  : UNIVERSE[studio];

const releaseDate =
  seasonRecord?.air_date ??
  record.release_date ??
  record.first_air_date ??
  null;

function phaseOf() {
  if (options.has("phase")) return text(options.get("phase"));
  const neighbours = titles
    .filter((title) => title.studio === studio && title.releaseDate)
    .sort(
      (one, two) =>
        Math.abs(
          Date.parse(one.releaseDate) - Date.parse(releaseDate ?? "2100-01-01"),
        ) -
        Math.abs(
          Date.parse(two.releaseDate) - Date.parse(releaseDate ?? "2100-01-01"),
        ),
    );
  return neighbours[0]?.phase ?? "Unassigned";
}

const phase = phaseOf();

const franchiseIndex = options.has("index")
  ? Number(options.get("index"))
  : Math.max(
      0,
      ...titles
        .filter((title) => title.franchiseId === franchiseId)
        .map((title) => title.franchiseIndex),
    ) + 1;

const baseTitle = text(
  options.get("title") ??
    (seasonRecord
      ? `${record.name} — Season ${season}`
      : (record.title ?? record.name)),
);

const taken = new Set(titles.map((title) => title.id));
const wantedId = options.get("id") ?? slugify(baseTitle);
if (taken.has(wantedId) && !force)
  fail(
    `titles.json already has "${wantedId}". Pass --id <other> for a second ` +
      "entry of the same name, or --force to add it anyway.",
  );
const id = force ? uniqueId(wantedId, taken) : wantedId;

const external = await tmdb(`/${path}/${record.id}/external_ids`).catch(
  () => ({}),
);
const imdbId = external.imdb_id ?? null;
if (imdbId && !force) {
  const clash = titles.find((title) => title.imdbId === imdbId);
  if (clash)
    fail(
      `${clash.id} already carries ${imdbId}. Pass --force to add it anyway.`,
    );
}

const runtime =
  kind === "movie"
    ? (record.runtime ?? null)
    : (record.episode_run_time?.[0] ?? averageEpisode(seasonRecord) ?? null);

function averageEpisode(seasonEntry) {
  const runtimes = (seasonEntry?.episodes ?? [])
    .map((episode) => episode.runtime)
    .filter((value) => typeof value === "number" && value > 0);
  if (runtimes.length === 0) return null;
  return Math.round(
    runtimes.reduce((sum, value) => sum + value, 0) / runtimes.length,
  );
}

const posterPath = seasonRecord?.poster_path ?? record.poster_path ?? null;
const overview = seasonRecord?.overview || record.overview || "";
const today = new Date().toISOString().slice(0, 10);

const entry = {
  id,
  title: baseTitle,
  type: kind,
  studio,
  universe,
  franchiseId,
  franchiseIndex,
  phase,
  releaseDate,
  loreStart: options.get("lore-start") ?? null,
  loreEnd: options.get("lore-end") ?? null,
  loreNote: options.has("lore-note") ? text(options.get("lore-note")) : null,
  runtimeMinutes: runtime,
  ...(kind === "series"
    ? {
        episodes:
          seasonRecord?.episodes?.length ?? record.number_of_episodes ?? null,
      }
    : {}),
  cast: [],
  synopsis: text(options.get("synopsis") ?? overview),
  poster: posterPath
    ? `https://image.tmdb.org/t/p/${POSTER_SIZE}${posterPath}`
    : null,
  imdbId,
  tmdbId: record.id,
};

const sortKey = (date) =>
  date ? Number(date.replace(/-/g, "")) : Number.MAX_SAFE_INTEGER;

const successor = titles.find(
  (title) => sortKey(title.releaseDate) > sortKey(entry.releaseDate),
);

function insert(raw, block, beforeId) {
  const lines = raw.split("\n");

  if (!beforeId) {
    let last = lines.length - 1;
    while (last >= 0 && !/^ {2}\}$/.test(lines[last])) last -= 1;
    if (last < 0) throw new Error("titles.json does not end in an entry");
    lines[last] = "  },";
    lines.splice(last + 1, 0, block);
    return lines.join("\n");
  }

  const marker = lines.findIndex((line) => line === `    "id": "${beforeId}",`);
  if (marker < 0)
    throw new Error(`could not find "${beforeId}" in titles.json`);
  let open = marker;
  while (open >= 0 && !/^ {2}\{$/.test(lines[open])) open -= 1;
  lines.splice(open, 0, `${block},`);
  return lines.join("\n");
}

const block = entryBlock(entry);

if (dryRun) {
  console.log(block);
} else {
  await writeFile(
    paths.titles,
    insert(await readFile(paths.titles, "utf8"), block, successor?.id ?? null),
  );
  if (newFranchise) writeJson(paths.franchises, franchises);
}

const status =
  entry.releaseDate && entry.releaseDate <= today ? "released" : "upcoming";

console.log(
  [
    "",
    `${dryRun ? "would add" : "added"} ${entry.id} — ${entry.title}`,
    `  ${entry.type} · ${entry.studio} · ${entry.phase} · ${entry.franchiseId} #${entry.franchiseIndex}`,
    `  ${entry.releaseDate ?? "no date"} · ${status} · ${entry.imdbId ?? "no IMDb id"} · TMDB #${entry.tmdbId}`,
    entry.poster ? "" : "  no poster on TMDB — PosterArt will draw one",
    "",
    "next: fill in loreStart / loreEnd (TMDB does not know them)" +
      (flags.has("cast")
        ? ""
        : `, then: node scripts/sync-cast.mjs ${entry.id}`),
  ]
    .filter((line) => line !== "")
    .join("\n"),
);

if (flags.has("cast") && !dryRun) {
  console.log("");
  const child = spawn(
    process.execPath,
    [
      resolvePath(root, "scripts/sync-cast.mjs"),
      entry.id,
      ...(keepDashes ? ["--keep-dashes"] : []),
    ],
    { stdio: "inherit" },
  );
  child.on("exit", (code) => process.exit(code ?? 0));
}
