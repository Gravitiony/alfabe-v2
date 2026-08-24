import { PrismaClient } from "@prisma/client";
import { Worker } from "bullmq";
import IORedis from "ioredis";
import nodemailer from "nodemailer";

const prisma = new PrismaClient();
const domain = process.env.MAIL_DOMAIN || "alfabe.co";
const appUrl = process.env.APP_URL || "http://localhost:3000";

const connection = new IORedis({
  host: process.env.REDIS_HOST || "redis",
  port: Number(process.env.REDIS_PORT || 6379),
  maxRetriesPerRequest: null,
});

const transporter = process.env.SMTP_HOST
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth:
        process.env.SMTP_USER && process.env.SMTP_PASS
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
          : undefined,
    })
  : null;

async function deliver(to, subject, text) {
  if (transporter) {
    await transporter.sendMail({
      from: `"Alfabe Mail" <no-reply@${domain}>`,
      to,
      subject,
      text,
    });
    console.log(`[MAIL] SMTP ile gönderildi -> ${to} :: ${subject}`);
  } else {
    console.log(`\n========== MAIL (SIMÜLASYON) ==========`);
    console.log(`Kime : ${to}`);
    console.log(`Konu : ${subject}`);
    console.log(text);
    console.log(`=======================================\n`);
  }
}

const worker = new Worker(
  "mail",
  async (job) => {
    const data = job.data;

    if (data.type === "activation") {
      const link = `${appUrl}/api/auth/activate?token=${data.token}`;
      const text = `Merhaba ${data.displayName},\n\nAlfabe Mail öğretmen hesabınızı aktifleştirmek için aşağıdaki bağlantıya tıklayın:\n\n${link}\n\nBu isteği siz yapmadıysanız bu e-postayı yok sayabilirsiniz.`;
      await deliver(data.to, "Alfabe Mail — Hesap Aktifleştirme", text);
      return;
    }

    if (data.type === "send") {
      const mail = await prisma.mailMessage.findUnique({ where: { id: data.mailId } });
      if (!mail || mail.status !== "QUEUED") return;

      try {
        await deliver(mail.toAddress, mail.subject, mail.body);
        await prisma.mailMessage.update({
          where: { id: mail.id },
          data: { status: "SENT", sentAt: new Date() },
        });
      } catch (err) {
        console.error(`[MAIL] Gönderim başarısız (${mail.toAddress}):`, err.message);
        await prisma.mailMessage.update({
          where: { id: mail.id },
          data: { status: "FAILED", error: String(err.message || err) },
        });
      }
    }
  },
  { connection, concurrency: 5 }
);

worker.on("ready", () => console.log("[WORKER] Alfabe Mail worker hazır. Kuyruk dinleniyor..."));
worker.on("failed", (job, err) => console.error(`[WORKER] İş başarısız (#${job?.id}):`, err.message));
worker.on("error", (err) => console.error("[WORKER] Hata:", err.message));

async function shutdown() {
  console.log("\n[WORKER] Kapatılıyor...");
  await worker.close();
  await connection.quit();
  await prisma.$disconnect();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
