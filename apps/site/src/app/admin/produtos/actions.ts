'use server';

import { randomUUID } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  parseInput,
  parseToCents,
  productCreateSchema,
  productUpdateSchema,
  specificationSchema,
  uuidSchema,
} from '@dz/shared';
import { audit, requireAdmin } from '@/lib/admin/auth';
import { buildStoragePath, validateAndReencode } from '@/lib/admin/images';
import {
  ValidationError,
  assertFetchMetadata,
  assertSameOrigin,
  logServer,
  toPublicError,
} from '@/lib/admin/security';
import { clientIp, enforceRateLimit } from '@/lib/admin/rate-limit';
import { revalidateSite } from '@/lib/admin/revalidate';
import type { ActionState } from '@/app/admin/login/actions';

/**
 * =============================================================================
 * CRUD DE PRODUTOS
 * =============================================================================
 * Toda action deste arquivo passa pelo mesmo portão, na mesma ordem:
 *
 *   1. Origin/Referer  → a requisição veio do painel, não de outro site
 *   2. Fetch Metadata  → o navegador não a classificou como cross-site
 *   3. requireAdmin()  → sessão válida + is_admin() no banco + MFA cumprido
 *   4. rate limit      → teto de mutations por minuto
 *   5. Zod .strict()   → campo desconhecido reprova a requisição inteira
 *   6. RLS             → e mesmo assim o banco confere de novo
 *
 * Chegar na página não autoriza nada. Cada action reverifica do zero.
 * =============================================================================
 */

async function guard() {
  await assertSameOrigin();
  await assertFetchMetadata();
  const session = await requireAdmin();
  await enforceRateLimit([{ name: 'admin_mutation', identifier: session.user.id }]);
  return session;
}

/** Depois de mexer no catálogo, o painel e o site público precisam refletir. */
function refresh(productId?: string) {
  revalidatePath('/admin/produtos');
  revalidatePath('/admin');
  if (productId) revalidatePath(`/admin/produtos/${productId}`);
  revalidateSite();
}

// -----------------------------------------------------------------------------
// FormData → objeto tipado
// -----------------------------------------------------------------------------

function text(form: FormData, key: string): string {
  return (form.get(key) ?? '').toString();
}

function bool(form: FormData, key: string): boolean {
  return form.get(key) === 'on' || form.get(key) === 'true';
}

/**
 * Preço chega da tela como "129,90". Converte para centavos AQUI, no servidor.
 * O cliente nunca envia centavos direto, e nenhum float chega ao banco.
 */
function cents(form: FormData, key: string): number | null {
  const raw = text(form, key).trim();
  if (raw === '') return null;
  try {
    return parseToCents(raw);
  } catch {
    throw new ValidationError(`valor monetário inválido em ${key}`, [
      { path: key, message: 'Informe um valor como 129,90.' },
    ]);
  }
}

function int(form: FormData, key: string, fallback: number): number {
  const raw = text(form, key).trim();
  if (raw === '') return fallback;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 0) {
    throw new ValidationError(`número inválido em ${key}`, [
      { path: key, message: 'Informe um número inteiro.' },
    ]);
  }
  return n;
}

/** "Óculos de Sol Atena - Camuflado" → "oculos-de-sol-atena-camuflado" */
function toSlug(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 160);
}

function buildPayload(form: FormData) {
  const name = text(form, 'name').trim();
  const rawSlug = text(form, 'slug').trim();

  return {
    name,
    slug: rawSlug ? toSlug(rawSlug) : toSlug(name),
    description: text(form, 'description') || null,
    category_id: text(form, 'category_id') || null,
    price_cents: cents(form, 'price') ?? 0,
    compare_at_price_cents: cents(form, 'compare_at_price'),
    stock: int(form, 'stock', 0),
    active: bool(form, 'active'),
    is_launch: bool(form, 'is_launch'),
    is_featured: bool(form, 'is_featured'),
    display_order: int(form, 'display_order', 0),
    meta_title: text(form, 'meta_title') || null,
    meta_description: text(form, 'meta_description') || null,
  };
}

// -----------------------------------------------------------------------------
// CRIAR
// -----------------------------------------------------------------------------
export async function createProduct(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  let newId: string | null = null;

  try {
    const { client, user } = await guard();

    const parsed = parseInput(productCreateSchema, buildPayload(form));
    if (!parsed.ok) return { error: parsed.issues[0]?.message ?? parsed.message };

    const { data, error } = await client
      .from('products')
      .insert(parsed.data)
      .select('id, slug')
      .single();

    if (error) {
      // 23505 = unique_violation. É a única condição de erro que vale explicar,
      // porque a pessoa consegue corrigir sozinha.
      if (error.code === '23505') {
        return { error: 'Já existe um produto com esse endereço (slug). Escolha outro.' };
      }
      logServer('product_create_failed', { user_id: user.id, code: error.code });
      return { error: 'Não foi possível criar o produto.' };
    }

    await audit(client, 'PRODUCT_CREATED', 'product', data.id, { slug: data.slug });
    refresh();
    newId = data.id;
  } catch (error) {
    const { message } = toPublicError(error);
    return { error: message };
  }

  redirect(`/admin/produtos/${newId}?criado=1`);
}

// -----------------------------------------------------------------------------
// ATUALIZAR
// -----------------------------------------------------------------------------
export async function updateProduct(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  try {
    const { client, user } = await guard();

    const id = uuidSchema.safeParse(text(form, 'id'));
    if (!id.success) return { error: 'Produto não encontrado.' };

    const parsed = parseInput(productUpdateSchema, buildPayload(form));
    if (!parsed.ok) return { error: parsed.issues[0]?.message ?? parsed.message };

    const { error } = await client.from('products').update(parsed.data).eq('id', id.data);

    if (error) {
      if (error.code === '23505') {
        return { error: 'Já existe um produto com esse endereço (slug). Escolha outro.' };
      }
      logServer('product_update_failed', { user_id: user.id, code: error.code });
      return { error: 'Não foi possível salvar as alterações.' };
    }

    await audit(client, 'PRODUCT_UPDATED', 'product', id.data, {
      campos: Object.keys(parsed.data),
    });
    refresh(id.data);
    return { info: 'Alterações salvas.' };
  } catch (error) {
    const { message } = toPublicError(error);
    return { error: message };
  }
}

// -----------------------------------------------------------------------------
// TIRAR DO AR / COLOCAR NO AR — o "remover" reversível
// -----------------------------------------------------------------------------
export async function toggleActive(_prev: ActionState, form: FormData): Promise<ActionState> {
  try {
    const { client } = await guard();

    const id = uuidSchema.safeParse(text(form, 'id'));
    if (!id.success) return { error: 'Produto não encontrado.' };
    const active = bool(form, 'active');

    const { error } = await client.from('products').update({ active }).eq('id', id.data);
    if (error) return { error: 'Não foi possível alterar a situação do produto.' };

    await audit(client, active ? 'PRODUCT_ACTIVATED' : 'PRODUCT_DEACTIVATED', 'product', id.data);
    refresh(id.data);
    return { info: active ? 'Produto publicado no catálogo.' : 'Produto retirado do catálogo.' };
  } catch (error) {
    const { message } = toPublicError(error);
    return { error: message };
  }
}

// -----------------------------------------------------------------------------
// EXCLUIR DEFINITIVAMENTE
// -----------------------------------------------------------------------------
/**
 * Exclusão é irreversível, então exige confirmação DIGITADA: a pessoa precisa
 * escrever o nome exato do produto. Um clique acidental não apaga nada.
 *
 * As imagens no Storage são apagadas ANTES da linha do banco. Se algo falhar
 * no meio, sobra registro apontando para arquivo ausente — situação visível e
 * corrigível — em vez de arquivo órfão invisível ocupando espaço para sempre.
 */
export async function deleteProduct(_prev: ActionState, form: FormData): Promise<ActionState> {
  try {
    const { client, user } = await guard();

    const id = uuidSchema.safeParse(text(form, 'id'));
    if (!id.success) return { error: 'Produto não encontrado.' };

    const { data: product, error: readError } = await client
      .from('products')
      .select('id, name, slug, product_images (storage_path)')
      .eq('id', id.data)
      .maybeSingle();

    if (readError || !product) return { error: 'Produto não encontrado.' };

    const typed = text(form, 'confirmacao').trim();
    if (typed !== product.name) {
      return { error: 'O nome digitado não confere. Nada foi excluído.' };
    }

    const paths = ((product.product_images ?? []) as { storage_path: string }[]).map(
      (i) => i.storage_path,
    );
    if (paths.length > 0) {
      const { error: storageError } = await client.storage.from('product-images').remove(paths);
      if (storageError) {
        logServer('product_delete_storage_failed', { product_id: id.data });
        return { error: 'Não foi possível remover as imagens. Nada foi excluído.' };
      }
    }

    const { error } = await client.from('products').delete().eq('id', id.data);
    if (error) {
      logServer('product_delete_failed', { user_id: user.id, code: error.code });
      return { error: 'Não foi possível excluir o produto.' };
    }

    await audit(client, 'PRODUCT_DELETED', 'product', id.data, {
      slug: product.slug,
      nome: product.name,
      imagens_removidas: paths.length,
    });
    refresh();
  } catch (error) {
    const { message } = toPublicError(error);
    return { error: message };
  }

  redirect('/admin/produtos?excluido=1');
}

// -----------------------------------------------------------------------------
// IMAGENS
// -----------------------------------------------------------------------------
export async function uploadImage(_prev: ActionState, form: FormData): Promise<ActionState> {
  try {
    const { client, user } = await guard();
    await enforceRateLimit([{ name: 'upload', identifier: await clientIp() }]);

    const id = uuidSchema.safeParse(text(form, 'product_id'));
    if (!id.success) return { error: 'Produto não encontrado.' };

    const file = form.get('file');
    if (!(file instanceof File) || file.size === 0) {
      return { error: 'Escolha uma imagem.' };
    }

    const { data: product } = await client
      .from('products')
      .select('slug, product_images (id, display_order)')
      .eq('id', id.data)
      .maybeSingle();

    if (!product) return { error: 'Produto não encontrado.' };

    const existing = (product.product_images ?? []) as { id: string; display_order: number }[];
    if (existing.length >= 30) {
      return { error: 'Limite de 30 imagens por produto atingido.' };
    }

    // Valida extensão, Content-Type, magic bytes, e reencoda para WebP.
    // O que sobe é um arquivo NOVO, gerado aqui — nada do original é preservado.
    const processed = await validateAndReencode(file);
    const path = buildStoragePath(product.slug, randomUUID());

    const { error: uploadError } = await client.storage
      .from('product-images')
      .upload(path, processed.data, {
        contentType: processed.contentType,
        cacheControl: '31536000',
        upsert: false,
      });

    if (uploadError) {
      logServer('image_upload_failed', { user_id: user.id, message: uploadError.message });
      return { error: 'Não foi possível enviar a imagem.' };
    }

    const nextOrder = existing.length === 0 ? 0 : Math.max(...existing.map((i) => i.display_order)) + 1;

    const { error: insertError } = await client.from('product_images').insert({
      product_id: id.data,
      storage_path: path,
      alt_text: text(form, 'alt_text').trim() || null,
      display_order: nextOrder,
      is_primary: existing.length === 0,
      width: processed.width,
      height: processed.height,
    });

    if (insertError) {
      // Registro falhou: o arquivo não pode ficar órfão no bucket.
      await client.storage.from('product-images').remove([path]);
      return { error: 'Não foi possível registrar a imagem.' };
    }

    await audit(client, 'IMAGE_UPLOADED', 'product', id.data, { path });
    refresh(id.data);
    return { info: 'Imagem enviada.' };
  } catch (error) {
    const { message } = toPublicError(error);
    return { error: message };
  }
}

export async function deleteImage(_prev: ActionState, form: FormData): Promise<ActionState> {
  try {
    const { client } = await guard();

    const imageId = uuidSchema.safeParse(text(form, 'image_id'));
    const productId = uuidSchema.safeParse(text(form, 'product_id'));
    if (!imageId.success || !productId.success) return { error: 'Imagem não encontrada.' };

    const { data: image } = await client
      .from('product_images')
      .select('id, storage_path, is_primary, product_id')
      .eq('id', imageId.data)
      .maybeSingle();

    if (!image || image.product_id !== productId.data) return { error: 'Imagem não encontrada.' };

    const { error: storageError } = await client.storage
      .from('product-images')
      .remove([image.storage_path]);
    if (storageError) return { error: 'Não foi possível remover o arquivo.' };

    const { error } = await client.from('product_images').delete().eq('id', imageId.data);
    if (error) return { error: 'Não foi possível remover a imagem.' };

    // Se a principal saiu, a próxima assume — o produto nunca fica sem capa.
    if (image.is_primary) {
      const { data: next } = await client
        .from('product_images')
        .select('id')
        .eq('product_id', productId.data)
        .order('display_order', { ascending: true })
        .limit(1);
      const first = next?.[0];
      if (first) {
        await client.from('product_images').update({ is_primary: true }).eq('id', first.id);
      }
    }

    await audit(client, 'IMAGE_DELETED', 'product', productId.data, { path: image.storage_path });
    refresh(productId.data);
    return { info: 'Imagem removida.' };
  } catch (error) {
    const { message } = toPublicError(error);
    return { error: message };
  }
}

export async function setPrimaryImage(_prev: ActionState, form: FormData): Promise<ActionState> {
  try {
    const { client } = await guard();

    const imageId = uuidSchema.safeParse(text(form, 'image_id'));
    const productId = uuidSchema.safeParse(text(form, 'product_id'));
    if (!imageId.success || !productId.success) return { error: 'Imagem não encontrada.' };

    // O índice único parcial do banco garante uma principal por produto, então
    // a antiga precisa cair antes da nova subir.
    await client
      .from('product_images')
      .update({ is_primary: false })
      .eq('product_id', productId.data)
      .eq('is_primary', true);

    const { error } = await client
      .from('product_images')
      .update({ is_primary: true })
      .eq('id', imageId.data)
      .eq('product_id', productId.data);

    if (error) return { error: 'Não foi possível definir a imagem principal.' };

    await audit(client, 'IMAGE_SET_PRIMARY', 'product', productId.data);
    refresh(productId.data);
    return { info: 'Imagem principal atualizada.' };
  } catch (error) {
    const { message } = toPublicError(error);
    return { error: message };
  }
}

// -----------------------------------------------------------------------------
// ESPECIFICAÇÕES
// -----------------------------------------------------------------------------
export async function saveSpecifications(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  try {
    const { client } = await guard();

    const productId = uuidSchema.safeParse(text(form, 'product_id'));
    if (!productId.success) return { error: 'Produto não encontrado.' };

    const labels = form.getAll('spec_label').map((v) => v.toString());
    const values = form.getAll('spec_value').map((v) => v.toString());

    const rows: { label: string; value: string; display_order: number }[] = [];
    for (let i = 0; i < labels.length; i += 1) {
      const label = (labels[i] ?? '').trim();
      const value = (values[i] ?? '').trim();
      if (label === '' && value === '') continue; // linha em branco: ignora
      const parsed = parseInput(specificationSchema, {
        label,
        value,
        display_order: rows.length,
      });
      if (!parsed.ok) {
        return { error: `Especificação ${i + 1}: ${parsed.issues[0]?.message ?? 'inválida'}` };
      }
      rows.push(parsed.data);
    }

    if (rows.length > 40) return { error: 'Máximo de 40 especificações.' };

    await client.from('product_specifications').delete().eq('product_id', productId.data);

    if (rows.length > 0) {
      const { error } = await client
        .from('product_specifications')
        .insert(rows.map((r) => ({ ...r, product_id: productId.data })));
      if (error) return { error: 'Não foi possível salvar as especificações.' };
    }

    await audit(client, 'SPECIFICATIONS_SAVED', 'product', productId.data, { total: rows.length });
    refresh(productId.data);
    return { info: 'Especificações salvas.' };
  } catch (error) {
    const { message } = toPublicError(error);
    return { error: message };
  }
}
