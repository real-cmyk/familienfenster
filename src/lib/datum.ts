const WOCHENTAGE = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
const MONATE = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];

export function formatiereDatum(datum: Date): string {
  return `${WOCHENTAGE[datum.getDay()]}, ${datum.getDate()}. ${MONATE[datum.getMonth()]} ${datum.getFullYear()}`;
}

export function formatiereUhrzeit(datum: Date): string {
  return datum.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
}

export function tageszeitGruss(): string {
  const stunde = new Date().getHours();
  if (stunde < 11) return "Guten Morgen";
  if (stunde < 17) return "Guten Tag";
  return "Guten Abend";
}

export function formatiereDatumKurz(datum: Date): string {
  const heute = new Date();
  const morgen = new Date(heute);
  morgen.setDate(heute.getDate() + 1);

  if (datum.toDateString() === heute.toDateString()) return "Heute";
  if (datum.toDateString() === morgen.toDateString()) return "Morgen";
  return `${WOCHENTAGE[datum.getDay()]}, ${datum.getDate()}. ${MONATE[datum.getMonth()]}`;
}

export function formatiereZeit(zeitStr: string): string {
  // "HH:MM:SS" → "HH:MM Uhr"
  return zeitStr.slice(0, 5) + " Uhr";
}
