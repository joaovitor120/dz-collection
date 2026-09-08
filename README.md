# DZ Collection — catálogo digital

Site institucional e catálogo da **DZ Collection**, construído em Next.js.
Não é um e-commerce: a jornada é **ver → escolher → conhecer o produto → comprar pelo WhatsApp**.
Não existe carrinho, checkout, pagamento online nem cadastro.

## Stack

- Next.js 14 (App Router) + React 18 + TypeScript
- Tailwind CSS 3 (design system em `tailwind.config.ts` + `src/app/globals.css`)
- `next/image` para otimização de imagens, `next/font` para as fontes

## Rodando localmente

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Variável de ambiente obrigatória

```env
NEXT_PUBLIC_SITE_URL=https://dz-collection.vercel.app
```

Essa URL é usada para montar o link do produto enviado na mensagem do WhatsApp,
além de canonical, sitemap e Open Graph. **Nunca pode apontar para localhost em
produção**, porque a proprietária clica nesse link depois, dentro da conversa.

Na Vercel: Project → Settings → Environment Variables → `NEXT_PUBLIC_SITE_URL`.

## WhatsApp

Toda a lógica está centralizada em dois arquivos:

- `src/data/site.ts` → `WHATSAPP_NUMBER = '5527996441300'`
- `src/lib/whatsapp.ts` → `createProductWhatsAppUrl(product)` e `createGeneralWhatsAppUrl()`

A mensagem de produto sempre carrega o **nome exato** e a **URL pública** daquele
produto, para identificar de imediato qual peça gerou o contato.

## Dados dos produtos

`src/data/products.ts` — extraído da loja atual em
`dzcollection.lojavirtualnuvem.com.br` (auditoria de 07/09/2026).
Para publicar um novo produto: adicione o objeto, coloque as imagens em
`public/images/products/<modelo>/` e marque `isNew: true` nas peças que devem
aparecer em "Lançamentos".

## Scripts

```bash
npm run dev        # desenvolvimento
npm run build      # build de produção
npm run start      # servir o build
npm run typecheck  # TypeScript
node qa.mjs        # suíte de QA end-to-end (precisa do servidor em :3100)
```
