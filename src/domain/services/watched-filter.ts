export type WatchedFilter = "all" | "watched" | "unwatched";

export const WATCHED_FILTERS: readonly WatchedFilter[] = ["all", "watched", "unwatched"];

export const WATCHED_FILTER_LABEL: Record<WatchedFilter, string> = {
  all: "All",
  watched: "Watched",
  unwatched: "Not watched",
};

export const WATCHED_FILTER_TITLE: Record<WatchedFilter, string> = {
  all: "All titles",
  watched: "Watched only",
  unwatched: "Not watched only",
};

export function matchesWatchedFilter(watched: boolean, filter: WatchedFilter): boolean {
  return filter === "all" || (filter === "watched" && watched) || (filter === "unwatched" && !watched);
}

export function isWatchedFilter(value: unknown): value is WatchedFilter {
  return WATCHED_FILTERS.includes(value as WatchedFilter);
}
