-- RLS aktivieren
alter table personen enable row level security;
alter table kalender_eintraege enable row level security;
alter table fotos enable row level security;
alter table playlists enable row level security;
alter table playlist_titel enable row level security;
alter table besuche enable row level security;
alter table nachrichten enable row level security;
alter table wohlbefinden_signale enable row level security;
alter table geraet_heartbeat enable row level security;

-- === personen ===
-- Alle eingeloggten Benutzer dürfen aktive Personen sehen
create policy "personen_lesen" on personen
  for select using (aktiv = true and auth.uid() is not null);

-- Admin: vollzugriff
create policy "personen_admin_schreiben" on personen
  for all using (ist_rolle('admin'));

-- === kalender_eintraege ===
-- Oma und Familie dürfen alle Einträge lesen
create policy "kalender_lesen" on kalender_eintraege
  for select using (auth.uid() is not null);

-- Familie und Admin dürfen Einträge erstellen/ändern
create policy "kalender_familie_schreiben" on kalender_eintraege
  for insert with check (ist_rolle('familie') or ist_rolle('admin'));

create policy "kalender_familie_aendern" on kalender_eintraege
  for update using (ist_rolle('familie') or ist_rolle('admin'));

create policy "kalender_admin_loeschen" on kalender_eintraege
  for delete using (ist_rolle('admin'));

-- === fotos ===
-- Tablet (Oma) darf genehmigte Fotos sehen — kein Auth nötig (Service Role wird verwendet)
-- Eingeloggte: sehen genehmigte Fotos
create policy "fotos_genehmigt_lesen" on fotos
  for select using (status = 'genehmigt' and auth.uid() is not null);

-- Admin sieht alle Fotos
create policy "fotos_admin_lesen" on fotos
  for select using (ist_rolle('admin'));

-- Familie darf Fotos hochladen (eigene)
create policy "fotos_familie_hochladen" on fotos
  for insert with check (
    ist_rolle('familie') and
    hochgeladen_von = (select id from personen where auth_id = auth.uid())
  );

-- Admin: vollzugriff
create policy "fotos_admin_verwalten" on fotos
  for all using (ist_rolle('admin'));

-- === playlists ===
create policy "playlists_lesen" on playlists
  for select using (aktiv = true and auth.uid() is not null);

create policy "playlists_familie_erstellen" on playlists
  for insert with check (ist_rolle('familie') or ist_rolle('admin'));

create policy "playlists_admin_verwalten" on playlists
  for all using (ist_rolle('admin'));

-- === playlist_titel ===
create policy "playlist_titel_lesen" on playlist_titel
  for select using (auth.uid() is not null);

create policy "playlist_titel_familie_erstellen" on playlist_titel
  for insert with check (ist_rolle('familie') or ist_rolle('admin'));

create policy "playlist_titel_admin_verwalten" on playlist_titel
  for all using (ist_rolle('admin'));

-- === besuche ===
create policy "besuche_lesen" on besuche
  for select using (auth.uid() is not null);

create policy "besuche_familie_erstellen" on besuche
  for insert with check (
    ist_rolle('familie') and
    besucher_id = (select id from personen where auth_id = auth.uid())
  );

create policy "besuche_eigene_aendern" on besuche
  for update using (
    besucher_id = (select id from personen where auth_id = auth.uid()) or
    ist_rolle('admin')
  );

-- === nachrichten ===
create policy "nachrichten_lesen" on nachrichten
  for select using (auth.uid() is not null);

create policy "nachrichten_familie_senden" on nachrichten
  for insert with check (
    ist_rolle('familie') and
    von_person_id = (select id from personen where auth_id = auth.uid())
  );

-- === wohlbefinden_signale ===
-- Tablet schreibt via Service Role (kein Auth auf Tablet)
-- Familie/Admin liest
create policy "wohlbefinden_lesen" on wohlbefinden_signale
  for select using (ist_rolle('familie') or ist_rolle('admin'));

-- === geraet_heartbeat ===
create policy "heartbeat_lesen" on geraet_heartbeat
  for select using (ist_rolle('admin'));
