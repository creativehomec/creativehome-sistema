-- Com um quadro só, `board` não separa mais nada: toda linha vale 'entregas'.
-- Ninguém lê a coluna depois que o kanban parou de filtrar por ela, e coluna
-- que ninguém lê é mentira esperando alguém acreditar. O índice cai junto.
--
-- Rode depois de publicar o código que deixou de filtrar por board, nunca
-- antes: o PostgREST devolveria 42703 no quadro, no calendário e no
-- faturamento.
alter table backlog_columns drop column if exists board;
