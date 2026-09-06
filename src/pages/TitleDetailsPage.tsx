import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, Clapperboard, ExternalLink, Tv } from "lucide-react";
import { useCatalog } from "@/app/providers/catalog-context";
import { isUpcoming } from "@/domain/entities/title";
import {
  formatDateRange,
  formatPartialDate,
} from "@/domain/entities/partial-date";
import {
  formatRuntime,
  formatTotalRuntime,
} from "@/domain/services/formatting";
import { imdbUrl, isImdbGuess } from "@/domain/services/external-links";
import { sortTitles } from "@/domain/services/ordering";
import { castByCharacter } from "@/domain/services/actor-filter";
import {
  billedCast,
  indexBillingOverrides,
  recurringCharacterIds,
} from "@/domain/services/billing";
import { useSpotlight } from "@/features/spotlight/hooks/useSpotlight";
import { useWatched } from "@/features/watched/hooks/watched-context";
import { PosterArt } from "@/components/poster-art";
import { ActorAvatar } from "@/components/actor-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/shared/lib/utils";

function Fact({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm font-medium">
        {value ?? <span className="text-muted-foreground">Not announced</span>}
      </dd>
    </div>
  );
}

export function TitleDetailsPage() {
  const { titleId = "" } = useParams();
  const navigate = useNavigate();
  const { status, catalog, getTitle, getCharacter } = useCatalog();
  const { isWatched, toggle } = useWatched();
  const { setCharacter, setActor } = useSpotlight();

  if (status === "loading") {
    return (
      <div className="mx-auto max-w-4xl p-8">
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  const title = getTitle(titleId);
  if (!title || !catalog) {
    return (
      <div className="grid h-dvh place-items-center p-8 text-center">
        <div>
          <p className="text-lg font-medium">No entry with that id.</p>
          <Button asChild variant="link">
            <Link to="/">Back to the wall</Link>
          </Button>
        </div>
      </div>
    );
  }

  const watched = isWatched(title.id);
  const siblings = sortTitles(
    catalog.titles.filter((other) => other.franchise.id === title.franchise.id),
    "chronological",
  ).sort((a, b) => a.franchiseIndex - b.franchiseIndex);

  const { principal, supporting } = billedCast(
    title,
    recurringCharacterIds(catalog.titles),
    indexBillingOverrides(catalog.billingOverrides, catalog.titles),
  );
  const cast = castByCharacter(title, catalog.actors);

  const credits = (characterIds: readonly string[]) =>
    characterIds.flatMap((characterId) => {
      const character = getCharacter(characterId);
      if (!character) return [];

      const playing = cast.get(characterId) ?? [];
      const pairs = playing.length > 0 ? playing : [null];

      return pairs.map((actor) => ({ characterId, character, actor }));
    });

  return (
    <div className="min-h-dvh">
      <div
        className="relative border-b"
        style={{
          background: `linear-gradient(180deg, ${title.franchise.accent}33 0%, transparent 100%)`,
        }}
      >
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 mb-4"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="size-4" />
            Back
          </Button>

          <div className="flex flex-col gap-6 md:flex-row md:gap-8">
            <div className="w-32 shrink-0 sm:w-40 md:w-64">
              <div className="aspect-[2/3] overflow-hidden rounded-2xl border shadow-2xl">
                <PosterArt title={title} />
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="gap-1">
                  {title.type === "series" ? (
                    <Tv className="size-3" />
                  ) : (
                    <Clapperboard className="size-3" />
                  )}
                  {title.type === "series" ? "Series" : "Movie"}
                </Badge>
                <Badge variant="outline">{title.phase}</Badge>
                <Badge variant="outline">{title.studio}</Badge>
              </div>

              <h1 className="mt-3 text-2xl font-bold tracking-tight text-balance sm:text-3xl">
                {title.title}
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
                {title.synopsis}
              </p>

              <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                <Button
                  className={cn(
                    "w-full sm:w-auto",
                    watched && "bg-watched text-black hover:bg-watched/90",
                  )}
                  variant={watched ? "default" : "outline"}
                  onClick={() => toggle(title.id)}
                >
                  <Check className="size-4" strokeWidth={3} />
                  {watched ? "Watched" : "Mark as watched"}
                </Button>

                <Button asChild variant="ghost" className="w-full sm:w-auto">
                  <a
                    href={imdbUrl(title)}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Open "${title.title}" on IMDb`}
                  >
                    <ExternalLink className="size-4" />
                    {isImdbGuess(title) ? "Search on IMDb" : "View on IMDb"}
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-5 sm:gap-6 md:grid-cols-4">
          <Fact
            label="In the lore"
            value={formatDateRange(title.loreStart, title.loreEnd)}
          />
          <Fact
            label={isUpcoming(title) ? "Releases" : "Released"}
            value={
              title.releaseDate ? formatPartialDate(title.releaseDate) : null
            }
          />
          <Fact
            label={title.episodes ? "Episodes" : "Duration"}
            value={title.runtimeMinutes ? formatRuntime(title) : null}
          />
          <Fact
            label={title.episodes ? "Total runtime" : "Universe"}
            value={title.episodes ? formatTotalRuntime(title) : title.universe}
          />
          <Fact label="Franchise" value={title.franchise.name} />
          <Fact label="Entry in franchise" value={`#${title.franchiseIndex}`} />
          {title.episodes ? (
            <Fact label="Universe" value={title.universe} />
          ) : null}
        </dl>

        {title.loreNote && (
          <p className="mt-6 rounded-lg border-l-2 border-primary/60 bg-card/60 px-4 py-3 text-sm text-muted-foreground">
            {title.loreNote}
          </p>
        )}

        {siblings.length > 1 && (
          <>
            <Separator className="my-8" />
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {title.franchise.name}, in story order
              </h2>
              <ol className="mt-3 grid gap-1.5">
                {siblings.map((sibling) => (
                  <li key={sibling.id}>
                    <Link
                      to={`/title/${sibling.id}`}
                      className={cn(
                        "flex min-h-11 items-baseline gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent",
                        sibling.id === title.id && "bg-accent font-medium",
                      )}
                    >
                      <span className="w-5 shrink-0 tabular-nums text-muted-foreground">
                        #{sibling.franchiseIndex}
                      </span>
                      <span className="min-w-0 flex-1 truncate">
                        {sibling.title}
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {sibling.releaseDate
                          ? formatPartialDate(sibling.releaseDate, "short")
                          : "TBA"}
                      </span>
                      {isWatched(sibling.id) && (
                        <Check
                          className="size-3.5 shrink-0 text-watched"
                          strokeWidth={3}
                        />
                      )}
                    </Link>
                  </li>
                ))}
              </ol>
            </section>
          </>
        )}

        <Separator className="my-8" />

        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Cast
          </h2>
          {principal.length === 0 && supporting.length === 0 && (
            <p className="mt-3 rounded-xl border border-dashed bg-card/40 px-4 py-6 text-center text-sm text-muted-foreground">
              Cast in progress…
            </p>
          )}

          {principal.length > 0 && (
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {credits(principal).map(({ characterId, character, actor }) => (
                <div
                  key={`${characterId}-${actor?.id ?? "unknown"}`}
                  className="flex items-center gap-3 rounded-xl border bg-card p-2"
                >
                  {actor ? (
                    <Link
                      to={`/?a=${actor.id}`}
                      onClick={() => setActor(actor.id)}
                      aria-label={`Follow ${actor.name}`}
                      className="shrink-0 rounded-full transition-opacity hover:opacity-80"
                    >
                      <ActorAvatar actor={actor} className="size-16" />
                    </Link>
                  ) : (
                    <span
                      aria-hidden
                      className="size-16 shrink-0 rounded-full border border-dashed"
                    />
                  )}

                  <span className="min-w-0 flex-1 py-0.5">
                    <Link
                      to={`/?c=${characterId}`}
                      onClick={() => setCharacter(characterId)}
                      className="block truncate text-sm font-medium transition-colors hover:text-primary"
                      title={
                        character.aka
                          ? `${character.name} — ${character.aka}`
                          : character.name
                      }
                    >
                      {character.name}
                    </Link>
                    {character.aka && (
                      <span className="block truncate text-xs text-muted-foreground">
                        {character.aka}
                      </span>
                    )}
                    {actor ? (
                      <Link
                        to={`/?a=${actor.id}`}
                        onClick={() => setActor(actor.id)}
                        className="block truncate text-xs text-muted-foreground transition-colors hover:text-primary"
                      >
                        {actor.name}
                      </Link>
                    ) : (
                      <span className="block truncate text-xs text-muted-foreground/70">
                        Uncredited here
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          )}

          {supporting.length > 0 && (
            <>
              <h3 className="mt-8 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Also appearing
              </h3>
              <div className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-5">
                {credits(supporting).map(
                  ({ characterId, character, actor }) => (
                    <div
                      key={`${characterId}-${actor?.id ?? "unknown"}`}
                      className="flex items-center gap-2 rounded-lg border bg-card/60 p-1.5"
                    >
                      {actor ? (
                        <ActorAvatar actor={actor} className="size-9" />
                      ) : (
                        <span
                          aria-hidden
                          className="size-9 shrink-0 rounded-[25%] border border-dashed"
                        />
                      )}

                      <span className="min-w-0 flex-1">
                        <span
                          className="block truncate text-xs font-medium"
                          title={
                            character.aka
                              ? `${character.name} — ${character.aka}`
                              : character.name
                          }
                        >
                          {character.name}
                        </span>
                        <span className="block truncate text-[0.7rem] text-muted-foreground">
                          {actor ? actor.name : "Uncredited here"}
                        </span>
                      </span>
                    </div>
                  ),
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
