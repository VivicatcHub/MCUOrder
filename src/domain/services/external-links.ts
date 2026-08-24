import type { Title } from "../entities/title";

const IMDB_TITLE = "https://www.imdb.com/title/";
const IMDB_FIND = "https://www.imdb.com/find/?s=tt&q=";

export function imdbUrl(title: Title): string {
  if (title.imdbId) return `${IMDB_TITLE}${title.imdbId}/`;
  return IMDB_FIND + encodeURIComponent(title.title);
}

export function isImdbGuess(title: Title): boolean {
  return title.imdbId === null;
}
