import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const host = request.headers.get('x-tenant-host') || request.headers.get('host') || '';
  const base = process.env.API_URL_INTERNAL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const response = await fetch(`${base}/public/chat/start`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-forwarded-for': request.headers.get('x-forwarded-for') || '',
    },
    body: JSON.stringify({ host }),
  });
  const data = await response.json().catch(() => ({}));
  return NextResponse.json(data, { status: response.status });
}
