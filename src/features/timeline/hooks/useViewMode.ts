import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";

export type ViewMode = "board" | "reel";

const PARAM = "view";
const DEFAULT: ViewMode = "board";

function isViewMode(value: string | null): value is ViewMode {
  return value === "board" || value === "reel";
}

export function useViewMode() {
  const [searchParams, setSearchParams] = useSearchParams();
  const raw = searchParams.get(PARAM);
  const mode: ViewMode = isViewMode(raw) ? raw : DEFAULT;

  const setMode = useCallback(
    (next: ViewMode) => {
      setSearchParams(
        (current) => {
          const params = new URLSearchParams(current);
          if (next === DEFAULT) params.delete(PARAM);
          else params.set(PARAM, next);
          return params;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  return { mode, setMode };
}
