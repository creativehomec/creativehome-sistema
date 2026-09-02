-- Sync ao vivo: policy de select pública pra Realtime, nas tabelas que
-- alimentam notificações, backlog, tarefas do dia e Guia de Captação.
--
-- Decisão consciente: essas tabelas ficam legíveis pela chave anônima (que
-- vai embutida no bundle do navegador) sem exigir login — o app não usa
-- Supabase Auth, só cookie de sessão próprio, então não tem como o RLS
-- filtrar por "sessão de admin válida" sem reescrever a autenticação. Toda
-- escrita continua só pelas server actions com a service role; isto aqui é
-- só leitura.
--
-- O Realtime só entrega evento de tabela que está na publicação
-- `supabase_realtime` — a policy sozinha não basta.

create policy "realtime select" on notifications for select using (true);
create policy "realtime select" on backlog_columns for select using (true);
create policy "realtime select" on backlog_cards for select using (true);
create policy "realtime select" on backlog_checklist_items for select using (true);
create policy "realtime select" on backlog_card_activity for select using (true);
create policy "realtime select" on daily_todos for select using (true);
create policy "realtime select" on daily_todo_assignees for select using (true);
create policy "realtime select" on daily_todo_checklist_items for select using (true);
create policy "realtime select" on guides for select using (true);
create policy "realtime select" on videos for select using (true);
create policy "realtime select" on scenes for select using (true);
create policy "realtime select" on visual_references for select using (true);
create policy "realtime select" on photo_items for select using (true);
create policy "realtime select" on card_items for select using (true);
create policy "realtime select" on shot_list_items for select using (true);
create policy "realtime select" on checklist_items for select using (true);

alter publication supabase_realtime add table
  notifications,
  backlog_columns,
  backlog_cards,
  backlog_checklist_items,
  backlog_card_activity,
  daily_todos,
  daily_todo_assignees,
  daily_todo_checklist_items,
  guides,
  videos,
  scenes,
  visual_references,
  photo_items,
  card_items,
  shot_list_items,
  checklist_items;
