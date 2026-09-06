import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

let raw = "";
try {
  raw = readFileSync(resolve(root, ".env"), "utf8");
} catch { }

const eol = raw.includes("\r\n") ? "\r\n" : "\n";
for (const line of raw.split(eol)) {
  const match = /^\s*(?:export\s+)?([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line);
  if (!match) continue;
  const value = match[2].trim().replace(/^["']|["']$/g, "");
  if (!process.env[match[1]]) process.env[match[1]] = value;
}
