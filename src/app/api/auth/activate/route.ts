import { NextResponse } from "next/server";
import { prisma } from "@/lib/auth";

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token");
  if (!token) return NextResponse.redirect(new URL("/giris", req.url));

  const user = await prisma.user.findFirst({ where: { activationToken: token } });
  if (!user) return NextResponse.redirect(new URL("/giris?hata=gecersiz-token", req.url));

  await prisma.user.update({
    where: { id: user.id },
    data: { isActive: true, activationToken: null },
  });

  return NextResponse.redirect(new URL("/giris?aktif=1", req.url));
}
