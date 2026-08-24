import type {
  Actor,
  ActorId,
  CharacterId,
  Title,
  TitleId,
} from "../entities/title";

export function featuresActor(title: Title, actorId: ActorId | null): boolean {
  if (!actorId) return true;
  return title.cast.includes(actorId);
}

export function actorAppearanceCounts(
  titles: readonly Title[],
): Map<ActorId, number> {
  const counts = new Map<ActorId, number>();

  for (const title of titles) {
    for (const actorId of title.cast) {
      counts.set(actorId, (counts.get(actorId) ?? 0) + 1);
    }
  }

  return counts;
}

export function castOf(
  titleId: TitleId,
  characterIds: readonly CharacterId[],
  actors: readonly Actor[],
): ActorId[] {
  const characters = new Set(characterIds);

  return actors
    .filter((actor) =>
      actor.roles.some((role) =>
        role.titleIds
          ? role.titleIds.includes(titleId)
          : characters.has(role.characterId),
      ),
    )
    .map((actor) => actor.id);
}

export function actorsForCharacter(
  title: Title,
  characterId: CharacterId,
  actors: readonly Actor[],
): Actor[] {
  return actors.filter((actor) =>
    actor.roles.some(
      (role) =>
        role.characterId === characterId &&
        (role.titleIds
          ? role.titleIds.includes(title.id)
          : title.characters.includes(characterId)),
    ),
  );
}

export function playedCharacterIds(actor: Actor): CharacterId[] {
  return [...new Set(actor.roles.map((role) => role.characterId))];
}

export function charactersForActor(
  title: Title,
  actorId: ActorId,
  actors: readonly Actor[],
): CharacterId[] {
  const actor = actors.find((candidate) => candidate.id === actorId);
  if (!actor) return [];

  return [
    ...new Set(
      actor.roles
        .filter((role) =>
          role.titleIds
            ? role.titleIds.includes(title.id)
            : title.characters.includes(role.characterId),
        )
        .map((role) => role.characterId),
    ),
  ];
}
