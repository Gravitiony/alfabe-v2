import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/auth";
import { SESSION_COOKIE, signSession } from "@/lib/jwt";

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const identifier = String(body.identifier ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");

  if (!identifier || !password)
    return NextResponse.json({ error: "Kullanıcı adı ve şifre gerekli." }, { status: 400 });

  const user = await prisma.user.findFirst({
    where: { OR: [{ username: identifier }, { email: identifier }] },
  });

  if (!user || !(await bcrypt.compare(password, user.passwordHash)))
    return NextResponse.json({ error: "Kullanıcı adı veya şifre hatalı." }, { status: 401 });
  if (!user.isActive)
    return NextResponse.json(
      { error: "Hesabınız henüz aktifleştirilmemiş. E-postanızı kontrol edin." },
      { status: 403 }
    );

  const token = await signSession({
    userId: user.id,
    username: user.username,
    role: user.role,
  });

  const res = NextResponse.json({
    ok: true,
    role: user.role,
    redirect:
      user.role === "ADMIN" ? "/admin" : user.role === "OGRETMEN" ? "/ogretmen" : "/ogrenci",
  });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
