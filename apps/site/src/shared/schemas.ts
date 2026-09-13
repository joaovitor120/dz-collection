/**
 * DTOs de entrada. Esta é a fronteira de confiança da aplicação.
 *
 * Regras que valem para TODOS os schemas deste arquivo:
 *
 *  1. `.strict()` — chave desconhecida REJEITA a requisição inteira. É a defesa
 *     contra mass assignment: mandar `{"name":"x","isAdmin":true}` não passa.
 *  2. Campos server-owned (id, created_at, updated_at, user_id, admin_user_id)
 *     simplesmente NÃO EXISTEM aqui. Não há como enviá-los.
 *  3. Os limites de tamanho espelham as CHECK constraints do banco, para a
 *     mensagem de erro ser boa — mas o banco continua sendo a última barreira.
 *  4. Allowlist sempre que o valor for estruturado (ordenação, status, direção).
 */
import { z } from 'zod';

// -----------------------------------------------------------------------------
// Primitivos
// -----------------------------------------------------------------------------
export const uuidSchema = z.string().uuid('identificador inválido');

/** Slug: minúsculas, números e hífens. Sem acento, sem espaço, sem barra. */
export const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(160)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'slug deve conter apenas letras minúsculas, números e hífens');

/** Preço em centavos. Inteiro, não negativo, com teto sensato. */
export const centsSchema = z
  .number()
  .int('o preço deve ser um número inteiro de centavos')
  .min(0, 'o preço não pode ser negativo')
  .max(100_000_000, 'preço acima do limite');

/**
 * Normaliza texto antes de validar: NFC + colapso de espaços.
 * Evita que representações Unicode diferentes do mesmo dado driblem as regras.
 */
const normalizedText = (min: number, max: number) =>
  z
    .string()
    .transform((s) => s.normalize('NFC').replace(/[ \t]+/g, ' ').trim())
    .pipe(z.string().min(min).max(max));

const optionalText = (max: number) =>
  z
    .string()
    .transform((s) => s.normalize('NFC').trim())
    .pipe(z.string().max(max))
    .nullish()
    .transform((v) => (v === '' ? null : (v ?? null)));

// -----------------------------------------------------------------------------
// Produto
// -----------------------------------------------------------------------------
const productBase = z.object({
  name: normalizedText(1, 120),
  slug: slugSchema,
  description: optionalText(8000),
  category_id: uuidSchema.nullish().transform((v) => v ?? null),
  price_cents: centsSchema,
  compare_at_price_cents: centsSchema.nullish().transform((v) => v ?? null),
  stock: z.number().int().min(0).max(1_000_000),
  active: z.boolean(),
  is_launch: z.boolean(),
  is_featured: z.boolean(),
  display_order: z.number().int().min(0).max(100_000),
  meta_title: optionalText(160),
  meta_description: optionalText(320),
});

/** Regra de negócio: o preço "de" nunca pode ser menor que o preço atual. */
const COMPARE_AT_MESSAGE = {
  message: 'o preço "de" precisa ser maior ou igual ao preço atual',
  path: ['compare_at_price_cents'] as const,
};

export const productCreateSchema = productBase
  .strict()
  .refine(
    (v) => v.compare_at_price_cents === null || v.compare_at_price_cents >= v.price_cents,
    { message: COMPARE_AT_MESSAGE.message, path: ['compare_at_price_cents'] },
  );

export const productUpdateSchema = productBase
  .partial()
  .strict()
  .refine((v) => Object.keys(v).length > 0, { message: 'nenhum campo para atualizar' })
  .refine(
    (v) =>
      v.compare_at_price_cents === null ||
      v.compare_at_price_cents === undefined ||
      v.price_cents === undefined ||
      v.compare_at_price_cents >= v.price_cents,
    {
      message: 'o preço "de" precisa ser maior ou igual ao preço atual',
      path: ['compare_at_price_cents'],
    },
  );

export type ProductCreateInput = z.infer<typeof productCreateSchema>;
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;

// -----------------------------------------------------------------------------
// Categoria
// -----------------------------------------------------------------------------
export const categoryCreateSchema = z
  .object({
    slug: slugSchema,
    name: normalizedText(1, 120),
    description: optionalText(500),
    parent_name: optionalText(120),
    display_order: z.number().int().min(0).max(100_000),
    active: z.boolean(),
  })
  .strict();

export const categoryUpdateSchema = categoryCreateSchema
  .partial()
  .strict()
  .refine((v) => Object.keys(v).length > 0, { message: 'nenhum campo para atualizar' });

// -----------------------------------------------------------------------------
// Especificações e características
// -----------------------------------------------------------------------------
export const specificationSchema = z
  .object({
    label: normalizedText(1, 80),
    value: normalizedText(1, 600),
    display_order: z.number().int().min(0).max(1000),
  })
  .strict();

export const specificationsPayloadSchema = z
  .object({
    product_id: uuidSchema,
    specifications: z.array(specificationSchema).max(40),
  })
  .strict();

export const highlightsPayloadSchema = z
  .object({
    product_id: uuidSchema,
    highlights: z.array(normalizedText(1, 400)).max(20),
  })
  .strict();

// -----------------------------------------------------------------------------
// Imagens
// -----------------------------------------------------------------------------
export const imageMetadataSchema = z
  .object({
    product_id: uuidSchema,
    alt_text: optionalText(300),
  })
  .strict();

export const imageReorderSchema = z
  .object({
    product_id: uuidSchema,
    /** Ordem completa: lista de ids na sequência desejada. */
    image_ids: z.array(uuidSchema).min(1).max(30),
    primary_image_id: uuidSchema.nullish().transform((v) => v ?? null),
  })
  .strict();

// -----------------------------------------------------------------------------
// Autenticação
// -----------------------------------------------------------------------------
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email('e-mail inválido')
  .max(254);

/**
 * Política de senha: comprimento robusto, sem regras antiquadas de composição,
 * sem truncamento silencioso. Aceita passphrase e gerenciador de senhas.
 */
export const passwordSchema = z
  .string()
  .min(12, 'a senha precisa ter pelo menos 12 caracteres')
  .max(256, 'a senha excede o limite');

export const loginSchema = z
  .object({ email: emailSchema, password: z.string().min(1).max(256) })
  .strict();

export const passwordResetRequestSchema = z.object({ email: emailSchema }).strict();

export const passwordChangeSchema = z
  .object({
    password: passwordSchema,
    confirm: z.string(),
  })
  .strict()
  .refine((v) => v.password === v.confirm, {
    message: 'as senhas não conferem',
    path: ['confirm'],
  });

/** TOTP: exatamente 6 dígitos. */
export const totpCodeSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, 'o código precisa ter 6 dígitos');

export const mfaChallengeSchema = z
  .object({ factorId: uuidSchema, code: totpCodeSchema })
  .strict();

// -----------------------------------------------------------------------------
// Listagem: ordenação e paginação por ALLOWLIST
// -----------------------------------------------------------------------------

/** Mapeamento fechado. Nada vindo do usuário chega perto de um ORDER BY. */
export const SORT_COLUMNS = {
  lancamentos: { column: 'display_order', ascending: true },
  destaques: { column: 'is_featured', ascending: false },
  'menor-preco': { column: 'price_cents', ascending: true },
  'maior-preco': { column: 'price_cents', ascending: false },
  'a-z': { column: 'name', ascending: true },
  recentes: { column: 'created_at', ascending: false },
} as const;

export type SortOption = keyof typeof SORT_COLUMNS;

export const sortSchema = z
  .enum(Object.keys(SORT_COLUMNS) as [SortOption, ...SortOption[]])
  .default('lancamentos');

export const statusSchema = z.enum(['active', 'inactive', 'all']).default('all');

export const listQuerySchema = z
  .object({
    q: z.string().trim().max(120).optional(),
    sort: sortSchema,
    status: statusSchema,
    category: slugSchema.optional(),
    limit: z.coerce.number().int().min(1).max(100).default(50),
    offset: z.coerce.number().int().min(0).max(100_000).default(0),
  })
  .strict();

// -----------------------------------------------------------------------------
// Upload
// -----------------------------------------------------------------------------
export const ALLOWED_IMAGE_MIME = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_IMAGE_DIMENSION = 6000;
export const MAX_IMAGE_PIXELS = 40_000_000; // trava contra decompression bomb

export type AllowedImageMime = (typeof ALLOWED_IMAGE_MIME)[number];

// -----------------------------------------------------------------------------
// Helper de parsing com erro seguro para o usuário
// -----------------------------------------------------------------------------
export type ParseResult<T> =
  | { ok: true; data: T }
  | { ok: false; message: string; issues: { path: string; message: string }[] };

export function parseInput<T>(schema: z.ZodType<T>, input: unknown): ParseResult<T> {
  const result = schema.safeParse(input);
  if (result.success) return { ok: true, data: result.data };
  return {
    ok: false,
    message: 'Não foi possível concluir a operação. Verifique os dados enviados.',
    issues: result.error.issues.map((i) => ({
      path: i.path.join('.'),
      message: i.message,
    })),
  };
}
