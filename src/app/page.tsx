import Link from "next/link";
import { getSession, mailAddress, prisma } from "@/lib/auth";
import SponsorCarousel, { type SponsorItem } from "@/components/SponsorCarousel";

export const dynamic = "force-dynamic";

const roleHome: Record<string, string> = {
  ADMIN: "/admin",
  OGRETMEN: "/ogretmen",
  OGRENCI: "/ogrenci",
};

export default async function Home() {
  const session = await getSession();

  const sponsors = await prisma.sponsor.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  const sponsorData: SponsorItem[] = sponsors.map((s) => ({
    id: s.id,
    name: s.name,
    logoUrl: s.logoUrl,
    websiteUrl: s.websiteUrl,
  }));

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 py-16">
      <h1 className="bg-gradient-to-r from-indigo-600 to-sky-500 bg-clip-text text-center text-5xl font-extrabold text-transparent">
        Alfabe Mail
      </h1>
      <p className="mt-4 max-w-xl text-center text-lg text-slate-600">
        Çocuklar için güvenli, reklamsız ve kontrollü ortamda e-posta kullanımını sağlayan eğitim
        odaklı mail platformu.
      </p>

      <div className="mt-10 flex gap-4">
        {session ? (
          <Link
            href={roleHome[session.role] ?? "/giris"}
            className="rounded-lg bg-indigo-600 px-8 py-3 font-semibold text-white shadow hover:bg-indigo-700"
          >
            Panelime Git ({session.username})
          </Link>
        ) : (
          <>
            <Link
              href="/giris"
              className="rounded-lg bg-indigo-600 px-8 py-3 font-semibold text-white shadow hover:bg-indigo-700"
            >
              Giriş Yap
            </Link>
            <Link
              href="/kayit"
              className="rounded-lg border border-indigo-200 bg-white px-8 py-3 font-semibold text-indigo-700 shadow hover:bg-indigo-50"
            >
              Kayıt Ol
            </Link>
          </>
        )}
      </div>

      {sponsorData.length > 0 && (
        <section className="mt-16 w-full">
          <h2 className="text-center text-2xl font-bold">Sponsorlarımız</h2>
          <p className="mt-1 text-center text-sm text-slate-500">
            Alfabe Mail&apos;i destekleyen kurumlar
          </p>
          <SponsorCarousel sponsors={sponsorData} />
        </section>
      )}

      <div className="mt-16 grid w-full gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-2xl">🎓</div>
          <h2 className="mt-2 text-lg font-bold">Öğrenci Portalı</h2>
          <p className="mt-1 text-sm text-slate-600">
            Kullanıcı adın ile giriş yap, güvenli bir şekilde mail gönder ve al, ödevlerini takip et.
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-2xl">👩‍🏫</div>
          <h2 className="mt-2 text-lg font-bold">Öğretmen Paneli</h2>
          <p className="mt-1 text-sm text-slate-600">
            Sınıf oluştur, öğrenci ekle, ödev ata ve öğrencilerinin mail akışını yönet.
          </p>
        </div>
      </div>

      <p className="mt-10 text-xs text-slate-400">
        {mailAddress("info")} · Güvenli Okul E-posta Sistemi
      </p>
    </main>
  );
}
