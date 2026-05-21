-- Storage-Buckets
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('fotos', 'fotos', false, 10485760, array['image/jpeg', 'image/png', 'image/webp']),
  ('musik', 'musik', false, 52428800, array['audio/mpeg', 'audio/aac', 'audio/mp4', 'audio/ogg']);

-- Fotos: Familie darf hochladen, Admin verwaltet
create policy "fotos_upload_familie" on storage.objects
  for insert with check (
    bucket_id = 'fotos' and
    (select ist_rolle('familie') or ist_rolle('admin'))
  );

create policy "fotos_lesen" on storage.objects
  for select using (
    bucket_id = 'fotos' and
    (select ist_rolle('familie') or ist_rolle('admin'))
  );

create policy "fotos_admin_loeschen" on storage.objects
  for delete using (
    bucket_id = 'fotos' and
    (select ist_rolle('admin'))
  );

-- Musik: Familie darf hochladen, alle dürfen lesen (signed URLs)
create policy "musik_upload_familie" on storage.objects
  for insert with check (
    bucket_id = 'musik' and
    (select ist_rolle('familie') or ist_rolle('admin'))
  );

create policy "musik_lesen" on storage.objects
  for select using (
    bucket_id = 'musik' and
    (select ist_rolle('familie') or ist_rolle('admin'))
  );

create policy "musik_admin_loeschen" on storage.objects
  for delete using (
    bucket_id = 'musik' and
    (select ist_rolle('admin'))
  );
