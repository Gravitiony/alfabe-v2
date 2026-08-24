import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const username = process.env.ADMIN_USERNAME || "admin";
const password = process.env.ADMIN_PASSWORD || "Admin123!";
const domain = process.env.MAIL_DOMAIN || "alfabe.co";

async function ensureAdminMailbox() {
  if (!process.env.MAILCOW_API_URL || !process.env.MAILCOW_API_KEY) return;
  try {
    const res = await fetch(`${process.env.MAILCOW_API_URL.replace(/\/+$/, "")}/api/v1/add/mailbox`, {
      method: "POST",
      headers: { "X-API-Key": process.env.MAILCOW_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({
        local_part: username,
        domain,
        password,
        password2: password,
        quota: 1024,
        active: true,
        name: "Sistem Yoneticisi",
      }),
    });
    console.log(`[MAILCOW] Admin posta kutusu: HTTP ${res.status}`);
  } catch (e) {
    console.error("[MAILCOW] Admin posta kutusu hatasi:", e.message);
  }
}

async function main() {
  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.upsert({
    where: { username },
    update: { passwordHash, isActive: true, role: "ADMIN" },
    create: {
      username,
      email: `${username}@alfabe.co`,
      passwordHash,
      role: "ADMIN",
      displayName: "Sistem Yöneticisi",
      isActive: true,
    },
  });
  console.log(`[SEED] Admin hesabı hazır: ${username}`);
  await ensureAdminMailbox();
}

main()
  .catch((e) => {
    console.error("[SEED] Hata:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
