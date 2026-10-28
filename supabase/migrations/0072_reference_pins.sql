-- Mural de referências (/admin/referencias): links colados, indexados por nicho
-- (tag livre) e, opcionalmente, pelo cliente a quem a referência serve.
-- `thumb_url` guarda a capa que o link publica (og:image / miniatura do YouTube).
-- `kind` ('image' | 'video' | 'link') é resolvido na gravação.
create table if not exists reference_pins (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  url text not null default '',
  thumb_url text not null default '',
  kind text not null default 'link',
  note text not null default '',
  client text not null default '',
  tags text[] not null default '{}'::text[],
  created_at timestamptz not null default now()
);

create index if not exists reference_pins_tags_idx on reference_pins using gin (tags);

alter table reference_pins enable row level security;
