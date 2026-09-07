export type CategorySlug =
  | 'aviador'
  | 'quadrado'
  | 'redondo'
  | 'gatinho'
  | 'retangular';

export interface Category {
  slug: CategorySlug;
  name: string;
  /** Caminho da categoria na loja atual (taxonomia oficial) */
  parent: string;
  description?: string;
  /** Imagem representativa — sempre uma foto real de um produto da categoria */
  image?: string;
}

export interface ProductSpecification {
  label: string;
  value: string;
}

export interface Product {
  /** id numérico da loja atual (Nuvemshop) — também define a ordem de lançamento */
  id: string;
  slug: string;
  name: string;
  /** Categoria oficial da loja. `null` quando o produto não está classificado lá. */
  category: CategorySlug | null;
  /** Cores declaradas no próprio nome do produto na loja atual */
  colors: string[];
  price: number;
  /** Preço "de" — só existe quando a loja realmente exibe promoção */
  compareAtPrice?: number;
  /** Preço no Pix — só existe quando a loja realmente o exibe (não acumula com promoção) */
  pixPrice?: number;
  /** Parágrafos da descrição, extraídos da loja atual */
  description: string[];
  /** Bullets de destaques/características, quando a loja os apresenta em lista */
  highlights?: string[];
  specifications?: ProductSpecification[];
  images: string[];
  /** Texto alternativo por imagem, na mesma ordem de `images` */
  imageAlts: string[];
  stock: number;
  available: boolean;
  /** Marcado como lançamento. Controlado aqui — nunca inferido de forma arbitrária. */
  isNew?: boolean;
  /** Produto que a loja atual destaca na home */
  featured?: boolean;
  /** Data de última atualização na loja atual (sitemap) */
  updatedAt: string;
}

export type SortKey =
  | 'lancamentos'
  | 'menor-preco'
  | 'maior-preco'
  | 'a-z'
  | 'destaques'
  | 'maior-desconto';

export interface PriceBucket {
  id: string;
  label: string;
  min: number;
  max: number | null;
}

export interface CatalogFilters {
  query: string;
  categories: CategorySlug[];
  colors: string[];
  priceBuckets: string[];
  onlyPromo: boolean;
}
