import { parseOptionalDate } from "@/domain/entities/partial-date";
import type {
  Actor,
  BillingOverride,
  Catalog,
  Character,
  Franchise,
  Title,
} from "@/domain/entities/title";
import { characterIdsOf } from "@/domain/services/actor-filter";
import type {
  ActorDto,
  BillingOverrideDto,
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
  return { id: dto.id, name: dto.name, photo: dto.photo ?? null };
}

function toBillingOverride(
  dto: BillingOverrideDto,
  known: { characters: ReadonlySet<string>; actors: ReadonlySet<string> },
  titleIds: ReadonlySet<string>,
): BillingOverride {
  const pool = dto.subject === "actor" ? known.actors : known.characters;
  if (!pool.has(dto.id))
    throw new Error(
      `Billing override points at unknown ${dto.subject} "${dto.id}"`,
    );

  for (const titleId of dto.titleIds ?? []) {
    if (!titleIds.has(titleId))
      throw new Error(
        `Billing override for "${dto.id}" points at unknown title "${titleId}"`,
      );
  }

  return {
    subject: dto.subject,
    id: dto.id,
    weight: dto.weight,
    titleIds: dto.titleIds ?? null,
    note: dto.note ?? null,
  };
}

function toTitle(
  dto: TitleDto,
  franchises: ReadonlyMap<string, Franchise>,
  known: { characters: ReadonlySet<string>; actors: ReadonlySet<string> },
): Title {
  const franchise = franchises.get(dto.franchiseId);
  if (!franchise)
    throw new Error(
      `Title "${dto.id}" points at unknown franchise "${dto.franchiseId}"`,
    );

  const cast = dto.cast.map((credit) => {
    if (!known.characters.has(credit.characterId))
      throw new Error(
        `Title "${dto.id}" credits unknown character "${credit.characterId}"`,
      );
    if (credit.actorId && !known.actors.has(credit.actorId))
      throw new Error(
        `Title "${dto.id}" credits unknown actor "${credit.actorId}"`,
      );

    return { characterId: credit.characterId, actorId: credit.actorId };
  });

  return {
    id: dto.id,
    title: dto.title,
    type: dto.type,
    studio: dto.studio,
    universe: dto.universe,
    franchise,
    franchiseIndex: dto.franchiseIndex,
    phase: dto.phase,
    releaseDate: parseOptionalDate(dto.releaseDate),
    loreStart: parseOptionalDate(dto.loreStart),
    loreEnd: parseOptionalDate(dto.loreEnd),
    loreNote: dto.loreNote ?? null,
    runtimeMinutes: dto.runtimeMinutes,
    episodes: dto.episodes ?? null,
    cast,
    characters: characterIdsOf(cast),
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
  const characters = dto.characters.map(toCharacter);

  const known = {
    characters: new Set(characters.map((character) => character.id)),
    actors: new Set(actors.map((actor) => actor.id)),
  };

  const titles = dto.titles.map((title) => toTitle(title, byId, known));
  const titleIds = new Set(titles.map((title) => title.id));

  return {
    franchises,
    characters,
    actors,
    titles,
    billingOverrides: dto.billingOverrides.map((override) =>
      toBillingOverride(override, known, titleIds),
    ),
  };
}
