/**
 * Tipos do domínio. Espelham o schema do PostgreSQL, que é a fonte da verdade.
 * Dinheiro trafega SEMPRE em centavos (inteiro). Nunca float.
 */

export type Uuid = string;

export interface CategoryRow {
  id: Uuid;
  slug: string;
  name: string;
  description: string | null;
  parent_name: string | null;
  display_order: number;
  active: boolean;
}

export interface ProductImageRow {
  id: Uuid;
  storage_path: string;
  alt_text: string | null;
  display_order: number;
  is_primary: boolean;
  width: number | null;
  height: number | null;
}

export interface ProductSpecificationRow {
  id: Uuid;
  label: string;
  value: string;
  display_order: number;
}

export interface ProductHighlightRow {
  id: Uuid;
  text: string;
  display_order: number;
}

export interface ProductRow {
  id: Uuid;
  name: string;
  slug: string;
  description: string | null;
  category_id: Uuid | null;
  price_cents: number;
  compare_at_price_cents: number | null;
  stock: number;
  active: boolean;
  is_launch: boolean;
  is_featured: boolean;
  display_order: number;
  meta_title: string | null;
  meta_description: string | null;
  created_at: string;
  updated_at: string;
}

/** Produto já montado para a interface, com relações resolvidas. */
export interface Product extends ProductRow {
  category: Pick<CategoryRow, 'id' | 'slug' | 'name'> | null;
  images: ProductImageRow[];
  specifications: ProductSpecificationRow[];
  highlights: ProductHighlightRow[];
  /** Derivado: só existe quando não há preço promocional. */
  pix_price_cents: number | null;
}

export type SortKey =
  | 'lancamentos'
  | 'destaques'
  | 'menor-preco'
  | 'maior-preco'
  | 'maior-desconto'
  | 'a-z';

export interface CatalogFilters {
  query: string;
  categories: string[];
  priceBuckets: string[];
  onlyPromo: boolean;
}

export interface AuditLogRow {
  id: number;
  admin_user_id: Uuid | null;
  actor_email: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}
