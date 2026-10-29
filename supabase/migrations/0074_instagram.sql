-- Postagem no Instagram direto do card.
--
-- Cada cliente conecta a própria conta profissional (Instagram API com login
-- do Instagram). O token de longa duração vale 60 dias e o cron renova antes
-- de vencer.

create table if not exists instagram_accounts (
  client_id uuid primary key references gallery_clients(id) on delete cascade,
  ig_user_id text not null,
  username text not null default '',
  access_token text not null,
  expires_at timestamptz not null,
  connected_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table instagram_accounts enable row level security;

-- Um post por card. "agendado" espera o dia e hora do card; "processando" já
-- mandou a mídia e espera o Instagram terminar de processar o vídeo.
create table if not exists instagram_posts (
  card_id uuid primary key references backlog_cards(id) on delete cascade,
  status text not null default 'agendado'
    check (status in ('agendado', 'processando', 'publicado', 'erro')),
  container_id text,
  -- Carrossel: cada foto/vídeo vira um container antes do container pai.
  children_ids text[] not null default '{}',
  media_id text,
  permalink text,
  error text,
  requested_by uuid references users(id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists instagram_posts_status_idx on instagram_posts(status);

alter table instagram_posts enable row level security;
