# Site paroissial — consignes communes

Modèle de site pour une paroisse catholique : site statique Astro, back-office Sveltia CMS en français, horaires lus
dans les calendriers Enoria. Ce fichier est public ; les notes propres à une personne ou à une paroisse vont dans
`CLAUDE.md` à la racine (ignoré par Git).

## Trois couches, à ne pas mélanger

- **Commun** (`src/`, `public/`, `astro.config.mjs`) : le moteur. Il ne nomme aucune paroisse ni aucun diocèse,
  aucun chemin de page du contenu (`/horaires/`…), aucune couleur en dur : tout passe par `src/lib/config.ts`,
  les variables CSS (`--principale`, `--accent`, `--fond-doux`…) et `pageAvecBloc()` pour trouver une page.
- **Diocèse** (`dioceses/<code>/`) : `diocese.json` (nom, liens diocésains) et `theme.css` (couleurs, police),
  partagés par toutes les paroisses du diocèse.
- **Paroisse** (`sites/<nom>/`) : `paroisse.json` (identité, textes de l'accueil, liens Enoria, dépôt du
  back-office), `lieux.json`, `secteurs.json`, `pages/`, `articles/`, `public/` (photos, calendriers, carte, servis
  à la racine), `outils/` (scripts propres à la paroisse). Le code y accède par l'alias `@site` ;
  `src/choix-site.mjs` choisit le site (variable `SITE_PAROISSE`, sinon le premier dossier autre que `demo`).
- `sites/demo/` est le site de démonstration publié avec le modèle : noms de personnes, téléphones et e-mails
  fictifs (« P. Jean EXEMPLE », 03 00 00 00 00, accueil@paroisse-exemple.fr), ni document interne ni photo de personnes. Le site réel d'une paroisse vit dans son propre dépôt (privé), à côté de la démo.

Avant d'ajouter une donnée en dur dans le commun, se demander si une autre paroisse l'écrirait autrement : si oui,
elle va dans `paroisse.json` ou `dioceses/<code>/`.

## Repères

- Contenu : `sites/<nom>/pages/<chemin>/index.md` (un dossier par page, le parent = le dossier parent),
  `sites/<nom>/articles/*.md`.
- Back-office : `public/admin/` (aperçu identique au site `apercu.js`, photo recadrée `image-cadree.js`, découpe
  à la construction par `src/lib/images.ts`). Sa configuration commune est `src/admin/config-cms.yml` ;
  `/admin/config.yml` y ajoute le dépôt de la paroisse et le dossier du site. Garder la compatibilité Decap CMS.
- Enoria : un calendrier ICS par lieu (`paroisse.json > calendriers_enoria`, sinon `sites/<nom>/calendriers/`),
  sans catégorie dans les flux de lieux ; si des catégories sont présentes, seules `CELEBRATION` et `PUBLIC` sont
  publiées. Les adresses Enoria ne sont jamais publiées : `/ics/` est produit à la construction (`src/pages/ics/`). Formulaires intégrés en iFrame par l'adresse longue public.enoria.app,
  copiée déconnecté, jamais avec `fl=`.
- Code, commentaires et interface en français.
- Sur le site, uniquement des contacts institutionnels, jamais le portable d'un bénévole.

## Vérifier

`npm run build` (toutes les pages doivent se construire, pour la démo comme pour le site réel), puis `npx astro dev --host --port 4323` (sous PowerShell, `npm run dev -- …` perd ses options) :
http://localhost:4323 et http://localhost:4323/admin/ (Chrome ou Edge, « Travailler avec un dépôt local »).
