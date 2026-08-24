import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/auth";
import { mailQueue } from "@/lib/queue";
import { createMailbox } from "@/lib/mailcow";

const USERNAME_RE = /^[a-z0-9._-]{3,20}$/;

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const accountType = String(body.accountType ?? "ogrenci");
  const password = String(body.password ?? "");

  try {
    if (accountType === "ogretmen") {
      const firstName = String(body.firstName ?? "").trim();
      const lastName = String(body.lastName ?? "").trim();
      const email = String(body.email ?? "").trim().toLowerCase();

      if (!firstName || !lastName)
        return NextResponse.json({ error: "Ad ve soyad gerekli." }, { status: 400 });
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
        return NextResponse.json({ error: "Geçerli bir e-posta girin." }, { status: 400 });
      if (password.length < 8)
        return NextResponse.json(
          { error: "Şifre en az 8 karakter olmalı." },
          { status: 400 }
        );

      const activationToken = randomUUID();
      const user = await prisma.user.create({
        data: {
          username: email.split("@")[0] + "-" + randomUUID().slice(0, 4),
          email,
          passwordHash: await bcrypt.hash(password, 10),
          role: "OGRETMEN",
          displayName: `${firstName} ${lastName}`,
          firstName,
          lastName,
          isActive: false,
          activationToken,
        },
      });

      await mailQueue.add("activation", {
        type: "activation",
        to: email,
        token: activationToken,
        displayName: user.displayName,
      });

      await createMailbox(user.username, password, user.displayName);

      return NextResponse.json(
        {
          ok: true,
          message:
            "Kaydınız alındı. Aktivasyon bağlantısı e-postanıza gönderildi (yerel kurulumda worker konsolunda görünür).",
        },
        { status: 201 }
      );
    }

    const username = String(body.username ?? "").trim().toLowerCase();
    const displayName = String(body.displayName ?? "").trim() || username;

    if (!USERNAME_RE.test(username))
      return NextResponse.json(
        { error: "Kullanıcı adı 3-20 karakter olmalı; sadece harf, rakam, nokta, tire ve alt çizgi." },
        { status: 400 }
      );
    if (password.length < 6)
      return NextResponse.json({ error: "Şifre en az 6 karakter olmalı." }, { status: 400 });

    await prisma.user.create({
      data: {
        username,
        passwordHash: await bcrypt.hash(password, 10),
        role: "OGRENCI",
        displayName,
      },
    });

    await createMailbox(username, password, displayName);

    return NextResponse.json(
      {
        ok: true,
        message: "Hesabınız oluşturuldu. Giriş yapabilirsiniz.",
      },
      { status: 201 }
    );
  } catch (e: unknown) {
    const code =
      typeof e === "object" && e !== null && "code" in e ? String((e as { code: string }).code) : "";
    if (code === "P2002")
      return NextResponse.json(
        { error: "Bu kullanıcı adı veya e-posta zaten kullanımda." },
        { status: 409 }
      );
    console.error(e);
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 });
  }
}
