import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Maximize2, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/shared/lib/utils";
import type { OrderMode, Title, TitleId } from "@/domain/entities/title";
import {
  formatDateRange,
  formatPartialDate,
} from "@/domain/entities/partial-date";
import type { SpotlightCredit } from "@/domain/services/spotlight-credit";
import { useWatched } from "@/features/watched/hooks/watched-context";
import {
  CARD_HEIGHT,
  CARD_WIDTH,
  columnsForWidth,
  computeBoardLayout,
} from "../lib/layout";
import { intersects, visibleBoardRect } from "../lib/viewport-window";
import { usePanZoom } from "../hooks/usePanZoom";
import { TitleCard } from "./TitleCard";
import { Connector } from "./Connector";

interface MuralBoardProps {
  titles: readonly Title[];
  mode: OrderMode;
  credits: ReadonlyMap<TitleId, SpotlightCredit>;
  focus?: BoardFocus | null;
  onFocused?: () => void;
}

export interface BoardFocus {
  readonly id: TitleId;
  readonly at: number;
}

const FOCUS_MIN_SCALE = 0.7;

const HIGHLIGHT_MS = 2600;

export function MuralBoard({
  titles,
  mode,
  credits,
  focus = null,
  onFocused,
}: MuralBoardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [container, setContainer] = useState({ width: 1280, height: 720 });
  const { viewport, isPanning, zoomBy, reset, handlers } =
    usePanZoom(containerRef);
  const { isWatched, toggle } = useWatched();

  const scaleRef = useRef(viewport.scale);
  useEffect(() => {
    scaleRef.current = viewport.scale;
  }, [viewport.scale]);

  useLayoutEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) =>
      setContainer({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      }),
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const layout = useMemo(
    () => computeBoardLayout(titles, columnsForWidth(container.width)),
    [titles, container.width],
  );

  const onScreen = useMemo(
    () => visibleBoardRect(viewport, container),
    [viewport, container],
  );

  const cards = useMemo(
    () =>
      layout.cards.filter((card) =>
        intersects(onScreen, {
          x: card.x,
          y: card.y,
          width: CARD_WIDTH,
          height: CARD_HEIGHT,
        }),
      ),
    [layout.cards, onScreen],
  );

  const connectors = useMemo(
    () =>
      layout.connectors.filter((connector) => intersects(onScreen, connector)),
    [layout.connectors, onScreen],
  );

  const fit = useCallback(() => {
    const element = containerRef.current;
    if (!element || layout.width === 0) return;

    const padding = element.clientWidth < 640 ? 16 : 64;
    const scale = Math.min(
      1,
      (element.clientWidth - padding * 2) / layout.width,
    );
    reset({
      scale,
      x: (element.clientWidth - layout.width * scale) / 2,
      y: padding,
    });
  }, [layout.width, reset]);

  useEffect(() => {
    fit();
  }, [fit, layout.columns, layout.height]);

  useEffect(() => {
    if (!focus) return;
    const card = layout.cards.find(({ title }) => title.id === focus.id);

    if (!card) return;

    const scale = Math.min(1, Math.max(scaleRef.current, FOCUS_MIN_SCALE));
    reset({
      scale,
      x: container.width / 2 - (card.x + CARD_WIDTH / 2) * scale,
      y: container.height / 2 - (card.y + CARD_HEIGHT / 2) * scale,
    });

    const timer = setTimeout(() => onFocused?.(), HIGHLIGHT_MS);
    return () => clearTimeout(timer);
  }, [focus, layout.cards, container, reset, onFocused]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative h-full w-full touch-none overflow-hidden",
        isPanning ? "cursor-grabbing" : "cursor-grab",
      )}
      style={{
        backgroundImage:
          "radial-gradient(circle at 1px 1px, color-mix(in oklab, var(--muted-foreground) 35%, transparent) 1px, transparent 0)",
        backgroundSize: `${28 * viewport.scale}px ${28 * viewport.scale}px`,
        backgroundPosition: `${viewport.x}px ${viewport.y}px`,
      }}
      {...handlers}
    >
      <div
        className="absolute left-0 top-0 origin-top-left will-change-transform"
        style={{
          width: layout.width,
          height: layout.height,
          transform: `translate3d(${viewport.x}px, ${viewport.y}px, 0) scale(${viewport.scale})`,
        }}
      >
        {connectors.map((connector) => (
          <Connector
            key={connector.id}
            connector={connector}
            golden={isWatched(connector.fromId) && isWatched(connector.toId)}
          />
        ))}

        {cards.map(({ title, x, y }) => (
          <div
            key={title.id}
            data-no-pan
            data-touch-pan
            className="absolute"
            style={{ left: x, top: y }}
          >
            <TitleCard
              title={title}
              watched={isWatched(title.id)}
              highlighted={title.id === focus?.id}
              onToggleWatched={toggle}
              credit={credits.get(title.id) ?? null}
              dateLabel={
                mode === "chronological"
                  ? formatDateRange(title.loreStart, title.loreEnd)
                  : title.releaseDate
                    ? formatPartialDate(title.releaseDate)
                    : null
              }
            />
          </div>
        ))}
      </div>

      <p
        data-no-pan
        className="pointer-events-none absolute bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-[max(0.75rem,env(safe-area-inset-left))] max-w-[9.5rem] rounded-md bg-background/80 px-2 py-1 text-[9px] leading-tight text-muted-foreground shadow-sm backdrop-blur sm:bottom-4 sm:left-4 sm:max-w-[15rem] sm:text-[10px]"
      >
        Poster artwork and title metadata from{" "}
        <a
          href="https://www.themoviedb.org/"
          target="_blank"
          rel="noreferrer"
          className="pointer-events-auto underline underline-offset-2 hover:text-foreground"
        >
          TMDB
        </a>
        . This product uses the TMDB API but is not endorsed or certified by
        TMDB.
      </p>

      <div
        data-no-pan
        className="absolute bottom-[max(0.75rem,env(safe-area-inset-bottom))] right-[max(0.75rem,env(safe-area-inset-right))] flex items-center gap-1 rounded-full border bg-card/90 p-1 shadow-lg backdrop-blur sm:bottom-4 sm:right-4"
      >
        <Button
          variant="ghost"
          size="icon"
          className="size-9 rounded-full sm:size-8"
          onClick={() => zoomBy(1 / 1.2)}
          aria-label="Zoom out"
        >
          <Minus className="size-4" />
        </Button>
        <span className="w-11 text-center text-xs tabular-nums text-muted-foreground">
          {Math.round(viewport.scale * 100)}%
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="size-9 rounded-full sm:size-8"
          onClick={() => zoomBy(1.2)}
          aria-label="Zoom in"
        >
          <Plus className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-9 rounded-full sm:size-8"
          onClick={fit}
          aria-label="Fit the wall to the screen"
        >
          <Maximize2 className="size-4" />
        </Button>
      </div>
    </div>
  );
}
