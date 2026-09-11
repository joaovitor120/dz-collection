# DZ Collection — Passo a passo: banco de dados e painel administrativo

Este arquivo é o roteiro completo, na ordem certa. Não pule etapas — a etapa 0
é a mais importante de todas.

---

## ETAPA 0 — ROTACIONAR A CHAVE SECRETA (fazer AGORA)

A chave `sb_secret_...` do projeto foi colada em uma conversa. Pela sua própria
regra (item 64 do briefing), uma chave exposta é considerada **comprometida**.
Apagar a mensagem não resolve: a chave continua válida até ser rotacionada.

Essa chave ignora RLS. Quem a tiver lê, altera e apaga qualquer dado do banco.

1. Abra https://supabase.com/dashboard
2. Escolha o projeto
3. Menu lateral → **Project Settings** → **API Keys**
4. Na chave secreta, use a opção de **rotacionar / gerar nova** (revoke + create)
5. Guarde a nova chave **fora do chat, fora do GitHub, fora do código**
   — ela só vive em dois lugares: `apps/site/.env.local` na sua máquina e nas
   Environment Variables da Vercel

A chave publicável (`sb_publishable_...`) é pública por natureza — não precisa
rotacionar.

---

## ETAPA 1 — RODAR OS ARQUIVOS SQL

Os dois arquivos já estão no seu computador:

```
C:\Users\Cliente\Documents\dz-setup\01_completo.sql
C:\Users\Cliente\Documents\dz-setup\02_storage.sql
```

### 1.1 — Rodar o `01_completo.sql`

1. Abra https://supabase.com/dashboard e entre no projeto
2. Menu lateral esquerdo → **SQL Editor**
3. Clique em **New query** (ou no `+`)
4. Abra o arquivo `01_completo.sql` no **Bloco de Notas**
   (clique com o botão direito → Abrir com → Bloco de Notas)
5. Dentro do Bloco de Notas: `Ctrl + A` (selecionar tudo), `Ctrl + C` (copiar)
6. Clique na área preta do SQL Editor e `Ctrl + V` (colar)
7. Clique em **Run** (ou `Ctrl + Enter`)

Deve levar alguns segundos. O resultado esperado é **Success. No rows returned**.

> Se aparecer erro, **não tente consertar sozinho**. Copie a mensagem de erro
> inteira e me mande. O arquivo é feito para rodar do começo ao fim, de uma vez.

### 1.2 — Rodar o `02_storage.sql`

Mesma coisa, arquivo novo:

1. **New query**
2. Abrir `02_storage.sql` no Bloco de Notas → `Ctrl+A` → `Ctrl+C`
3. Colar → **Run**

### 1.3 — Conferir se deu certo

Menu lateral → **Table Editor**. Devem aparecer **9 tabelas**:

```
admin_users        categories        products
product_images     product_specifications
product_highlights site_settings     audit_logs
auth_rate_limits
```

Clique em **products**: devem estar lá os **8 produtos** com os preços exatos
da loja atual. Clique em **categories**: **5 categorias**.

Pode rodar os arquivos duas vezes sem medo — eles são idempotentes (não
duplicam nada).

---

## ETAPA 2 — CRIAR O SEU USUÁRIO ADMINISTRADOR

O Supabase guarda a senha. A tabela `admin_users` guarda apenas **quem tem
permissão** — nunca senha, nunca hash.

### 2.1 — Criar a conta de login

1. Menu lateral → **Authentication** → **Users**
2. Botão **Add user** → **Create new user**
3. Preencha:
   - **Email**: o e-mail que você vai usar para entrar no painel
   - **Password**: senha forte, **no mínimo 12 caracteres**
   - **Auto Confirm User**: **marque essa caixa** (senão o login não funciona)
4. **Create user**
5. O usuário aparece na lista. Clique nele e **copie o `UID`**
   (é um código no formato `a1b2c3d4-e5f6-...`)

### 2.2 — Dar permissão de administrador a esse usuário

Volte ao **SQL Editor** → **New query** e cole isto, **trocando os dois valores**:

```sql
insert into public.admin_users (user_id, email, full_name)
values (
  'COLE-AQUI-O-UID-COPIADO',
  'seu-email@exemplo.com',
  'Seu Nome'
)
on conflict (user_id) do nothing;
```

**Run**. Depois confira:

```sql
select user_id, email, full_name, created_at from public.admin_users;
```

Tem que aparecer uma linha — a sua.

> Sem esse passo o login funciona, mas o painel devolve "sem permissão".
> É de propósito: ter conta no Supabase não é o mesmo que ser administrador.

---

## ETAPA 3 — FECHAR AS PORTAS DA AUTENTICAÇÃO

Três ajustes no painel do Supabase. Todos obrigatórios.

### 3.1 — Desligar cadastro público

**Authentication** → **Sign In / Providers** → **Email** →
desmarque **Enable Sign Ups** → **Save**.

Sem isso, qualquer pessoa na internet cria uma conta no seu projeto.
(Ela ainda não seria administradora, porque não estaria em `admin_users` —
mas conta que não deveria existir não deve existir.)

### 3.2 — Ligar o segundo fator (TOTP)

**Authentication** → **Multi-Factor Authentication** →
ative **TOTP (App Authenticator)** → **Save**.

O painel **exige** MFA. No primeiro login ele vai te levar direto para a tela
de configuração e mostrar um QR Code. Leia esse QR Code com o **Google
Authenticator** ou **Microsoft Authenticator** no celular.

> O QR Code aparece **uma única vez**. Configure o app antes de fechar a tela.

### 3.3 — Autorizar as URLs de retorno

**Authentication** → **URL Configuration**:

- **Site URL**: `http://localhost:3000`
- **Redirect URLs** (adicione uma por vez):
  - `http://localhost:3000/**`
  - `https://dz-collection.vercel.app/**` *(quando publicar)*

Sem isso, o link de "esqueci minha senha" não volta para o painel.

---

## ETAPA 4 — ONDE FICA O PAINEL ADMINISTRATIVO

O painel é uma área do próprio site, em **`/admin`**. Uma aplicação só, um
projeto só na Vercel.

| | Endereço | O que é |
|---|---|---|
| Catálogo público | `http://localhost:3000` | o site que o cliente vê |
| **Painel** | **`http://localhost:3000/admin`** | onde você edita produtos |

Em produção: **`https://dz-collection.vercel.app/admin`**.

O painel não herda cabeçalho, rodapé nem botão de WhatsApp da loja — são grupos
de rotas diferentes, com cascas diferentes. E `/admin` responde com `noindex` e
`no-store`, então não entra em buscador nem fica em cache do navegador.

### 4.1 — Configurar o arquivo de variáveis

Crie `apps/site/.env.local` (trocando pelos valores do **seu** projeto, com a
**chave secreta nova** da etapa 0):

```
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_NOVA_CHAVE_DA_ETAPA_0
```

> `.env.local` está no `.gitignore`. Ele nunca vai para o GitHub — é assim que
> tem que ser.

### 4.2 — Subir as fotos para o Storage

Sem isso o site fica com todas as imagens quebradas: o banco já sabe o caminho
das 25 fotos, mas os arquivos ainda não estão lá.

```powershell
npm run imagens:subir
```

### 4.3 — Rodar

```powershell
npm run dev
```

Loja em **http://localhost:3000**, painel em **http://localhost:3000/admin**.

### 4.4 — Primeiro login

1. `http://localhost:3000/admin` → cai na tela de login
2. E-mail e senha da etapa 2.1
3. O painel manda configurar o MFA → leia o QR Code no app do celular
4. Digite o código de 6 dígitos
5. Pronto — **Produtos** no menu do topo

> Se aparecer **"Configuração pendente"**, é o `.env.local` faltando ou com
> valor errado. A página lista exatamente qual variável falta.

## ETAPA 5 — SITUAÇÃO ATUAL DO SITE PUBLICADO

O site em **https://dz-collection.vercel.app** está **no ar e funcionando**.
Ele serve a branch `main`, que é a versão antiga (catálogo + WhatsApp, sem
banco de dados). Nada quebrou lá.

O erro de deploy que você viu é o **preview da branch `mudanca-grande`**.
Ele falha por um motivo esperado e já previsto: o repositório virou um
**monorepo** (`apps/site`, `packages/shared`), e o projeto na
Vercel ainda aponta para a **raiz** do repositório. O `next build` roda na
raiz, não acha aplicação nenhuma, e falha.

**Isso não afeta a produção.** É só o preview.

---

## ETAPA 6 — PUBLICAR (só quando tudo acima estiver funcionando)

Um projeto só na Vercel. O painel vai junto, em `/admin`.

### 6.1 — Root Directory

Vercel → projeto `dz-collection` → **Settings** → **Build and Deployment** →
**Root Directory** → `apps/site` → **Save**.

> **Atenção à ordem.** A produção ainda serve a branch `main`, que é a estrutura
> antiga, sem a pasta `apps/`. Trocar o Root Directory antes do merge faz o
> próximo build de produção falhar. Faça o merge de `mudanca-grande` em `main`
> na mesma janela, ou troque a production branch primeiro.

### 6.2 — Environment Variables

**Settings** → **Environment Variables**, em Production e Preview:

```
NEXT_PUBLIC_SITE_URL                  = https://dz-collection.vercel.app
NEXT_PUBLIC_SUPABASE_URL              = https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY  = sb_publishable_...
SUPABASE_SECRET_KEY                   = (a chave nova da etapa 0)
```

### 6.3 — Voltar às URLs de produção no Supabase

**Authentication** → **URL Configuration**:

- **Site URL**: `https://dz-collection.vercel.app`
- **Redirect URLs**: `https://dz-collection.vercel.app/**`

Depois disso o painel fica em **https://dz-collection.vercel.app/admin**.

---

## SE ALGO DER ERRADO

O site publicado tem rede de segurança: Vercel → **Deployments** →
o último deploy que funcionou → **⋯** → **Promote to Production**.
Volta ao ar em segundos, sem mexer no git.

E existe a tag `v1.0-catalogo-whatsapp` marcando a versão estável no
repositório.
