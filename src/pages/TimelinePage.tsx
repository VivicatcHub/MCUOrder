import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SlidersHorizontal } from "lucide-react";
import { useCatalog } from "@/app/providers/catalog-context";
import { sortTitles } from "@/domain/services/ordering";
import { applySpotlight } from "@/domain/services/spotlight";
import { resolveRoadToPrerequisites } from "@/domain/services/road-to-filter";
import type { Title, TitleId } from "@/domain/entities/title";
import {
  creditsFor,
  type SpotlightCredit,
} from "@/domain/services/spotlight-credit";
import {
  MuralBoard,
  type BoardFocus,
} from "@/features/timeline/components/MuralBoard";
import { TimelineReel } from "@/features/timeline/components/TimelineReel";
import { OrderToggle } from "@/features/timeline/components/OrderToggle";
import { ViewToggle } from "@/features/timeline/components/ViewToggle";
import { useOrderMode } from "@/features/timeline/hooks/useOrderMode";
import { useViewMode } from "@/features/timeline/hooks/useViewMode";
import { PersonPicker } from "@/features/spotlight/components/PersonPicker";
import { StudioToggle } from "@/features/spotlight/components/StudioToggle";
import { TypeToggle } from "@/features/spotlight/components/TypeToggle";
import { WatchedToggle } from "@/features/spotlight/components/WatchedToggle";
import { useSpotlight } from "@/features/spotlight/hooks/useSpotlight";
import { RoadToPicker } from "@/features/road-to/components/RoadToPicker";
import { TitleSearch } from "@/features/search/components/TitleSearch";
import { WatchedProgress } from "@/features/watched/components/WatchedProgress";
import { useWatched } from "@/features/watched/hooks/watched-context";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useMediaQuery } from "@/shared/hooks/use-media-query";
import { cn } from "@/shared/lib/utils";

const HANDSET_QUERY = "(max-width: 767px)";

export function TimelinePage() {
  const { status, catalog, error } = useCatalog();
  const { mode, setMode } = useOrderMode();
  const { mode: viewMode, setMode: setViewMode } = useViewMode();
  const {
    spotlight,
    setCharacter,
    setActor,
    setStudio,
    setType,
    setWatched,
    setRoadTo,
    clear,
    isActive,
  } = useSpotlight({ persist: true });
  const { watched } = useWatched();

  const [controlsOpen, setControlsOpen] = useState(false);
  const [focus, setFocus] = useState<BoardFocus | null>(null);

  const handset = useMediaQuery(HANDSET_QUERY);
  const reel = handset || viewMode === "reel";
  const navigate = useNavigate();

  const ordered = useMemo(
    () => (catalog ? sortTitles(catalog.titles, mode) : []),
    [catalog, mode],
  );

  const roadToPrerequisites = useMemo(
    () =>
      catalog
        ? resolveRoadToPrerequisites(catalog.dependencies, spotlight.roadTo)
        : null,
    [catalog, spotlight.roadTo],
  );

  const visible = useMemo(
    () => applySpotlight(ordered, spotlight, watched, roadToPrerequisites),
    [ordered, spotlight, watched, roadToPrerequisites],
  );

  const credits = useMemo(
    () =>
      catalog
        ? creditsFor(visible, spotlight, catalog.characters, catalog.actors)
        : new Map<TitleId, SpotlightCredit>(),
    [catalog, visible, spotlight],
  );

  const visibleIds = useMemo(
    () => new Set(visible.map((title) => title.id)),
    [visible],
  );

  const onSearchSelect = useCallback(
    (title: Title) => {
      if (reel) {
        navigate(`/title/${title.id}`);
        return;
      }
      if (!visibleIds.has(title.id)) clear();
      setFocus({ id: title.id, at: Date.now() });
    },
    [reel, navigate, visibleIds, clear],
  );

  const onFocused = useCallback(() => setFocus(null), []);

  const caption = isActive
    ? `${visible.length} of ${ordered.length} shown`
    : mode === "chronological"
      ? "The story, in the order it happens"
      : "The films, in the order they came out";

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <header className="z-10 flex flex-wrap items-center gap-x-3 gap-y-2.5 border-b bg-background/80 px-4 py-2.5 backdrop-blur sm:py-3">
        <div className="mr-auto flex min-w-0 flex-col sm:flex-row sm:items-baseline sm:gap-2.5">
          <h1 className="text-base font-bold tracking-tight sm:text-lg">
            Marvel Order
          </h1>
          <p className="truncate text-[11px] text-muted-foreground sm:text-xs">
            {caption}
          </p>
        </div>

        {catalog && (
          <>
            <TitleSearch
              titles={ordered}
              visibleIds={visibleIds}
              action={reel ? "open" : "center"}
              onSelect={onSearchSelect}
            />

            <Button
              variant={isActive ? "default" : "outline"}
              size="sm"
              className="rounded-full"
              onClick={() => setControlsOpen((open) => !open)}
              aria-expanded={controlsOpen}
              aria-controls="board-controls"
            >
              <SlidersHorizontal className="size-3.5" />
              Filters
            </Button>

            <div
              id="board-controls"
              className={cn(
                "w-full flex-wrap items-center gap-2 border-t pt-2.5",
                controlsOpen
                  ? "flex animate-in fade-in-0 slide-in-from-top-1 duration-200"
                  : "hidden",
              )}
            >
              <PersonPicker
                characters={catalog.characters}
                actors={catalog.actors}
                titles={catalog.titles}
                billingOverrides={catalog.billingOverrides}
                characterId={spotlight.characterId}
                actorId={spotlight.actorId}
                onSelectCharacter={setCharacter}
                onSelectActor={setActor}
              />
              <StudioToggle value={spotlight.studio} onChange={setStudio} />
              <TypeToggle value={spotlight.type} onChange={setType} />
              <WatchedToggle value={spotlight.watched} onChange={setWatched} />
              <RoadToPicker
                dependencies={catalog.dependencies}
                titles={catalog.titles}
                value={spotlight.roadTo}
                onChange={setRoadTo}
              />
              <OrderToggle mode={mode} onChange={setMode} />
              <ViewToggle mode={viewMode} onChange={setViewMode} />
              <WatchedProgress total={catalog.titles.length} />
              {isActive && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full text-muted-foreground"
                  onClick={clear}
                >
                  Clear filters
                </Button>
              )}
            </div>
          </>
        )}
      </header>

      <main className="relative min-h-0 flex-1">
        {status === "loading" && (
          <div className="grid h-full place-items-center p-4">
            <div className="grid w-full max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">
              {Array.from({ length: 8 }, (_, index) => (
                <Skeleton
                  key={index}
                  className={cn(
                    "aspect-[208/300] w-full rounded-xl",

                    index > 3 && "hidden sm:block",
                  )}
                />
              ))}
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="grid h-full place-items-center p-8 text-center">
            <div>
              <p className="font-medium">The catalog could not be loaded.</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {error?.message}
              </p>
            </div>
          </div>
        )}

        {status === "ready" &&
          visible.length > 0 &&
          (reel ? (
            <TimelineReel titles={visible} mode={mode} credits={credits} />
          ) : (
            <MuralBoard
              titles={visible}
              mode={mode}
              credits={credits}
              focus={focus}
              onFocused={onFocused}
            />
          ))}

        {status === "ready" && visible.length === 0 && (
          <div className="grid h-full place-items-center p-8 text-center">
            <div>
              <p className="font-medium">Nothing matches these filters.</p>
              <p className="mt-1 text-sm text-muted-foreground">
                No entry satisfies every filter at once.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={clear}
              >
                Clear filters
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
