import { signToken, validateCredentials } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { username, password } = body;

  if (!username || !password) {
    return NextResponse.json(
      { error: 'Usuario y contraseña son requeridos' },
      { status: 400 }
    );
  }

  if (!validateCredentials(username, password)) {
    return NextResponse.json(
      { error: 'Usuario o contraseña incorrectos' },
      { status: 401 }
    );
  }

  const token = await signToken({ username });
  const response = NextResponse.json({ ok: true });

  response.cookies.set('admin_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 8,
    path: '/',
  });

  return response;
}
