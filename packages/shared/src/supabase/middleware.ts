import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from '../env';

/**
 * Renova a sessão a cada request e devolve o usuário já validado no servidor.
 *
 * Usa `getUser()`, que verifica o token contra o servidor de Auth. `getSession()`
 * apenas lê o cookie e por isso NÃO serve para decisão de autorização — o cookie
 * é dado do cliente até que alguém o valide.
 */
export async function updateSession(request: NextRequest) {
  const isProduction = process.env.NODE_ENV === 'production';
  let response = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL(), SUPABASE_PUBLISHABLE_KEY(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookies) {
        for (const { name, value } of cookies) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookies) {
          response.cookies.set(name, value, {
            ...options,
            httpOnly: true,
            secure: isProduction,
            sameSite: 'lax',
            path: '/',
          });
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response, supabase, user };
}
