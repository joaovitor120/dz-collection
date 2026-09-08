# DZ Collection

Monorepo com duas aplicações:

| Pasta | O que é | Porta local |
|---|---|---|
| `apps/site` | Catálogo público | 3000 |
| `apps/admin` | Painel administrativo | 3001 |
| `packages/shared` | Tipos, schemas Zod, dinheiro, WhatsApp, clientes Supabase | — |
| `supabase/` | Migrations, seed e testes de RLS | — |

Não é e-commerce: a jornada é ver → escolher → conhecer o produto → **comprar pelo
WhatsApp**. Não existe carrinho, checkout, pagamento nem cadastro de cliente.

---

## Rodando na sua máquina

Requer **Node 20.11+**.

```bash
npm install
```

### Catálogo público — funciona sem nenhuma configuração

```bash
npm run dev:site
```

Abra <http://localhost:3000>.

> Nesta etapa o catálogo ainda lê `apps/site/src/data/products.ts`. A troca para
> o banco é o próximo passo do projeto; os dados já estão migrados e conferidos.

### Painel administrativo — precisa do Supabase

```bash
npm run dev:admin
```

Abra <http://localhost:3001>. Sem as variáveis de ambiente o painel mostra uma
página listando o que falta, em vez de quebrar.

Para ligar de verdade, crie `apps/admin/.env.local`:

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_ADMIN_URL=http://localhost:3001
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...
```

O passo a passo para criar o projeto e pegar essas chaves está em
[`docs/SETUP-SUPABASE.md`](docs/SETUP-SUPABASE.md).

> `.env.local` está no `.gitignore`. Nunca versione valores reais.

---

## Verificação

```bash
npm run typecheck   # TypeScript strict nos dois apps
npm run build       # build de produção dos dois
npm run test:db     # migrations + matriz de RLS + seed + conferência de dados
```

`test:db` precisa de um PostgreSQL local em `localhost:5433`. Ele recria o banco
do zero, aplica as migrations reais, roda 46 casos de segurança (anon,
autenticado não-admin e admin — testando o permitido **e** o negado) e compara o
catálogo antigo com o banco campo a campo.

---

## Estado atual

Veja [`docs/STATUS.md`](docs/STATUS.md) para o que já está verificado com
evidência, o que está escrito mas ainda não foi testado ponta a ponta, e o que
falta construir.

## Segurança

Toda a arquitetura de autenticação, autorização, RLS, Storage, rate limiting e
rotação de chaves está documentada em `docs/`. Nenhum valor secreto aparece no
repositório.
