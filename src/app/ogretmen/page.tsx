import { requireRole, mailAddress, prisma } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";
import {
  CreateClassForm,
  AddStudentForm,
  AssignHomeworkForm,
} from "@/components/TeacherForms";

export const dynamic = "force-dynamic";

export default async function OgretmenPage() {
  const session = await requireRole("OGRETMEN", "ADMIN");

  const [classrooms, assignments] = await Promise.all([
    prisma.classroom.findMany({
      where: session.role === "ADMIN" ? {} : { teacherId: session.userId },
      include: {
        students: { select: { id: true, username: true, displayName: true } },
        _count: { select: { assignments: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.assignment.findMany({
      where:
        session.role === "ADMIN" ? {} : { classroom: { teacherId: session.userId } },
      include: {
        classroom: { select: { name: true } },
        createdBy: { select: { displayName: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const options = classrooms.map((c) => ({ id: c.id, name: c.name }));

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">👩‍🏫 Öğretmen Paneli</h1>
          <p className="mt-1 text-sm text-slate-500">
            Hoş geldiniz, {session.username} · Sınıflarınızı ve öğrencilerinizi yönetin.
          </p>
        </div>
        <LogoutButton />
      </header>

      <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-bold">Sınıf Oluştur</h2>
        <CreateClassForm />
      </section>

      <section className="mt-8">
        <h2 className="mb-4 text-lg font-bold">Sınıflarım & Öğrenciler</h2>
        {classrooms.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-400">
            Henüz sınıfınız yok.
          </p>
        ) : (
          <div className="space-y-4">
            {classrooms.map((c) => (
              <div
                key={c.id}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-bold">{c.name}</h3>
                  <span className="text-xs text-slate-500">
                    {c.students.length} öğrenci · {c._count.assignments} ödev
                  </span>
                </div>
                {c.students.length > 0 && (
                  <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {c.students.map((s) => (
                      <li
                        key={s.id}
                        className="rounded-lg bg-slate-50 px-3 py-2 text-sm"
                      >
                        <span className="font-medium">{s.displayName}</span>{" "}
                        <span className="font-mono text-xs text-indigo-600">
                          {mailAddress(s.username)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-bold">Öğrenci Ekle</h2>
        <AddStudentForm classrooms={options} />
      </section>

      <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-bold">Ödev Ata</h2>
        <AssignHomeworkForm classrooms={options} />
      </section>

      <section className="mt-8">
        <h2 className="mb-4 text-lg font-bold">Atanan Ödevler</h2>
        {assignments.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-400">
            Henüz ödev atanmadı.
          </p>
        ) : (
          <ul className="space-y-3">
            {assignments.map((a) => (
              <li
                key={a.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div>
                  <span className="font-semibold">{a.title}</span>
                  <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                    {a.classroom.name}
                  </span>
                  {a.dueAt && (
                    <span className="ml-2 text-xs text-orange-600">
                      Son: {new Date(a.dueAt).toLocaleDateString("tr-TR")}
                    </span>
                  )}
                </div>
                <span className="text-xs text-slate-500">{a.createdBy.displayName}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
