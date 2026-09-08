'use client';

import { createBrowserClient } from '@supabase/ssr';
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from '../env';

/**
 * Cliente do browser. Usa a PUBLISHABLE KEY, que é pública por natureza.
 *
 * Isso não afrouxa nada: toda leitura e escrita continua passando por
 * grants + RLS no PostgreSQL. A chave identifica o projeto, não autoriza ação.
 */
export function createClient() {
  return createBrowserClient(SUPABASE_URL(), SUPABASE_PUBLISHABLE_KEY());
}
