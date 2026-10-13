// Photos cadrées, découpées à la construction du site (voir src/lib/images.ts)
import type { APIRoute } from 'astro';
import { imagesDuSite, decouper } from '../../../lib/images';

export const getStaticPaths = () => imagesDuSite().map((img: any) => ({ params: { nom: img.nom }, props: { img } }));

export const GET: APIRoute = async ({ props }) =>
  new Response(new Uint8Array(await decouper(props.img)), { headers: { 'Content-Type': 'image/webp' } });
