# 🏆 Classe Ouro — Sistema de Competição Interclasses

Sistema web completo para gerenciar a **Competição Interclasses** entre turmas escolares.

Desenvolvido com **React**, **JavaScript**, **CSS3**, **PostgreSQL** e **Supabase**. O sistema permite cadastrar turmas, alunos, professores, períodos, registrar pontuações, aplicar penalidades, acompanhar o ranking, gerar relatórios e auditar todas as operações.

---

## 📑 Sumário

1. [Requisitos](#1-requisitos)
2. [Instalação](#2-instalação)
3. [Configuração do Supabase](#3-configuração-do-supabase)
4. [Configurar .env](#4-configurar-env)
5. [Executar localmente](#5-executar-localmente)
6. [Build](#6-build)
7. [Testar build](#7-testar-build)
8. [Configuração do Banco de Dados](#8-configuração-do-banco-de-dados)
9. [Segurança](#9-segurança)
10. [Deploy](#10-deploy)
11. [Problemas comuns](#11-problemas-comuns)
12. [Estrutura do projeto](#12-estrutura-do-projeto)
13. [Funcionamento](#13-funcionamento)

---

## 1. Requisitos

Antes de começar, você precisará ter instalado:

- **Node.js** (versão 18 ou superior) — [nodejs.org](https://nodejs.org)
- **npm** (instalado junto com o Node.js)
- **Conta no Supabase** (gratuita) — [supabase.com](https://supabase.com)
- **Git** — [git-scm.com](https://git-scm.com)
- **Navegador web** moderno (Chrome, Firefox, Edge)

Verifique suas instalações:

```bash
node --version
npm --version
git --version
```

---

## 2. Instalação

Clone o repositório e instale as dependências:

```bash
git clone <URL_DO_SEU_REPOSITORIO> classe-ouro
cd classe-ouro
npm install
```

---

## 3. Configuração do Supabase

### 3.1 Criar conta e projeto

1. Acesse [supabase.com](https://supabase.com) e crie uma conta gratuita.
2. Clique em **New Project**.
3. Dê um nome ao projeto (ex: `classe-ouro`).
4. Defina a **Senha do banco** (guarde-a com segurança).
5. Escolha a **Região** mais próxima de você.
6. Clique em **Create new project** e aguarde a criação (pode levar alguns minutos).

### 3.2 Executar o Schema SQL

1. No painel do Supabase, vá em **SQL Editor** → **New query**.
2. Abra o arquivo [`supabase/schema.sql`](supabase/schema.sql) deste projeto.
3. Copie todo o conteúdo e cole no editor.
4. Clique em **Run** para executar.

Isso criará:
- Todas as tabelas (`profiles`, `turmas`, `alunos`, `periodos`, `criterios`, `penalidades`, `pontuacoes`, `aplicacoes_penalidades`, `audit_logs`);
- Relacionamentos (Foreign Keys) e índices;
- As políticas **RLS (Row Level Security)**;
- As funções auxiliares de segurança;
- Os **critérios de pontuação** iniciais (Anexo 1);
- As **penalidades** iniciais;
- Dados de teste (períodos e turmas de exemplo).

### 3.3 Configurar Authentication

1. No painel, vá em **Authentication** → **Providers**.
2. Confirme que **Email** está habilitado.
3. Em **Authentication** → **URL Configuration**, defina a URL do site (ex: `http://localhost:5173` para desenvolvimento).
4. Se desejar que os professores ativem a conta pelo e-mail, mantenha **Confirm email** ativo. Se preferir testes rápidos, pode desativar temporariamente.

### 3.4 Copiar URL e chave pública

1. Vá em **Project Settings** → **API**.
2. Copie o **Project URL** (ex: `https://xxxx.supabase.co`).
3. Copie a **anon public key** (a chave pública `anon`).

> ⚠️ **IMPORTANTE**: Use apenas a chave **anon/public**. NUNCA use a `service_role key` no frontend.

### 3.5 Criar usuários

1. Vá em **Authentication** → **Users** → **Add user**.
2. Crie o primeiro **Administrador** (e-mail e senha), ex: `admin@escola.com`.

> O papel de `admin` ou `professor` é definido na tabela `profiles`. Veja a seção 8 para associar os usuários aos perfis.

---

## 4. Configurar .env

1. Copie o arquivo de exemplo:

```bash
cp .env.example .env
```

No Windows (PowerShell):

```powershell
Copy-Item .env.example .env
```

2. Abra o arquivo `.env` e preencha com os valores do seu projeto:

```env
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=SUA_CHAVE_ANON_PUBLICA
```

3. **NUNCA** versionar o arquivo `.env` (ele já está no `.gitignore`).

---

## 5. Executar localmente

Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

O Vite exibirá uma URL (geralmente `http://localhost:5173`). Abra no navegador.

- Faça login com o usuário que você criou.
- Como primeiro usuário, você precisará que seu perfil na tabela `profiles` tenha `role = 'admin'` (veja seção 8).

---

## 6. Build

Para gerar a versão de produção (pasta `dist/`):

```bash
npm run build
```

---

## 7. Testar build

Depois de gerar o build, teste a versão de produção localmente:

```bash
npm run preview
```

O Vite servirá a versão compilada localmente. Abra a URL exibida no navegador e teste a aplicação.

---

## 8. Configuração do Banco de Dados

### Como verificar as tabelas

No painel do Supabase, vá em **Table Editor**. Você verá todas as tabelas criadas pelo SQL.

### Como verificar RLS

1. No painel, selecione uma tabela (ex: `turmas`).
2. Clique em **RLS Policies** logo abaixo do editor.
3. Você verá todas as políticas criadas e o **Row Level Security** habilitado.

### Como associar usuários às profiles

Quando um usuário é criado via Authentication (ou via tela de cadastro), ele precisa de um registro correspondente na tabela `profiles`.

A forma mais simples de criar o **primeiro administrador**:

1. No **Table Editor**, abra a tabela `profiles`.
2. Clique em **Insert row**.
3. Preencha:
   - `user_id`: o ID do usuário (copie de **Authentication → Users**);
   - `nome`: nome do professor;
   - `email`: e-mail do usuário;
   - `role`: `admin` (ou `professor`);
   - `ativo`: `true`.

Ou use o **SQL Editor**:

```sql
insert into public.profiles (user_id, nome, email, role, ativo)
select id, 'Administrador', email, 'admin', true
from auth.users
where email = 'admin@escola.com'
on conflict (user_id) do nothing;
```

> **Alternativa**: na tela **Professores** do sistema, o administrador pode cadastrar novos professores (isso cria automaticamente o usuário no Authentication e o perfil em `profiles`). Porém, para o **primeiro** acesso, é necessário cadastrar manualmente o perfil do administrador como acima.

### Como inserir dados iniciais

O arquivo `schema.sql` já insere:
- 19 critérios de pontuação;
- 9 penalidades;
- Períodos e turmas de exemplo (comentados ao final — descomente se quiser os dados de teste).

---

## 9. Segurança

- **Nunca publique o `.env`** — ele contém credenciais.
- **Use apenas a chave `anon`/public** no frontend. NUNCA use a `service_role key`.
- **RLS (Row Level Security)** está habilitado em todas as tabelas, protegendo os dados no nível do banco de dados — não apenas na interface.
- **Controle de permissões**: apenas administradores podem alterar/excluir dados cadastrais, configurações e lançamentos. Professores só inserem pontuações e penalidades.
- **Não confie somente no frontend**: além das validações no React, o banco possui validações e RLS.
- **Auditoria**: toda operação registra um log na tabela `audit_logs` (usuário, ação, tabela, dados anteriores/novos, data/hora).

---

## 10. Deploy

Escolha uma plataforma para React. Exemplo com **Vercel**:

1. **Criar conta** em [vercel.com](https://vercel.com).
2. **Criar repositório GitHub** com o projeto:
   ```bash
   git init
   git add .
   git commit -m "Inicial"
   git branch -M main
   git remote add origin https://github.com/SEU-USUARIO/classe-ouro.git
   git push -u origin main
   ```
3. No dashboard da Vercel, clique em **New Project**.
4. **Importar** o repositório GitHub.
5. Escolha o framework **Vite** (a Vercel detecta automaticamente).
6. Em **Environment Variables**, adicione:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   (com os mesmos valores do `.env`)
7. Clique em **Deploy**.
8. A Vercel fará o build e publicará. Você receberá uma URL (`https://seu-projeto.vercel.app`).
9. **Configurar domínio** (opcional): em **Settings → Domains**, adicione seu domínio customizado.
10. Atualize o **URL Configuration** do Supabase:
    - Authentication → URL Configuration → Site URL = sua URL de produção (ex: `https://seu-projeto.vercel.app`).
    - Adicione a URL de produção em **Redirect URLs**.
11. **Teste**: faça login, teste o acesso ao banco e registre uma pontuação para garantir que tudo está funcionando em produção.

Para **Netlify**, o processo é análogo: conecte o repositório, defina o **Build command** como `npm run build` e o **Publish directory** como `dist`, e configure as mesmas variáveis de ambiente.

**Variáveis obrigatórias na plataforma:**
```env
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

---

## 11. Problemas comuns

| Problema | Solução |
|----------|---------|
| **Erro de conexão com Supabase** | Verifique se `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` estão corretos no `.env`. Reinicie o servidor (`npm run dev`). |
| **Variável de ambiente não encontrada** | Se acabou de criar o `.env`, reinicie o processo do Vite. `import.meta.env` é lido no momento do start. |
| **Erro de autenticação** | Confirme que o e-mail está confirmado (se `Confirm email` estiver ativo) e que o usuário existe em **Authentication → Users**. |
| **RLS bloqueando consulta** | Verifique se o usuário está autenticado e se existe o registro em `profiles` com `ativo = true`. As políticas exigem usuário logado. |
| **Tabela inexistente** | Certifique-se de que executou o `schema.sql` por completo, sem erros, no **SQL Editor**. |
| **Build falhando** | Execute `npm install` novamente e `npm run build`. Verifique a versão do Node (18+). |
| **Deploy falhando** | Verifique as variáveis de ambiente na plataforma e o comando de build (`npm run build`). |
| **Login funciona local mas não no deploy** | Atualize o **Site URL** e os **Redirect URLs** no Supabase para a URL de produção da plataforma. |

---

## 12. Estrutura do projeto

```
classe-ouro/
├── index.html
├── vite.config.js
├── package.json
├── .env.example
├── .gitignore
├── supabase/
│   └── schema.sql           # Tabelas, RLS, índices e dados iniciais
└── src/
    ├── main.jsx             # Ponto de entrada
    ├── App.jsx              # Rotas e proteção de rotas
    ├── styles.css           # CSS3 (design system + responsivo)
    ├── design-refinements.css # Refinamentos visuais (gradientes, animações)
    ├── assets/
    ├── routes/
    ├── layouts/
    │   ├── AdminLayout.jsx
    │   └── PublicLayout.jsx
    ├── contexts/
    │   ├── AuthContext.jsx  # Sessão e perfil do usuário
    │   └── ToastContext.jsx # Notificações toast
    ├── services/
    │   ├── supabase.js
    │   ├── authService.js
    │   ├── turmaService.js
    │   ├── alunoService.js
    │   ├── periodoService.js
    │   ├── criterioService.js
    │   ├── pontuacaoService.js
    │   ├── penalidadeService.js
    │   ├── rankingService.js
    │   └── auditService.js
    ├── hooks/
    ├── utils/
    │   ├── format.js
    │   └── validators.js
    ├── components/
    │   ├── Sidebar.jsx
    │   ├── Navbar.jsx
    │   ├── Table.jsx
    │   ├── Modal.jsx
    │   ├── Button.jsx
    │   ├── Input.jsx
    │   ├── Select.jsx
    │   ├── Badge.jsx
    │   ├── Loading.jsx
    │   ├── Toast (via context)
    │   ├── ConfirmDialog.jsx
    │   ├── SearchInput.jsx
    │   ├── Pagination.jsx
    │   ├── DashboardCard.jsx
    │   ├── RankingTable.jsx
    │   └── EmptyState.jsx
    └── pages/
        ├── Login.jsx
        ├── Dashboard.jsx
        ├── Turmas.jsx
        ├── TurmaDetalhes.jsx
        ├── Alunos.jsx
        ├── Professores.jsx
        ├── Periodos.jsx
        ├── Criterios.jsx
        ├── Pontuacoes.jsx
        ├── Penalidades.jsx
        ├── Ranking.jsx
        ├── Historico.jsx
        ├── Relatorios.jsx
        ├── Regulamento.jsx
        ├── Premiacao.jsx
        ├── Perfil.jsx
        └── Configuracoes.jsx
```

---

## 13. Funcionamento

- **Login** com Supabase Auth (e-mail/senha), recuperação de senha e sessão persistente.
- **Perfis**: `admin` (controle total) e `professor` (lançamentos e consultas).
- **Turmas** e **alunos**: CRUD completo, com ativar/desativar e transferência de alunos.
- **Períodos**: cadastro das etapas da competição.
- **Critérios**: tabela oficial (Anexo 1) configurável pelo administrador.
- **Pontuações**: lançamento de pontos positivos com validação do limite por critério/período (direto no banco).
- **Penalidades**: aplicação com confirmação e controle por tipo/limite.
- **Ranking**: total = pontos positivos + penalidades, com filtros e podium.
- **Histórico**: todos os lançamentos com filtros e busca.
- **Auditoria**: trilha completa de todas as operações.
- **Premiação**: tela especial para a turma campeã ("Classe Ouro" + pizza 🍕).
- **Regulamento**: página pública e organizada.
- **Relatórios**: impressão e exportação CSV do ranking.
