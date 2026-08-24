import { requireRole, mailAddress, prisma } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";
import ComposeMail from "@/components/ComposeMail";
import MailList, { type MailItem } from "@/components/MailList";

export const dynamic = "force-dynamic";

export default async function OgrenciPage() {
  const session = await requireRole("OGRENCI");

  const [user, inbox, sent, assignments] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.userId },
      include: { classroom: { select: { name: true } } },
    }),
    prisma.mailMessage.findMany({
      where: { toAddress: mailAddress(session.username) },
      include: { fromUser: { select: { username: true, displayName: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.mailMessage.findMany({
      where: { fromUserId: session.userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.assignment.findMany({
      where: { classroom: { students: { some: { id: session.userId } } } },
      include: {
        classroom: { select: { name: true } },
        createdBy: { select: { displayName: true } },
      },
      orderBy: { dueAt: "asc" },
    }),
  ]);

  const inboxData: MailItem[] = inbox.map((m) => ({
    id: m.id,
    subject: m.subject,
    body: m.body,
    fromName: m.fromUser?.displayName ?? null,
    fromUsername: m.fromUser?.username ?? null,
    createdAt: m.createdAt.toISOString(),
  }));

  const sentData: MailItem[] = sent.map((m) => ({
    id: m.id,
    subject: m.subject,
    body: m.body,
    toAddress: m.toAddress,
    status: m.status,
    createdAt: m.createdAt.toISOString(),
  }));

  const address = mailAddress(session.username);

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">🎓 Öğrenci Portalı</h1>
          <p className="mt-1 text-sm text-slate-500">
            Hoş geldin, {user?.displayName} ·{" "}
            <span className="font-mono text-indigo-600">{address}</span>
            {user?.classroom && (
              <span className="ml-2 rounded-full bg-indigo-100 px-2 py-0.5 text-xs text-indigo-700">
                {user.classroom.name}
              </span>
            )}
          </p>
        </div>
        <LogoutButton />
      </header>

      <section className="mt-8">
        <ComposeMail />
      </section>

      <div className="mt-10 grid gap-10 md:grid-cols-2">
        <section>
          <h2 className="mb-4 text-lg font-bold">📥 Gelen Kutusu</h2>
          <MailList mails={inboxData} variant="inbox" emptyText="Henüz mailiniz yok." />
        </section>

        <section>
          <h2 className="mb-4 text-lg font-bold">📅 Ödevlerim</h2>
          {assignments.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-400">
              Henüz ödev atanmadı.
            </p>
          ) : (
            <ul className="space-y-3">
              {assignments.map((a) => (
                <li
                  key={a.id}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold">{a.title}</span>
                    {a.dueAt && (
                      <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs text-orange-700">
                        Son: {new Date(a.dueAt).toLocaleDateString("tr-TR")}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {a.classroom.name} · Atayan: {a.createdBy.displayName}
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
                    {a.description}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="mt-10">
        <h2 className="mb-4 text-lg font-bold">📤 Gönderilenler</h2>
        <MailList mails={sentData} variant="sent" emptyText="Henüz mail göndermediniz." />
      </section>
    </main>
  );
}
