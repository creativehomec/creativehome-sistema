-- Aviso da campainha quando o cliente sugere uma ideia no portal.

alter table notifications drop constraint if exists notifications_kind_check;
alter table notifications add constraint notifications_kind_check check (
  kind in (
    'card_assigned', 'todo_assigned', 'card_moved', 'card_approved',
    'client_idea'
  )
);
