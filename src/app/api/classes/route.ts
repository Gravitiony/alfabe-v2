import { NextResponse } from "next/server";
import { getSession, prisma } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session || !["OGRETMEN", "ADMIN"].includes(session.role))
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });

  const classrooms = await prisma.classroom.findMany({
    where: session.role === "ADMIN" ? {} : { teacherId: session.userId },
    include: {
      teacher: { select: { displayName: true } },
      students: { select: { id: true, username: true, displayName: true } },
      _count: { select: { assignments: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ classrooms });
}

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

  const name = String(body.name ?? "").trim();
  if (!name) return NextResponse.json({ error: "Sınıf adı gerekli." }, { status: 400 });

  try {
    const classroom = await prisma.classroom.create({
      data: { name, teacherId: session.userId },
    });
    return NextResponse.json({ ok: true, classroom }, { status: 201 });
  } catch (e: unknown) {
    const code =
      typeof e === "object" && e !== null && "code" in e ? String((e as { code: string }).code) : "";
    if (code === "P2002")
      return NextResponse.json({ error: "Bu isimde bir sınıf zaten var." }, { status: 409 });
    throw e;
  }
}
