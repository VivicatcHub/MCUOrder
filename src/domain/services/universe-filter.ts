import type { Title } from "../entities/title";

export type UniverseFilter = string;

export const ALL_UNIVERSES: UniverseFilter = "all";

export function universesOf(titles: readonly Title[]): string[] {
  const seen = new Set<string>();
  for (const title of titles) seen.add(title.universe);
  return [...seen];
}

export function matchesUniverse(title: Title, filter: UniverseFilter): boolean {
  return filter === ALL_UNIVERSES || title.universe === filter;
}
