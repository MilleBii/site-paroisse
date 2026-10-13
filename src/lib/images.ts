// Photos cadrées dans le back-office (champ « image_cadree ») : la photo d'origine reste intacte, le site la découpe
// selon le cadrage enregistré et la réduit à sa taille d'affichage. Les fichiers sont produits par src/pages/img/cadre/.
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { pages } from './pages';
import { articles } from './articles';
import { PUBLIC_SITE } from './config';

export type ImageCadree = { src: string; format?: string; cadrage?: { x: number; y: number; l: number; h: number } | null };

const LARGEUR_MAX = 1600;
const PROPORTIONS: Record<string, number> = { '16:9': 16 / 9, '4:3': 4 / 3, '1:1': 1, '4:5': 4 / 5 };

const nomDe = (img: ImageCadree) => {
  const base = img.src.split('/').pop()!.replace(/\.[^.]+$/, '').normalize('NFD').replace(/[^\w-]+/g, '-').toLowerCase();
  const empreinte = createHash('sha1').update(JSON.stringify([img.src, img.cadrage ?? null])).digest('hex').slice(0, 8);
  return `${base}-${empreinte}`;
};

export const urlImage = (img?: ImageCadree | null) => (img?.src ? `/img/cadre/${nomDe(img)}.webp` : null);
export const proportion = (img: ImageCadree) => (img.format && PROPORTIONS[img.format]) || undefined;

// Toutes les photos cadrées du site : blocs « Photo » des pages et photos des articles
export const imagesDuSite = (): ImageCadree[] => [
  ...pages.flatMap((p) => p.blocs.filter((b: any) => b.type === 'image' && b.photo?.src).map((b: any) => b.photo)),
  ...articles.filter((a: any) => a.image?.src).map((a: any) => a.image),
].filter((img, i, toutes) => toutes.findIndex((x) => nomDe(x) === nomDe(img)) === i).map((img) => ({ ...img, nom: nomDe(img) }));

export async function decouper(img: ImageCadree) {
  // les photos du back-office sont dans sites/<nom>/public ; public/ (commun) en second recours
  const fichier = decodeURIComponent(img.src);
  const source = [PUBLIC_SITE, 'public'].map((d) => join(process.cwd(), d, fichier)).find(existsSync) ?? join(process.cwd(), PUBLIC_SITE, fichier);
  // .rotate() applique l'orientation enregistrée par le téléphone, comme l'affichait l'outil de cadrage
  const { data, info } = await sharp(source).rotate().toBuffer({ resolveWithObject: true });
  const k = img.cadrage ?? { x: 0, y: 0, l: 1, h: 1 };
  const zone = {
    left: Math.round(k.x * info.width), top: Math.round(k.y * info.height),
    width: Math.max(1, Math.round(k.l * info.width)), height: Math.max(1, Math.round(k.h * info.height)),
  };
  zone.width = Math.min(zone.width, info.width - zone.left);
  zone.height = Math.min(zone.height, info.height - zone.top);
  return sharp(data).extract(zone).resize({ width: Math.min(LARGEUR_MAX, zone.width) }).webp({ quality: 80 }).toBuffer();
}
