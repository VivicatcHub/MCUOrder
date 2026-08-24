import type { Title, TitleType } from "../entities/title";

export type TypeFilter = "all" | TitleType;

export const TYPE_FILTERS: readonly TypeFilter[] = ["all", "movie", "series"];

export const TYPE_FILTER_LABEL: Record<TypeFilter, string> = {
  all: "All",
  movie: "Movies",
  series: "Series",
};

export const TYPE_FILTER_TITLE: Record<TypeFilter, string> = {
  all: "Films and series",
  movie: "Films only",
  series: "Series only",
};

export function matchesType(title: Title, filter: TypeFilter): boolean {
  return filter === "all" || title.type === filter;
}

export function isTypeFilter(value: unknown): value is TypeFilter {
  return TYPE_FILTERS.includes(value as TypeFilter);
}
