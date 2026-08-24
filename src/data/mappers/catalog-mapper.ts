import { parseOptionalDate } from "@/domain/entities/partial-date";
import type {
  Actor,
  Catalog,
  Character,
  Franchise,
  Title,
} from "@/domain/entities/title";
import { castOf } from "@/domain/services/actor-filter";
import type {
  ActorDto,
  CatalogDto,
  CharacterDto,
  FranchiseDto,
  TitleDto,
} from "../dto/catalog-dto";

function toFranchise(dto: FranchiseDto): Franchise {
  return { id: dto.id, name: dto.name, accent: dto.accent };
}

function toCharacter(dto: CharacterDto): Character {
  return { id: dto.id, name: dto.name, aka: dto.aka };
}

function toActor(dto: ActorDto): Actor {
  return {
    id: dto.id,
    name: dto.name,
    roles: dto.roles.map((role) => ({
      characterId: role.characterId,
      titleIds: role.titleIds ?? null,
    })),
    photo: dto.photo ?? null,
  };
}

function toTitle(
  dto: TitleDto,
  franchises: ReadonlyMap<string, Franchise>,
  actors: readonly Actor[],
): Title {
  const franchise = franchises.get(dto.franchiseId);
  if (!franchise)
    throw new Error(
      `Title "${dto.id}" points at unknown franchise "${dto.franchiseId}"`,
    );

  return {
    id: dto.id,
    title: dto.title,
    type: dto.type,
    studio: dto.studio,
    universe: dto.universe,
    franchise,
    franchiseIndex: dto.franchiseIndex,
    phase: dto.phase,
    status: dto.status,
    releaseDate: parseOptionalDate(dto.releaseDate),
    loreStart: parseOptionalDate(dto.loreStart),
    loreEnd: parseOptionalDate(dto.loreEnd),
    loreNote: dto.loreNote ?? null,
    runtimeMinutes: dto.runtimeMinutes,
    episodes: dto.episodes ?? null,
    characters: dto.characters,
    cast: castOf(dto.id, dto.characters, actors),
    synopsis: dto.synopsis,
    poster: dto.poster ?? null,
    imdbId: dto.imdbId ?? null,
  };
}

export function toCatalog(dto: CatalogDto): Catalog {
  const franchises = dto.franchises.map(toFranchise);
  const byId = new Map(
    franchises.map((franchise) => [franchise.id, franchise]),
  );
  const actors = dto.actors.map(toActor);

  return {
    franchises,
    characters: dto.characters.map(toCharacter),
    actors,
    titles: dto.titles.map((title) => toTitle(title, byId, actors)),
  };
}
