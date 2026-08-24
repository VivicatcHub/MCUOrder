import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { TitleId } from "@/domain/entities/title";
import { watchedStorage } from "../storage/watched-storage";
import { WatchedContext, type WatchedState } from "../hooks/watched-context";

export function WatchedProvider({ children }: { children: ReactNode }) {
  const [watched, setWatched] = useState<ReadonlySet<TitleId>>(
    () => new Set(watchedStorage.read()),
  );

  useEffect(
    () => watchedStorage.subscribe((ids) => setWatched(new Set(ids))),
    [],
  );

  const toggle = useCallback((id: TitleId) => {
    setWatched((current) => {
      const next = new Set(current);
      if (!next.delete(id)) next.add(id);
      watchedStorage.write([...next]);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    watchedStorage.write([]);
    setWatched(new Set());
  }, []);

  const value = useMemo<WatchedState>(
    () => ({
      watched,
      isWatched: (id) => watched.has(id),
      toggle,
      clear,
      count: watched.size,
    }),
    [watched, toggle, clear],
  );

  return <WatchedContext value={value}>{children}</WatchedContext>;
}
