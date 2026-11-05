-- Prospecção (/admin/prospeccao): histórico de buscas e quem já foi contatado, por usuário.
-- Acesso só pelo servidor (service role), como no resto do sistema.
-- As buscas com mais de 30 dias são apagadas pelo próprio código ao listar.
create table if not exists prospeccao_buscas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  nicho text not null,
  cidade text not null,
  total integer not null default 0,
  csv text not null
);

create index if not exists prospeccao_buscas_user_idx
  on prospeccao_buscas (user_id, created_at desc);

-- `lead_id` = "nome|endereço" da empresa, o mesmo em qualquer busca.
create table if not exists prospeccao_contatados (
  user_id uuid not null references users(id) on delete cascade,
  lead_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, lead_id)
);

alter table prospeccao_buscas enable row level security;
alter table prospeccao_contatados enable row level security;
