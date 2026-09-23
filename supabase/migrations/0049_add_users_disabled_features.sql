-- Áreas do admin desligadas por usuário (ver lib/features.ts). Guarda o que
-- foi tirado, não o que foi dado: quem já existe continua vendo tudo, e área
-- nova nasce liberada. Admin ignora a coluna e vê tudo.
--
-- Rode ANTES de publicar o código: salvar um usuário em /admin/usuarios
-- escreve nesta coluna e daria 42703 sem ela.
alter table users
  add column if not exists disabled_features text[] not null default '{}';
