import type { PartialDate } from "./partial-date";
import type { FilmDependency } from "./dependency";
import { compareDates, todayPartialDate } from "./partial-date";

export type TitleId = string;
export type CharacterId = string;
export type ActorId = string;
export type FranchiseId = string;

export type TitleType = "movie" | "series" | "oneshot";

export type OrderMode = "chronological" | "release";

export interface Character {
  readonly id: CharacterId;
  readonly name: string;

  readonly aka?: string;
}

export interface CastCredit {
  readonly characterId: CharacterId;
  readonly actorId: ActorId | null;
}

export interface Actor {
  readonly id: ActorId;
  readonly name: string;

  readonly photo: string | null;
}

export type BillingWeight = "principal" | "supporting";

export type BillingSubject = "character" | "actor";

export interface BillingOverride {
  readonly subject: BillingSubject;
  readonly id: CharacterId | ActorId;
  readonly weight: BillingWeight;

  readonly titleIds: readonly TitleId[] | null;
  readonly note: string | null;
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
  readonly universe: string | null;
  readonly franchise: Franchise;

  readonly franchiseIndex: number;
  readonly phase: string | null;

  readonly releaseDate: PartialDate | null;

  readonly loreStart: PartialDate | null;
  readonly loreEnd: PartialDate | null;
  readonly loreNote: string | null;

  readonly runtimeMinutes: number | null;

  readonly episodes: number | null;

  readonly cast: readonly CastCredit[];

  readonly characters: readonly CharacterId[];
  readonly synopsis: string;
  readonly poster: string | null;

  readonly imdbId: string | null;
}

export interface Catalog {
  readonly titles: readonly Title[];
  readonly characters: readonly Character[];
  readonly actors: readonly Actor[];
  readonly franchises: readonly Franchise[];

  readonly billingOverrides: readonly BillingOverride[];
  readonly dependencies: readonly FilmDependency[];
}

export function isSeries(title: Title): title is Title & { episodes: number } {
  return title.type === "series";
}

export function isUpcoming(
  title: Title,
  now: PartialDate = todayPartialDate(),
): boolean {
  if (!title.releaseDate) return true;
  return compareDates(title.releaseDate, now) > 0;
}

export function totalRuntimeMinutes(title: Title): number | null {
  if (title.runtimeMinutes === null) return null;
  return title.runtimeMinutes * (title.episodes ?? 1);
}
