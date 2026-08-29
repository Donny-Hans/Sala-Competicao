-- ============================================================
-- CLASSE OURO - SISTEMA DE COMPETIÇÃO INTERCLASSES
-- SCHEMA, TABELAS, ÍNDICES, RLS, DADOS INICIAIS
-- Execute este arquivo no SQL Editor do Supabase.
-- ============================================================

-- ------------------------------------------------------------
-- EXTENSÕES
-- ------------------------------------------------------------
create extension if not exists "uuid-ossp";

-- ------------------------------------------------------------
-- TABELA: profiles
-- ------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid unique not null references auth.users(id) on delete cascade,
  nome text not null,
  email text not null,
  role text not null default 'professor' check (role in ('admin','professor')),
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- TABELA: turmas
-- ------------------------------------------------------------
create table if not exists public.turmas (
  id uuid primary key default uuid_generate_v4(),
  nome text not null,
  serie text not null,
  turno text not null default 'Manhã',
  sala text,
  ano_letivo integer not null default extract(year from now())::int,
  descricao text,
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- TABELA: alunos
-- ------------------------------------------------------------
create table if not exists public.alunos (
  id uuid primary key default uuid_generate_v4(),
  nome text not null,
  matricula text unique not null,
  turma_id uuid references public.turmas(id) on delete set null,
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- TABELA: periodos
-- ------------------------------------------------------------
create table if not exists public.periodos (
  id uuid primary key default uuid_generate_v4(),
  nome text not null,
  data_inicio date not null,
  data_fim date not null,
  status text not null default 'ativo' check (status in ('ativo','encerrado','planejado')),
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- TABELA: criterios
-- ------------------------------------------------------------
create table if not exists public.criterios (
  id uuid primary key default uuid_generate_v4(),
  nome text not null unique,
  categoria text not null,
  pontos_maximos integer not null check (pontos_maximos > 0),
  ativo boolean not null default true
);

-- ------------------------------------------------------------
-- TABELA: penalidades
-- ------------------------------------------------------------
create table if not exists public.penalidades (
  id uuid primary key default uuid_generate_v4(),
  nome text not null,
  descricao text,
  pontos integer not null,
  tipo_calculo text not null default 'fixo' check (tipo_calculo in ('fixo','por_dia','por_semana','por_periodo')),
  limite integer,
  ativo boolean not null default true
);

-- ------------------------------------------------------------
-- TABELA: pontuacoes (pontos positivos)
-- ------------------------------------------------------------
create table if not exists public.pontuacoes (
  id uuid primary key default uuid_generate_v4(),
  turma_id uuid not null references public.turmas(id) on delete cascade,
  periodo_id uuid not null references public.periodos(id) on delete cascade,
  criterio_id uuid not null references public.criterios(id) on delete cascade,
  professor_id uuid not null references public.profiles(id) on delete cascade,
  pontos integer not null check (pontos > 0),
  observacao text,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- TABELA: aplicacoes_penalidades
-- ------------------------------------------------------------
create table if not exists public.aplicacoes_penalidades (
  id uuid primary key default uuid_generate_v4(),
  turma_id uuid not null references public.turmas(id) on delete cascade,
  periodo_id uuid not null references public.periodos(id) on delete cascade,
  penalidade_id uuid not null references public.penalidades(id) on delete cascade,
  professor_id uuid not null references public.profiles(id) on delete cascade,
  pontos integer not null,
  data_aplicacao date not null default current_date,
  descricao text,
  observacao text,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- TABELA: audit_logs
-- ------------------------------------------------------------
create table if not exists public.audit_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete set null,
  acao text not null,
  tabela text not null,
  registro_id uuid,
  tipo_operacao text not null,
  dados_anteriores jsonb,
  dados_novos jsonb,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- ÍNDICES
-- ------------------------------------------------------------
create index if not exists idx_alunos_turma on public.alunos(turma_id);
create index if not exists idx_alunos_nome on public.alunos(nome);
create index if not exists idx_turmas_ano on public.turmas(ano_letivo);
create index if not exists idx_pontuacoes_turma on public.pontuacoes(turma_id);
create index if not exists idx_pontuacoes_periodo on public.pontuacoes(periodo_id);
create index if not exists idx_pontuacoes_criterio on public.pontuacoes(criterio_id);
create index if not exists idx_ap_turma on public.aplicacoes_penalidades(turma_id);
create index if not exists idx_ap_periodo on public.aplicacoes_penalidades(periodo_id);
create index if not exists idx_audit_user on public.audit_logs(user_id);
create index if not exists idx_profiles_user on public.profiles(user_id);

-- ------------------------------------------------------------
-- HELPER: função para checar se usuário é admin
-- ------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid() and p.role = 'admin' and p.ativo = true
  );
$$;

-- ------------------------------------------------------------
-- HELPER: função para checar se usuário é professor ativo
-- ------------------------------------------------------------
create or replace function public.is_professor()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid() and p.ativo = true
  );
$$;

-- ------------------------------------------------------------
-- RLS: HABILITAR RLS NAS TABELAS
-- ------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.turmas enable row level security;
alter table public.alunos enable row level security;
alter table public.periodos enable row level security;
alter table public.criterios enable row level security;
alter table public.penalidades enable row level security;
alter table public.pontuacoes enable row level security;
alter table public.aplicacoes_penalidades enable row level security;
alter table public.audit_logs enable row level security;

-- ------------------------------------------------------------
-- RLS: PROFILES
-- Usuário pode ver seu próprio perfil; admin vê todos.
-- ------------------------------------------------------------
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = user_id);

drop policy if exists "profiles_update_admin" on public.profiles;
create policy "profiles_update_admin" on public.profiles
  for update using (public.is_admin()) with check (public.is_admin());

-- ------------------------------------------------------------
-- RLS: TURMAS
-- Qualquer professor logado pode ler; admin gerencia.
-- ------------------------------------------------------------
drop policy if exists "turmas_select" on public.turmas;
create policy "turmas_select" on public.turmas
  for select using (public.is_professor());

drop policy if exists "turmas_insert_admin" on public.turmas;
create policy "turmas_insert_admin" on public.turmas
  for insert with check (public.is_admin());

drop policy if exists "turmas_update_admin" on public.turmas;
create policy "turmas_update_admin" on public.turmas
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "turmas_delete_admin" on public.turmas;
create policy "turmas_delete_admin" on public.turmas
  for delete using (public.is_admin());

-- ------------------------------------------------------------
-- RLS: ALUNOS
-- ------------------------------------------------------------
drop policy if exists "alunos_select" on public.alunos;
create policy "alunos_select" on public.alunos
  for select using (public.is_professor());

drop policy if exists "alunos_insert_admin" on public.alunos;
create policy "alunos_insert_admin" on public.alunos
  for insert with check (public.is_admin());

drop policy if exists "alunos_update_admin" on public.alunos;
create policy "alunos_update_admin" on public.alunos
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "alunos_delete_admin" on public.alunos;
create policy "alunos_delete_admin" on public.alunos
  for delete using (public.is_admin());

-- ------------------------------------------------------------
-- RLS: PERIODOS
-- ------------------------------------------------------------
drop policy if exists "periodos_select" on public.periodos;
create policy "periodos_select" on public.periodos
  for select using (public.is_professor());

drop policy if exists "periodos_insert_admin" on public.periodos;
create policy "periodos_insert_admin" on public.periodos
  for insert with check (public.is_admin());

drop policy if exists "periodos_update_admin" on public.periodos;
create policy "periodos_update_admin" on public.periodos
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "periodos_delete_admin" on public.periodos;
create policy "periodos_delete_admin" on public.periodos
  for delete using (public.is_admin());

-- ------------------------------------------------------------
-- RLS: CRITERIOS (leitura para todos, gerenciamento admin)
-- ------------------------------------------------------------
drop policy if exists "criterios_select" on public.criterios;
create policy "criterios_select" on public.criterios
  for select using (public.is_professor());

drop policy if exists "criterios_insert_admin" on public.criterios;
create policy "criterios_insert_admin" on public.criterios
  for insert with check (public.is_admin());

drop policy if exists "criterios_update_admin" on public.criterios;
create policy "criterios_update_admin" on public.criterios
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "criterios_delete_admin" on public.criterios;
create policy "criterios_delete_admin" on public.criterios
  for delete using (public.is_admin());

-- ------------------------------------------------------------
-- RLS: PENALIDADES (catálogo - leitura para todos)
-- ------------------------------------------------------------
drop policy if exists "penalidades_select" on public.penalidades;
create policy "penalidades_select" on public.penalidades
  for select using (public.is_professor());

drop policy if exists "penalidades_insert_admin" on public.penalidades;
create policy "penalidades_insert_admin" on public.penalidades
  for insert with check (public.is_admin());

drop policy if exists "penalidades_update_admin" on public.penalidades;
create policy "penalidades_update_admin" on public.penalidades
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "penalidades_delete_admin" on public.penalidades;
create policy "penalidades_delete_admin" on public.penalidades
  for delete using (public.is_admin());

-- ------------------------------------------------------------
-- RLS: PONTUACOES
-- Professores podem inserir; apenas admin pode alterar/excluir.
-- ------------------------------------------------------------
drop policy if exists "pontuacoes_select" on public.pontuacoes;
create policy "pontuacoes_select" on public.pontuacoes
  for select using (public.is_professor());

drop policy if exists "pontuacoes_insert" on public.pontuacoes;
create policy "pontuacoes_insert" on public.pontuacoes
  for insert with check (public.is_professor());

drop policy if exists "pontuacoes_update_admin" on public.pontuacoes;
create policy "pontuacoes_update_admin" on public.pontuacoes
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "pontuacoes_delete_admin" on public.pontuacoes;
create policy "pontuacoes_delete_admin" on public.pontuacoes
  for delete using (public.is_admin());

-- ------------------------------------------------------------
-- RLS: APLICACOES_PENALIDADES
-- Professores podem inserir; apenas admin pode alterar/excluir.
-- ------------------------------------------------------------
drop policy if exists "ap_select" on public.aplicacoes_penalidades;
create policy "ap_select" on public.aplicacoes_penalidades
  for select using (public.is_professor());

drop policy if exists "ap_insert" on public.aplicacoes_penalidades;
create policy "ap_insert" on public.aplicacoes_penalidades
  for insert with check (public.is_professor());

drop policy if exists "ap_update_admin" on public.aplicacoes_penalidades;
create policy "ap_update_admin" on public.aplicacoes_penalidades
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "ap_delete_admin" on public.aplicacoes_penalidades;
create policy "ap_delete_admin" on public.aplicacoes_penalidades
  for delete using (public.is_admin());

-- ------------------------------------------------------------
-- RLS: AUDIT_LOGS
-- Qualquer professor logado grava; apenas admin lê todos.
-- ------------------------------------------------------------
drop policy if exists "audit_insert" on public.audit_logs;
create policy "audit_insert" on public.audit_logs
  for insert with check (public.is_professor());

drop policy if exists "audit_select_admin" on public.audit_logs;
create policy "audit_select_admin" on public.audit_logs
  for select using (public.is_admin());

-- ------------------------------------------------------------
-- DADOS INICIAIS: CRITÉRIOS (Anexo 1)
-- ------------------------------------------------------------
insert into public.criterios (nome, categoria, pontos_maximos) values
('Zeladoria', 'Organização', 50),
('Cuidado com o patrimônio', 'Organização', 50),
('Pontualidade', 'Disciplina', 20),
('Uso do uniforme', 'Disciplina', 10),
('Comportamento', 'Disciplina', 50),
('Assiduidade', 'Disciplina', 20),
('Deveres de casa', 'Atividades', 50),
('Trabalhos em grupo', 'Atividades', 50),
('Participação em eventos', 'Atividades', 50),
('Acolhimento de todos os colegas', 'Relacionamento', 50),
('Ausência de conflitos graves ou bullying', 'Relacionamento', 50),
('Solidariedade com os colegas', 'Relacionamento', 50),
('Respeito aos professores', 'Professor', 50),
('Cordialidade com os professores', 'Professor', 50),
('Disciplina', 'Disciplina', 50),
('Colaboração com os professores', 'Professor', 50),
('Média da turma', 'Avaliações', 100),
('Evolução', 'Avaliações', 100),
('Recuperação', 'Avaliações', 100)
on conflict (nome) do nothing;

-- ------------------------------------------------------------
-- DADOS INICIAIS: PENALIDADES
-- ------------------------------------------------------------
insert into public.penalidades (nome, descricao, pontos, tipo_calculo, limite) values
('Depredação de bens', 'Depredar, quebrar ou riscar bens físicos ou móveis da escola.', -50, 'fixo', null),
('Fora da sala injustificado', 'Ficar fora da sala de aula injustificadamente.', -2, 'por_dia', null),
('Fora da sala (semana)', 'Ficar fora da sala de aula injustificadamente acumulado na semana.', -10, 'por_semana', null),
('Fora da sala (período)', 'Ficar fora da sala de aula injustificadamente acumulado no período.', -60, 'por_periodo', null),
('Advertências e ocorrências', 'Advertências, ocorrências ou suspensões individualmente e/ou coletivamente na turma.', -150, 'fixo', null),
('Desrespeito grave', 'Atitudes de desrespeito graves, brigas, vandalismo ou preconceito (bullying/cyberbullying).', -150, 'fixo', null),
('Inadimplência de atividades', 'Inadimplência na entrega de atividades.', -10, 'fixo', -100),
('Tentar burlar regras', 'Tentar burlar as regras de pontuação ou colar em avaliações.', -100, 'fixo', null),
('Uso indevido de eletrônicos', 'Uso indevido de aparelhos eletrônicos.', -20, 'fixo', null)
on conflict do nothing;

-- Se estiver reexecutando, limpar dados de teste (comente se não desejar):
-- delete from public.pontuacoes;
-- delete from public.aplicacoes_penalidades;
-- delete from public.alunos;
-- delete from public.turmas;
-- delete from public.periodos;

-- ------------------------------------------------------------
-- DADOS DE TESTE (OPCIONAL)
-- ------------------------------------------------------------
-- Periodos
insert into public.periodos (nome, data_inicio, data_fim, status) values
('1º Período', date_trunc('year', now())::date, (date_trunc('year', now()) + interval '4 months')::date, 'ativo'),
('2º Período', (date_trunc('year', now()) + interval '4 months')::date, (date_trunc('year', now()) + interval '8 months')::date, 'planejado'),
('3º Período', (date_trunc('year', now()) + interval '8 months')::date, (date_trunc('year', now()) + interval '12 months')::date, 'planejado');

-- Turmas de exemplo
insert into public.turmas (nome, serie, turno, sala, ano_letivo, descricao) values
('1º Ano A', '1º Ano', 'Manhã', 'Sala 01', extract(year from now())::int, 'Turma de exemplo'),
('1º Ano B', '1º Ano', 'Manhã', 'Sala 02', extract(year from now())::int, 'Turma de exemplo'),
('2º Ano A', '2º Ano', 'Tarde', 'Sala 03', extract(year from now())::int, 'Turma de exemplo'),
('3º Ano A', '3º Ano', 'Tarde', 'Sala 04', extract(year from now())::int, 'Turma de exemplo');

-- ============================================================
-- NOTA: usuários (auth.users) devem ser criados via Supabase
-- Authentication (email/senha) e depois associados a profiles.
-- Veja o README para instruções completas.
-- ============================================================
