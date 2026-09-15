export const EVENT = {
  babyName: "Fausto",
  title: "Baby Shower",
  weekday: "Domingo",
  dateLabel: "15.11.26",
  timeLabel: "16:00 a 19:00",
  timeRange: "16:00 A 19:00",
  startIso: "2026-11-15T16:00:00-03:00",
  endIso: "2026-11-15T19:00:00-03:00",
  rsvpDeadlineLabel: "01/11",
  rsvpDeadlineIso: "2026-11-01T23:59:59-03:00",
  venue: "Salón Regina",
  addressLine1: "Av. Ángel T. de Alvear",
  addressLine2: "840",
  addressFull: "Av. Ángel T. de Alvear 840 (Salón Regina)",
  mapsQuery: "Av. Ángel T. de Alvear 840, Buenos Aires, Argentina",
} as const;

/** Buenos Aires mobile 11 3024-9702 in WhatsApp international format. */
export const WHATSAPP_NUMBER = "5491130249702";

export const MAPS_LINK = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(EVENT.mapsQuery)}`;

export const MAPS_EMBED = `https://maps.google.com/maps?q=${encodeURIComponent(EVENT.mapsQuery)}&hl=es&z=16&output=embed`;

export const GOOGLE_CALENDAR_LINK =
  "https://calendar.google.com/calendar/render?action=TEMPLATE" +
  `&text=${encodeURIComponent("Baby Shower Fausto")}` +
  "&dates=20261115T160000/20261115T190000" +
  "&ctz=America/Argentina/Buenos_Aires" +
  `&location=${encodeURIComponent(EVENT.addressFull)}` +
  `&details=${encodeURIComponent("Baby Shower de Fausto · Salón Regina")}`;

export function buildIcs(): string {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Baby Shower Fausto//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    "UID:fausto-baby-shower-20261115@invitation",
    "DTSTAMP:20260915T120000Z",
    "DTSTART;TZID=America/Argentina/Buenos_Aires:20261115T160000",
    "DTEND;TZID=America/Argentina/Buenos_Aires:20261115T190000",
    `SUMMARY:Baby Shower Fausto`,
    `LOCATION:${EVENT.addressFull}`,
    "DESCRIPTION:Baby Shower de Fausto · Salón Regina",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

const CLIENT_KEY = "fausto-rsvp-client";

export function getOrCreateClientId(): string {
  if (typeof window === "undefined") return "";
  const existing = window.localStorage.getItem(CLIENT_KEY);
  if (existing && existing.length >= 8) return existing;
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `guest-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  window.localStorage.setItem(CLIENT_KEY, id);
  return id;
}

export function downloadIcs() {
  const blob = new Blob([buildIcs()], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "baby-shower-fausto.ics";
  a.click();
  URL.revokeObjectURL(url);
}

export function whatsappRsvpMessage(
  name: string,
  attending: boolean,
  partySize: number,
): string {
  if (attending) {
    const group =
      partySize > 1 ? ` Somos ${partySize} personas.` : "";
    return `Hola! Soy ${name} y confirmo asistencia al Baby Shower de Fausto el 15/11.${group}`;
  }
  return `Hola! Soy ${name} y no confirmo asistencia al Baby Shower de Fausto el 15/11.`;
}

export function whatsappRsvpLink(
  name: string,
  attending: boolean,
  partySize: number,
): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    whatsappRsvpMessage(name, attending, partySize),
  )}`;
}
