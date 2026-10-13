// Ce qui est propre à une paroisse vit dans sites/<nom>/ (alias @site, voir src/choix-site.mjs), ce qui est propre
// à un diocèse dans dioceses/<diocese>/. Le reste du code (src/, public/) est commun à tous les sites et ne doit
// nommer ni l'une ni l'autre.
import paroisse from '@site/paroisse.json';
import lieux from '@site/lieux.json';
import secteurs from '@site/secteurs.json';
import { DOSSIER_SITE } from '../choix-site.mjs';

type Diocese = { nom: string; lien_bandeau: string; site: string; abus?: string; lectures?: string; police_prechargee?: string };

const dioceses = import.meta.glob<Diocese>('../../dioceses/*/diocese.json', { eager: true, import: 'default' });
const themes = import.meta.glob<string>('../../dioceses/*/theme.css', { eager: true, query: '?raw', import: 'default' });

export const diocese = dioceses[`../../dioceses/${paroisse.diocese}/diocese.json`];
if (!diocese) throw new Error(`Diocèse « ${paroisse.diocese} » introuvable : créer dioceses/${paroisse.diocese}/diocese.json`);
export const themeDiocese = themes[`../../dioceses/${paroisse.diocese}/theme.css`] ?? '';

// Dossier des fichiers publics de la paroisse (photos, calendriers, carte), servis à la racine du site
export const PUBLIC_SITE = `${DOSSIER_SITE}/public`;

export { paroisse, lieux, secteurs };
