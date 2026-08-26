-- Setup completo do banco (instalação nova, white label).
--
-- Rode este arquivo inteiro no SQL Editor de um projeto Supabase VAZIO.
-- Não contém nenhum dado — só estrutura. Todos os statements são
-- idempotentes (`if not exists`), então rodar de novo não quebra nada.
--
-- Conteúdo: schema.sql (que já reflete o estado final da maioria das
-- migrations) + as sete migrations posteriores que ainda não tinham sido
-- incorporadas nele. As demais migrations em supabase/migrations/ servem só
-- pra atualizar um banco antigo — num banco vazio elas não têm o que fazer,
-- e a 0013 (rename users.email -> username) chega a falhar, porque o
-- schema.sql já cria a coluna com o nome novo.

-- ============================== schema.sql ==============================
-- Guia de Captação — schema do Supabase
-- Para um projeto NOVO: rode este arquivo inteiro no SQL Editor.
-- Se você já rodou uma versão anterior deste schema (sem a tabela "videos"),
-- rode em vez disso supabase/migrations/0002_add_videos.sql para preservar
-- os dados existentes.

create extension if not exists pgcrypto;

create table if not exists guides (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null default 'Novo guia',
  client_name text default '',
  shoot_date date,
  location text default '',
  status text not null default 'draft' check (status in ('draft', 'published')),
  tags text[] not null default '{}'::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists guides_tags_idx on guides using gin (tags);

create table if not exists videos (
  id uuid primary key default gen_random_uuid(),
  guide_id uuid not null references guides(id) on delete cascade,
  position integer not null default 0,
  title text not null default ''
);

create table if not exists scenes (
  id uuid primary key default gen_random_uuid(),
  video_id uuid not null references videos(id) on delete cascade,
  position integer not null default 0,
  script text not null default '',
  description text not null default '',
  recorded boolean not null default false
);

create table if not exists visual_references (
  id uuid primary key default gen_random_uuid(),
  guide_id uuid not null references guides(id) on delete cascade,
  scene_id uuid references scenes(id) on delete set null,
  image_url text not null,
  source_url text,
  caption text not null default '',
  position integer not null default 0,
  selected boolean not null default false
);

create table if not exists photo_items (
  id uuid primary key default gen_random_uuid(),
  guide_id uuid not null references guides(id) on delete cascade,
  position integer not null default 0,
  image_url text not null,
  source_url text,
  caption text not null default '',
  selected boolean not null default false
);

create table if not exists card_items (
  id uuid primary key default gen_random_uuid(),
  guide_id uuid not null references guides(id) on delete cascade,
  position integer not null default 0,
  image_url text not null,
  source_url text,
  caption text not null default '',
  selected boolean not null default false
);

create table if not exists shot_list_items (
  id uuid primary key default gen_random_uuid(),
  guide_id uuid not null references guides(id) on delete cascade,
  position integer not null default 0,
  description text not null default '',
  shot_type text not null default '',
  duration text not null default '',
  notes text not null default ''
);

create table if not exists checklist_items (
  id uuid primary key default gen_random_uuid(),
  guide_id uuid not null references guides(id) on delete cascade,
  category text not null default 'equipamento' check (category in ('equipamento', 'locacao')),
  position integer not null default 0,
  label text not null default '',
  done boolean not null default false
);

create index if not exists videos_guide_id_idx on videos(guide_id);
create index if not exists scenes_video_id_idx on scenes(video_id);
create index if not exists visual_references_guide_id_idx on visual_references(guide_id);
create index if not exists photo_items_guide_id_idx on photo_items(guide_id);
create index if not exists card_items_guide_id_idx on card_items(guide_id);
create index if not exists shot_list_items_guide_id_idx on shot_list_items(guide_id);
create index if not exists checklist_items_guide_id_idx on checklist_items(guide_id);

-- Storage: crie manualmente um bucket público chamado "guide-references"
-- (Storage > New bucket > marque "Public bucket") para permitir upload
-- de imagens de referência visual.

-- Este projeto acessa o banco usando a service role key apenas em código
-- server-side (nunca exposta ao navegador), então RLS pode ficar habilitado
-- com as tabelas sem policies — a service role ignora RLS por padrão.
alter table guides enable row level security;
alter table videos enable row level security;
alter table scenes enable row level security;
alter table visual_references enable row level security;
alter table photo_items enable row level security;
alter table card_items enable row level security;
alter table shot_list_items enable row level security;
alter table checklist_items enable row level security;

-- Orçamento — proposta comercial em landing page por cliente (ver
-- supabase/migrations/0008_add_budgets.sql). Sem bucket de Storage: o único
-- campo de mídia é um link de vídeo de fundo (mp4/YouTube/Vimeo colado como
-- texto), não upload de arquivo.

create table if not exists budgets (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null default 'Novo orçamento',
  client_name text default '',
  client_whatsapp text default '',
  status text not null default 'draft' check (status in ('draft', 'published')),
  hero_eyebrow text not null default 'PROPOSTA CRIATIVA · 2026',
  hero_title1 text not null default '',
  hero_title2 text not null default '',
  hero_subtitle text not null default '',
  hero_cta text not null default 'Conhecer a proposta',
  hero_bg_video_url text not null default '',
  about_title text not null default '',
  about_text text not null default '',
  highlights_title text not null default 'O que você recebe',
  calc_meu_nivel text not null default 'intermediario' check (calc_meu_nivel in ('iniciante', 'intermediario', 'pro')),
  calc_nivel_cliente text not null default 'medio' check (calc_nivel_cliente in ('pequena', 'medio', 'grande')),
  calc_estrategia numeric(10,2) not null default 0,
  calc_videos numeric(10,2) not null default 0,
  calc_resultado numeric(10,2) not null default 0,
  calc_extras numeric(10,2) not null default 0,
  calc_margem_pct numeric(5,2) not null default 10,
  calc_tax_pct numeric(5,2) not null default 5,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists budget_highlights (
  id uuid primary key default gen_random_uuid(),
  budget_id uuid not null references budgets(id) on delete cascade,
  position integer not null default 0,
  title text not null default ''
);

create table if not exists budget_packages (
  id uuid primary key default gen_random_uuid(),
  budget_id uuid not null references budgets(id) on delete cascade,
  position integer not null default 0,
  name text not null default '',
  price numeric(10,2) not null default 0,
  tag text not null default '',
  features text not null default ''
);

create table if not exists budget_faq (
  id uuid primary key default gen_random_uuid(),
  budget_id uuid not null references budgets(id) on delete cascade,
  position integer not null default 0,
  question text not null default '',
  answer text not null default ''
);

create table if not exists budget_references (
  id uuid primary key default gen_random_uuid(),
  budget_id uuid not null references budgets(id) on delete cascade,
  position integer not null default 0,
  image_url text not null,
  source_url text,
  caption text not null default ''
);

create index if not exists budget_highlights_budget_id_idx on budget_highlights(budget_id);
create index if not exists budget_packages_budget_id_idx on budget_packages(budget_id);
create index if not exists budget_faq_budget_id_idx on budget_faq(budget_id);
create index if not exists budget_references_budget_id_idx on budget_references(budget_id);

alter table budgets enable row level security;
alter table budget_highlights enable row level security;
alter table budget_packages enable row level security;
alter table budget_faq enable row level security;
alter table budget_references enable row level security;

-- Biblioteca — lista de links e ferramentas úteis (ver
-- supabase/migrations/0010_add_library_links.sql e
-- 0036_add_library_tags_and_icon.sql). `tags` categoriza e alimenta a busca;
-- `icon_url` é override opcional do favicon derivado do domínio.

create table if not exists library_links (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  url text not null default '',
  description text not null default '',
  tags text[] not null default '{}'::text[],
  icon_url text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists library_links_tags_idx on library_links using gin (tags);

alter table library_links enable row level security;

-- Usuários — cadastro real (username + senha) substituindo a senha única
-- compartilhada (ver supabase/migrations/0012_add_users.sql,
-- 0013_rename_users_email_to_username.sql e 0014_add_users_email.sql).
-- `email` é só dado de contato — o login é sempre por `username`.

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  email text not null default '',
  password_hash text not null,
  role text not null default 'member' check (role in ('admin', 'member')),
  created_at timestamptz not null default now()
);

alter table users enable row level security;

-- Convites de cadastro — link com token único que deixa a pessoa convidada
-- escolher seus próprios usuário/e-mail/senha (ver
-- supabase/migrations/0015_add_invites.sql).

create table if not exists invites (
  id uuid primary key default gen_random_uuid(),
  token text unique not null,
  role text not null default 'member' check (role in ('admin', 'member')),
  created_by uuid references users(id) on delete set null,
  used_by uuid references users(id) on delete set null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

alter table invites enable row level security;

-- Galeria do cliente — cada cliente tem sua própria aba no admin e seu
-- próprio link público (/galeria/[slug]) com as fotos dele (ver
-- supabase/migrations/0016_add_gallery_clients.sql).

create table if not exists gallery_clients (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null default 'Novo cliente',
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists gallery_images (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references gallery_clients(id) on delete cascade,
  position integer not null default 0,
  image_url text not null,
  source_url text,
  caption text not null default '',
  selected boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists gallery_images_client_id_idx on gallery_images(client_id);

alter table gallery_clients enable row level security;
alter table gallery_images enable row level security;

-- Backlog do Instagram — kanban de materiais da agência, com calendário de
-- postagem (ver supabase/migrations/0022_add_backlog.sql). As colunas do
-- quadro são editáveis pelo admin e a mídia do card é link (Drive), não
-- upload.

create table if not exists backlog_columns (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Nova coluna',
  color text not null default '#6b7280',
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists backlog_cards (
  id uuid primary key default gen_random_uuid(),
  column_id uuid not null references backlog_columns(id) on delete cascade,
  client_id uuid references gallery_clients(id) on delete set null,
  guide_id uuid references guides(id) on delete set null,
  assignee_id uuid references users(id) on delete set null,
  position integer not null default 0,
  title text not null default '',
  description text not null default '',
  format text not null default 'reel'
    check (format in ('reel', 'carrossel', 'foto', 'story')),
  drive_url text,
  cover_url text,
  caption text not null default '',
  post_date date,
  post_time time,
  duration_minutes integer,
  sent_whatsapp boolean not null default false,
  sent_whatsapp_at timestamptz,
  approved_at timestamptz,
  approved_by uuid references users(id) on delete set null,
  -- Evento espelhado no Google Agenda, quando a sincronização está ligada.
  google_event_id text,
  tags text[] not null default '{}'::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists backlog_cards_column_id_idx on backlog_cards(column_id);
create index if not exists backlog_cards_client_id_idx on backlog_cards(client_id);
create index if not exists backlog_cards_assignee_id_idx on backlog_cards(assignee_id);
create index if not exists backlog_cards_post_date_idx on backlog_cards(post_date);
create index if not exists backlog_cards_tags_idx on backlog_cards using gin (tags);

alter table backlog_columns enable row level security;
alter table backlog_cards enable row level security;

-- Checklist por material do backlog (ver
-- supabase/migrations/0023_add_backlog_checklist.sql).

create table if not exists backlog_checklist_items (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references backlog_cards(id) on delete cascade,
  position integer not null default 0,
  label text not null default '',
  done boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists backlog_checklist_items_card_id_idx
  on backlog_checklist_items(card_id);

alter table backlog_checklist_items enable row level security;

-- Atividade do material do backlog: movimentações, respostas de automação e
-- comentários (ver supabase/migrations/0025_add_backlog_activity.sql).

create table if not exists backlog_card_activity (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references backlog_cards(id) on delete cascade,
  author_id uuid references users(id) on delete set null,
  kind text not null default 'note' check (kind in ('move', 'answer', 'note')),
  message text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists backlog_card_activity_card_id_idx
  on backlog_card_activity(card_id, created_at desc);

alter table backlog_card_activity enable row level security;

-- Tarefas do hub do admin: lista única, compartilhada pelo time. Concluída
-- some 15 dias depois de ser marcada (limpeza roda na leitura, em
-- lib/dailyTodos.ts). Ver supabase/migrations/0029_add_daily_todos.sql.

create table if not exists daily_todos (
  id uuid primary key default gen_random_uuid(),
  text text not null,
  notes text not null default '',
  done boolean not null default false,
  due_date date,
  -- 1 = mais urgente; a tela ordena crescente. Ver
  -- supabase/migrations/0037_add_daily_todo_details.sql.
  priority smallint not null default 2 check (priority between 1 and 3),
  -- Ordem manual, arrastável na lista.
  position integer not null default 0,
  completed_at timestamptz,
  created_by uuid references users(id) on delete set null,
  completed_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists daily_todos_position_idx on daily_todos(position);

-- Checklist da tarefa, mesma forma da checklist do backlog.

create table if not exists daily_todo_checklist_items (
  id uuid primary key default gen_random_uuid(),
  todo_id uuid not null references daily_todos(id) on delete cascade,
  position integer not null default 0,
  label text not null default '',
  done boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists daily_todo_checklist_items_todo_id_idx
  on daily_todo_checklist_items(todo_id);

alter table daily_todo_checklist_items enable row level security;

-- Responsáveis da tarefa: junção, porque uma tarefa aceita mais de um (ver
-- supabase/migrations/0032_daily_todo_multiple_assignees.sql).

create table if not exists daily_todo_assignees (
  todo_id uuid not null references daily_todos(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (todo_id, user_id)
);

create index if not exists daily_todo_assignees_user_id_idx
  on daily_todo_assignees(user_id);

alter table daily_todo_assignees enable row level security;

create index if not exists daily_todos_completed_at_idx
  on daily_todos(completed_at)
  where completed_at is not null;

alter table daily_todos enable row level security;

-- ===================== migrations/0017_add_google_drive_oauth.sql =====================
-- Integração OAuth com o Google Drive — permite sincronizar automaticamente
-- as fotos de uma pasta do Drive pra galeria de um cliente, sem precisar
-- colar link por link.

-- Guarda o refresh_token da conta Google conectada. É um "singleton": o app
-- inteiro usa uma única conta conectada (id fixo 'default'), não uma por
-- usuário do admin.
create table if not exists google_oauth_tokens (
  id text primary key default 'default',
  refresh_token text not null,
  email text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table google_oauth_tokens enable row level security;

alter table gallery_clients add column if not exists drive_folder_id text;
alter table gallery_clients add column if not exists drive_synced_at timestamptz;

alter table gallery_images add column if not exists drive_file_id text;

create unique index if not exists gallery_images_drive_file_id_idx
  on gallery_images(client_id, drive_file_id)
  where drive_file_id is not null;

-- ===================== migrations/0018_add_gallery_image_mime_type.sql =====================
-- Guarda o tipo do arquivo sincronizado do Drive (imagem ou vídeo) e o
-- caminho da subpasta de origem, pra galeria conseguir renderizar cada item
-- do jeito certo (<img> vs <video>) e agrupado por subpasta do Drive.

alter table gallery_images add column if not exists mime_type text;
alter table gallery_images add column if not exists drive_relative_path text;

-- ===================== migrations/0019_add_gallery_image_modified_time.sql =====================
-- Guarda a data real de modificação do arquivo no Drive (não a data em que
-- foi sincronizado pro nosso banco) — usada pela ordenação "por data" na
-- galeria pública.

alter table gallery_images add column if not exists drive_modified_time timestamptz;

-- ===================== migrations/0031_add_notifications.sql =====================
-- Notificações: avisam a pessoa quando um material do backlog ou uma tarefa do
-- painel passa a ser responsabilidade dela, e quando algo acontece com o que
-- ela já é responsável (mudança de coluna, aprovação). Quem causou o evento
-- nunca é notificado do próprio ato.

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  kind text not null check (
    kind in ('card_assigned', 'todo_assigned', 'card_moved', 'card_approved')
  ),
  title text not null default '',
  body text not null default '',
  link text,
  entity_id uuid,
  actor_id uuid references users(id) on delete set null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

-- A consulta da campainha é sempre "as minhas, mais recentes primeiro", com o
-- não lido contado à parte.
create index if not exists notifications_user_idx
  on notifications(user_id, created_at desc);

create index if not exists notifications_unread_idx
  on notifications(user_id) where read_at is null;

alter table notifications enable row level security;

-- ===================== migrations/0033_index_gallery_images_drive_file_id.sql =====================
-- O proxy de mídia (/api/drive-image, /api/drive-thumbnail) confirma cada
-- arquivo pelo drive_file_id sozinho, sem client_id. O único índice existente
-- é (client_id, drive_file_id), que não serve pra esse filtro — a consulta
-- varria a tabela a cada requisição, e assistir um vídeo dispara várias.
create index if not exists gallery_images_drive_file_id_lookup_idx
  on gallery_images(drive_file_id)
  where drive_file_id is not null;

-- ===================== migrations/0034_add_google_calendar_sync.sql =====================
-- Sincronização do calendário do backlog com o Google Agenda.
--
-- Reaproveita a conta Google já conectada pelo Drive (google_oauth_tokens):
-- o escopo do OAuth passou a pedir também acesso aos eventos do calendário,
-- então conectar de novo é o suficiente pra habilitar essa parte.

-- Calendário de destino escolhido pelo admin. Fica na mesma linha singleton
-- do token porque a conta conectada e o calendário de destino andam juntos:
-- desconectar a conta zera os dois.
alter table google_oauth_tokens
  add column if not exists calendar_id text;

-- Id do evento criado no Google pra este card. Guardar aqui é o que permite
-- atualizar/apagar o evento certo depois, em vez de criar um duplicado a
-- cada edição.
alter table backlog_cards
  add column if not exists google_event_id text;

-- ===================== migrations/0035_user_calendar_accounts.sql =====================
-- Agenda do backlog deixa de ser do estúdio e passa a ser de cada pessoa.
--
-- Antes, a conta Google era uma só (google_oauth_tokens, linha singleton) e
-- servia Drive e Agenda ao mesmo tempo: todo card ia parar no calendário de
-- quem tinha conectado, e desconectar pra mexer no Drive derrubava as duas
-- coisas. Agora o Drive continua sendo do estúdio naquela linha, e cada
-- usuário conecta a própria conta só pro calendário.

create table if not exists user_calendar_accounts (
  user_id uuid primary key references users(id) on delete cascade,
  refresh_token text not null,
  email text not null default '',
  -- 'primary' é o apelido que o Google dá pra agenda principal da conta
  -- autenticada. Guardar o apelido em vez do id resolvido faz a integração
  -- continuar certa se a pessoa trocar de agenda principal depois.
  calendar_id text not null default 'primary',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table user_calendar_accounts enable row level security;

-- Um card agora tem um evento por pessoa conectada, então o id do evento não
-- cabe mais numa coluna do card.
create table if not exists backlog_card_events (
  card_id uuid not null references backlog_cards(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  google_event_id text not null,
  created_at timestamptz not null default now(),
  primary key (card_id, user_id)
);

alter table backlog_card_events enable row level security;

create index if not exists backlog_card_events_user_id_idx
  on backlog_card_events(user_id);

-- backlog_cards.google_event_id (migration 0034) fica onde está por ora: os
-- eventos que ela aponta pertencem à conta singleton antiga e serão apagados
-- por lá. Removê-la é assunto de uma migration posterior, depois que a
-- transição estiver de pé em produção.

-- ===================== colunas iniciais do backlog =====================
-- Vinham da migration 0022. O `where not exists` deixa o statement
-- idempotente: num quadro que já tem colunas, não insere nada.
insert into backlog_columns (name, color, position)
select * from (values
  ('Ideia', '#6b7280', 0),
  ('Captado', '#0ea5e9', 1),
  ('Editado', '#8b5cf6', 2),
  ('Aprovação', '#f59e0b', 3),
  ('Postado', '#10b981', 4)
) as seed(name, color, position)
where not exists (select 1 from backlog_columns);
