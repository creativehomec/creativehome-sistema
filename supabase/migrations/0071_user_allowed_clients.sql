-- Acesso restrito por cliente: `allowed_client_ids` limita, em Clientes,
-- Galerias e Entregas, a quais clientes a pessoa tem acesso.
-- null = todos (comportamento de hoje). Admin nunca é afetado.

alter table users
  add column if not exists allowed_client_ids uuid[];
