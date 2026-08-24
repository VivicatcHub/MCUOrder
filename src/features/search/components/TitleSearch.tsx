import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { Clapperboard, Crosshair, EyeOff, Search, Tv } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PosterArt } from "@/components/poster-art";
import { cn } from "@/shared/lib/utils";
import type { Title, TitleId } from "@/domain/entities/title";
import { formatPartialDate } from "@/domain/entities/partial-date";
import { searchTitles } from "@/domain/services/title-search";
import { useHasHover } from "@/shared/hooks/use-media-query";

const MAX_ROWS = 40;

export type SearchAction = "open" | "center";

interface TitleSearchProps {
  titles: readonly Title[];
  visibleIds: ReadonlySet<TitleId>;
  action: SearchAction;
  onSelect: (title: Title) => void;
}

export function TitleSearch({
  titles,
  visibleIds,
  action,
  onSelect,
}: TitleSearchProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);

  const hasHover = useHasHover();
  const listRef = useRef<HTMLDivElement>(null);

  const rows = useMemo(
    () => (open ? searchTitles(titles, query, MAX_ROWS) : []),
    [open, titles, query],
  );

  const choose = useCallback(
    (title: Title) => {
      setOpen(false);
      setQuery("");
      onSelect(title);
    },
    [onSelect],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const typing =
        event.target instanceof HTMLElement &&
        (event.target.isContentEditable ||
          ["INPUT", "TEXTAREA", "SELECT"].includes(event.target.tagName));

      if (key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((current) => !current);
      } else if (key === "/" && !typing && !event.metaKey && !event.ctrlKey) {
        event.preventDefault();
        setOpen(true);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const onInputKeyDown = (event: ReactKeyboardEvent) => {
    if (rows.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setCursor((index) => (index + 1) % rows.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setCursor((index) => (index - 1 + rows.length) % rows.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      choose(rows[Math.min(cursor, rows.length - 1)]);
    }
  };

  useEffect(() => {
    listRef.current
      ?.querySelector('[data-cursor="true"]')
      ?.scrollIntoView({ block: "nearest" });
  }, [cursor, rows]);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery("");
      }}
    >
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="rounded-full"
          aria-label="Search a movie or a series"
        >
          <Search className="size-3.5" />
          <span className="hidden sm:inline">Search</span>
          <kbd className="ml-0.5 hidden rounded border border-border bg-muted/60 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground lg:inline">
            /
          </kbd>
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Find an entry</DialogTitle>
          <DialogDescription>
            {action === "center"
              ? "Picking one flies the wall to it and lights it up."
              : "Picking one opens its page."}
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus={hasHover}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setCursor(0);
            }}
            onKeyDown={onInputKeyDown}
            placeholder="A title, a saga, a year…"
            aria-label="Search a movie or a series"
            className="pl-9"
          />
        </div>

        <ScrollArea className="-mx-1 h-[55vh] px-1 sm:h-80">
          <div ref={listRef} className="grid gap-1">
            {rows.map((title, index) => {
              const hidden = !visibleIds.has(title.id);
              const year = title.releaseDate
                ? formatPartialDate(title.releaseDate, "short")
                : "Not announced";

              return (
                <button
                  key={title.id}
                  type="button"
                  data-cursor={index === cursor}
                  onPointerEnter={() => setCursor(index)}
                  onClick={() => choose(title)}
                  className={cn(
                    "flex min-h-14 items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-colors",
                    "focus-visible:outline-none",
                    index === cursor && "bg-accent",
                  )}
                >
                  <span
                    className="h-14 w-[2.4rem] shrink-0 overflow-hidden rounded-md border"
                    style={{ borderColor: `${title.franchise.accent}66` }}
                  >
                    <PosterArt title={title} />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate text-sm font-medium">
                        {title.title}
                      </span>
                      {hidden && (
                        <EyeOff
                          className="size-3 shrink-0 text-muted-foreground"
                          aria-label="Hidden by the current filters"
                        />
                      )}
                    </span>
                    <span className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                      {title.type === "series" ? (
                        <Tv className="size-3 shrink-0" />
                      ) : (
                        <Clapperboard className="size-3 shrink-0" />
                      )}
                      <span className="truncate">
                        {title.franchise.name} · {year}
                      </span>
                    </span>
                  </span>

                  {action === "center" && index === cursor && (
                    <Crosshair className="size-4 shrink-0 text-muted-foreground" />
                  )}
                </button>
              );
            })}

            {rows.length === 0 && (
              <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                Nothing here is called “{query}”.
              </p>
            )}
          </div>
        </ScrollArea>

        {rows.some((title) => !visibleIds.has(title.id)) && (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <EyeOff className="size-3 shrink-0" />
            {action === "center"
              ? "Marked entries are filtered off the wall — picking one clears the filters."
              : "Marked entries are filtered out of the reel."}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
