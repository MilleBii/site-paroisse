// Ce qui est propre à une paroisse vit dans sites/<nom>/ (alias @site, voir src/choix-site.mjs), ce qui est propre
// à un diocèse dans dioceses/<diocese>/. Le reste du code (src/, public/) est commun à tous les sites et ne doit
// nommer ni l'une ni l'autre.
import paroisse from '@site/paroisse.json';
import donneesSecteurs from '@site/secteurs.json';
import { DOSSIER_SITE } from '../choix-site.mjs';

type Diocese = { nom: string; lien_bandeau: string; site: string; abus?: string; lectures?: string; police_prechargee?: string };

const dioceses = import.meta.glob<Diocese>('../../dioceses/*/diocese.json', { eager: true, import: 'default' });
const themes = import.meta.glob<string>('../../dioceses/*/theme.css', { eager: true, query: '?raw', import: 'default' });

export const diocese = dioceses[`../../dioceses/${paroisse.diocese}/diocese.json`];
if (!diocese) throw new Error(`Diocèse « ${paroisse.diocese} » introuvable : créer dioceses/${paroisse.diocese}/diocese.json`);
export const themeDiocese = themes[`../../dioceses/${paroisse.diocese}/theme.css`] ?? '';

// Dossier des fichiers publics de la paroisse (photos, carte), servis à la racine du site
export const PUBLIC_SITE = `${DOSSIER_SITE}/public`;

// Secteurs (secteurs.json, rubrique « Réglages » du back-office), dans l'ordre d'affichage
export type Secteur = { slug: string; nom: string; couleur: string };
export const secteurs: Secteur[] = Array.isArray(donneesSecteurs) ? donneesSecteurs : (donneesSecteurs as { secteurs: Secteur[] }).secteurs;

// Lieux de culte : un fichier par lieu (lieux/<slug>.md), modifiable dans le back-office ;
// l'en-tête porte les informations du lieu et l'adresse de son flux Enoria, le texte est son histoire.
export type Lieu = {
  slug: string; nom: string; nom_court?: string; type: string; commune: string; secteur: string; lat: number; lon: number;
  ical?: string; photo?: string; photo_petite?: string; photo_l?: number; photo_h?: number; credit?: string; commons?: string;
  histoire: string;  // HTML, vide si pas encore rédigée
};
const fichiersLieux = import.meta.glob<{ frontmatter: Omit<Lieu, 'slug' | 'histoire'>; compiledContent: () => string | Promise<string> }>(
  '@site/lieux/*.md', { eager: true });
export const lieux: Lieu[] = (await Promise.all(Object.entries(fichiersLieux).map(async ([fichier, m]) => ({
  ...m.frontmatter, slug: fichier.split('/').pop()!.replace(/\.md$/, ''), histoire: String(await m.compiledContent()).trim(),
})))).sort((a, b) => a.nom.localeCompare(b.nom));

export { paroisse };
