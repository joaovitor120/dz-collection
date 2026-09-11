import 'server-only';

import { revalidatePath } from 'next/cache';

/**
 * =============================================================================
 * ATUALIZAR O CATÁLOGO PÚBLICO DEPOIS DE UMA EDIÇÃO
 * =============================================================================
 * O catálogo é servido de cache para ser rápido. Quando a proprietária muda um
 * preço, as páginas em cache precisam ser invalidadas.
 *
 * Com o painel dentro da mesma aplicação, isso é uma chamada de função no mesmo
 * processo. Antes era um POST autenticado por segredo compartilhado — o que
 * significava um endpoint público a mais para proteger. O endpoint deixou de
 * existir junto com a necessidade dele.
 * =============================================================================
 */
export function revalidateSite(): void {
  revalidatePath('/', 'layout');
  revalidatePath('/(loja)', 'layout');
  revalidatePath('/catalogo');
  revalidatePath('/produtos/[slug]', 'page');
  revalidatePath('/sitemap.xml');
}
