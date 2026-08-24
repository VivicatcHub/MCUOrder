import type { Catalog } from "../entities/title";

export interface CatalogRepository {
  getCatalog(): Promise<Catalog>;
}
