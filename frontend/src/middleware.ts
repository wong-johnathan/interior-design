import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const isAdmin = req.auth?.user?.role === 'admin';
  const isAdminRoute = nextUrl.pathname.startsWith('/admin');

  // Redirect unauthenticated users to login
  if (!isLoggedIn && nextUrl.pathname !== '/auth/login') {
    return Response.redirect(new URL('/auth/login', nextUrl));
  }

  // Redirect non-admin users away from admin routes
  if (isAdminRoute && !isAdmin) {
    return Response.redirect(new URL('/', nextUrl));
  }

  return NextResponse.next();
});

// Protect all routes except public ones
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/auth|api/ai/chat|api/render).*)'],
};
