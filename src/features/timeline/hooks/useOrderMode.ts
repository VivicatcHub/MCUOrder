import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import type { OrderMode } from "@/domain/entities/title";
import { isOrderMode } from "@/domain/services/ordering";

const PARAM = "order";
const DEFAULT: OrderMode = "chronological";

export function useOrderMode() {
  const [searchParams, setSearchParams] = useSearchParams();
  const raw = searchParams.get(PARAM);
  const mode: OrderMode = isOrderMode(raw) ? raw : DEFAULT;

  const setMode = useCallback(
    (next: OrderMode) => {
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

  const toggle = useCallback(
    () => setMode(mode === "chronological" ? "release" : "chronological"),
    [mode, setMode],
  );

  return { mode, setMode, toggle };
}
