import { cn } from "@/shared/lib/utils";

const SMALL = "/logo-128.png";
const LARGE = "/icon-512.png";

export function BrandLogo({
  size = "sm",
  className,
}: {
  size?: "sm" | "lg";
  className?: string;
}) {
  return (
    <img
      src={size === "lg" ? LARGE : SMALL}
      alt=""
      draggable={false}
      className={cn("aspect-square shrink-0 select-none", className)}
    />
  );
}

export function BrandLoader({ className }: { className?: string }) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn("grid h-full place-items-center p-8", className)}
    >
      <BrandLogo size="lg" className="w-28 animate-pulse sm:w-36" />
    </div>
  );
}
