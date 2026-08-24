import { requireRole, prisma } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";
import SponsorManager from "@/components/SponsorManager";

export const dynamic = "force-dynamic";

function presence(lastSeenAt: Date | null) {
  if (!lastSeenAt) return { online: false, text: "Hiç giriş yapmadı" };
  const dk = Math.floor((Date.now() - lastSeenAt.getTime()) / 60000);
  if (dk < 5) return { online: true, text: "Şimdi aktif" };
  if (dk < 60) return { online: false, text: `Son görülme: ${dk} dk önce` };
  const saat = Math.floor(dk / 60);
  if (saat < 24) return { online: false, text: `Son görülme: ${saat} sa önce` };
  return { online: false, text: `Son görülme: ${Math.floor(saat / 24)} gün önce` };
}

export default async function AdminPage() {
  await requireRole("ADMIN");

  const [userCount, teacherCount, studentCount, classCount, mailCount, sentCount, failedCount, onlineCount, recentUsers, recentMails, sponsors] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "OGRETMEN" } }),
      prisma.user.count({ where: { role: "OGRENCI" } }),
      prisma.classroom.count(),
      prisma.mailMessage.count(),
      prisma.mailMessage.count({ where: { status: "SENT" } }),
      prisma.mailMessage.count({ where: { status: "FAILED" } }),
      prisma.user.count({ where: { lastSeenAt: { gte: new Date(Date.now() - 5 * 60 * 1000) } } }),
      prisma.user.findMany({
        orderBy: [{ lastSeenAt: "desc" }, { createdAt: "desc" }],
        take: 20,
        select: {
          username: true,
          displayName: true,
          role: true,
          isActive: true,
          lastSeenAt: true,
        },
      }),
      prisma.mailMessage.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { fromUser: { select: { displayName: true } } },
      }),
      prisma.sponsor.findMany({
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      }),
    ]);

  const stats = [
    { label: "Toplam Kullanıcı", value: userCount, icon: "👥" },
    { label: "Öğretmen", value: teacherCount, icon: "👩‍🏫" },
    { label: "Öğrenci", value: studentCount, icon: "🎓" },
    { label: "Çevrimiçi", value: onlineCount, icon: "🟢" },
    { label: "Sınıf", value: classCount, icon: "🏫" },
    { label: "Toplam Mail", value: mailCount, icon: "✉️" },
    { label: "Teslim Edilen", value: sentCount, icon: "✅" },
    { label: "Başarısız", value: failedCount, icon: "❌" },
  ];

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">🛡️ Admin Paneli</h1>
          <p className="mt-1 text-sm text-slate-500">
            Sistem geneli istatistikler ve kullanıcı yönetimi.
          </p>
        </div>
        <LogoutButton />
      </header>

      <section className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm"
          >
            <div className="text-xl">{s.icon}</div>
            <div className="mt-1 text-2xl font-extrabold text-indigo-600">{s.value}</div>
            <div className="text-xs text-slate-500">{s.label}</div>
          </div>
        ))}
      </section>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="mb-4 text-lg font-bold">Son Kayıt Olanlar</h2>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Kullanıcı</th>
                  <th className="px-4 py-3">Rol</th>
                  <th className="px-4 py-3">Hesap</th>
                  <th className="px-4 py-3">Çevrim Durumu</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.map((u) => {
                  const p = presence(u.lastSeenAt);
                  return (
                    <tr key={u.username} className="border-t border-slate-100">
                      <td className="px-4 py-3">
                        <span className="font-medium">{u.displayName}</span>{" "}
                        <span className="text-xs text-slate-400">@{u.username}</span>
                      </td>
                      <td className="px-4 py-3">{u.role}</td>
                      <td className="px-4 py-3">
                        {u.isActive ? (
                          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                            Aktif
                          </span>
                        ) : (
                          <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-700">
                            Beklemede
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3" title={p.text}>
                        <span className="flex items-center gap-2">
                          <span
                            className={`h-2.5 w-2.5 rounded-full ${
                              p.online ? "animate-pulse bg-green-500" : "bg-slate-300"
                            }`}
                          />
                          <span
                            className={`text-xs font-medium ${
                              p.online ? "text-green-600" : "text-slate-500"
                            }`}
                          >
                            {p.online ? "Çevrimiçi" : "Çevrimdışı"}
                          </span>
                          {!p.online && u.lastSeenAt && (
                            <span className="text-xs text-slate-400">{p.text}</span>
                          )}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-lg font-bold">Son Mailler</h2>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Konu</th>
                  <th className="px-4 py-3">Alıcı</th>
                  <th className="px-4 py-3">Durum</th>
                </tr>
              </thead>
              <tbody>
                {recentMails.map((m) => (
                  <tr key={m.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-medium">{m.subject}</td>
                    <td className="px-4 py-3 font-mono text-xs">{m.toAddress}</td>
                    <td className="px-4 py-3">
                      {m.status === "FAILED" ? "❌" : "✅"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section className="mt-10 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold">Sponsor Yönetimi</h2>
        <p className="mb-4 mt-1 text-sm text-slate-500">
          Buraya eklediğiniz sponsorlar ana sayfadaki &quot;Sponsorlarımız&quot; carrouselinde
          yuvarlak logo ile görünür; logoya basıldığında sponsorun sitesine gidilir.
        </p>
        <SponsorManager
          sponsors={sponsors.map((s) => ({
            id: s.id,
            name: s.name,
            logoUrl: s.logoUrl,
            websiteUrl: s.websiteUrl,
            sortOrder: s.sortOrder,
          }))}
        />
      </section>

      <section className="mt-10 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold">Servis Durumu (Beklenen Konteynerler)</h2>
        <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
          {["alfabemail (Next.js :3000)", "alfabemail-worker (BullMQ)", "alfabemail_mysql (MySQL 8.4)", "alfabemail_redis (Redis)"].map(
            (s) => (
              <li
                key={s}
                className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2"
              >
                <span className="h-2 w-2 rounded-full bg-green-500"></span>
                <span className="font-mono text-xs">{s}</span>
              </li>
            )
          )}
        </ul>
        <p className="mt-3 text-xs text-slate-400">
          Mailcow entegrasyonu için SMTP ayarlarını .env dosyasına girin; worker otomatik olarak gerçek
          sunucuya göndermeye başlar.
        </p>
      </section>
    </main>
  );
}
