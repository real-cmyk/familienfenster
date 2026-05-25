// Modul-Level Audio-Manager: ein einziger aktiver Stream zur Zeit.
// Kann aus dem Layout heraus gestoppt werden ohne React-Props durchreichen.

let aktivesAudio: HTMLAudioElement | null = null;

export function registriereAudio(audio: HTMLAudioElement) {
  aktivesAudio = audio;
}

export function meldeAudioAb() {
  aktivesAudio = null;
}

export function stoppeAllesAudio() {
  if (aktivesAudio) {
    aktivesAudio.pause();
    aktivesAudio.src = "";
    aktivesAudio = null;
  }
}
