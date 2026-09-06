import type { ActorId, CharacterId, Title, TitleId } from "../entities/title";
import { featuresActor } from "./actor-filter";
import { featuresCharacter } from "./character-filter";
import { matchesRoadTo } from "./road-to-filter";
import { matchesStudio, type StudioFilter } from "./studio-filter";
import { matchesType, type TypeFilter } from "./type-filter";
import { matchesWatchedFilter, type WatchedFilter } from "./watched-filter";

export interface Spotlight {
  readonly characterId: CharacterId | null;
  readonly actorId: ActorId | null;
  readonly studio: StudioFilter;
  readonly type: TypeFilter;
  readonly watched: WatchedFilter;
  readonly roadTo: TitleId | null;
}

export const NO_SPOTLIGHT: Spotlight = {
  characterId: null,
  actorId: null,
  studio: "all",
  type: "all",
  watched: "all",
  roadTo: null,
};

export function isSpotlit(
  title: Title,
  spotlight: Spotlight,
  isWatched: boolean,
  roadToPrerequisites: ReadonlySet<TitleId> | null,
): boolean {
  return (
    featuresCharacter(title, spotlight.characterId) &&
    featuresActor(title, spotlight.actorId) &&
    matchesStudio(title, spotlight.studio) &&
    matchesType(title, spotlight.type) &&
    matchesWatchedFilter(isWatched, spotlight.watched) &&
    matchesRoadTo(title.id, roadToPrerequisites)
  );
}

export function isSpotlightActive(spotlight: Spotlight): boolean {
  return (
    spotlight.characterId !== null ||
    spotlight.actorId !== null ||
    spotlight.studio !== "all" ||
    spotlight.type !== "all" ||
    spotlight.watched !== "all" ||
    spotlight.roadTo !== null
  );
}

export function applySpotlight(
  titles: readonly Title[],
  spotlight: Spotlight,
  watchedIds: ReadonlySet<string> = new Set(),
  roadToPrerequisites: ReadonlySet<TitleId> | null = null,
): Title[] {
  return titles.filter((title) =>
    isSpotlit(title, spotlight, watchedIds.has(title.id), roadToPrerequisites),
  );
}
