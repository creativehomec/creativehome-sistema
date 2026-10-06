-- Hooks e CTAs alternativos por cena e notas de produção por vídeo (mostradas
-- depois da última cena). Usados pelo "Colar roteiro" no editor do guia.
alter table scenes add column if not exists hooks_alternativos text[] not null default '{}';
alter table scenes add column if not exists ctas_alternativos text[] not null default '{}';
alter table videos add column if not exists notas_producao text not null default '';
