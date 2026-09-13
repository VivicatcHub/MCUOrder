import type { Title } from "../entities/title";

export type PhaseFilter = string;

export const ALL_PHASES: PhaseFilter = "all";

export function phasesOf(titles: readonly Title[]): string[] {
  const seen = new Set<string>();
  for (const title of titles) seen.add(title.phase);
  return [...seen];
}

export function matchesPhase(title: Title, filter: PhaseFilter): boolean {
  return filter === ALL_PHASES || title.phase === filter;
}
