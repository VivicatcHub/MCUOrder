export interface CharacterDto {
  id: string;
  name: string;
  aka?: string;
}

export interface CastCreditDto {
  characterId: string;
  actorId: string | null;
}

export interface ActorDto {
  id: string;
  name: string;
  photo?: string | null;
  tmdbId?: number | null;
}

export interface FranchiseDto {
  id: string;
  name: string;
  accent: string;
}

export interface TitleDto {
  id: string;
  title: string;
  type: "movie" | "series";
  studio: string;
  universe: string;
  franchiseId: string;
  franchiseIndex: number;
  phase: string;
  releaseDate: string | null;
  loreStart: string | null;
  loreEnd: string | null;
  loreNote: string | null;
  runtimeMinutes: number | null;
  episodes: number | null;
  cast: CastCreditDto[];
  synopsis: string;
  poster?: string | null;
  imdbId?: string | null;
  tmdbId?: number | null;
}

export interface BillingOverrideDto {
  subject: "character" | "actor";
  id: string;
  weight: "principal" | "supporting";
  titleIds?: string[] | null;
  note?: string | null;
}

export interface CatalogDto {
  franchises: FranchiseDto[];
  characters: CharacterDto[];
  actors: ActorDto[];
  titles: TitleDto[];
  billingOverrides: BillingOverrideDto[];
}
