-- Mesma liberação de leitura do 0039, agora para as tabelas que a seção
-- Clientes trouxe. O navegador só precisa saber que mudou; a escrita continua
-- passando por server action com a service role.

create policy "realtime select" on services for select using (true);
create policy "realtime select" on monthly_invoices for select using (true);
create policy "realtime select" on monthly_invoice_items for select using (true);
create policy "realtime select" on backlog_card_assignees for select using (true);
create policy "realtime select" on gallery_clients for select using (true);

alter publication supabase_realtime add table services;
alter publication supabase_realtime add table monthly_invoices;
alter publication supabase_realtime add table monthly_invoice_items;
alter publication supabase_realtime add table backlog_card_assignees;
alter publication supabase_realtime add table gallery_clients;
