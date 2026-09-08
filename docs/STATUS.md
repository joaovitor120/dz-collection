# Status da migração para banco + painel administrativo

Branch: `mudanca-grande` · Base estável para rollback: tag `v1.0-catalogo-whatsapp`

## Verificado com evidência

Rodável a qualquer momento com `npm run test:db`.

| Item | Evidência |
|---|---|
| Schema, constraints, índices, triggers | 4 migrations aplicadas em PostgreSQL 16 real |
| RLS ativo em todas as 9 tabelas | matriz de 46 casos, 46 passando |
| `anon` não escreve | INSERT/UPDATE/DELETE bloqueados em produto, categoria, imagem, configuração |
| `authenticated` não-admin não escreve | idem, e sem leitura de `admin_users` nem da auditoria |
| Admin escreve | CRUD liberado, auditoria gravada |
| Auditoria imutável | admin não consegue UPDATE nem DELETE na própria trilha |
| Auto-promoção impossível | INSERT em `admin_users` negado para todos os perfis da aplicação |
| Produto inativo invisível | imagens e specs somem junto, por RLS derivado |
| Constraints do banco | preço negativo, compare_at menor, slug duplicado/inválido, path traversal, 2ª imagem principal — todos rejeitados |
| Migração dos 8 produtos | comparação campo a campo, zero divergências |
| Seed idempotente | reaplicado sem duplicar |
| Nenhum secret no bundle | varredura no JS servido ao browser |
| Build limpo | os dois apps, TypeScript strict |
| Sem ISR em rota autenticada | todas as rotas do painel são dinâmicas |

## Escrito, ainda NÃO testado ponta a ponta

Depende do projeto Supabase existir. O código está pronto; o que falta é execução.

- login com senha + resposta neutra contra enumeração
- desafio MFA (TOTP) e enrollment com QR Code
- troca de senha com revogação das outras sessões
- recuperação de senha por link do Supabase Auth
- rate limit por conta e por IP com backoff progressivo
- cabeçalhos de segurança e CSP chegando ao navegador em produção

## Ainda por construir

- catálogo público lendo do banco (hoje ainda lê `apps/site/src/data/products.ts`)
- CRUD do painel: produtos, categorias, imagens, especificações
- upload para o Storage usando a validação já escrita em `lib/images.ts`
- endpoint de revalidação protegido por segredo
- suíte de testes negativos contra as aplicações rodando
- `SECURITY.md`

## Decisões que valem registrar

- **`admin_users` sem grant nenhum.** A autorização sai de `is_admin()`, uma função `SECURITY DEFINER` com `search_path` fixo. A tabela em si é inalcançável pela Data API.
- **Bloqueio de conta tem teto de tempo.** Um bloqueio permanente por tentativas erradas viraria um jeito trivial de trancar a proprietária para fora.
- **Rate limit falha aberto.** Se o banco cair, o painel não trava; senha, MFA e RLS seguem de pé. Fechar aqui criaria um DoS.
- **Upload é reencodado, não só validado.** O arquivo que chega ao Storage é gerado por nós, o que descarta EXIF, GPS e qualquer payload embutido.
- **CRUD passa pela sessão do admin, não pela secret key.** Assim o RLS continua sendo barreira real e a auditoria registra o autor de verdade.
