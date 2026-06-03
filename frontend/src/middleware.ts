export { auth as middleware } from '@/lib/auth';

export const config = {
  matcher: [
    '/studio/:path*',
    '/edit/:path*',
    '/render/:path*',
    '/project/:path*',
    '/admin/:path*',
  ],
};
