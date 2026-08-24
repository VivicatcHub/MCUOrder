import { cn } from "@/shared/lib/utils";
import type { Actor } from "@/domain/entities/title";

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter((part) => /[a-z]/i.test(part))
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function hueOf(id: string): number {
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) % 360;
  return hash;
}

export function ActorAvatar({
  actor,
  className,
}: {
  actor: Actor;
  className?: string;
}) {
  const shape = cn(
    "size-8 shrink-0 overflow-hidden rounded-[25%] border bg-muted",
    className,
  );

  if (actor.photo) {
    return (
      <img
        src={actor.photo}
        alt=""
        loading="lazy"
        draggable={false}
        className={cn(shape, "object-cover")}
      />
    );
  }

  const hue = hueOf(actor.id);

  return (
    <span
      aria-hidden
      className={cn(
        shape,
        "grid place-items-center text-[0.65em] font-semibold text-white/90",
      )}
      style={{
        background: `linear-gradient(140deg, hsl(${hue} 42% 42%) 0%, hsl(${(hue + 40) % 360} 38% 26%) 100%)`,
      }}
    >
      {initialsOf(actor.name)}
    </span>
  );
}
