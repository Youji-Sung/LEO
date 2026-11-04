import { NextResponse, type NextRequest } from "next/server";
import { DIRECTION_COOKIE, DIRECTION_QUERY, isDirection } from "@/lib/direction";

const SESSION_COOKIE = "leo_session";
const PUBLIC_PATHS = ["/login", "/signup"];

// 쿠키 존재만 확인한다. 실제 세션 검증은 서버 컴포넌트(requireUser)와 API(requireRequestUser)가 한다.
// 쿠키가 있어도 공개 경로는 막지 않는다(만료·삭제된 세션 쿠키로 /login ↔ / 무한 리다이렉트가 생기지 않게).
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 시각 방향 시안 전환: ?direction=study|stage|console|off 를 쿠키로 옮기고 쿼리를 뗀 주소로 보낸다.
  const direction = request.nextUrl.searchParams.get(DIRECTION_QUERY);
  if (direction !== null && (isDirection(direction) || direction === "off")) {
    const url = request.nextUrl.clone();
    url.searchParams.delete(DIRECTION_QUERY);
    const res = NextResponse.redirect(url);
    if (direction === "off") res.cookies.delete(DIRECTION_COOKIE);
    else
      res.cookies.set(DIRECTION_COOKIE, direction, {
        path: "/",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30,
      });
    return res;
  }

  const hasCookie = Boolean(request.cookies.get(SESSION_COOKIE)?.value);
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (!hasCookie && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = pathname === "/" ? "" : `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|svg|ico|txt)$).*)"],
};
