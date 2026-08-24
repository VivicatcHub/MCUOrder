import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ArrowUp, CalendarDays, History, PlayCircle } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import type { OrderMode, Title, TitleId } from "@/domain/entities/title";
import {
  formatDateRange,
  formatPartialDate,
} from "@/domain/entities/partial-date";
import type { SpotlightCredit } from "@/domain/services/spotlight-credit";
import { useWatched } from "@/features/watched/hooks/watched-context";
import { ReelEntry } from "./ReelEntry";

interface TimelineReelProps {
  titles: readonly Title[];
  mode: OrderMode;
  credits: ReadonlyMap<TitleId, SpotlightCredit>;
}

const STICKY_OFFSET = 44;

const dateLabelFor = (title: Title, mode: OrderMode) =>
  mode === "chronological"
    ? formatDateRange(title.loreStart, title.loreEnd)
    : title.releaseDate
      ? formatPartialDate(title.releaseDate)
      : null;

export function TimelineReel({ titles, mode, credits }: TimelineReelProps) {
  const { isWatched, toggle } = useWatched();

  const scrollRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLOListElement>(null);
  const offsets = useRef<number[]>([]);

  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  const [threaded, setThreaded] = useState(titles);
  if (threaded !== titles) {
    setThreaded(titles);
    setActive(0);
    setProgress(0);
    setScrolled(false);
  }

  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const measure = () => {
      offsets.current = [...list.children].map(
        (row) => (row as HTMLElement).offsetTop,
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(list);
    return () => observer.disconnect();
  }, [titles, credits]);

  const onScroll = useCallback(() => {
    const element = scrollRef.current;
    if (!element) return;

    const top = element.scrollTop;
    const travel = element.scrollHeight - element.clientHeight;
    setProgress(travel <= 0 ? 1 : Math.min(1, Math.max(0, top / travel)));
    setScrolled(top > 400);

    const tops = offsets.current;
    let low = 0;
    let high = tops.length - 1;
    let found = 0;
    while (low <= high) {
      const mid = (low + high) >> 1;
      if (tops[mid] <= top + STICKY_OFFSET + 8) {
        found = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }
    setActive(found);
  }, []);

  const scrollToIndex = useCallback((index: number) => {
    const element = scrollRef.current;
    const top = offsets.current[index];
    if (!element || top === undefined) return;
    element.scrollTo({
      top: index === 0 ? 0 : Math.max(0, top - STICKY_OFFSET),
      behavior: "smooth",
    });
  }, []);

  const nextUnwatched = useMemo(
    () => titles.findIndex((title) => !isWatched(title.id)),
    [titles, isWatched],
  );

  const current = titles[Math.min(active, titles.length - 1)];
  const currentLabel = current ? dateLabelFor(current, mode) : null;

  useLayoutEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [titles]);

  return (
    <div className="relative h-full">
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="h-full overflow-y-auto overscroll-contain"
      >
        <div className="sticky top-0 z-20 border-b bg-background/90 backdrop-blur">
          <div className="flex items-baseline gap-2 px-3 py-1.5 text-[11px]">
            <span className="font-semibold tabular-nums">
              {Math.min(active + 1, titles.length)}
              <span className="text-muted-foreground">/{titles.length}</span>
            </span>
            <span className="truncate text-muted-foreground">
              {currentLabel ?? "Not announced"}
            </span>
            <span className="ml-auto flex shrink-0 items-center gap-1 text-muted-foreground">
              {mode === "chronological" ? (
                <>
                  <History className="size-3" />
                  Lore
                </>
              ) : (
                <>
                  <CalendarDays className="size-3" />
                  Release
                </>
              )}
            </span>
          </div>
          <span
            aria-hidden
            className="block h-0.5 origin-left bg-primary transition-transform duration-150"
            style={{ transform: `scaleX(${progress})` }}
          />
        </div>

        <ol ref={listRef} className="pb-40 pt-2">
          {titles.map((title, index) => {
            const watched = isWatched(title.id);
            const previous = titles[index - 1];
            const next = titles[index + 1];

            return (
              <ReelEntry
                key={title.id}
                title={title}
                position={index + 1}
                watched={watched}
                linkedAbove={watched && !!previous && isWatched(previous.id)}
                linkedBelow={watched && !!next && isWatched(next.id)}
                first={index === 0}
                last={index === titles.length - 1}
                dateLabel={dateLabelFor(title, mode)}
                credit={credits.get(title.id) ?? null}
                onToggleWatched={toggle}
              />
            );
          })}
        </ol>

        <p className="px-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-center text-[10px] leading-relaxed text-muted-foreground">
          Poster artwork and title metadata from{" "}
          <a
            href="https://www.themoviedb.org/"
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2"
          >
            TMDB
          </a>
          . This product uses the TMDB API but is not endorsed or certified by
          TMDB.
        </p>
      </div>

      <div className="pointer-events-none absolute bottom-[max(1rem,env(safe-area-inset-bottom))] right-3 flex flex-col items-end gap-2">
        <button
          type="button"
          onClick={() => scrollToIndex(0)}
          aria-label="Back to the top of the reel"
          className={cn(
            "grid size-11 place-items-center rounded-full border bg-card/90 text-muted-foreground shadow-lg backdrop-blur transition-opacity",
            scrolled ? "pointer-events-auto opacity-100" : "opacity-0",
          )}
        >
          <ArrowUp className="size-5" />
        </button>

        {nextUnwatched !== -1 && (
          <button
            type="button"
            onClick={() => scrollToIndex(nextUnwatched)}
            className="pointer-events-auto flex h-11 items-center gap-2 rounded-full border border-watched/50 bg-card/90 pl-3 pr-4 text-xs font-semibold shadow-lg backdrop-blur"
          >
            <PlayCircle className="size-4 text-watched" />
            Watch next
            <span className="tabular-nums text-muted-foreground">
              #{nextUnwatched + 1}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
