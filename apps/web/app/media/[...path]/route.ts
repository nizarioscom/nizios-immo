import { NextResponse } from 'next/server';

/** Même origine pour les photos. Le fichier est lu par l'API (clients/ ou uploads/). */
export async function GET(_request: Request, { params }: { params: { path: string[] } }) {
  const base = process.env.API_URL_INTERNAL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const target = `${base}/media/${params.path.map(encodeURIComponent).join('/')}`;
  const response = await fetch(target);
  if (!response.ok) return new NextResponse('Not found', { status: 404 });
  const bytes = await response.arrayBuffer();
  return new NextResponse(bytes, {
    status: 200,
    headers: {
      'content-type': response.headers.get('content-type') || 'application/octet-stream',
      'cache-control': 'public, max-age=86400',
    },
  });
}
