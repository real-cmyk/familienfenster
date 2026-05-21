-- Enums
create type benutzer_rolle as enum ('oma', 'familie', 'admin');
create type foto_status as enum ('ausstehend', 'genehmigt', 'abgelehnt');
create type besuch_status as enum ('angekuendigt', 'abgesagt');

-- Hilfsfunktion: Rolle des aktuell eingeloggten Benutzers
create or replace function ist_rolle(r benutzer_rolle)
returns boolean
language sql stable security definer
as $$
  select exists (
    select 1 from personen
    where auth_id = auth.uid()
    and rolle = r
    and aktiv = true
  );
$$;

-- Personen
create table personen (
  id                 uuid primary key default gen_random_uuid(),
  auth_id            uuid unique references auth.users(id) on delete set null,
  name               text not null,
  spitzname          text,
  rolle              benutzer_rolle not null default 'familie',
  avatar_storage_key text,
  aktiv              boolean not null default true,
  erstellt_am        timestamptz not null default now(),
  geaendert_am       timestamptz not null default now()
);

-- Kalender-Einträge
create table kalender_eintraege (
  id           uuid primary key default gen_random_uuid(),
  erstellt_von uuid references personen(id) on delete set null,
  titel        text not null,
  beschreibung text,
  termin_datum date not null,
  termin_zeit  time,
  ganztaegig   boolean not null default false,
  erstellt_am  timestamptz not null default now(),
  geaendert_am timestamptz not null default now()
);

-- Fotos
create table fotos (
  id                  uuid primary key default gen_random_uuid(),
  hochgeladen_von     uuid references personen(id) on delete set null,
  storage_key         text not null,
  beschriftung        text,
  status              foto_status not null default 'ausstehend',
  genehmigt_von       uuid references personen(id) on delete set null,
  genehmigt_am        timestamptz,
  anzeige_reihenfolge int,
  erstellt_am         timestamptz not null default now()
);

-- Playlists
create table playlists (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  beschreibung text,
  erstellt_von uuid references personen(id) on delete set null,
  aktiv        boolean not null default true,
  erstellt_am  timestamptz not null default now()
);

-- Playlist-Titel
create table playlist_titel (
  id               uuid primary key default gen_random_uuid(),
  playlist_id      uuid not null references playlists(id) on delete cascade,
  titel            text not null,
  kuenstler        text,
  storage_key      text not null,
  dauer_sekunden   int,
  reihenfolge      int not null default 0,
  erstellt_am      timestamptz not null default now()
);

-- Besuche
create table besuche (
  id             uuid primary key default gen_random_uuid(),
  besucher_id    uuid references personen(id) on delete set null,
  besuchs_datum  date not null,
  besuchs_zeit   time,
  nachricht      text,
  status         besuch_status not null default 'angekuendigt',
  erstellt_am    timestamptz not null default now(),
  geaendert_am   timestamptz not null default now()
);

-- Nachrichten
create table nachrichten (
  id             uuid primary key default gen_random_uuid(),
  von_person_id  uuid references personen(id) on delete set null,
  text           text not null,
  gelesen_am     timestamptz,
  erstellt_am    timestamptz not null default now()
);

-- Wohlbefinden-Signale ("Mir geht es gut")
create table wohlbefinden_signale (
  id          uuid primary key default gen_random_uuid(),
  gesendet_am timestamptz not null default now()
);

-- Tablet-Heartbeat (Admin-Monitoring)
create table geraet_heartbeat (
  id                uuid primary key default gen_random_uuid(),
  zuletzt_gesehen   timestamptz not null default now(),
  batterie_prozent  int,
  netzwerk_ssid     text,
  app_version       text
);

-- Trigger: geaendert_am automatisch aktualisieren
create or replace function aktualisiere_geaendert_am()
returns trigger language plpgsql as $$
begin
  new.geaendert_am = now();
  return new;
end;
$$;

create trigger personen_geaendert_am
  before update on personen
  for each row execute function aktualisiere_geaendert_am();

create trigger kalender_geaendert_am
  before update on kalender_eintraege
  for each row execute function aktualisiere_geaendert_am();

create trigger besuche_geaendert_am
  before update on besuche
  for each row execute function aktualisiere_geaendert_am();

-- Indexes für häufige Abfragen
create index on kalender_eintraege(termin_datum);
create index on fotos(status);
create index on besuche(besuchs_datum);
create index on wohlbefinden_signale(gesendet_am desc);
