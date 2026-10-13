// Arborescence du site, gérée par la paroisse dans le back-office : un dossier par page (sites/<nom>/pages/<chemin>/index.md).
// La place du dossier donne la page parente ; l'en-tête du fichier donne titre, résumé, ordre, statut et blocs.
// Le fichier racine (sites/<nom>/pages/index.md) ne sert qu'à porter l'arbre dans le back-office.

export type Bloc = { type: string; titre?: string | null; contenu?: string | null; url?: string | null; nombre?: number | null };
export type Page = {
  titre: string; slug: string; resume: string; dans_menu: boolean; ordre: number;
  blocs: Bloc[]; chemin: string; enfants: Page[]; ancetres: Page[];
};

const fichiers = import.meta.glob<{ frontmatter: any }>('@site/pages/**/index.md', { eager: true });
const parChemin = new Map<string, Page>();
for (const [fichier, { frontmatter: f }] of Object.entries(fichiers)) {
  const dossier = fichier.replace(/^.*\/pages\//, '/').replace(/index\.md$/, '');  // ex. /etapes-de-vie/mariage/
  if (dossier === '/' || (f.statut ?? 'publie') !== 'publie') continue;
  parChemin.set(dossier, {
    titre: f.titre, slug: dossier.split('/').at(-2)!, resume: f.resume ?? '', dans_menu: f.dans_menu ?? true, ordre: f.ordre ?? 0,
    blocs: f.blocs ?? [], chemin: dossier, enfants: [], ancetres: [],
  });
}

const parentDe = (p: Page) => parChemin.get(p.chemin.replace(/[^/]+\/$/, ''));
const tri = (a: Page, b: Page) => a.ordre - b.ordre || a.titre.localeCompare(b.titre);
for (const p of parChemin.values()) parentDe(p)?.enfants.push(p);
for (const p of parChemin.values()) {
  p.enfants.sort(tri);
  for (let a = parentDe(p); a; a = parentDe(a)) p.ancetres.unshift(a);
}

export const pages = [...parChemin.values()];
export const racines = pages.filter((p) => !parentDe(p)).sort(tri);
export const menu = racines.filter((p) => p.dans_menu);
export const pageParSlug = (slug: string) => pages.find((p) => p.slug === slug);
// Page qui porte un bloc donné (ex. « horaires », « clochers ») : sert aux liens du cadre, quelle que soit l'arborescence
export const pageAvecBloc = (type: string) => pages.find((p) => p.blocs.some((b) => b.type === type));
