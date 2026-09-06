import type { TitleId } from "./title";

export interface FilmDependency {
  readonly filmId: TitleId;
  readonly label: string;
  readonly description: string;
  readonly prerequisites: readonly TitleId[];
}
