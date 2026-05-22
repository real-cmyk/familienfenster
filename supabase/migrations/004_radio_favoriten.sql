-- Radio-Favoriten: Familienangehörige können Sender favorisieren,
-- die dann auf dem Tablet als Favoriten erscheinen.

create table if not exists radio_favoriten (
  station_id text primary key,
  hinzugefuegt_am timestamptz default now()
);

grant all on radio_favoriten to authenticated;
grant all on radio_favoriten to service_role;

alter table radio_favoriten enable row level security;

create policy "radio_lesen"
  on radio_favoriten for select
  using (true);

create policy "radio_schreiben"
  on radio_favoriten for insert
  with check (ist_rolle('familie') or ist_rolle('admin'));

create policy "radio_loeschen"
  on radio_favoriten for delete
  using (ist_rolle('familie') or ist_rolle('admin'));
