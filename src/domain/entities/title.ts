import type { PartialDate } from "./partial-date";

export type TitleId = string;
export type CharacterId = string;
export type ActorId = string;
export type FranchiseId = string;

export type TitleType = "movie" | "series";

export type TitleStatus = "released" | "upcoming";

export type OrderMode = "chronological" | "release";

export interface Character {
  readonly id: CharacterId;
  readonly name: string;

  readonly aka?: string;
}

export interface ActorRole {
  readonly characterId: CharacterId;
  readonly titleIds: readonly TitleId[] | null;
}

export interface Actor {
  readonly id: ActorId;
  readonly name: string;
  readonly roles: readonly ActorRole[];

  readonly photo: string | null;
}

export interface Franchise {
  readonly id: FranchiseId;
  readonly name: string;

  readonly accent: string;
}

export interface Title {
  readonly id: TitleId;
  readonly title: string;
  readonly type: TitleType;
  readonly studio: string;
  readonly universe: string;
  readonly franchise: Franchise;

  readonly franchiseIndex: number;
  readonly phase: string;
  readonly status: TitleStatus;

  readonly releaseDate: PartialDate | null;

  readonly loreStart: PartialDate | null;
  readonly loreEnd: PartialDate | null;
  readonly loreNote: string | null;

  readonly runtimeMinutes: number | null;

  readonly episodes: number | null;
  readonly characters: readonly CharacterId[];

  readonly cast: readonly ActorId[];
  readonly synopsis: string;
  readonly poster: string | null;

  readonly imdbId: string | null;
}

export interface Catalog {
  readonly titles: readonly Title[];
  readonly characters: readonly Character[];
  readonly actors: readonly Actor[];
  readonly franchises: readonly Franchise[];
}

export function isSeries(title: Title): title is Title & { episodes: number } {
  return title.type === "series";
}

export function isUpcoming(title: Title): boolean {
  return title.status === "upcoming";
}

export function totalRuntimeMinutes(title: Title): number | null {
  if (title.runtimeMinutes === null) return null;
  return title.runtimeMinutes * (title.episodes ?? 1);
}
