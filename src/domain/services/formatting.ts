import type { Title } from "../entities/title";
import { totalRuntimeMinutes } from "../entities/title";

export function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} min`;
  if (rest === 0) return `${hours} h`;
  return `${hours} h ${String(rest).padStart(2, "0")}`;
}

export function formatRuntime(title: Title): string | null {
  if (title.runtimeMinutes === null) return null;
  if (title.episodes) return `${title.episodes} × ~${title.runtimeMinutes} min`;
  return formatMinutes(title.runtimeMinutes);
}

export function formatTotalRuntime(title: Title): string | null {
  const total = totalRuntimeMinutes(title);
  return total === null ? null : formatMinutes(total);
}

export function formatTypeLabel(title: Title): string {
  return title.type === "series" ? "Series" : "Movie";
}
