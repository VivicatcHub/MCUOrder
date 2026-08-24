import type { ActorId, CharacterId } from "@/domain/entities/title";

const STORAGE_KEY = "marvel-order:spotlight:v1";

export interface FollowedPerson {
  lens: "character" | "actor";
  id: CharacterId | ActorId;
}

const isFollowedPerson = (value: unknown): value is FollowedPerson => {
  if (typeof value !== "object" || value === null) return false;
  const person = value as Partial<FollowedPerson>;
  return (
    (person.lens === "character" || person.lens === "actor") &&
    typeof person.id === "string" &&
    person.id.length > 0
  );
};

export const spotlightStorage = {
  read(): FollowedPerson | null {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed: unknown = JSON.parse(raw);
      return isFollowedPerson(parsed) ? parsed : null;
    } catch {
      return null;
    }
  },

  write(person: FollowedPerson | null): void {
    if (typeof window === "undefined") return;
    try {
      if (person)
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(person));
      else window.localStorage.removeItem(STORAGE_KEY);
    } catch {}
  },
};
