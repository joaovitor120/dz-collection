/**
 * =============================================================================
 * SUBIR AS FOTOS DO CATÁLOGO PARA O SUPABASE STORAGE
 * =============================================================================
 * Roda uma vez. Envia os arquivos de
 *
 *     apps/site/public/images/products/<pasta>/<arquivo>.webp
 *
 * para o bucket `product-images`, no MESMO caminho que o banco já registrou em
 * product_images.storage_path. Não inventa caminho: confere contra o banco e
 * avisa qualquer divergência em vez de subir arquivo no lugar errado.
 *
 * Uso, na raiz do projeto:
 *     node scripts/subir-imagens.mjs
 *
 * Precisa de apps/admin/.env.local com SUPABASE_SECRET_KEY preenchida.
 * A chave só é lida em memória — nunca é impressa, nem gravada em lugar nenhum.
 * =============================================================================
 */
import { createClient } from '@supabase/supabase-js';
import { readdir, readFile } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const IMAGES_DIR = join(ROOT, 'apps/site/public/images/products');
const BUCKET = 'product-images';

// --- env ---------------------------------------------------------------------
function loadEnv(file) {
  if (!existsSync(file)) return {};
  const out = {};
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && m[1] && !line.trimStart().startsWith('#')) {
      out[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
  return out;
}

const env = { ...loadEnv(join(ROOT, 'apps/admin/.env.local')), ...process.env };
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const secret = env.SUPABASE_SECRET_KEY;

if (!url || !secret || secret.startsWith('COLE-AQUI')) {
  console.error(
    '\n  Faltou configurar apps/admin/.env.local:\n' +
      '    NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co\n' +
      '    SUPABASE_SECRET_KEY=sb_secret_...\n',
  );
  process.exit(1);
}

const supabase = createClient(url, secret, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// --- o banco diz onde cada arquivo deve ficar --------------------------------
const { data: rows, error } = await supabase
  .from('product_images')
  .select('storage_path')
  .order('storage_path');

if (error) {
  console.error('  Não foi possível ler product_images:', error.message);
  process.exit(1);
}

const expected = new Set(rows.map((r) => r.storage_path));
console.log(`\n  ${expected.size} caminhos registrados no banco.`);

// --- arquivos em disco -------------------------------------------------------
const files = [];
for (const folder of await readdir(IMAGES_DIR, { withFileTypes: true })) {
  if (!folder.isDirectory()) continue;
  for (const name of await readdir(join(IMAGES_DIR, folder.name))) {
    if (name.endsWith('.webp')) {
      files.push({ path: `${folder.name}/${name}`, disk: join(IMAGES_DIR, folder.name, name) });
    }
  }
}
console.log(`  ${files.length} arquivos .webp encontrados em disco.\n`);

const orphans = files.filter((f) => !expected.has(f.path));
const missing = [...expected].filter((p) => !files.some((f) => f.path === p));

if (orphans.length > 0) {
  console.log('  Arquivos sem registro no banco (NÃO serão enviados):');
  for (const o of orphans) console.log(`    · ${o.path}`);
  console.log('');
}
if (missing.length > 0) {
  console.log('  Registros no banco sem arquivo em disco:');
  for (const m of missing) console.log(`    · ${m}`);
  console.log('');
}

// --- envio -------------------------------------------------------------------
let sent = 0;
let failed = 0;

for (const file of files) {
  if (!expected.has(file.path)) continue;
  const body = await readFile(file.disk);
  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(file.path, body, {
    contentType: 'image/webp',
    cacheControl: '31536000',
    upsert: true, // rodar de novo é seguro: sobrescreve, não duplica
  });

  if (uploadError) {
    failed += 1;
    console.log(`  ✗ ${file.path} — ${uploadError.message}`);
  } else {
    sent += 1;
    console.log(`  ✓ ${file.path}`);
  }
}

console.log(`\n  ${sent} enviadas, ${failed} com erro.\n`);
process.exit(failed > 0 ? 1 : 0);
