import 'server-only';

import sharp from 'sharp';
import {
  ALLOWED_IMAGE_MIME,
  MAX_IMAGE_DIMENSION,
  MAX_IMAGE_PIXELS,
  MAX_UPLOAD_BYTES,
} from '@dz/shared';
import { ValidationError, logServer } from './security';

/**
 * =============================================================================
 * VALIDAÇÃO E REPROCESSAMENTO DE IMAGEM
 * =============================================================================
 * Três verificações independentes, porque nenhuma sozinha basta:
 *
 *   1. extensão declarada
 *   2. Content-Type declarado pelo navegador   ← mentira fácil
 *   3. MAGIC BYTES do conteúdo real            ← o que realmente vale
 *
 * E, no fim, a imagem é DECODIFICADA E REENCODADA para WebP. Isso descarta
 * qualquer coisa embutida no arquivo original — payload após o marcador de fim,
 * EXIF, perfil de cor com conteúdo estranho, polyglot HTML/JPEG. O que vai para
 * o Storage é um arquivo novo, gerado por nós.
 * =============================================================================
 */

const MAGIC: { mime: string; test: (b: Buffer) => boolean }[] = [
  { mime: 'image/jpeg', test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  {
    mime: 'image/png',
    test: (b) =>
      b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 &&
      b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a,
  },
  {
    mime: 'image/webp',
    test: (b) =>
      b.subarray(0, 4).toString('ascii') === 'RIFF' &&
      b.subarray(8, 12).toString('ascii') === 'WEBP',
  },
];

function detectRealMime(buffer: Buffer): string | null {
  if (buffer.length < 12) return null;
  return MAGIC.find((m) => m.test(buffer))?.mime ?? null;
}

export interface ProcessedImage {
  data: Buffer;
  width: number;
  height: number;
  contentType: 'image/webp';
  extension: 'webp';
}

export async function validateAndReencode(file: File): Promise<ProcessedImage> {
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new ValidationError('arquivo acima do limite', [
      { path: 'file', message: 'A imagem deve ter no máximo 5 MB.' },
    ]);
  }
  if (file.size === 0) {
    throw new ValidationError('arquivo vazio', [
      { path: 'file', message: 'Arquivo vazio.' },
    ]);
  }

  // 1. Content-Type declarado
  if (!ALLOWED_IMAGE_MIME.includes(file.type as (typeof ALLOWED_IMAGE_MIME)[number])) {
    throw new ValidationError(`mime declarado não permitido: ${file.type}`, [
      { path: 'file', message: 'Envie uma imagem JPG, PNG ou WebP.' },
    ]);
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // 2. Magic bytes — o que o arquivo REALMENTE é
  const realMime = detectRealMime(buffer);
  if (!realMime) {
    logServer('upload_rejected_magic_bytes', { declared: file.type, size: file.size });
    throw new ValidationError('assinatura de arquivo não reconhecida', [
      { path: 'file', message: 'Este arquivo não é uma imagem válida.' },
    ]);
  }
  if (realMime !== file.type) {
    logServer('upload_mime_mismatch', { declared: file.type, real: realMime });
    throw new ValidationError('conteúdo não corresponde ao tipo declarado', [
      { path: 'file', message: 'Este arquivo não é uma imagem válida.' },
    ]);
  }

  // 3. Estrutura da imagem + trava contra decompression bomb
  let meta: sharp.Metadata;
  try {
    meta = await sharp(buffer, { limitInputPixels: MAX_IMAGE_PIXELS }).metadata();
  } catch (error) {
    logServer('upload_decode_failed', {
      message: error instanceof Error ? error.message : String(error),
    });
    throw new ValidationError('imagem ilegível', [
      { path: 'file', message: 'Não foi possível ler esta imagem.' },
    ]);
  }

  const { width = 0, height = 0 } = meta;
  if (width < 1 || height < 1) {
    throw new ValidationError('dimensões inválidas', [
      { path: 'file', message: 'Imagem com dimensões inválidas.' },
    ]);
  }
  if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
    throw new ValidationError('dimensões acima do limite', [
      { path: 'file', message: `A imagem deve ter no máximo ${MAX_IMAGE_DIMENSION}px de lado.` },
    ]);
  }
  if (width * height > MAX_IMAGE_PIXELS) {
    throw new ValidationError('total de pixels acima do limite', [
      { path: 'file', message: 'Imagem grande demais.' },
    ]);
  }

  // 4. Reencode. `withMetadata()` NÃO é chamado de propósito: EXIF, GPS e dados
  // do dispositivo são descartados. Foto de produto não precisa disso, e a
  // localização de quem fotografou não deveria ir para um bucket público.
  const output = await sharp(buffer, { limitInputPixels: MAX_IMAGE_PIXELS })
    .rotate()                                   // aplica a orientação EXIF antes de removê-la
    .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer({ resolveWithObject: true });

  return {
    data: output.data,
    width: output.info.width,
    height: output.info.height,
    contentType: 'image/webp',
    extension: 'webp',
  };
}

/**
 * Caminho no Storage gerado pelo servidor.
 *
 * O filename enviado pelo usuário é IGNORADO por completo — nada de
 * `../../`, nem de nome com barra, nem de extensão dupla. Só entra o slug do
 * produto (já validado por regex) e um UUID.
 */
export function buildStoragePath(productSlug: string, uuid: string): string {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(productSlug)) {
    throw new ValidationError('slug de produto inválido');
  }
  return `${productSlug}/${uuid}.webp`;
}
