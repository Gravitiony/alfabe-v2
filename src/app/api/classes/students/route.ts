import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSession, prisma } from "@/lib/auth";
import { createMailbox } from "@/lib/mailcow";

const USERNAME_RE = /^[a-z0-9._-]{3,20}$/;

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || !["OGRETMEN", "ADMIN"].includes(session.role))
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const classId = String(body.classId ?? "");
  const username = String(body.username ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  const displayName = String(body.displayName ?? "").trim() || username;

  const classroom = await prisma.classroom.findUnique({ where: { id: classId } });
  if (!classroom)
    return NextResponse.json({ error: "Sınıf bulunamadı." }, { status: 404 });
  if (session.role === "OGRETMEN" && classroom.teacherId !== session.userId)
    return NextResponse.json({ error: "Bu sınıfa ekleme yetkiniz yok." }, { status: 403 });

  if (!USERNAME_RE.test(username))
    return NextResponse.json(
      { error: "Kullanıcı adı 3-20 karakter olmalı; sadece harf, rakam, nokta, tire ve alt çizgi." },
      { status: 400 }
    );
  if (password.length < 6)
    return NextResponse.json({ error: "Şifre en az 6 karakter olmalı." }, { status: 400 });

  try {
    await prisma.user.create({
      data: {
        username,
        passwordHash: await bcrypt.hash(password, 10),
        role: "OGRENCI",
        displayName,
        classId,
      },
    });

    await createMailbox(username, password, displayName);

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e: unknown) {
    const code =
      typeof e === "object" && e !== null && "code" in e ? String((e as { code: string }).code) : "";
    if (code === "P2002")
      return NextResponse.json({ error: "Bu kullanıcı adı zaten alınmış." }, { status: 409 });
    throw e;
  }
}
