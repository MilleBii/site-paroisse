// Quel site construire ? Chaque site est un dossier de sites/ (sites/demo est le site de démonstration).
// - variable d'environnement SITE_PAROISSE=<nom> si elle est donnée ;
// - sinon le premier dossier de sites/ autre que demo (le dépôt d'une paroisse ajoute le sien à côté de la démo) ;
// - sinon la démo.
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

// Depuis la racine du projet (d'où se lancent npm run dev et build) : ce module est aussi recopié dans dist/ à la construction
const SITES = join(process.cwd(), 'sites');
const disponibles = existsSync(SITES)
  ? readdirSync(SITES, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort()
  : [];
const nom = process.env.SITE_PAROISSE || disponibles.find((n) => n !== 'demo') || 'demo';
if (!disponibles.includes(nom)) throw new Error(`Site « ${nom} » introuvable dans sites/ (disponibles : ${disponibles.join(', ')})`);

export const NOM_SITE = nom;
export const DOSSIER_SITE = `sites/${nom}`;  // relatif à la racine du projet
export const CHEMIN_SITE = join(SITES, nom);
