import type { ActorId, CharacterId, Title } from "../entities/title";
import { featuresActor } from "./actor-filter";
import { featuresCharacter } from "./character-filter";
import { matchesStudio, type StudioFilter } from "./studio-filter";
import { matchesType, type TypeFilter } from "./type-filter";

export interface Spotlight {
  readonly characterId: CharacterId | null;
  readonly actorId: ActorId | null;
  readonly studio: StudioFilter;
  readonly type: TypeFilter;
}

export const NO_SPOTLIGHT: Spotlight = {
  characterId: null,
  actorId: null,
  studio: "all",
  type: "all",
};

export function isSpotlit(title: Title, spotlight: Spotlight): boolean {
  return (
    featuresCharacter(title, spotlight.characterId) &&
    featuresActor(title, spotlight.actorId) &&
    matchesStudio(title, spotlight.studio) &&
    matchesType(title, spotlight.type)
  );
}

export function isSpotlightActive(spotlight: Spotlight): boolean {
  return (
    spotlight.characterId !== null ||
    spotlight.actorId !== null ||
    spotlight.studio !== "all" ||
    spotlight.type !== "all"
  );
}

export function applySpotlight(
  titles: readonly Title[],
  spotlight: Spotlight,
): Title[] {
  return titles.filter((title) => isSpotlit(title, spotlight));
}
