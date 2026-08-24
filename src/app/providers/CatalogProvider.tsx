import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { Catalog } from "@/domain/entities/title";
import type { CatalogRepository } from "@/domain/ports/catalog-repository";
import { staticCatalogRepository } from "@/data/repositories/static-catalog-repository";
import { CatalogContext, type CatalogState } from "./catalog-context";

interface CatalogProviderProps {
  children: ReactNode;
  repository?: CatalogRepository;
}

export function CatalogProvider({
  children,
  repository = staticCatalogRepository,
}: CatalogProviderProps) {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    repository
      .getCatalog()
      .then((loaded) => {
        if (!cancelled) setCatalog(loaded);
      })
      .catch((cause: unknown) => {
        if (!cancelled)
          setError(cause instanceof Error ? cause : new Error(String(cause)));
      });
    return () => {
      cancelled = true;
    };
  }, [repository]);

  const value = useMemo<CatalogState>(() => {
    const titlesById = new Map(
      (catalog?.titles ?? []).map((title) => [title.id, title]),
    );
    const charactersById = new Map(
      (catalog?.characters ?? []).map((character) => [character.id, character]),
    );
    const actorsById = new Map(
      (catalog?.actors ?? []).map((actor) => [actor.id, actor]),
    );

    return {
      status: error ? "error" : catalog ? "ready" : "loading",
      catalog,
      error,
      getTitle: (id) => titlesById.get(id),
      getCharacter: (id) => charactersById.get(id),
      getActor: (id) => actorsById.get(id),
    };
  }, [catalog, error]);

  return <CatalogContext value={value}>{children}</CatalogContext>;
}
