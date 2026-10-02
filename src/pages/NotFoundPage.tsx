import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/brand-logo";

export function NotFoundPage() {
  return (
    <div className="relative grid h-dvh place-items-center overflow-hidden p-8 text-center">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 40%, color-mix(in oklch, var(--crimson) 28%, transparent) 0%, transparent 100%)",
        }}
      />
      <div className="relative flex flex-col items-center">
        <BrandLogo
          size="lg"
          className="w-40 drop-shadow-[0_0_32px_color-mix(in_oklch,var(--gold)_35%,transparent)] sm:w-52"
        />
        <h1 className="-mt-2 bg-gradient-to-b from-gold via-crimson to-[oklch(0.35_0.15_27)] bg-clip-text text-8xl font-black tracking-tighter text-transparent sm:text-9xl">
          404
        </h1>
        <p className="mt-2 text-muted-foreground">
          This page snapped out of existence.
        </p>
        <Button asChild className="mt-6 rounded-full">
          <Link to="/">Back to the wall</Link>
        </Button>
      </div>
    </div>
  );
}
