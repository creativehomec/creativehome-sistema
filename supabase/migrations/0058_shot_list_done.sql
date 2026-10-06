-- Checkbox "feito" na shot list do guia publicado.
alter table shot_list_items add column if not exists done boolean not null default false;
