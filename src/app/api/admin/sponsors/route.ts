import { NextResponse } from "next/server";
import { getSession, prisma } from "@/lib/auth";

const MAX_LOGO_LEN = 700000;

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN")
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const name = String(body.name ?? "").trim();
  const websiteUrl = String(body.websiteUrl ?? "").trim();
  const logoUrl = String(body.logoUrl ?? "").trim();
  const sortOrder = Number.isFinite(Number(body.sortOrder)) ? Number(body.sortOrder) : 0;

  if (!name || name.length > 60)
    return NextResponse.json({ error: "Sponsor adı gerekli (en fazla 60 karakter)." }, { status: 400 });
  if (!/^https?:\/\/.+/.test(websiteUrl))
    return NextResponse.json({ error: "Web sitesi https:// veya http:// ile başlamalı." }, { status: 400 });
  if (!(logoUrl.startsWith("data:image") || /^https?:\/\/.+/.test(logoUrl)))
    return NextResponse.json(
      { error: "Logo bir görsel dosyası veya http(s) bağlantısı olmalı." },
      { status: 400 }
    );
  if (logoUrl.length > MAX_LOGO_LEN)
    return NextResponse.json({ error: "Logo çok büyük (en fazla ~500KB)." }, { status: 413 });

  const sponsor = await prisma.sponsor.create({
    data: { name, websiteUrl, logoUrl, sortOrder },
  });

  return NextResponse.json({ ok: true, id: sponsor.id }, { status: 201 });
}

export async function DELETE(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN")
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Sponsor kimliği gerekli." }, { status: 400 });

  await prisma.sponsor.delete({ where: { id } }).catch(() => {});

  return NextResponse.json({ ok: true });
}
