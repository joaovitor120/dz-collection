import 'server-only';

import { createServerClient } from '@supabase/ssr';
import type { CookieOptions } from '@supabase/ssr';
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from '../env';

export interface CookieStore {
  getAll(): { name: string; value: string }[];
  set(name: string, value: string, options?: CookieOptions): void;
}

/**
 * Cliente server-side com sessão em COOKIE (nunca localStorage).
 *
 * Atributos dos cookies de sessão, aplicados a todos os cookies do Supabase:
 *   httpOnly  → JavaScript da página não alcança o token
 *   secure    → só trafega em HTTPS (liberado em localhost para desenvolvimento)
 *   sameSite  → 'lax': protege contra CSRF sem quebrar o retorno do link de
 *               recuperação de senha, que chega por navegação top-level GET
 *   path '/'  → sem atributo Domain, então o cookie NÃO vaza para o domínio do
 *               catálogo público nem para outros subdomínios
 */
export function createClient(cookieStore: CookieStore) {
  const isProduction = process.env.NODE_ENV === 'production';

  return createServerClient(SUPABASE_URL(), SUPABASE_PUBLISHABLE_KEY(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookies) {
        try {
          for (const { name, value, options } of cookies) {
            cookieStore.set(name, value, {
              ...options,
              httpOnly: true,
              secure: isProduction,
              sameSite: 'lax',
              path: '/',
            });
          }
        } catch {
          // Server Component não pode escrever cookie. O middleware já cuidou
          // da renovação da sessão, então ignorar aqui é seguro.
        }
      },
    },
  });
}
