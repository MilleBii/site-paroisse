// Lecture des calendriers : un calendrier ICS par lieu, comme Enoria en publie un par église ou salle.
// À défaut d'adresse Enoria, le calendrier d'un lieu est lu dans sites/<nom>/public/ics/<slug>.ics ; pour brancher Enoria,
// renseigner l'adresse du calendrier du lieu dans paroisse.json > calendriers_enoria { slug: url }.
import ical from 'node-ical';
import { join } from 'node:path';
import { lieux, secteurs, paroisse, PUBLIC_SITE } from './config';

export type Lieu = (typeof lieux)[number];
export type Celebration = {
  debut: Date;
  journee: boolean; // heure non précisée
  titre: string;
  description: string;
  lieu: Lieu;
};

// Seules ces catégories sont publiées : un calendrier d'église peut contenir des réservations privées.
const PUBLIQUES = new Set(['CELEBRATION', 'PUBLIC']);
const TZ = 'Europe/Paris';

let cache: Celebration[] | null = null;

async function lireCalendrier(lieu: Lieu) {
  const url = (paroisse.calendriers_enoria as Record<string, string>)[lieu.slug];
  if (url) return ical.async.fromURL(url);
  return ical.sync.parseFile(join(process.cwd(), PUBLIC_SITE, 'ics', `${lieu.slug}.ics`));
}

export async function toutesLesCelebrations(): Promise<Celebration[]> {
  if (cache) return cache;
  const out: Celebration[] = [];
  for (const lieu of lieux) {
    const cal = await lireCalendrier(lieu);
    for (const e of Object.values(cal)) {
      if (!e || e.type !== 'VEVENT') continue;
      const cats = ([] as string[]).concat((e as any).categories ?? []).map((c) => c.toUpperCase());
      if (cats.length && !cats.some((c) => PUBLIQUES.has(c))) continue;
      out.push({
        debut: new Date(e.start),
        journee: (e as any).datetype === 'date',
        titre: String(e.summary ?? 'Célébration'),
        description: String(e.description ?? ''),
        lieu,
      });
    }
  }
  out.sort((a, b) => a.debut.getTime() - b.debut.getTime());
  return (cache = out);
}

export async function prochaines(opts: { jours?: number; lieu?: string; max?: number } = {}) {
  const now = new Date();
  const debutJour = new Date(now.toDateString());
  const fin = opts.jours ? new Date(debutJour.getTime() + opts.jours * 864e5) : null;
  const res = (await toutesLesCelebrations()).filter(
    (c) =>
      (c.journee ? c.debut >= debutJour : c.debut >= now) &&
      (!fin || c.debut < fin) &&
      (!opts.lieu || c.lieu.slug === opts.lieu),
  );
  return opts.max ? res.slice(0, opts.max) : res;
}

export function parJour(cs: Celebration[]) {
  const m = new Map<string, Celebration[]>();
  for (const c of cs) {
    const k = c.debut.toLocaleDateString('fr-CA', { timeZone: TZ });
    m.set(k, [...(m.get(k) ?? []), c]);
  }
  return [...m.entries()];
}

export const fmtJour = (iso: string) =>
  new Date(iso + 'T12:00:00')
    .toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: TZ })
    .replace(/ 1 /, ' 1er ');
export const fmtHeure = (c: Celebration) =>
  c.journee ? 'heure à préciser' : c.debut.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: TZ }).replace(':', 'h').replace(/^0/, '');

// Célébrations présentes dans les calendriers mais trop fréquentes pour les listes générales (paroisse.json > agenda)
const MASQUEES = new Set<string>(paroisse.agenda?.masquer_des_listes ?? []);
export const pourListes = (cs: Celebration[]) => cs.filter((c) => !MASQUEES.has(c.description));

export const secteur = (slug: string) => secteurs.find((s) => s.slug === slug);
// Nom affiché dans les listes : nom_court du lieu s'il en a un (lieux.json), sinon la commune
export const nomCourt = (l: Lieu) => (l as { nom_court?: string }).nom_court || l.commune || l.nom;
export { lieux, secteurs, paroisse };
