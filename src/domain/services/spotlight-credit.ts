import type { Actor, Character, Title, TitleId } from "../entities/title";
import { actorsForCharacter, charactersForActor } from "./actor-filter";
import type { Spotlight } from "./spotlight";

export type SpotlightCredit =
  | { readonly kind: "actors"; readonly actors: readonly Actor[] }
  | { readonly kind: "characters"; readonly characters: readonly Character[] };

export function creditFor(
  title: Title,
  spotlight: Spotlight,
  characters: readonly Character[],
  actors: readonly Actor[],
): SpotlightCredit | null {
  if (spotlight.characterId) {
    const playing = actorsForCharacter(title, spotlight.characterId, actors);
    return playing.length > 0 ? { kind: "actors", actors: playing } : null;
  }

  if (spotlight.actorId) {
    const parts = charactersForActor(title, spotlight.actorId)
      .map((id) => characters.find((character) => character.id === id))
      .filter((character) => character !== undefined);
    return parts.length > 0 ? { kind: "characters", characters: parts } : null;
  }

  return null;
}

export function creditsFor(
  titles: readonly Title[],
  spotlight: Spotlight,
  characters: readonly Character[],
  actors: readonly Actor[],
): ReadonlyMap<TitleId, SpotlightCredit> {
  const credits = new Map<TitleId, SpotlightCredit>();
  if (!spotlight.characterId && !spotlight.actorId) return credits;

  for (const title of titles) {
    const credit = creditFor(title, spotlight, characters, actors);
    if (credit) credits.set(title.id, credit);
  }

  return credits;
}
