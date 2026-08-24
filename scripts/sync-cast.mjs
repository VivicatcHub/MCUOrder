import { readFile, writeFile } from "node:fs/promises";
import { resolve as resolvePath } from "node:path";
import {
  PROFILE_SIZE,
  datasetText,
  normalize,
  parseArgs,
  paths,
  readJson,
  requireCredentials,
  root,
  searchQuery,
  seasonOf,
  slugify,
  tmdb,
  uniqueId,
  writeJson,
} from "./lib/tmdb.mjs";

const { flags, options, positionals } = parseArgs(process.argv.slice(2), [
  "limit",
  "min-episodes",
]);
const dryRun = flags.has("dry-run");
const keepDashes = flags.has("keep-dashes");
const withUncredited = !flags.has("no-uncredited");
const withPhotos = !flags.has("no-photos");
const limit = Number(options.get("limit") ?? 0) || Infinity;
const minEpisodes = Number(options.get("min-episodes") ?? 1);

requireCredentials();

const titles = readJson(paths.titles);
const characters = readJson(paths.characters);
const actors = readJson(paths.actors);

const aliases = readJson(resolvePath(root, "scripts/catalog-aliases.json"));
const aliasIds = new Map(
  Object.entries(aliases.characters ?? {}).map(([key, id]) => [
    normalize(key),
    id,
  ]),
);
const skipParts = new Set((aliases.skip ?? []).map((part) => normalize(part)));

for (const id of aliasIds.values())
  if (!characters.some((character) => character.id === id)) {
    console.error(`catalog-aliases.json points at unknown character "${id}"`);
    process.exit(1);
  }

const byId = new Map(titles.map((title) => [title.id, title]));
let targets;

if (positionals.length > 0) {
  targets = positionals.map((id) => {
    const title = byId.get(id);
    if (!title) {
      console.error(`No entry with id "${id}" in titles.json`);
      process.exit(1);
    }
    return title;
  });
} else if (flags.has("all")) {
  targets = titles;
} else {
  targets = titles.filter((title) => title.characters.length === 0);
  if (targets.length === 0) {
    console.log(
      "Every entry already has a cast. Name the ones to re-sync, or pass --all.",
    );
    process.exit(0);
  }
}

const characterIds = new Set(characters.map((character) => character.id));
const characterById = new Map(
  characters.map((character) => [character.id, character]),
);
const actorIds = new Set(actors.map((actor) => actor.id));

const byName = new Map();
const byAka = new Map();

for (const character of characters) {
  byName.set(normalize(character.name), character);
  if (!character.aka) continue;
  const key = normalize(character.aka);

  byAka.set(key, byAka.has(key) ? null : character);
}

const actorByTmdb = new Map(
  actors.filter((actor) => actor.tmdbId).map((actor) => [actor.tmdbId, actor]),
);
const actorByName = new Map(
  actors.map((actor) => [normalize(actor.name), actor]),
);

async function resolve(title) {
  const kind = title.type === "series" ? "tv" : "movie";

  if (title.tmdbId) return { kind, id: title.tmdbId, how: "tmdbId" };

  if (title.imdbId) {
    const found = await tmdb(`/find/${title.imdbId}`, {
      external_source: "imdb_id",
    });
    const match =
      kind === "tv"
        ? (found.tv_results?.[0] ?? found.movie_results?.[0])
        : (found.movie_results?.[0] ?? found.tv_results?.[0]);
    if (match)
      return {
        kind: found.tv_results?.includes(match) ? "tv" : kind,
        id: match.id,
        how: "imdbId",
      };
  }

  const search = await tmdb(`/search/${kind}`, {
    query: searchQuery(title.title),
  });
  const wantedName = normalize(title.title);
  const wantedYear = title.releaseDate?.slice(0, 4) ?? null;
  let best = null;

  for (const candidate of (search.results ?? []).slice(0, 10)) {
    const name = normalize(candidate.title ?? candidate.name ?? "");
    const year = (
      candidate.release_date ??
      candidate.first_air_date ??
      ""
    ).slice(0, 4);
    const score =
      name === wantedName && year === wantedYear
        ? 2
        : name === wantedName
          ? 1
          : 0;
    if (!best || score > best.score) best = { candidate, score };
    if (score === 2) break;
  }

  if (!best || best.score === 0) return null;
  return {
    kind,
    id: best.candidate.id,
    how: best.score === 2 ? "search" : "search (name only)",
  };
}

function inOrder(credits) {
  return credits.sort(
    (one, two) =>
      (one.order ?? Number.MAX_SAFE_INTEGER) -
        (two.order ?? Number.MAX_SAFE_INTEGER) || two.episodes - one.episodes,
  );
}

async function creditsFor(title, found) {
  if (found.kind === "movie") {
    const credits = await tmdb(`/movie/${found.id}/credits`);
    return inOrder(
      (credits.cast ?? []).map((entry) => ({
        tmdbId: entry.id,
        name: entry.name,
        profilePath: entry.profile_path,
        character: entry.character ?? "",
        order: entry.order,
        episodes: 1,
      })),
    );
  }

  const season = seasonOf(title.title);
  let credits;
  try {
    credits = await tmdb(
      season
        ? `/tv/${found.id}/season/${season}/aggregate_credits`
        : `/tv/${found.id}/aggregate_credits`,
    );
  } catch (cause) {
    if (!season || cause.status !== 404) throw cause;

    credits = await tmdb(`/tv/${found.id}/aggregate_credits`);
  }

  const rows = [];
  for (const entry of credits.cast ?? []) {
    for (const role of entry.roles ?? []) {
      rows.push({
        tmdbId: entry.id,
        name: entry.name,
        profilePath: entry.profile_path,
        character: role.character ?? "",
        order: entry.order,
        episodes: role.episode_count ?? 0,
      });
    }
  }
  return inOrder(rows);
}

const HONORIFICS = new Set(
  (
    "agent captain colonel commander detective doctor dr general lieutenant lt " +
    "major miss mr mrs ms officer president professor sergeant sgt sir the young"
  ).split(" "),
);

const NOT_A_PART =
  /^(self|himself|herself|themself|themselves|various|various characters|additional voices?|extras?|background|cameo|uncredited|narrator's voice)$/i;

function parsePart(raw) {
  const uncredited = /\(uncredited\)/i.test(raw);
  const cleaned = raw
    .replace(/\([^)]*\)/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const segments = cleaned
    .split(/\s*[/|]\s*/)
    .map((segment) => segment.replace(/^[-–—,\s]+|[-–—,\s]+$/g, "").trim())
    .filter(Boolean);

  if (segments.length === 0) return null;
  const [name, aka] = segments;
  if (NOT_A_PART.test(name)) return null;

  return {
    uncredited,
    name: datasetText(name, keepDashes),
    aka:
      aka && normalize(aka) !== normalize(name)
        ? datasetText(aka, keepDashes)
        : null,
  };
}

const ambiguous = [];
const invented = [];

function byTokens(name, credit, title) {
  const wanted = normalize(name)
    .split(" ")
    .filter((word) => !HONORIFICS.has(word));
  if (wanted.length === 0) return undefined;

  const matches = characters.filter((character) => {
    const tokens = normalize(character.name).split(" ");

    if (tokens.length < wanted.length) return false;
    return (
      wanted.every((word) => tokens.includes(word)) &&
      wanted.includes(tokens[tokens.length - 1])
    );
  });

  if (matches.length === 1) return matches[0];
  if (matches.length > 1)
    ambiguous.push(
      `${title.id}: "${credit.character}" (${credit.name}) — could be ` +
        matches.map((character) => character.id).join(" or "),
    );
  return matches.length > 1 ? null : undefined;
}

function characterFor(part, credit, title) {
  for (const key of [part.name, part.aka].filter(Boolean)) {
    if (skipParts.has(normalize(key))) return null;
    const alias = aliasIds.get(normalize(key));
    if (alias) return characterById.get(alias);
  }

  const name = byName.get(normalize(part.name));
  if (name) return name;

  if (part.aka) {
    const swapped = byName.get(normalize(part.aka));
    if (swapped) return swapped;
  }

  for (const key of [part.name, part.aka].filter(Boolean)) {
    if (!byAka.has(normalize(key))) continue;
    const match = byAka.get(normalize(key));
    if (match) return match;

    ambiguous.push(
      `${title.id}: "${credit.character}" (${credit.name}) — "${key}" is a codename two characters share`,
    );
    return null;
  }

  for (const key of [part.name, part.aka].filter(Boolean)) {
    const tokens = byTokens(key, credit, title);
    if (tokens === null) return null;
    if (tokens) return tokens;
  }

  const character = {
    id: uniqueId(slugify(part.name), characterIds),
    name: part.name,
  };
  if (part.aka) character.aka = part.aka;

  characterIds.add(character.id);
  characterById.set(character.id, character);
  characters.push(character);
  byName.set(normalize(character.name), character);
  if (character.aka) {
    const key = normalize(character.aka);
    byAka.set(key, byAka.has(key) ? null : character);
  }
  invented.push(
    `${character.id} — ${character.name}${character.aka ? ` (${character.aka})` : ""}`,
  );
  return character;
}

function actorFor(credit) {
  const existing =
    actorByTmdb.get(credit.tmdbId) ?? actorByName.get(normalize(credit.name));

  if (existing) {
    if (!existing.tmdbId) {
      existing.tmdbId = credit.tmdbId;
      actorByTmdb.set(credit.tmdbId, existing);
    }
    if (withPhotos && !existing.photo && credit.profilePath)
      existing.photo = `https://image.tmdb.org/t/p/${PROFILE_SIZE}${credit.profilePath}`;
    return { actor: existing, created: false };
  }

  const actor = {
    id: uniqueId(slugify(credit.name), actorIds),
    name: datasetText(credit.name, keepDashes),
    roles: [],
    photo:
      withPhotos && credit.profilePath
        ? `https://image.tmdb.org/t/p/${PROFILE_SIZE}${credit.profilePath}`
        : null,
    tmdbId: credit.tmdbId,
  };

  actorIds.add(actor.id);
  actors.push(actor);
  actorByTmdb.set(actor.tmdbId, actor);
  actorByName.set(normalize(actor.name), actor);
  return { actor, created: true };
}

function attach(actor, characterId, titleId) {
  const role = actor.roles.find(
    (candidate) => candidate.characterId === characterId,
  );
  if (!role) {
    actor.roles.push({ characterId, titleIds: [titleId] });
    return true;
  }
  if (!role.titleIds || role.titleIds.includes(titleId)) return false;
  role.titleIds.push(titleId);
  return true;
}

const updates = new Map();
const unresolved = [];
const stats = {
  titles: 0,
  characters: characters.length,
  actors: actors.length,
  roles: 0,
};

console.log(`${targets.length} of ${titles.length} entries to sync\n`);

for (const [index, title] of targets.entries()) {
  const label = `${String(index + 1).padStart(3)}/${targets.length} ${title.title}`;

  let found;
  let credits;
  try {
    found = await resolve(title);
    if (!found) {
      console.warn(`? ${label}: no TMDB match`);
      unresolved.push(title.id);
      continue;
    }
    credits = await creditsFor(title, found);
  } catch (cause) {
    console.warn(`! ${label}: ${cause.message}`);
    unresolved.push(title.id);
    continue;
  }

  const list = [...title.characters];
  const seen = new Set();
  let kept = 0;
  let addedCharacters = 0;
  let addedRoles = 0;
  let addedActors = 0;

  for (const credit of credits) {
    if (kept >= limit) break;
    if (title.type === "series" && credit.episodes < minEpisodes) continue;

    const part = parsePart(credit.character);
    if (!part) continue;
    if (part.uncredited && !withUncredited) continue;

    const before = characterIds.size;
    const character = characterFor(part, credit, title);
    if (!character) continue;
    if (characterIds.size > before) addedCharacters += 1;

    const pair = `${credit.tmdbId}:${character.id}`;
    if (seen.has(pair)) continue;
    seen.add(pair);
    kept += 1;

    if (!list.includes(character.id)) list.push(character.id);

    const { actor, created } = actorFor(credit);
    if (created) addedActors += 1;
    if (attach(actor, character.id, title.id)) addedRoles += 1;
  }

  if (list.length !== title.characters.length) updates.set(title.id, list);
  if (addedCharacters + addedActors + addedRoles > 0) stats.titles += 1;
  stats.roles += addedRoles;

  console.log(
    `↓ ${label} — ${kept} credits (${found.how}): ` +
      `+${addedCharacters} characters, +${addedActors} actors, +${addedRoles} roles`,
  );
}

function renderCharacters(ids, trailing) {
  const inline = `    "characters": [${ids.map((id) => JSON.stringify(id)).join(", ")}]${trailing}`;
  if (inline.length <= 100) return inline;

  return [
    '    "characters": [',
    ...ids.map(
      (id, index) =>
        `      ${JSON.stringify(id)}${index < ids.length - 1 ? "," : ""}`,
    ),
    `    ]${trailing}`,
  ].join("\n");
}

function patch(raw, lists) {
  const lines = raw.split("\n");
  const out = [];
  let current = null;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const id = /^ {4}"id": "(.+)",$/.exec(line);
    if (id) current = id[1];

    const opener = /^ {4}"characters": \[/.test(line);
    if (!opener || !current || !lists.has(current)) {
      out.push(line);
      continue;
    }

    const oneLine = /^ {4}"characters": \[.*\](,?)$/.exec(line);
    let trailing;
    if (oneLine) {
      trailing = oneLine[1];
    } else {
      while (index < lines.length && !/^ {4}\](,?)$/.test(lines[index]))
        index += 1;
      trailing = /^ {4}\](,?)$/.exec(lines[index])?.[1] ?? "";
    }
    out.push(renderCharacters(lists.get(current), trailing));
  }

  return out.join("\n");
}

if (!dryRun) {
  if (updates.size > 0)
    await writeFile(
      paths.titles,
      patch(await readFile(paths.titles, "utf8"), updates),
    );
  if (characters.length > stats.characters)
    writeJson(paths.characters, characters);

  if (actors.length > stats.actors || stats.roles > 0)
    writeJson(paths.actors, actors);
}

console.log(
  [
    "",
    `done — ${stats.titles} entries updated, ` +
      `+${characters.length - stats.characters} characters (${characters.length} total), ` +
      `+${actors.length - stats.actors} actors (${actors.length} total), ` +
      `+${stats.roles} roles`,
    dryRun ? "(--dry-run: nothing written)" : "",
    ambiguous.length
      ? "\nskipped — the codename alone does not say who this is:"
      : "",
    ...ambiguous.slice(0, 40).map((line) => `  ${line}`),
    ambiguous.length > 40 ? `  … and ${ambiguous.length - 40} more` : "",
    invented.length ? `\nnew characters:` : "",
    ...invented.slice(0, 40).map((line) => `  ${line}`),
    invented.length > 40 ? `  … and ${invented.length - 40} more` : "",
    unresolved.length
      ? `\nno TMDB match, or unreachable: ${unresolved.join(", ")}`
      : "",
  ]
    .filter(Boolean)
    .join("\n"),
);
