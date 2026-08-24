"use client";

import { useState } from "react";
import Link from "next/link";

type AccountType = "ogrenci" | "ogretmen";

export default function KayitPage() {
  const [accountType, setAccountType] = useState<AccountType>("ogrenci");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const payload =
        accountType === "ogretmen"
          ? { accountType, firstName, lastName, email, password }
          : { accountType, username, displayName, password };

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Kayıt başarısız.");
        return;
      }
      setSuccess(data.message);
    } catch {
      setError("Sunucuya ulaşılamadı.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6 py-12">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <Link href="/" className="text-sm text-indigo-600 hover:underline">
          ← Ana sayfa
        </Link>
        <h1 className="mt-4 text-2xl font-bold">Kayıt Ol</h1>

        <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
          {(["ogrenci", "ogretmen"] as AccountType[]).map((t) => (
            <button
              key={t}
              onClick={() => {
                setAccountType(t);
                setError(null);
                setSuccess(null);
              }}
              className={`rounded-lg py-2 text-sm font-semibold transition ${
                accountType === t ? "bg-white text-indigo-700 shadow" : "text-slate-500"
              }`}
            >
              {t === "ogrenci" ? "🎓 Öğrenci" : "👩‍🏫 Öğretmen"}
            </button>
          ))}
        </div>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          {accountType === "ogrenci" ? (
            <>
              <div>
                <label className="mb-1 block text-sm font-medium">Kullanıcı adı</label>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="ornek: ali.yilmaz"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
                  required
                />
                <p className="mt-1 text-xs text-slate-400">
                  Mail adresiniz: {username || "kullanici"}@alfabe.co
                </p>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Görünen ad</label>
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Ali Yılmaz"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Şifre</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
                  required
                />
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium">Ad</label>
                  <input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Soyad</label>
                  <input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Kurumsal / Kişisel E-posta</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ogretmen@okul.k12.tr"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Şifre (en az 8 karakter)</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
                  required
                />
              </div>
            </>
          )}

          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
          )}
          {success && (
            <div className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{success}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-indigo-600 py-2.5 font-semibold text-white shadow hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? "Kaydediliyor..." : "Kayıt Ol"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Zaten hesabınız var mı?{" "}
          <Link href="/giris" className="font-medium text-indigo-600 hover:underline">
            Giriş yapın
          </Link>
        </p>
      </div>
    </main>
  );
}
