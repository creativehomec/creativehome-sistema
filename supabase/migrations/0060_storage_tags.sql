-- Etiquetas livres por espaço (ex.: "clientes", "2026", "arquivo morto"), editadas na tela.
alter table storage_locations add column if not exists tags text[] not null default '{}';
