import { memo } from "react";
import { Link } from "react-router-dom";
import { Check, Clapperboard, Drama, Tv } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import type { Title } from "@/domain/entities/title";
import { imdbUrl } from "@/domain/services/external-links";
import { formatRuntime } from "@/domain/services/formatting";
import type { SpotlightCredit } from "@/domain/services/spotlight-credit";
import { PosterArt } from "@/components/poster-art";
import { ActorAvatar } from "@/components/actor-avatar";
import { CARD_HEIGHT, CARD_WIDTH } from "../lib/layout";

interface TitleCardProps {
  title: Title;
  watched: boolean;
  onToggleWatched: (id: string) => void;
  dateLabel: string | null;
  credit: SpotlightCredit | null;
  highlighted?: boolean;
}

export const TitleCard = memo(function TitleCard({
  title,
  watched,
  onToggleWatched,
  dateLabel,
  credit,
  highlighted = false,
}: TitleCardProps) {
  const upcoming = title.status === "upcoming";
  const runtime = formatRuntime(title);

  return (
    <div
      className={cn(
        "group relative select-none rounded-xl transition-all duration-300",
        highlighted && "z-10 scale-[1.04]",
      )}
      style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}
    >
      <Link
        to={`/title/${title.id}`}
        className={cn(
          "block h-full w-full overflow-hidden rounded-xl border bg-card shadow-lg",
          "transition-transform duration-200 group-hover:-translate-y-1 group-hover:shadow-xl",
          "focus-visible:ring-ring/70 focus-visible:outline-none focus-visible:ring-2",
          watched
            ? "border-watched shadow-[0_0_0_1px_var(--watched),0_0_28px_-6px_var(--watched)]"
            : upcoming
              ? "border-dashed border-border/70"
              : "border-border",
          highlighted &&
            "border-primary shadow-[0_0_0_3px_var(--primary),0_0_40px_-4px_var(--primary)]",
        )}
      >
        <div className="relative h-[62%] w-full">
          <PosterArt title={title} />
          <span className="absolute left-2 top-2 flex items-center gap-1 rounded-md bg-black/55 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white/85 backdrop-blur-sm">
            {title.type === "series" ? (
              <Tv className="size-3" />
            ) : (
              <Clapperboard className="size-3" />
            )}
            {title.type === "series"
              ? title.episodes
                ? `${title.episodes} ep.`
                : "Series"
              : "Movie"}
          </span>
          {upcoming && (
            <span
              className={cn(
                "absolute left-2 rounded-md border border-dashed border-white/40 bg-black/55 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white/85 backdrop-blur-sm",

                credit ? "bottom-16" : "bottom-2",
              )}
            >
              Upcoming
            </span>
          )}

          {credit && (
            <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-gradient-to-t from-black/90 via-black/70 to-transparent px-2 pb-2 pt-5">
              {credit.kind === "actors" ? (
                <>
                  <span className="flex shrink-0 -space-x-2.5">
                    {credit.actors.slice(0, 3).map((actor) => (
                      <ActorAvatar
                        key={actor.id}
                        actor={actor}
                        className="size-10 border-2 border-white/70 shadow-md"
                      />
                    ))}
                  </span>
                  <span className="min-w-0 truncate text-[11px] font-semibold leading-tight text-white">
                    {credit.actors.map((actor) => actor.name).join(", ")}
                  </span>
                </>
              ) : (
                <span className="flex min-w-0 items-center gap-1.5 text-[11px] font-semibold text-white">
                  <Drama className="size-4 shrink-0 opacity-80" />
                  <span className="truncate">
                    as{" "}
                    {credit.characters
                      .map((character) => character.name)
                      .join(", ")}
                  </span>
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex h-[38%] flex-col justify-between p-3">
          <p className="text-sm font-semibold leading-snug text-balance">
            {title.title}
          </p>
          <div className="text-[11px] text-muted-foreground">
            <p className="truncate">{dateLabel ?? "Date to be announced"}</p>
            <p className="truncate">{runtime ?? "\u00a0"}</p>
          </div>
        </div>
      </Link>

      <a
        href={imdbUrl(title)}
        target="_blank"
        rel="noreferrer"
        aria-label={`Open "${title.title}" on IMDb`}
        title="Open on IMDb"
        className={cn(
          "absolute right-11 top-2 grid h-8 place-items-center rounded-full border px-2 text-[10px] font-bold tracking-wide backdrop-blur-sm transition sm:right-10 sm:h-7",
          "focus-visible:ring-ring/70 focus-visible:outline-none focus-visible:ring-2",

          "border-white/25 bg-black/50 text-white/70 opacity-0",
          "hover:border-white/60 hover:text-white group-hover:opacity-100 focus-visible:opacity-100",
          "[@media(hover:none)]:opacity-100",
        )}
      >
        IMDb
      </a>

      <button
        type="button"
        onClick={(event) => {
          event.preventDefault();
          onToggleWatched(title.id);
        }}
        aria-pressed={watched}
        aria-label={
          watched
            ? `Mark "${title.title}" as not watched`
            : `Mark "${title.title}" as watched`
        }
        title={watched ? "Watched — click to undo" : "Mark as watched"}
        className={cn(
          "absolute right-2 top-2 grid size-8 place-items-center rounded-full border backdrop-blur-sm transition sm:size-7",
          "focus-visible:ring-ring/70 focus-visible:outline-none focus-visible:ring-2",
          watched
            ? "border-watched bg-watched text-black"
            : [
                "border-white/25 bg-black/50 text-white/70 opacity-0",
                "hover:border-watched hover:text-watched group-hover:opacity-100 focus-visible:opacity-100",

                "[@media(hover:none)]:opacity-100",
              ],
        )}
      >
        <Check className="size-4" strokeWidth={3} />
      </button>
    </div>
  );
});
