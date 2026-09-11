-- O sistema passa a ter um quadro só. O de entregas cumpre a função dos dois:
-- a CreativeHome não programa os próprios posts de Instagram aqui, que era o
-- que justificava o segundo quadro herdado do projeto de origem.
--
-- Esta migration só tira os dados do quadro morto. A coluna `board` em si sai
-- na 0048, depois que o código parar de filtrar por ela — nesta ordem o app
-- nunca fica sem o que espera encontrar.

-- Os cards primeiro: `backlog_cards.column_id` é `on delete cascade`, então
-- apagar a coluna levaria junto o que estivesse nela. O que sobrou do quadro
-- antigo cai na primeira coluna do de entregas.
--
-- Sem guarda explícita: se não houver coluna de entregas, o subselect devolve
-- null, o `not null` de column_id estoura e a transação inteira aborta. Falhar
-- alto é melhor que apagar em silêncio.
update backlog_cards
set column_id = (
      select id from backlog_columns where board = 'entregas'
      order by position limit 1
    ),
    -- Empilha depois do que já está lá, em vez de intercalar.
    position = position + 1000
where column_id in (select id from backlog_columns where board = 'instagram');

delete from backlog_columns where board = 'instagram';
