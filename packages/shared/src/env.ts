/**
 * Leitura de ambiente com falha explícita.
 *
 * `requireServerEnv` propositalmente recusa qualquer nome com prefixo
 * NEXT_PUBLIC_: um segredo nunca deve ser lido por um caminho que o bundler
 * possa inlinar no cliente.
 */

export function publicEnv(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) throw new Error(`Variável de ambiente ausente: ${name}`);
  return value;
}

export function requireServerEnv(name: string): string {
  if (name.startsWith('NEXT_PUBLIC_')) {
    throw new Error(`${name} é pública e não pode ser usada como segredo`);
  }
  if (typeof window !== 'undefined') {
    throw new Error(`${name} é server-only e foi lida no browser`);
  }
  const value = process.env[name];
  if (!value) throw new Error(`Variável de ambiente ausente: ${name}`);
  return value;
}

export const SITE_URL = () =>
  publicEnv('NEXT_PUBLIC_SITE_URL', 'https://dz-collection.vercel.app').replace(/\/+$/, '');

export const ADMIN_URL = () =>
  publicEnv('NEXT_PUBLIC_ADMIN_URL', 'https://dz-collection-adm.vercel.app').replace(/\/+$/, '');

export const SUPABASE_URL = () => publicEnv('NEXT_PUBLIC_SUPABASE_URL');
export const SUPABASE_PUBLISHABLE_KEY = () => publicEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY');
