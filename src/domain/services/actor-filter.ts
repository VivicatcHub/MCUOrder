import type {
  Actor,
  ActorId,
  CastCredit,
  CharacterId,
  Title,
} from "../entities/title";

export function featuresActor(title: Title, actorId: ActorId | null): boolean {
  if (!actorId) return true;
  return title.cast.some((credit) => credit.actorId === actorId);
}

export function actorAppearanceCounts(
  titles: readonly Title[],
): Map<ActorId, number> {
  const counts = new Map<ActorId, number>();

  for (const title of titles) {
    for (const actorId of actorIdsOf(title.cast)) {
      counts.set(actorId, (counts.get(actorId) ?? 0) + 1);
    }
  }

  return counts;
}

/** The parts a cast sheet names, each once, still in billing order. */
export function characterIdsOf(
  cast: readonly CastCredit[],
): readonly CharacterId[] {
  return [...new Set(cast.map((credit) => credit.characterId))];
}

/** The people a cast sheet credits, each once — an actor may play two parts. */
export function actorIdsOf(cast: readonly CastCredit[]): readonly ActorId[] {
  const actorIds = cast
    .map((credit) => credit.actorId)
    .filter((actorId) => actorId !== null);

  return [...new Set(actorIds)];
}

export function actorsForCharacter(
  title: Title,
  characterId: CharacterId,
  actors: readonly Actor[],
): Actor[] {
  const playing: Actor[] = [];

  for (const credit of title.cast) {
    if (credit.characterId !== characterId || !credit.actorId) continue;

    const actor = actors.find((candidate) => candidate.id === credit.actorId);
    if (actor && !playing.includes(actor)) playing.push(actor);
  }

  return playing;
}

export function charactersForActor(
  title: Title,
  actorId: ActorId,
): CharacterId[] {
  return [
    ...new Set(
      title.cast
        .filter((credit) => credit.actorId === actorId)
        .map((credit) => credit.characterId),
    ),
  ];
}

/** Every part each actor plays anywhere on the wall, in first-seen order. */
export function charactersByActor(
  titles: readonly Title[],
): Map<ActorId, CharacterId[]> {
  const played = new Map<ActorId, CharacterId[]>();

  for (const title of titles) {
    for (const credit of title.cast) {
      if (!credit.actorId) continue;

      const parts = played.get(credit.actorId);
      if (!parts) played.set(credit.actorId, [credit.characterId]);
      else if (!parts.includes(credit.characterId))
        parts.push(credit.characterId);
    }
  }

  return played;
}

export function castByCharacter(
  title: Title,
  actors: readonly Actor[],
): Map<CharacterId, Actor[]> {
  const byId = new Map(actors.map((actor) => [actor.id, actor]));
  const cast = new Map<CharacterId, Actor[]>();

  for (const credit of title.cast) {
    const actor = credit.actorId ? byId.get(credit.actorId) : undefined;
    if (!actor) continue;

    const playing = cast.get(credit.characterId);
    if (playing) {
      if (!playing.includes(actor)) playing.push(actor);
    } else cast.set(credit.characterId, [actor]);
  }

  return cast;
}
