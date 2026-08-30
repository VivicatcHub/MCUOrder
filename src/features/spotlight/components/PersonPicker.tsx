import { useMemo, useState } from "react";
import { Drama, Heart, Search, X } from "lucide-react";
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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ActorAvatar } from "@/components/actor-avatar";
import { cn } from "@/shared/lib/utils";
import type {
  Actor,
  ActorId,
  BillingOverride,
  Character,
  CharacterId,
  Title,
} from "@/domain/entities/title";
import { appearanceCounts } from "@/domain/services/character-filter";
import {
  actorAppearanceCounts,
  charactersByActor,
} from "@/domain/services/actor-filter";
import {
  indexBillingOverrides,
  principalActorIds,
  principalCharacterIds,
} from "@/domain/services/billing";
import { useHasHover } from "@/shared/hooks/use-media-query";

type Lens = "character" | "actor";

const MAX_ROWS = 60;

interface PersonPickerProps {
  characters: readonly Character[];
  actors: readonly Actor[];
  titles: readonly Title[];
  billingOverrides: readonly BillingOverride[];
  characterId: CharacterId | null;
  actorId: ActorId | null;
  onSelectCharacter: (id: CharacterId | null) => void;
  onSelectActor: (id: ActorId | null) => void;
}

interface Row {
  id: string;
  name: string;

  caption: string | null;
  appearances: number;

  actor: Actor | null;
}

export function PersonPicker({
  characters,
  actors,
  titles,
  billingOverrides,
  characterId,
  actorId,
  onSelectCharacter,
  onSelectActor,
}: PersonPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [lens, setLens] = useState<Lens>(actorId ? "actor" : "character");

  const hasHover = useHasHover();

  const selectedCharacter =
    characters.find((character) => character.id === characterId) ?? null;
  const selectedActor = actors.find((actor) => actor.id === actorId) ?? null;
  const selected = selectedActor ?? selectedCharacter;
  const selectedId = selectedActor ? selectedActor.id : selectedCharacter?.id;

  const characterNames = useMemo(
    () =>
      new Map(characters.map((character) => [character.id, character.name])),
    [characters],
  );

  const allRows = useMemo<Row[]>(() => {
    if (!open) return [];

    const overrides = indexBillingOverrides(billingOverrides, titles);
    const principalCharacters = principalCharacterIds(titles, overrides);
    const principalActors = principalActorIds(titles, overrides);
    const played = charactersByActor(titles);

    const counts =
      lens === "character"
        ? appearanceCounts(titles)
        : actorAppearanceCounts(titles);

    const rows: Row[] =
      lens === "character"
        ? characters
            .filter((character) => principalCharacters.has(character.id))
            .map((character) => ({
              id: character.id,
              name: character.name,
              caption: character.aka ?? null,
              appearances: counts.get(character.id) ?? 0,
              actor: null,
            }))
        : actors
            .filter((actor) => principalActors.has(actor.id))
            .map((actor) => ({
              id: actor.id,
              name: actor.name,
              caption: (played.get(actor.id) ?? [])
                .filter((id) => principalCharacters.has(id))
                .map((id) => characterNames.get(id) ?? id)
                .join(", "),
              appearances: counts.get(actor.id) ?? 0,
              actor,
            }));

    return rows.sort(
      (a, b) => b.appearances - a.appearances || a.name.localeCompare(b.name),
    );
  }, [
    open,
    lens,
    characters,
    actors,
    titles,
    billingOverrides,
    characterNames,
  ]);

  const matches = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return allRows;

    return allRows.filter(
      (row) =>
        row.name.toLowerCase().includes(normalized) ||
        row.caption?.toLowerCase().includes(normalized),
    );
  }, [allRows, query]);

  const capped = matches.slice(0, MAX_ROWS);
  const pinned =
    selectedId && !capped.some((row) => row.id === selectedId)
      ? (allRows.find((row) => row.id === selectedId) ?? null)
      : null;
  const rows = pinned ? [pinned, ...capped] : capped;

  const select = (id: string) => {
    const next = id === selectedId ? null : id;
    if (lens === "character") onSelectCharacter(next);
    else onSelectActor(next);
    setOpen(false);
  };

  const clear = () =>
    selectedActor ? onSelectActor(null) : onSelectCharacter(null);

  return (
    <div className="flex items-center gap-1.5">
      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);

          if (next) setLens(actorId ? "actor" : "character");
        }}
      >
        <DialogTrigger asChild>
          <Button
            variant={selected ? "default" : "outline"}
            size="sm"
            className="max-w-[14rem] rounded-full"
          >
            {selectedActor ? (
              <ActorAvatar
                actor={selectedActor}
                className="-ml-1.5 size-7 border-0 text-[0.6rem]"
              />
            ) : (
              <Heart
                className={cn(
                  "size-3.5 shrink-0",
                  selectedCharacter && "fill-current",
                )}
              />
            )}
            <span className="truncate">
              {selected ? selected.name : "I love that character"}
            </span>
          </Button>
        </DialogTrigger>

        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Follow a character — or the actor</DialogTitle>
            <DialogDescription>
              Everything they are not in leaves the wall. The choice stays in
              the URL, so the view is shareable.
            </DialogDescription>
          </DialogHeader>

          <ToggleGroup
            type="single"
            value={lens}
            onValueChange={(next) => next && setLens(next as Lens)}
            aria-label="Follow a character or an actor"
            className="gap-0.5 self-start rounded-full border bg-card/70 p-1"
          >
            <ToggleGroupItem
              value="character"
              className="h-8 gap-1.5 rounded-full px-3 text-xs font-medium data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
            >
              <Heart className="size-3.5" />
              Characters
            </ToggleGroupItem>
            <ToggleGroupItem
              value="actor"
              className="h-8 gap-1.5 rounded-full px-3 text-xs font-medium data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
            >
              <Drama className="size-3.5" />
              Actors
            </ToggleGroupItem>
          </ToggleGroup>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus={hasHover}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={
                lens === "character"
                  ? "Search a name or a codename…"
                  : "Search an actor or a part they play…"
              }
              className="pl-9"
            />
          </div>

          <ScrollArea className="-mx-1 h-[50vh] px-1 sm:h-80">
            <div className="grid gap-1">
              {rows.map((row) => (
                <button
                  key={row.id}
                  type="button"
                  onClick={() => select(row.id)}
                  className={cn(
                    "flex min-h-11 items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                    "hover:bg-accent focus-visible:bg-accent focus-visible:outline-none",
                    row.id === selectedId && "bg-accent",
                  )}
                >
                  {row.actor && (
                    <ActorAvatar actor={row.actor} className="size-14" />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">
                      {row.name}
                    </span>
                    {row.caption && (
                      <span className="block truncate text-xs text-muted-foreground w-60 sm:w-20">
                        {row.caption}
                      </span>
                    )}
                  </span>
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                    {row.appearances}{" "}
                    {row.appearances === 1 ? "entry" : "entries"}
                  </span>
                </button>
              ))}
              {rows.length === 0 && (
                <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                  No {lens} matches “{query}”.
                </p>
              )}
              {matches.length > capped.length && (
                <p className="px-3 py-3 text-center text-xs text-muted-foreground">
                  {matches.length - capped.length} more match — keep typing to
                  narrow it down.
                </p>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {selected && (
        <Button
          variant="ghost"
          size="icon"
          className="size-8 rounded-full"
          onClick={clear}
          aria-label={`Stop following ${selected.name}`}
        >
          <X className="size-4" />
        </Button>
      )}
    </div>
  );
}
