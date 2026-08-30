import { memo } from "react";
import { Link } from "react-router-dom";
import { Check, Clapperboard, Drama, Tv } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { isUpcoming, type Title } from "@/domain/entities/title";
import { formatRuntime } from "@/domain/services/formatting";
import type { SpotlightCredit } from "@/domain/services/spotlight-credit";
import { PosterArt } from "@/components/poster-art";
import { ActorAvatar } from "@/components/actor-avatar";

const NODE_TOP = "4.375rem";

interface ReelEntryProps {
  title: Title;
  position: number;
  watched: boolean;

  linkedAbove: boolean;
  linkedBelow: boolean;
  first: boolean;
  last: boolean;
  dateLabel: string | null;
  credit: SpotlightCredit | null;
  onToggleWatched: (id: string) => void;
}

export const ReelEntry = memo(function ReelEntry({
  title,
  position,
  watched,
  linkedAbove,
  linkedBelow,
  first,
  last,
  dateLabel,
  credit,
  onToggleWatched,
}: ReelEntryProps) {
  const upcoming = isUpcoming(title);
  const runtime = formatRuntime(title);

  return (
    <li className="relative py-2 pl-[3.25rem] pr-3" data-position={position}>
      {!first && (
        <span
          aria-hidden
          className="absolute left-6 top-0 w-0.5 -translate-x-1/2 rounded-full transition-colors duration-300"
          style={{
            height: NODE_TOP,
            background: linkedAbove
              ? "var(--watched)"
              : "color-mix(in oklab, var(--muted-foreground) 40%, transparent)",
          }}
        />
      )}
      {!last && (
        <span
          aria-hidden
          className="absolute bottom-0 left-6 w-0.5 -translate-x-1/2 rounded-full transition-colors duration-300"
          style={{
            top: NODE_TOP,
            background: linkedBelow
              ? "var(--watched)"
              : "color-mix(in oklab, var(--muted-foreground) 40%, transparent)",
          }}
        />
      )}

      <span
        aria-hidden
        className={cn(
          "absolute left-6 grid size-7 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border text-[10px] font-bold tabular-nums transition-colors duration-300",
          watched
            ? "border-watched bg-watched text-black"
            : "border-border bg-background text-muted-foreground",
        )}
        style={{ top: NODE_TOP }}
      >
        {watched ? <Check className="size-3.5" strokeWidth={3.5} /> : position}
      </span>

      <Link
        to={`/title/${title.id}`}
        className={cn(
          "flex gap-3 rounded-xl border bg-card p-2 pr-12 shadow-sm transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70",
          "active:bg-accent",
          watched
            ? "border-watched/60 shadow-[0_0_0_1px_var(--watched-soft)]"
            : upcoming
              ? "border-dashed border-border/70"
              : "border-border",
        )}
      >
        <span
          className="relative h-[6.75rem] w-[4.5rem] shrink-0 overflow-hidden rounded-lg"
          style={{
            boxShadow: `inset 0 0 0 1px ${title.franchise.accent}66`,
          }}
        >
          <PosterArt title={title} />
          {upcoming && (
            <span className="absolute inset-x-0 bottom-0 bg-black/65 py-0.5 text-center text-[8px] font-semibold uppercase tracking-wide text-white/90">
              Upcoming
            </span>
          )}
        </span>

        <span className="flex min-w-0 flex-1 flex-col justify-center gap-1 py-0.5">
          <span className="line-clamp-2 text-sm font-semibold leading-snug">
            {title.title}
          </span>

          <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span
              aria-hidden
              className="size-2 shrink-0 rounded-full"
              style={{ background: title.franchise.accent }}
            />
            <span className="truncate">{title.franchise.name}</span>
          </span>

          <span className="flex flex-wrap items-center gap-x-2 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              {title.type === "series" ? (
                <Tv className="size-3" />
              ) : (
                <Clapperboard className="size-3" />
              )}
              {title.type === "series" && title.episodes
                ? `${title.episodes} ep.`
                : (runtime ?? (title.type === "series" ? "Series" : "Movie"))}
            </span>
            <span className="truncate">
              {dateLabel ?? "Date to be announced"}
            </span>
          </span>

          {credit && (
            <span className="mt-0.5 flex items-center gap-1.5">
              {credit.kind === "actors" ? (
                <>
                  <span className="flex shrink-0 -space-x-2">
                    {credit.actors.slice(0, 3).map((actor) => (
                      <ActorAvatar
                        key={actor.id}
                        actor={actor}
                        className="size-6 border border-background text-[0.5rem]"
                      />
                    ))}
                  </span>
                  <span className="min-w-0 truncate text-[11px] font-medium">
                    {credit.actors.map((actor) => actor.name).join(", ")}
                  </span>
                </>
              ) : (
                <>
                  <Drama className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 truncate text-[11px] font-medium">
                    as{" "}
                    {credit.characters
                      .map((character) => character.name)
                      .join(", ")}
                  </span>
                </>
              )}
            </span>
          )}
        </span>
      </Link>

      <button
        type="button"
        onClick={() => onToggleWatched(title.id)}
        aria-pressed={watched}
        aria-label={
          watched
            ? `Mark "${title.title}" as not watched`
            : `Mark "${title.title}" as watched`
        }
        className={cn(
          "absolute right-4 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full border transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70",
          watched
            ? "border-watched bg-watched text-black"
            : "border-border/70 bg-background/60 text-muted-foreground/45",
        )}
      >
        <Check className="size-4" strokeWidth={2.5} />
      </button>
    </li>
  );
});
