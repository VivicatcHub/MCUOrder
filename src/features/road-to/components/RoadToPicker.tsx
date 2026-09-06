import { useMemo, useState } from "react";
import { MapPin, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { FilmDependency } from "@/domain/entities/dependency";
import type { Title, TitleId } from "@/domain/entities/title";

interface RoadToPickerProps {
  dependencies: readonly FilmDependency[];
  titles: readonly Title[];
  value: TitleId | null;
  onChange: (filmId: TitleId | null) => void;
}

export function RoadToPicker({
  dependencies,
  titles,
  value,
  onChange,
}: RoadToPickerProps) {
  const [open, setOpen] = useState(false);

  const titleMap = useMemo(
    () => new Map(titles.map((title) => [title.id, title])),
    [titles],
  );

  const availableRoads = useMemo(
    () =>
      dependencies
        .map((dependency) => ({
          dependency,
          title: titleMap.get(dependency.filmId),
        }))
        .filter(
          (road): road is { dependency: FilmDependency; title: Title } =>
            road.title !== undefined,
        ),
    [dependencies, titleMap],
  );

  if (availableRoads.length === 0) return null;

  const selectedRoad = availableRoads.find(
    (road) => road.dependency.filmId === value,
  );

  return (
    <div className="flex items-center gap-1.5">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            variant={value ? "default" : "outline"}
            size="sm"
            className="max-w-[14rem] gap-2 rounded-full"
            title="See what leads up to a film"
          >
            <MapPin className="size-3.5 shrink-0" />
            <span className="truncate">
              {selectedRoad ? selectedRoad.title.title : "Road to…"}
            </span>
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Road to…</DialogTitle>
            <DialogDescription>
              Pick a film to see only what you need to have watched to
              understand it.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-96">
            <div className="grid gap-1">
              {availableRoads.map(({ dependency, title }) => (
                <button
                  key={dependency.filmId}
                  type="button"
                  onClick={() => {
                    onChange(dependency.filmId);
                    setOpen(false);
                  }}
                  className={`w-full rounded-lg border p-3 text-left transition-colors ${
                    dependency.filmId === value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  <div className="font-medium">{title.title}</div>
                  <div className="text-sm text-muted-foreground">
                    {dependency.description}
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {value && (
        <Button
          variant="ghost"
          size="icon"
          className="size-8 rounded-full"
          onClick={() => onChange(null)}
          aria-label="Clear the road-to filter"
        >
          <X className="size-4" />
        </Button>
      )}
    </div>
  );
}
