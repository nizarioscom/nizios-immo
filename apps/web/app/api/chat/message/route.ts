import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body = await request.json();
  const base = process.env.API_URL_INTERNAL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const response = await fetch(`${base}/public/chat/message`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-forwarded-for': request.headers.get('x-forwarded-for') || '',
    },
    body: JSON.stringify({ sessionId: body.sessionId, text: body.text, value: body.value }),
  });
  const data = await response.json().catch(() => ({}));
  return NextResponse.json(data, { status: response.status });
}
