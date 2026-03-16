import { jwtVerify } from 'jose';
import { NextRequest, NextResponse } from 'next/server';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'historia-crema-jwt-secret-2026-change-in-production'
);

export async function middleware(request: NextRequest) {
  // Allow public GET requests to plantel API (consumed by mobile app)
  if (
    request.nextUrl.pathname.startsWith('/api/plantel') &&
    request.method === 'GET'
  ) {
    return NextResponse.next();
  }

  // Allow public GET requests to camisetas API (consumed by mobile app)
  if (
    request.nextUrl.pathname.startsWith('/api/camisetas') &&
    request.method === 'GET'
  ) {
    return NextResponse.next();
  }

  // Allow public GET requests to partidos API (consumed by mobile app)
  if (
    request.nextUrl.pathname.startsWith('/api/partidos') &&
    request.method === 'GET'
  ) {
    return NextResponse.next();
  }

  // Allow public GET requests to entrenadores API (consumed by mobile app)
  if (
    request.nextUrl.pathname.startsWith('/api/entrenadores') &&
    request.method === 'GET'
  ) {
    return NextResponse.next();
  }

  // Allow public GET requests to historia API (consumed by mobile app)
  if (
    request.nextUrl.pathname.startsWith('/api/historia') &&
    request.method === 'GET'
  ) {
    return NextResponse.next();
  }

  // Allow public GET requests to goleadores API (consumed by mobile app)
  if (
    request.nextUrl.pathname.startsWith('/api/goleadores') &&
    request.method === 'GET'
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get('admin_token')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    await jwtVerify(token, JWT_SECRET);
    return NextResponse.next();
  } catch {
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('admin_token');
    return response;
  }
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/plantel',
    '/api/plantel/[anio]',
    '/api/camisetas/:path*',
    '/api/partidos/:path*',
    '/api/entrenadores/:path*',
    '/api/historia/:path*',
    '/api/goleadores/:path*',
  ],
};
