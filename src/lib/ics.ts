// Écriture d'un calendrier iCalendar (RFC 5545) à partir des célébrations publiées.
import type { Celebration } from './agenda';

const echap = (t: string) => t.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
const utc = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
const date = (d: Date) => d.toLocaleDateString('fr-CA', { timeZone: 'Europe/Paris' }).replace(/-/g, '');
// Lignes de 75 octets au plus, suite précédée d'une espace
const plier = (ligne: string) => {
  const morceaux: string[] = [];
  let reste = ligne;
  while (new TextEncoder().encode(reste).length > 75) {
    let n = 75;
    while (new TextEncoder().encode(reste.slice(0, n)).length > 75) n--;
    morceaux.push(reste.slice(0, n));
    reste = ' ' + reste.slice(n);
  }
  return [...morceaux, reste].join('\r\n');
};

export function calendrier(nom: string, celebrations: Celebration[]) {
  const maintenant = utc(new Date());
  const L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Site paroissial//FR', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    `X-WR-CALNAME:${echap(nom)}`, 'X-WR-TIMEZONE:Europe/Paris', 'REFRESH-INTERVAL;VALUE=DURATION:PT6H'];
  for (const c of celebrations) {
    L.push('BEGIN:VEVENT', `UID:${echap(c.uid)}`, `DTSTAMP:${maintenant}`);
    if (c.journee) L.push(`DTSTART;VALUE=DATE:${date(c.debut)}`);
    else L.push(`DTSTART:${utc(c.debut)}`, `DTEND:${utc(c.fin ?? new Date(c.debut.getTime() + 36e5))}`);
    L.push(`SUMMARY:${echap(c.titre)}`, `LOCATION:${echap(c.lieu.nom)}`);
    if (c.description) L.push(`DESCRIPTION:${echap(c.description)}`);
    L.push('END:VEVENT');
  }
  L.push('END:VCALENDAR');
  return L.map(plier).join('\r\n') + '\r\n';
}
