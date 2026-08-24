import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function NotFoundPage() {
  return (
    <div className="grid h-dvh place-items-center p-8 text-center">
      <div>
        <p className="text-5xl font-black tracking-tight">404</p>
        <p className="mt-2 text-muted-foreground">
          This page snapped out of existence.
        </p>
        <Button asChild className="mt-5">
          <Link to="/">Back to the wall</Link>
        </Button>
      </div>
    </div>
  );
}
