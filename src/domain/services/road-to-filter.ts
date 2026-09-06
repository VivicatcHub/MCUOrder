import type { FilmDependency } from "../entities/dependency";
import type { TitleId } from "../entities/title";

export function resolveRoadToPrerequisites(
  dependencies: readonly FilmDependency[],
  filmId: TitleId | null,
): ReadonlySet<TitleId> | null {
  if (filmId === null) return null;
  const dependency = dependencies.find((d) => d.filmId === filmId);
  if (!dependency) return new Set();
  return new Set([...dependency.prerequisites, dependency.filmId]);
}

export function matchesRoadTo(
  titleId: TitleId,
  prerequisites: ReadonlySet<TitleId> | null,
): boolean {
  return prerequisites === null || prerequisites.has(titleId);
}
