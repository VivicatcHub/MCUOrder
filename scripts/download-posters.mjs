import { mkdir, readFile, writeFile, access } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dataPath = resolve(root, "src/data/catalog/titles.json");
const outDir = resolve(root, "public/posters");

const titles = JSON.parse(await readFile(dataPath, "utf8"));
await mkdir(outDir, { recursive: true });

let downloaded = 0;
let skipped = 0;

const vendored = new Map();

for (const title of titles) {
  if (!title.poster || title.poster.startsWith("/posters/")) {
    skipped += 1;
    continue;
  }

  const file = `${title.id}.jpg`;
  const target = resolve(outDir, file);

  try {
    await access(target);
  } catch {
    const response = await fetch(title.poster);
    if (!response.ok) {
      console.warn(`! ${title.id}: HTTP ${response.status}`);
      continue;
    }
    await writeFile(target, Buffer.from(await response.arrayBuffer()));
    downloaded += 1;
    console.log(`↓ ${file}`);
  }

  vendored.set(title.id, `/posters/${file}`);
}

function patch(raw, posters) {
  const out = [];
  let current = null;

  const eol = raw.includes("\r\n") ? "\r\n" : "\n";
  for (const line of raw.split(eol)) {
    const id = /^ {4}"id": "(.+)",$/.exec(line);
    if (id) current = id[1];

    const poster = /^( {4})"poster": (.*?)(,?)$/.exec(line);
    if (poster && current && posters.has(current)) {
      out.push(
        `${poster[1]}"poster": ${JSON.stringify(posters.get(current))}${poster[3]}`,
      );
      continue;
    }

    out.push(line);
  }
  return out.join(eol);
}

if (vendored.size > 0)
  await writeFile(dataPath, patch(await readFile(dataPath, "utf8"), vendored));
console.log(`\ndone — ${downloaded} downloaded, ${skipped} skipped`);
