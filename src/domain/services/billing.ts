import type {
  ActorId,
  BillingOverride,
  BillingWeight,
  CharacterId,
  Title,
  TitleId,
} from "../entities/title";

export const TOP_BILLED = 12;

export const RECURRING_MIN = 3;

export interface BilledCast {
  readonly principal: readonly CharacterId[];
  readonly supporting: readonly CharacterId[];
}

/**
 * Hand-written verdicts that beat the billing rule, resolved down to the one
 * thing the rule works in: a character, in a title. An entry scoped to a title
 * beats an unscoped one for that title.
 */
export interface BillingOverrideIndex {
  readonly everywhere: ReadonlyMap<CharacterId, BillingWeight>;
  readonly perTitle: ReadonlyMap<
    TitleId,
    ReadonlyMap<CharacterId, BillingWeight>
  >;
}

export const NO_BILLING_OVERRIDES: BillingOverrideIndex = {
  everywhere: new Map(),
  perTitle: new Map(),
};

interface PlayedPart {
  readonly titleId: TitleId;
  readonly characterId: CharacterId;
}

function partsByActor(
  titles: readonly Title[],
): Map<ActorId, PlayedPart[]> {
  const played = new Map<ActorId, PlayedPart[]>();

  for (const title of titles) {
    for (const credit of title.cast) {
      if (!credit.actorId) continue;

      const parts = played.get(credit.actorId);
      const part = { titleId: title.id, characterId: credit.characterId };
      if (parts) parts.push(part);
      else played.set(credit.actorId, [part]);
    }
  }

  return played;
}

/**
 * Flattens the overrides into character verdicts. An actor entry follows the
 * parts that actor is credited with, entry by entry, so demoting Norton never
 * touches Ruffalo.
 */
export function indexBillingOverrides(
  overrides: readonly BillingOverride[],
  titles: readonly Title[],
): BillingOverrideIndex {
  const everywhere = new Map<CharacterId, BillingWeight>();
  const perTitle = new Map<TitleId, Map<CharacterId, BillingWeight>>();

  const played = overrides.some((override) => override.subject === "actor")
    ? partsByActor(titles)
    : new Map<ActorId, PlayedPart[]>();

  const write = (
    characterId: CharacterId,
    titleIds: readonly TitleId[] | null,
    weight: BillingWeight,
  ) => {
    if (!titleIds) {
      everywhere.set(characterId, weight);
      return;
    }

    for (const titleId of titleIds) {
      const forTitle = perTitle.get(titleId) ?? new Map();
      forTitle.set(characterId, weight);
      perTitle.set(titleId, forTitle);
    }
  };

  for (const override of overrides) {
    if (override.subject === "character") {
      write(override.id, override.titleIds, override.weight);
      continue;
    }

    for (const part of played.get(override.id) ?? []) {
      if (override.titleIds && !override.titleIds.includes(part.titleId))
        continue;
      write(part.characterId, [part.titleId], override.weight);
    }
  }

  return { everywhere, perTitle };
}

export function forcedBilling(
  overrides: BillingOverrideIndex,
  titleId: TitleId,
  characterId: CharacterId,
): BillingWeight | null {
  return (
    overrides.perTitle.get(titleId)?.get(characterId) ??
    overrides.everywhere.get(characterId) ??
    null
  );
}

export function recurringCharacterIds(
  titles: readonly Title[],
): ReadonlySet<CharacterId> {
  const counts = new Map<CharacterId, number>();

  for (const title of titles) {
    for (const characterId of title.characters) {
      counts.set(characterId, (counts.get(characterId) ?? 0) + 1);
    }
  }

  const recurring = new Set<CharacterId>();
  for (const [characterId, count] of counts) {
    if (count >= RECURRING_MIN) recurring.add(characterId);
  }

  return recurring;
}

function isPrincipalAt(
  title: Title,
  characterId: CharacterId,
  index: number,
  recurring: ReadonlySet<CharacterId>,
  overrides: BillingOverrideIndex,
): boolean {
  const forced = forcedBilling(overrides, title.id, characterId);
  if (forced) return forced === "principal";
  return index < TOP_BILLED || recurring.has(characterId);
}

export function isPrincipalCharacter(
  title: Title,
  characterId: CharacterId,
  recurring: ReadonlySet<CharacterId>,
  overrides: BillingOverrideIndex = NO_BILLING_OVERRIDES,
): boolean {
  const index = title.characters.indexOf(characterId);
  if (index === -1) return false;
  return isPrincipalAt(title, characterId, index, recurring, overrides);
}

export function billedCast(
  title: Title,
  recurring: ReadonlySet<CharacterId>,
  overrides: BillingOverrideIndex = NO_BILLING_OVERRIDES,
): BilledCast {
  const principal: CharacterId[] = [];
  const supporting: CharacterId[] = [];

  title.characters.forEach((characterId, index) => {
    if (isPrincipalAt(title, characterId, index, recurring, overrides))
      principal.push(characterId);
    else supporting.push(characterId);
  });

  return { principal, supporting };
}

function principalsByTitle(
  titles: readonly Title[],
  overrides: BillingOverrideIndex,
): Map<TitleId, ReadonlySet<CharacterId>> {
  const recurring = recurringCharacterIds(titles);

  return new Map(
    titles.map((title) => [
      title.id,
      new Set(billedCast(title, recurring, overrides).principal),
    ]),
  );
}

export function principalCharacterIds(
  titles: readonly Title[],
  overrides: BillingOverrideIndex = NO_BILLING_OVERRIDES,
): ReadonlySet<CharacterId> {
  const ids = new Set<CharacterId>();

  for (const principals of principalsByTitle(titles, overrides).values()) {
    for (const characterId of principals) ids.add(characterId);
  }

  return ids;
}

export function principalActorIds(
  titles: readonly Title[],
  overrides: BillingOverrideIndex = NO_BILLING_OVERRIDES,
): ReadonlySet<ActorId> {
  const principals = principalsByTitle(titles, overrides);
  const ids = new Set<ActorId>();

  for (const title of titles) {
    const billed = principals.get(title.id);
    if (!billed) continue;

    for (const credit of title.cast) {
      if (credit.actorId && billed.has(credit.characterId))
        ids.add(credit.actorId);
    }
  }

  return ids;
}
