import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const hasSession = request.cookies.has('gacoda_admin_session');
    if (!hasSession) {
      const url = request.nextUrl.clone();
      url.pathname = '/admin/login';
      return NextResponse.redirect(url);
    }
  }

  if (pathname.startsWith('/member')) {
    const hasSession = request.cookies.has('gacoda_member_session');
    if (!hasSession) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
  }

  const response = NextResponse.next();
  response.headers.set('x-next-pathname', pathname);
  return response;
}

export const config = {
  matcher: ['/admin/:path*', '/member/:path*']
};
