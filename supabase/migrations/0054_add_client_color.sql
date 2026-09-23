-- Cor do cliente no rótulo dos cards de Entregas. Guarda uma chave de
-- CLIENT_COLORS (lib/backlogTypes.ts), não um hex solto: a paleta garante
-- contraste do texto sobre o fundo. Vazio = cor automática, tirada do id.
alter table gallery_clients add column if not exists color text;
