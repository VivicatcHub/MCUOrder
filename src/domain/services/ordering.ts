import { compareOptionalDates } from "../entities/partial-date";
import type { OrderMode, Title } from "../entities/title";

export const ORDER_MODES: readonly OrderMode[] = ["chronological", "release"];

export const ORDER_MODE_LABEL: Record<OrderMode, string> = {
  chronological: "Chronological order",
  release: "Release order",
};

export function isOrderMode(value: unknown): value is OrderMode {
  return value === "chronological" || value === "release";
}

export function sortTitles(titles: readonly Title[], mode: OrderMode): Title[] {
  const sorted = [...titles];
  sorted.sort((a, b) => {
    if (mode === "chronological") {
      const byStart = compareOptionalDates(a.loreStart, b.loreStart);
      if (byStart !== 0) return byStart;
      const byEnd = compareOptionalDates(a.loreEnd, b.loreEnd);
      if (byEnd !== 0) return byEnd;
    } else {
      const byRelease = compareOptionalDates(a.releaseDate, b.releaseDate);
      if (byRelease !== 0) return byRelease;
    }
    if (a.franchise.id === b.franchise.id)
      return a.franchiseIndex - b.franchiseIndex;
    return a.title.localeCompare(b.title);
  });
  return sorted;
}
