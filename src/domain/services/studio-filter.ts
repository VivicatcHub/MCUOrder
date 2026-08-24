import type { Title } from "../entities/title";

export type StudioGroup = "marvel" | "sony" | "fox";

export type StudioFilter = "all" | StudioGroup;

export const STUDIO_FILTERS: readonly StudioFilter[] = [
  "all",
  "marvel",
  "sony",
  "fox",
];

export const STUDIO_FILTER_LABEL: Record<StudioFilter, string> = {
  all: "All",
  marvel: "Marvel",
  sony: "Sony",
  fox: "Fox",
};

export const STUDIO_FILTER_TITLE: Record<StudioFilter, string> = {
  all: "Every studio",
  marvel: "Marvel Studios and Marvel Animation",
  sony: "Sony Pictures — the SSU and the Spider-Verse films",
  fox: "20th Century Fox — the X-Men line",
};

export function studioGroupOf(title: Title): StudioGroup {
  if (title.studio === "Sony Pictures") return "sony";
  if (title.studio === "20th Century Fox") return "fox";
  return "marvel";
}

export function matchesStudio(title: Title, filter: StudioFilter): boolean {
  return filter === "all" || studioGroupOf(title) === filter;
}

export function isStudioFilter(value: unknown): value is StudioFilter {
  return STUDIO_FILTERS.includes(value as StudioFilter);
}
