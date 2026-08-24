import type { Title } from "../entities/title";

const DIACRITICS = /[\u0300-\u036f]/g;
const WORD_BREAK = /[\s:'’\-–—.,()!&/]/;

export function normalizeQuery(value: string): string {
  return value.toLowerCase().normalize("NFD").replace(DIACRITICS, "").trim();
}

interface Field {
  readonly text: string;
  readonly weight: number;
}

function fieldsOf(title: Title): Field[] {
  const fields: Field[] = [
    { text: normalizeQuery(title.title), weight: 100 },
    { text: normalizeQuery(title.franchise.name), weight: 30 },
    { text: normalizeQuery(title.phase), weight: 18 },
    { text: normalizeQuery(title.universe), weight: 14 },
    { text: normalizeQuery(title.studio), weight: 14 },
    {
      text: title.type === "series" ? "series show tv" : "movie film",
      weight: 8,
    },
  ];

  if (title.releaseDate) {
    fields.push({ text: String(title.releaseDate.year), weight: 26 });
  }
  if (title.loreStart && title.loreStart.year !== title.releaseDate?.year) {
    fields.push({ text: String(title.loreStart.year), weight: 12 });
  }

  return fields;
}

function scoreField({ text, weight }: Field, token: string): number {
  const at = text.indexOf(token);
  if (at === -1) return 0;
  if (at === 0) return text.length === token.length ? weight * 3 : weight * 2;
  return WORD_BREAK.test(text[at - 1]) ? weight * 1.5 : weight;
}

function scoreTitle(fields: readonly Field[], tokens: readonly string[]) {
  let total = 0;
  for (const token of tokens) {
    let best = 0;
    for (const field of fields) {
      const score = scoreField(field, token);
      if (score > best) best = score;
    }
    if (best === 0) return 0;
    total += best;
  }
  return total;
}

export function searchTitles(
  titles: readonly Title[],
  rawQuery: string,
  limit = 40,
): Title[] {
  const query = normalizeQuery(rawQuery);
  if (!query) return titles.slice(0, limit);

  const tokens = query.split(/\s+/);
  const scored: { title: Title; score: number }[] = [];

  for (const title of titles) {
    const score = scoreTitle(fieldsOf(title), tokens);
    if (score > 0) scored.push({ title, score });
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((entry) => entry.title);
}
