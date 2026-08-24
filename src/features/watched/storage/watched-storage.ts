import type { TitleId } from "@/domain/entities/title";

const STORAGE_KEY = "marvel-order:watched:v1";

export const watchedStorage = {
  read(): TitleId[] {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter((id): id is string => typeof id === "string");
    } catch {
      return [];
    }
  },

  write(ids: readonly TitleId[]): void {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
    } catch {}
  },

  subscribe(onChange: (ids: TitleId[]) => void): () => void {
    if (typeof window === "undefined") return () => {};
    const handler = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) onChange(watchedStorage.read());
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  },
};
