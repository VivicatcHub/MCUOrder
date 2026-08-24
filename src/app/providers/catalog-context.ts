import { createContext, useContext } from "react";
import type {
  Actor,
  ActorId,
  Catalog,
  Character,
  CharacterId,
  Title,
  TitleId,
} from "@/domain/entities/title";

export interface CatalogState {
  status: "loading" | "ready" | "error";
  catalog: Catalog | null;
  error: Error | null;
  getTitle: (id: TitleId) => Title | undefined;
  getCharacter: (id: CharacterId) => Character | undefined;
  getActor: (id: ActorId) => Actor | undefined;
}

export const CatalogContext = createContext<CatalogState | null>(null);

export function useCatalog(): CatalogState {
  const state = useContext(CatalogContext);
  if (!state)
    throw new Error("useCatalog must be used inside <CatalogProvider>");
  return state;
}

export function useCatalogData(): Catalog {
  const { catalog } = useCatalog();
  if (!catalog) throw new Error("Catalog is not loaded yet");
  return catalog;
}
