# AGENTS.md

**Classe Ouro** — sistema de competição interclasses. React + Vite (JS, sem TypeScript) no front, **Supabase** (PostgreSQL + Auth) como única base de dados. Toda interface, comentário e código estão em **pt-BR** — mantenha isso.

## Comandos

- `npm run dev` — servidor Vite (porta 5173).
- `npm run build` — build de produção para `dist/`.
- `npm run preview` — serve o build.
- **Não há** testes, lint nem typecheck configurados. A única verificação é `npm run build`.
- `npm run build` valida código; mudanças no banco exigem aplicar `supabase/schema.sql` no SQL Editor do Supabase (não há migrações nem CLI).

## Arquitetura / pontos não óbvios

- **Sem banco local.** Tudo vem do Supabase via `src/services/supabase.js` (usa `import.meta.env.VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY`). Sem `.env`, o app roda com placeholders e só falha no console.
- **`supabase/schema.sql` é a única fonte de verdade do banco** e é aplicado manualmente no painel (não existe ferramenta de migração). É idempotente na maior parte (`if not exists`, `drop policy if exists`, `on conflict do nothing`), **exceto** a seção "DADOS DE TESTE" no final (inserts de `periodos`/`turmas` duplicam se re-executados).
- O schema inclui **GRANTs explícitos** a `anon`/`authenticated`/`service_role` que corrigem o erro "permission denied for schema public" em projetos novos do Supabase. Não os remova.
- **RLS está ativa em todas as tabelas.** As políticas dependem de `is_admin()`/`is_professor()`, que exigem o usuário logado **e** um registro em `profiles` com `ativo = true`. Se uma query retorna vazio/ERRO, primeiro confira se o perfil do usuário existe e está ativo.
- **Login por nome de usuário:** o front converte `usuario` em e-mail sintético `${usuario}@classe-ouro.app`. A constante `DOMAIN` está **duplicada** em `src/pages/Login.jsx` e `src/pages/Registro.jsx` — alterações exigem atualizar as duas.
- **Primeiro cadastro vira admin:** `Registro.jsx` chama a RPC `count_profiles()` (definida no schema) antes do signup; o trigger `handle_new_user` cria o perfil com role `professor` e o front faz `upsertProfile` para fixar role/nome. Não "simplifique" esse fluxo sem entender os dois lados.
- **Serviços em dois estilos:** a maioria é objeto singleton (`export const xService = { ... }`), mas `src/services/rankingService.js` exporta funções avulsas (`calcularRanking`, etc.). Siga o estilo do arquivo que estiver editando.

## Rotas e permissões

- `src/App.jsx` define as rotas; `src/routes/ProtectedRoute.jsx` protege (usa `adminOnly` prop). Páginas só-admin: `/professores`, `/criterios`, `/configuracoes`. Professores/logados veem as demais.
- Roles: `admin` (tudo) e `professor` (lê, registra pontuações/penalidades). O backend (RLS) é a autoridade real; front apenas esconde rotas.

## Gotchas operacionais do Supabase (configuração no painel, não no código)

- **"Email rate limit exceeded (429)"** — plano grátis limita e-mails; desative "Confirm email" em Authentication → Providers → Email para testes locais.
- **"Signups not allowed for this instance"** — ative "Allow new users to sign up" em Authentication.
- **"permission denied for schema public"** — rode o bloco de GRANTs do `schema.sql`.

## Arquivos de referência

- `README.md` (pt-BR) cobre setup completo, criação de usuários, deploy (Vercel/Netlify) e problemas comuns. Leia antes de mudar fluxo de auth/deploy.
- `session-ses_facc.md` na raiz é um registro de sessão (debug de rate limit de e-mail) — não é documentação e pode ser ignorado.
- `.env.example` é referenciado no README mas **não existe** no repositório; `.env` está no `.gitignore` — nunca o commite.