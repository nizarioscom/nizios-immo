import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body = await request.json();
  const base =
    process.env.API_URL_INTERNAL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const response = await fetch(`${base}/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: body.email, password: body.password }),
  });
  const data = (await response.json().catch(() => ({}))) as { accessToken?: string; user?: unknown };
  if (!response.ok || !data.accessToken) {
    return NextResponse.json({ message: 'Identifiants incorrects.' }, { status: 401 });
  }
  const next = NextResponse.json({ user: data.user });
  // Jour 1 : HTTP local (Docker et next start). Passer COOKIE_SECURE=true derrière HTTPS.
  next.cookies.set('nizios_admin_token', data.accessToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.COOKIE_SECURE === 'true',
    path: '/',
    maxAge: 60 * 60 * 12,
  });
  return next;
}
