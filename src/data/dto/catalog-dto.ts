export interface CharacterDto {
  id: string;
  name: string;
  aka?: string;
}

export interface ActorRoleDto {
  characterId: string;
  titleIds?: string[];
}

export interface ActorDto {
  id: string;
  name: string;
  roles: ActorRoleDto[];
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
  status: "released" | "upcoming";
  releaseDate: string | null;
  loreStart: string | null;
  loreEnd: string | null;
  loreNote: string | null;
  runtimeMinutes: number | null;
  episodes: number | null;
  characters: string[];
  synopsis: string;
  poster?: string | null;
  imdbId?: string | null;
  tmdbId?: number | null;
}

export interface CatalogDto {
  franchises: FranchiseDto[];
  characters: CharacterDto[];
  actors: ActorDto[];
  titles: TitleDto[];
}
