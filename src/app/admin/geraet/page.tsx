import { createAdminClient } from "@/lib/supabase/admin";

async function ladeHeartbeat() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("geraet_heartbeat")
    .select("*")
    .order("zuletzt_gesehen", { ascending: false })
    .limit(1)
    .single();
  return data;
}

export default async function TabletStatusSeite() {
  const heartbeat = await ladeHeartbeat();

  const zuletzt = heartbeat?.zuletzt_gesehen
    ? new Date(heartbeat.zuletzt_gesehen)
    : null;
  const minutenVor = zuletzt
    ? Math.floor((Date.now() - zuletzt.getTime()) / 60000)
    : null;

  const online = minutenVor !== null && minutenVor < 5;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6" style={{ color: "var(--farbe-warm-text)" }}>
        Tablet-Status
      </h1>

      <div
        className="rounded-3xl p-6 mb-6"
        style={{
          background: online ? "var(--farbe-gruen-hell)" : "var(--farbe-warm-bg2)",
          border: `2px solid ${online ? "var(--farbe-gruen)" : "var(--farbe-warm-akzent-hell)"}`,
        }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div
            className="rounded-full"
            style={{
              width: "16px", height: "16px",
              background: online ? "var(--farbe-gruen)" : "#aaa",
            }}
          />
          <p className="text-xl font-bold" style={{ color: "var(--farbe-warm-text)" }}>
            {online ? "Tablet ist online" : "Tablet ist offline oder nicht erreichbar"}
          </p>
        </div>

        {heartbeat ? (
          <div className="flex flex-col gap-2" style={{ color: "var(--farbe-warm-text-weich)" }}>
            <p>Zuletzt gesehen: {zuletzt?.toLocaleString("de-DE") ?? "—"}</p>
            {minutenVor !== null && <p>({minutenVor === 0 ? "Gerade eben" : `vor ${minutenVor} Minuten`})</p>}
            {heartbeat.batterie_prozent !== null && (
              <p>Akku: {heartbeat.batterie_prozent} %</p>
            )}
            {heartbeat.netzwerk_ssid && (
              <p>WLAN: {heartbeat.netzwerk_ssid}</p>
            )}
            {heartbeat.app_version && (
              <p>App-Version: {heartbeat.app_version}</p>
            )}
          </div>
        ) : (
          <p style={{ color: "var(--farbe-warm-text-weich)" }}>
            Noch kein Heartbeat empfangen. Die Tablet-Ansicht sendet automatisch alle 60 Sekunden ein Signal.
          </p>
        )}
      </div>

      <div
        className="rounded-2xl p-5"
        style={{ background: "var(--farbe-hell-karte)", border: "1px solid var(--farbe-warm-akzent-hell)" }}
      >
        <h2 className="text-lg font-semibold mb-2" style={{ color: "var(--farbe-warm-text)" }}>
          Kiosk-Modus einrichten
        </h2>
        <div className="flex flex-col gap-2 text-base" style={{ color: "var(--farbe-warm-text-weich)" }}>
          <p><strong>iPad:</strong> Einstellungen → Bedienungshilfen → Geführter Zugriff → App auswählen → PIN festlegen</p>
          <p><strong>Android:</strong> Einstellungen → Sicherheit → App-Fixierung → Familienfenster fixieren</p>
        </div>
      </div>
    </div>
  );
}
