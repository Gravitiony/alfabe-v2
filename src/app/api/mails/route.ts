import { NextResponse } from "next/server";
import { getSession, mailAddress, prisma } from "@/lib/auth";
import { mailQueue } from "@/lib/queue";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const address = mailAddress(session.username);
  const [inbox, sent] = await Promise.all([
    prisma.mailMessage.findMany({
      where: { toAddress: address },
      include: { fromUser: { select: { username: true, displayName: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.mailMessage.findMany({
      where: { fromUserId: session.userId },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);

  return NextResponse.json({ inbox, sent });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const toAddress = String(body.to ?? "").trim().toLowerCase();
  const subject = String(body.subject ?? "").trim();
  const text = String(body.body ?? "");

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(toAddress))
    return NextResponse.json({ error: "Geçerli bir alıcı adresi girin." }, { status: 400 });

  if (toAddress === mailAddress(session.username))
    return NextResponse.json({ error: "Kendinize mail gönderemezsiniz." }, { status: 400 });

  const domain = (process.env.MAIL_DOMAIN || "alfabe.co").toLowerCase();
  const isInternal = toAddress.endsWith("@" + domain);
  if (!subject)
    return NextResponse.json({ error: "Konu gerekli." }, { status: 400 });

  if (isInternal) {
    const recipientUsername = toAddress.slice(0, toAddress.indexOf("@"));
    const recipient = await prisma.user.findUnique({ where: { username: recipientUsername } });
    if (!recipient)
      return NextResponse.json(
        { error: "Alıcı bu platformda bulunamadı." },
        { status: 404 }
      );
  }

  const mail = await prisma.mailMessage.create({
    data: {
      fromUserId: session.userId,
      toAddress,
      subject,
      body: text,
    },
  });

  await mailQueue.add("send", { type: "send", mailId: mail.id });

  return NextResponse.json({ ok: true, id: mail.id, internal: isInternal }, { status: 201 });
}
