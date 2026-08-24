import { NextResponse } from "next/server";
import { getSession, prisma } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  if (session.role === "OGRENCI") {
    const assignments = await prisma.assignment.findMany({
      where: { classroom: { students: { some: { id: session.userId } } } },
      include: {
        classroom: { select: { name: true } },
        createdBy: { select: { displayName: true } },
      },
      orderBy: { dueAt: "asc" },
    });
    return NextResponse.json({ assignments });
  }

  if (["OGRETMEN", "ADMIN"].includes(session.role)) {
    const assignments = await prisma.assignment.findMany({
      where:
        session.role === "ADMIN"
          ? {}
          : { classroom: { teacherId: session.userId } },
      include: {
        classroom: { select: { name: true } },
        createdBy: { select: { displayName: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ assignments });
  }

  return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
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

  const classId = String(body.classId ?? "");
  const title = String(body.title ?? "").trim();
  const description = String(body.description ?? "").trim();
  const dueAtRaw = String(body.dueAt ?? "").trim();

  if (!title)
    return NextResponse.json({ error: "Ödev başlığı gerekli." }, { status: 400 });

  const classroom = await prisma.classroom.findUnique({ where: { id: classId } });
  if (!classroom) return NextResponse.json({ error: "Sınıf bulunamadı." }, { status: 404 });
  if (session.role === "OGRETMEN" && classroom.teacherId !== session.userId)
    return NextResponse.json({ error: "Bu sınıfa ödev atama yetkiniz yok." }, { status: 403 });

  const assignment = await prisma.assignment.create({
    data: {
      title,
      description,
      classroomId: classId,
      createdById: session.userId,
      dueAt: dueAtRaw ? new Date(dueAtRaw) : null,
    },
  });

  return NextResponse.json({ ok: true, assignment }, { status: 201 });
}
