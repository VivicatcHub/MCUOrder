import type { CatalogRepository } from "@/domain/ports/catalog-repository";
import type { Catalog } from "@/domain/entities/title";
import type {
  ActorDto,
  CharacterDto,
  FranchiseDto,
  TitleDto,
} from "../dto/catalog-dto";
import { toCatalog } from "../mappers/catalog-mapper";

export class StaticCatalogRepository implements CatalogRepository {
  private cache: Promise<Catalog> | null = null;

  getCatalog(): Promise<Catalog> {
    this.cache ??= Promise.all([
      import("../catalog/franchises.json"),
      import("../catalog/characters.json"),
      import("../catalog/actors.json"),
      import("../catalog/titles.json"),
    ]).then(([franchises, characters, actors, titles]) =>
      toCatalog({
        franchises: franchises.default as unknown as FranchiseDto[],
        characters: characters.default as unknown as CharacterDto[],
        actors: actors.default as unknown as ActorDto[],
        titles: titles.default as unknown as TitleDto[],
      }),
    );
    return this.cache;
  }
}

export const staticCatalogRepository = new StaticCatalogRepository();
