// Calendriers à s'abonner, produits à la construction à partir des calendriers sources (Enoria ou fichiers d'exemple) :
// - /ics/<slug du lieu>.ics : toutes les célébrations publiées du lieu ;
// - /ics/paroisse.ics et /ics/secteurs-<masque>.ics (bit i = i-ème secteur de secteurs.json) : celles des listes
//   générales, sans les messes de semaine mises à part (agenda > semaine_hors_listes).
// Les adresses Enoria (qui contiennent une clé) ne sont ainsi jamais publiées. Il faut reconstruire le site
// régulièrement (une fois par jour, par exemple) pour suivre les changements faits dans Enoria.
import type { APIRoute } from 'astro';
import { lieux, secteurs, paroisse, toutesLesCelebrations, pourListes } from '../../lib/agenda';
import { calendrier } from '../../lib/ics';

const DEPUIS = 30 * 864e5;  // garder un mois d'historique

export function getStaticPaths() {
  const masques = Array.from({ length: 2 ** secteurs.length - 1 }, (_, i) => i + 1);
  return [
    ...lieux.map((l) => ({ params: { nom: l.slug }, props: { lieu: l.slug } })),
    { params: { nom: 'paroisse' }, props: { masque: 2 ** secteurs.length - 1 } },
    ...masques.map((m) => ({ params: { nom: `secteurs-${m}` }, props: { masque: m } })),
  ];
}

export const GET: APIRoute = async ({ props }) => {
  const depuis = Date.now() - DEPUIS;
  const toutes = (await toutesLesCelebrations()).filter((c) => c.debut.getTime() >= depuis);
  let nom: string;
  let choisies;
  if (props.lieu) {
    choisies = toutes.filter((c) => c.lieu.slug === props.lieu);
    nom = choisies[0]?.lieu.nom ?? lieux.find((l) => l.slug === props.lieu)!.nom;
  } else {
    const retenus = secteurs.filter((_, i) => (props.masque >> i) & 1);
    const slugs = new Set(retenus.map((s) => s.slug));
    choisies = pourListes(toutes).filter((c) => slugs.has(c.lieu.secteur));
    nom = `Messes – ${retenus.length === secteurs.length ? paroisse.nom_court : retenus.map((s) => s.nom).join(', ')}`;
  }
  return new Response(calendrier(nom, choisies), { headers: { 'Content-Type': 'text/calendar; charset=utf-8' } });
};
