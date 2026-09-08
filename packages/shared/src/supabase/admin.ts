import 'server-only';

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { requireServerEnv, SUPABASE_URL } from '../env';

/**
 * ============================================================================
 * CLIENTE DE PRIVILÉGIO MÁXIMO — IGNORA RLS.
 * ============================================================================
 * `import 'server-only'` faz o BUILD FALHAR se este módulo for importado, ainda
 * que indiretamente, por um Client Component. É a trava que impede a secret key
 * de acabar no bundle enviado ao browser.
 *
 * Use SOMENTE onde RLS não dá conta:
 *   · escrita em auth_rate_limits (tabela sem grant para qualquer role da app)
 *   · leitura de admin_users em rotina de provisionamento
 *
 * NUNCA use para CRUD de produto. O CRUD passa pela sessão do administrador,
 * para que o RLS continue sendo a barreira real e a auditoria registre o autor.
 * ============================================================================
 */
export function createAdminClient() {
  return createSupabaseClient(SUPABASE_URL(), requireServerEnv('SUPABASE_SECRET_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
