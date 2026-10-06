import { resolveTenantHost } from '@nizios/config/resolve-tenant-host';
import { NextResponse, type NextRequest } from 'next/server';

const LOCALES = new Set(['fr', 'ar']);

function hostMap(): Record<string, string> {
  const raw = process.env.TENANT_HOST_MAP;
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as Record<string, string>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

/**
 * Résout le tenant depuis l'hôte et force le préfixe de locale /fr ou /ar.
 * Le nom affiché vient ensuite de l'API (clients/<slug>/tenant.config.json).
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get('host') ?? '';
  const slug = resolveTenantHost(host, hostMap());

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-tenant-host', host);
  if (slug) requestHeaders.set('x-tenant-slug', slug);
  else requestHeaders.delete('x-tenant-slug');

  if (pathname.startsWith('/admin') || pathname.startsWith('/api')) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  const segment = pathname.split('/')[1] ?? '';
  if (!LOCALES.has(segment)) {
    const url = request.nextUrl.clone();
    const suffix = pathname === '/' ? '' : pathname;
    url.pathname = `/fr${suffix}`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
