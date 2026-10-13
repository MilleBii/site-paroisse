// Lecture des calendriers : un calendrier ICS par lieu, comme Enoria en publie un par église ou salle.
// Adresse du flux Enoria du lieu dans sa fiche (lieux/<slug>.md, champ « ical ») ; à défaut, le fichier
// sites/<nom>/calendriers/<slug>.ics (données d'exemple). Ces sources ne sont jamais publiées telles quelles :
// le site sert à /ics/ des calendriers filtrés, produits à la construction (src/pages/ics/).
import ical from 'node-ical';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { lieux, secteurs, paroisse, type Lieu } from './config';
import { DOSSIER_SITE } from '../choix-site.mjs';

export type { Lieu };
export type Celebration = {
  uid: string;
  debut: Date;
  fin: Date | null;
  journee: boolean; // heure non précisée
  titre: string;
  description: string;
  lieu: Lieu;
};

// Seules ces catégories sont publiées : un calendrier d'église peut contenir des réservations privées.
// Un événement sans catégorie est publié (c'est le cas des flux de lieux d'Enoria).
// Un événement sans catégorie est publié (c'est le cas des flux de lieux d'Enoria).
const PUBLIQUES = new Set(['CELEBRATION', 'PUBLIC']);
const TZ = 'Europe/Paris';

let cache: Celebration[] | null = null;

async function lireCalendrier(lieu: Lieu) {
  if (lieu.ical) return ical.async.fromURL(lieu.ical);
  const fichier = join(process.cwd(), DOSSIER_SITE, 'calendriers', `${lieu.slug}.ics`);
  return existsSync(fichier) ? ical.sync.parseFile(fichier) : {};
}

export async function toutesLesCelebrations(): Promise<Celebration[]> {
  if (cache) return cache;
  const out: Celebration[] = [];
  // un flux par église : lus tous en même temps
  const calendriers = await Promise.all(lieux.map(lireCalendrier));
  for (const [i, lieu] of lieux.entries()) {
    const cal = calendriers[i];
    for (const e of Object.values(cal)) {
      if (!e || e.type !== 'VEVENT') continue;
      const cats = ([] as string[]).concat((e as any).categories ?? []).map((c) => c.toUpperCase());
      if (cats.length && !cats.some((c) => PUBLIQUES.has(c))) continue;
      out.push({
        uid: String(e.uid ?? `${lieu.slug}-${new Date(e.start).getTime()}`),
        debut: new Date(e.start),
        fin: e.end ? new Date(e.end) : null,
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

// Messes de semaine trop fréquentes pour les listes générales (ex. un sanctuaire où la messe est quotidienne) :
// paroisse.json > agenda > semaine_hors_listes [slugs]. Elles restent sur la page du lieu, dans son calendrier et
// dans « Prochaine célébration ». Le samedi à partir de 17h (messe anticipée du dimanche) reste dans les listes.
const HORS_LISTES = new Set<string>((paroisse.agenda as { semaine_hors_listes?: string[] } | undefined)?.semaine_hors_listes ?? []);
const enSemaine = (c: Celebration) => {
  const jour = c.debut.toLocaleDateString('en-US', { weekday: 'short', timeZone: TZ });
  const heure = Number(c.debut.toLocaleTimeString('fr-FR', { hour: '2-digit', hour12: false, timeZone: TZ }).slice(0, 2));
  return jour !== 'Sun' && !(jour === 'Sat' && heure >= 17);
};
export const pourListes = (cs: Celebration[]) => cs.filter((c) => !(HORS_LISTES.has(c.lieu.slug) && enSemaine(c)));

export const secteur = (slug: string) => secteurs.find((s) => s.slug === slug);
// Nom affiché dans les listes : nom_court du lieu s'il en a un, sinon la commune
export const nomCourt = (l: Lieu) => l.nom_court || l.commune || l.nom;

// Nombre de célébrations à venir par lieu (les lieux qui en ont sont mis en avant dans les listes)
export async function aVenirParLieu() {
  const n = new Map<string, number>();
  for (const c of await prochaines()) n.set(c.lieu.slug, (n.get(c.lieu.slug) ?? 0) + 1);
  return n;
}
export { lieux, secteurs, paroisse };
