import { createContext, useContext } from "react";
import type { TitleId } from "@/domain/entities/title";

export interface WatchedState {
  watched: ReadonlySet<TitleId>;
  isWatched: (id: TitleId) => boolean;
  toggle: (id: TitleId) => void;
  clear: () => void;
  count: number;
}

export const WatchedContext = createContext<WatchedState | null>(null);

export function useWatched(): WatchedState {
  const state = useContext(WatchedContext);
  if (!state)
    throw new Error("useWatched must be used inside <WatchedProvider>");
  return state;
}
