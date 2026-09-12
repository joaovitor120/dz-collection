# Setup do Supabase — passo a passo

Leva ~10 minutos. Faça isto em paralelo enquanto o restante da aplicação é construído:
sem o projeto no ar, autenticação, MFA e uploads não têm como ser testados de verdade.

**Nenhuma senha ou chave secreta deve ser colada no chat.** Tudo abaixo você faz
direto no painel do Supabase e da Vercel.

---

## 1. Criar o projeto

1. Acesse <https://supabase.com/dashboard> e crie um projeto.
2. Nome sugerido: `dz-collection`.
3. Região: **South America (São Paulo)** — menor latência para as clientes.
4. Guarde a **Database Password** que o painel gerar em um gerenciador de senhas.
   Ela não vai para o código, para o GitHub, nem para este chat.

## 2. Aplicar as migrations

No painel: **SQL Editor → New query**. Cole e rode **na ordem**, um arquivo por vez:

```
supabase/migrations/20260908000100_schema.sql
supabase/migrations/20260908000200_functions.sql
supabase/migrations/20260908000300_rls_grants.sql
supabase/migrations/20260908000400_storage.sql
```

Cada um deve terminar com `Success. No rows returned`.

> Os quatro já foram executados contra um PostgreSQL 16 real aqui, junto com uma
> matriz de 46 casos de segurança. Não são rascunho.

## 3. Carregar o catálogo

Ainda no SQL Editor, rode:

```
supabase/seed/0001_catalog.sql
```

Confira em **Table Editor → products**: devem aparecer 8 produtos.
O seed é idempotente — se rodar duas vezes, não duplica nada.

## 4. Criar a conta da administradora

**Authentication → Users → Add user → Create new user**

- E-mail: `zorzanellipamella@gmail.com`
- Senha: gere uma senha longa e aleatória no seu gerenciador de senhas.
  Ela é **temporária** — a Pâmella troca no primeiro acesso, em Configurações → Segurança.
- Marque **Auto Confirm User**.

Copie o **UID** que aparece na lista de usuários e rode no SQL Editor:

```sql
insert into public.admin_users (user_id, email, full_name)
values ('COLE_O_UID_AQUI', 'zorzanellipamella@gmail.com', 'Pâmella Zorzanelli')
on conflict (user_id) do nothing;
```

Sem essa linha a conta autentica mas **não autoriza nada** — é exatamente o
cenário "authenticated não-admin" que a matriz de testes cobre.

## 5. Desligar o cadastro público

**Authentication → Sign In / Providers → Email**

- **Enable Sign Ups**: **desligado**. Ninguém cria conta pela internet.
- **Confirm email**: ligado.
- **Secure email change**: ligado.

## 6. Ligar o MFA

**Authentication → Multi-Factor Authentication** → habilite **TOTP (App Authenticator)**.

O painel administrativo vai exigir o segundo fator; o enrollment (QR Code) acontece
dentro do próprio painel, no primeiro acesso.

## 7. URLs de redirecionamento

**Authentication → URL Configuration**

O painel vive em `/admin`, no mesmo domínio da loja — não há mais um endereço
separado para ele.

- **Site URL**: `https://dz-collection.vercel.app`
- **Redirect URLs** (allowlist — nada além disto):
  ```
  https://dz-collection.vercel.app/admin/auth/callback
  https://dz-collection.vercel.app/admin/redefinir-senha
  http://localhost:3000/admin/auth/callback
  http://localhost:3000/admin/redefinir-senha
  ```

Essa allowlist é o que impede open redirect no fluxo de recuperação de senha.

## 8. Pegar as chaves

**Project Settings → API Keys**

| Chave | Onde vai | Pode ser pública? |
|---|---|---|
| Project URL | `NEXT_PUBLIC_SUPABASE_URL` | sim |
| Publishable key (`sb_publishable_…`) | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | sim — vai para o browser de qualquer jeito |
| Secret key (`sb_secret_…`) | `SUPABASE_SECRET_KEY` | **NÃO** — só na Vercel, nunca no código |

A publishable key ser pública **não** significa acesso livre: toda leitura e
escrita continua passando por grants + RLS, que já estão testados.

Se o painel ainda mostrar o modelo antigo (`anon` / `service_role`), trate a
`service_role` com o mesmo cuidado da secret key.

## 9. Variáveis na Vercel

Dois projetos, com conjuntos diferentes de propósito:

**Projeto único (`dz-collection`)** — a loja em `/` e o painel em `/admin`
```
NEXT_PUBLIC_SITE_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SECRET_KEY
```

São quatro, e só essas.

`SUPABASE_SECRET_KEY` é a única server-only. Ela nunca chega ao navegador:
`requireServerEnv()` recusa qualquer nome com prefixo `NEXT_PUBLIC_` e lança se
for lida no cliente, e o módulo que a usa tem `import 'server-only'`, o que
quebra o build se algum componente de cliente tentar importá-lo.

> **`REVALIDATE_SECRET` não existe mais.** Ele autenticava o painel quando este
> era um site separado e precisava avisar o catálogo por HTTP que o cache tinha
> envelhecido. Com os dois na mesma aplicação, isso virou uma chamada de função
> no mesmo processo — e o endpoint `/api/revalidar`, que era a razão do segredo
> existir, foi removido junto. Se você viu essa variável em algum documento,
> era instrução velha.

## 10. Backup

**Project Settings → Database → Backups**. Confirme a política do seu plano e
anote a janela de retenção. O procedimento de restore está no `SECURITY.md`.

---

## Checagem rápida

Depois do passo 4, rode no SQL Editor. O resultado esperado está no comentário:

```sql
-- deve retornar 8
select count(*) from public.products;

-- deve retornar 1 (a Pâmella)
select count(*) from public.admin_users;

-- deve retornar 9 linhas, todas com rowsecurity = true
select tablename, rowsecurity from pg_tables
where schemaname = 'public' order by tablename;

-- deve retornar ZERO linhas: nenhuma tabela da aplicação sem policy
select t.tablename from pg_tables t
where t.schemaname = 'public'
  and t.rowsecurity
  and not exists (select 1 from pg_policies p
                  where p.schemaname = 'public' and p.tablename = t.tablename)
  and t.tablename not in ('admin_users', 'auth_rate_limits');
```

As duas últimas são a evidência de que o item "RLS ativo em todas as tabelas"
está cumprido no projeto real, e não só no ambiente de teste.
