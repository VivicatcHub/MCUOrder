import type { Title } from "../entities/title";

export type StudioFilter = string;

export const ALL_STUDIOS: StudioFilter = "all";

export function studiosOf(titles: readonly Title[]): string[] {
  const seen = new Set<string>();
  for (const title of titles) if (title.studio) seen.add(title.studio);
  return [...seen];
}

export function matchesStudio(title: Title, filter: StudioFilter): boolean {
  return filter === ALL_STUDIOS || title.studio === filter;
}
