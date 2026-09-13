import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Search, X } from "lucide-react";
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
import { cn } from "@/shared/lib/utils";
import { useHasHover } from "@/shared/hooks/use-media-query";

interface ValuePickerProps {
  icon: ReactNode;
  title: string;
  description: string;
  placeholder: string;
  searchPlaceholder: string;
  options: readonly string[];
  value: string | null;
  onChange: (value: string | null) => void;
}

export function ValuePicker({
  icon,
  title,
  description,
  placeholder,
  searchPlaceholder,
  options,
  value,
  onChange,
}: ValuePickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const hasHover = useHasHover();

  const matches = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return options;
    return options.filter((option) =>
      option.toLowerCase().includes(normalized),
    );
  }, [options, query]);

  const select = (option: string) => {
    onChange(option === value ? null : option);
    setOpen(false);
  };

  return (
    <div className="flex items-center gap-1.5">
      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (next) setQuery("");
        }}
      >
        <DialogTrigger asChild>
          <Button
            variant={value ? "default" : "outline"}
            size="sm"
            className="max-w-[14rem] rounded-full"
          >
            {icon}
            <span className="truncate">{value ?? placeholder}</span>
          </Button>
        </DialogTrigger>

        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus={hasHover}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={searchPlaceholder}
              className="pl-9"
            />
          </div>

          <ScrollArea className="-mx-1 h-[50vh] px-1 sm:h-80">
            <div className="grid gap-1">
              {matches.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => select(option)}
                  className={cn(
                    "flex min-h-11 items-center rounded-lg px-3 py-2 text-left text-sm transition-colors",
                    "hover:bg-accent focus-visible:bg-accent focus-visible:outline-none",
                    option === value && "bg-accent",
                  )}
                >
                  {option}
                </button>
              ))}
              {matches.length === 0 && (
                <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                  No match for “{query}”.
                </p>
              )}
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
          aria-label={`Clear the ${title.toLowerCase()} filter`}
        >
          <X className="size-4" />
        </Button>
      )}
    </div>
  );
}
