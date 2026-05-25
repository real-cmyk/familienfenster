// Modul-Level Audio-Manager: ein einziger aktiver Stream zur Zeit.
// Kann aus dem Layout heraus gestoppt werden ohne React-Props durchreichen.

let aktivesAudio: HTMLAudioElement | null = null;

export function registriereAudio(audio: HTMLAudioElement) {
  // Vorherigen Stream sicherheitshalber stoppen bevor neuer registriert wird
  if (aktivesAudio && aktivesAudio !== audio) {
    aktivesAudio.pause();
    aktivesAudio.src = "";
  }
  aktivesAudio = audio;
}

export function stoppeAllesAudio() {
  if (aktivesAudio) {
    aktivesAudio.pause();
    aktivesAudio.src = "";
    try { aktivesAudio.load(); } catch { /* ignorieren */ }
    aktivesAudio = null;
  }
}
