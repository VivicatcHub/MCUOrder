import { cn } from "@/shared/lib/utils";
import type { Title } from "@/domain/entities/title";

export function PosterArt({
  title,
  className,
}: {
  title: Title;
  className?: string;
}) {
  const accent = title.franchise.accent;

  if (title.poster) {
    return (
      <img
        src={title.poster}
        alt=""
        loading="lazy"
        draggable={false}
        className={cn("h-full w-full object-cover", className)}
      />
    );
  }

  return (
    <div
      aria-hidden
      className={cn("relative h-full w-full overflow-hidden", className)}
      style={{
        background: `radial-gradient(120% 90% at 20% 0%, ${accent} 0%, ${accent}55 42%, #0b0b0e 100%)`,
      }}
    >
      <div
        className="absolute inset-0 opacity-40 mix-blend-overlay"
        style={{
          backgroundImage:
            "repeating-linear-gradient(115deg, rgba(255,255,255,.16) 0 1px, transparent 1px 9px)",
        }}
      />
      <span className="absolute bottom-2 right-3 text-[64px] leading-none font-black text-white/10 tabular-nums select-none">
        {title.franchiseIndex}
      </span>
    </div>
  );
}
