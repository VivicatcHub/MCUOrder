import type { CharacterId, Title } from "../entities/title";

export function featuresCharacter(
  title: Title,
  characterId: CharacterId | null,
): boolean {
  if (!characterId) return true;
  return title.characters.includes(characterId);
}

export function appearanceCounts(
  titles: readonly Title[],
): Map<CharacterId, number> {
  const counts = new Map<CharacterId, number>();

  for (const title of titles) {
    for (const characterId of title.characters) {
      counts.set(characterId, (counts.get(characterId) ?? 0) + 1);
    }
  }

  return counts;
}
