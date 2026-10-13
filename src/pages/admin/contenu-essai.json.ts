// Contenu de départ du back-office en mode d'essai (paroisse.json > cms.essai) : les fichiers gérés par le back-office,
// que public/admin/demarrage.js recopie dans le navigateur du visiteur avant d'ouvrir Sveltia CMS.
// Hors mode d'essai : liste vide.
import type { APIRoute } from 'astro';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { paroisse } from '../../lib/config';
import { DOSSIER_SITE } from '../../choix-site.mjs';

const lister = (dossier: string): string[] =>
  readdirSync(join(process.cwd(), dossier)).flatMap((nom) => {
    const chemin = `${dossier}/${nom}`;
    return statSync(join(process.cwd(), chemin)).isDirectory() ? lister(chemin) : [chemin];
  });

export const GET: APIRoute = () => {
  const essai = (paroisse.cms as { essai?: boolean }).essai === true;
  const chemins = essai
    ? [...['pages', 'articles', 'lieux'].flatMap((d) => lister(`${DOSSIER_SITE}/${d}`)), `${DOSSIER_SITE}/secteurs.json`]
      .filter((c) => /\.(md|json)$/.test(c))
    : [];
  const fichiers = chemins.map((chemin) => ({ chemin, contenu: readFileSync(join(process.cwd(), chemin), 'utf-8') }));
  // la version change avec le contenu : le navigateur du visiteur repart alors du contenu à jour
  const version = String(fichiers.reduce((h, f) => (h * 31 + f.contenu.length + f.chemin.length) % 1e9, 7));
  return new Response(JSON.stringify({ version, fichiers }), { headers: { 'Content-Type': 'application/json' } });
};
