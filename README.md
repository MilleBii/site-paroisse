# Site paroissial

Un modèle pour créer rapidement le site d'une paroisse catholique : rapide sur mobile, sans serveur à maintenir,
et modifiable par des bénévoles dans un back-office en français.

- Site statique ([Astro](https://astro.build)) : une page par église ou chapelle, la carte de la paroisse,
  les horaires par secteur avec abonnement à l'agenda, les actualités.
- Horaires lus dans les calendriers [Enoria](https://www.enoria.app) (un calendrier ICS par lieu) ;
  formulaires Enoria intégrés aux pages.
- Back-office [Sveltia CMS](https://github.com/sveltia/sveltia-cms) (compatible Decap CMS) : pages, articles,
  photos recadrées, avec un aperçu identique au site.

```bash
npm install
npm run dev       # http://localhost:4321 : le site de démonstration
npm run build && npm run preview
```

Le site de démonstration (`sites/demo/`) reprend la paroisse Notre-Dame du Chêne des Premiers Plateaux
(diocèse de Besançon) : les noms des personnes, les téléphones et les adresses e-mail y sont fictifs, le bulletin
et les photos de la paroisse retirés. Ses horaires sont simulés.

## Ce qui est commun, ce qui est propre à chacun

| Dossier | Contenu | À modifier pour une nouvelle paroisse ? |
| --- | --- | --- |
| `src/`, `public/`, `astro.config.mjs` | Le moteur : mise en page, composants, back-office | Non |
| `dioceses/<code>/` | `diocese.json` (nom, liens diocésains) et `theme.css` (couleurs, police) | Seulement si votre diocèse n'y est pas |
| `sites/<nom>/` | Tout ce qui est propre à une paroisse | Oui : c'est votre dossier |

Un dossier de site contient :

- `paroisse.json` : nom, adresse, diocèse (`"diocese": "besancon"` → `dioceses/besancon/`), textes de l'accueil,
  liens Enoria (don, lettre, espace bénévoles), calendriers Enoria par lieu, dépôt GitHub du back-office ;
- `lieux.json` : les églises et chapelles (nom, commune, secteur, coordonnées, photo et crédit) ;
- `secteurs.json` : les secteurs, avec leur couleur sur la carte ;
- `pages/<chemin>/index.md` : une page par dossier, le dossier parent est la page parente ;
- `articles/*.md` : les actualités ;
- `public/` : logo (`img/logo.webp`, `img/embleme.webp`, `img/embleme.png`), photos, calendriers (`ics/`),
  contour de la paroisse et des communes (`carte.json`). Ces fichiers sont servis à la racine du site ;
- `outils/` (facultatif) : scripts propres à la paroisse.

## Quel site est construit ?

Le premier dossier de `sites/` autre que `demo`, sinon la démo. Pour choisir :
`SITE_PAROISSE=demo npm run dev` (PowerShell : `$env:SITE_PAROISSE='demo'; npm run dev`).

## Créer le site de sa paroisse

1. Créer votre dépôt à partir de celui-ci (bouton « Use this template » sur GitHub, ou une copie), de préférence
   privé si vous y mettez des coordonnées.
2. Copier `sites/demo/` en `sites/<votre-paroisse>/` et l'adapter ; garder les pages utiles comme point de départ.
   Ne modifiez pas `sites/demo/` : les mises à jour du modèle la remplacent.
3. Si votre diocèse n'a pas de dossier, copier `dioceses/besancon/` sous un autre nom et l'adapter, puis indiquer
   ce nom dans votre `paroisse.json`.
4. Renseigner dans `paroisse.json > cms` le dépôt GitHub de votre site et son adresse.

Pour récupérer les améliorations du modèle : `git remote add modele <adresse de ce dépôt>` une fois,
puis `git pull modele main`. Comme votre paroisse vit dans son propre dossier, il n'y a pas de conflit.

Les pages qui portent les blocs « Horaires » et « Clochers » sont trouvées d'elles-mêmes : le menu, le pied de page
et les liens des pages de clochers s'adaptent à votre arborescence.

## Calendriers Enoria

- `calendriers_enoria` dans `paroisse.json` : `{ "<slug du lieu>": "<adresse ICS Enoria>" }`.
  Sans adresse, le site lit `public/ics/<slug>.ics` dans le dossier du site.
- Seuls les événements de catégorie `CELEBRATION` ou `PUBLIC` (ou sans catégorie) sont affichés :
  un calendrier d'église peut contenir des réservations privées.
- Formulaires Enoria : copier l'adresse longue (public.enoria.app) depuis Enoria **déconnecté**.
  Une adresse avec `fl=` contient l'identité de la personne connectée.

## Back-office

Avec `npm run dev` lancé : <http://localhost:4321/admin/> dans Chrome ou Edge, « Travailler avec un dépôt local »,
choisir le dossier du projet. La configuration commune est `src/admin/config-cms.yml`.

## Contacts publiés

N'afficher sur le site que des contacts institutionnels (accueil, presbytère, adresse de la paroisse),
jamais le téléphone personnel d'un bénévole.

## Licence

Code sous licence MIT (`LICENSE`). La police Montserrat est sous licence SIL OFL 1.1
(`public/fonts/OFL-Montserrat.txt`). Les photos des églises viennent de Wikimedia Commons : leur auteur et leur
licence sont affichés sous chaque photo.
