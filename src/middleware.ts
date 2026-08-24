import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/jwt";

const rules: Array<{ prefix: string; roles: string[] }> = [
  { prefix: "/admin", roles: ["ADMIN"] },
  { prefix: "/ogretmen", roles: ["OGRETMEN", "ADMIN"] },
  { prefix: "/ogrenci", roles: ["OGRENCI"] },
];

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const rule = rules.find((r) => path === r.prefix || path.startsWith(r.prefix + "/"));
  if (!rule) return NextResponse.next();

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;

  if (!session) {
    const url = new URL("/giris", req.url);
    return NextResponse.redirect(url);
  }
  if (!rule.roles.includes(session.role)) {
    const home =
      session.role === "ADMIN"
        ? "/admin"
        : session.role === "OGRETMEN"
          ? "/ogretmen"
          : "/ogrenci";
    return NextResponse.redirect(new URL(home, req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/ogretmen/:path*", "/ogrenci/:path*"],
};
