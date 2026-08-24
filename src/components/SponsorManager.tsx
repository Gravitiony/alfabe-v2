"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export interface SponsorRow {
  id: string;
  name: string;
  logoUrl: string;
  websiteUrl: string;
  sortOrder: number;
}

export default function SponsorManager({ sponsors }: { sponsors: SponsorRow[] }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500 * 1024) {
      setMsg({ ok: false, text: "Logo en fazla 500KB olabilir." });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setLogoUrl(String(reader.result));
      setMsg({ ok: true, text: `Görsel hazır: ${file.name}` });
    };
    reader.readAsDataURL(file);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/sponsors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, websiteUrl, logoUrl, sortOrder: Number(sortOrder) }),
      });
      const data = await res.json();
      if (res.ok) {
        setMsg({ ok: true, text: `"${name}" ana sayfaya eklendi.` });
        setName("");
        setWebsiteUrl("");
        setLogoUrl("");
        setSortOrder("0");
        if (fileRef.current) fileRef.current.value = "";
        router.refresh();
      } else {
        setMsg({ ok: false, text: data.error || "Hata" });
      }
    } finally {
      setLoading(false);
    }
  }

  async function onDelete(id: string, sponsorName: string) {
    if (!confirm(`"${sponsorName}" sponsorunu silmek istiyor musunuz?`)) return;
    await fetch(`/api/admin/sponsors?id=${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="mb-1 block text-sm font-medium">Sponsor Adı</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Örn. Yıldız Kırtasiye"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Web Sitesi</label>
          <input
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            placeholder="https://ornek.com"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Logo</label>
          <div className="flex items-center gap-3">
            {logoUrl && (
              <img
                src={logoUrl}
                alt="önizleme"
                className="h-12 w-12 flex-none rounded-full border border-slate-200 bg-white object-cover p-1"
              />
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={onFile}
              className="w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-indigo-700 hover:file:bg-indigo-100"
            />
          </div>
          <input
            value={logoUrl.startsWith("data:") ? "" : logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            placeholder="veya görsel URL'si yapıştırın"
            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
          />
          <p className="mt-1 text-xs text-slate-400">En fazla 500KB · yuvarlak olarak gösterilir</p>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Sıra (küçük önce görünür)</label>
          <input
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="w-32 rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
          />
        </div>

        {msg && (
          <div
            className={`rounded-lg px-3 py-2 text-sm ${
              msg.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
            }`}
          >
            {msg.text}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-indigo-600 px-5 py-2.5 font-semibold text-white shadow hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "Ekleniyor..." : "Sponsor Ekle"}
        </button>
      </form>

      <div>
        <h3 className="mb-3 font-semibold">Mevcut Sponsorlar ({sponsors.length})</h3>
        {sponsors.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-400">
            Henüz sponsor eklenmedi.
          </p>
        ) : (
          <ul className="space-y-2">
            {sponsors.map((s) => (
              <li
                key={s.id}
                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
              >
                <img
                  src={s.logoUrl}
                  alt={s.name}
                  className="h-12 w-12 flex-none rounded-full border border-slate-200 bg-white object-cover p-1"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    <span className="mr-2 rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">
                      #{s.sortOrder}
                    </span>
                    {s.name}
                  </p>
                  <a
                    href={s.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block truncate text-xs text-indigo-600 hover:underline"
                  >
                    {s.websiteUrl.replace(/^https?:\/\//, "")}
                  </a>
                </div>
                <button
                  onClick={() => onDelete(s.id, s.name)}
                  className="flex-none rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100"
                >
                  Sil
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
