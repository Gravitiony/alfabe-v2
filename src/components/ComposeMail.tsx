"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ComposeMail() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOkMsg(null);
    setLoading(true);
    try {
      const res = await fetch("/api/mails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, subject, body }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gönderim başarısız.");
        return;
      }
      setOkMsg("Mailiniz gönderildi.");
      setTo("");
      setSubject("");
      setBody("");
      router.refresh();
    } catch {
      setError("Sunucuya ulaşılamadı.");
    } finally {
      setLoading(false);
    }
  }

  if (!open)
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-indigo-600 px-5 py-2.5 font-semibold text-white shadow hover:bg-indigo-700"
      >
        ✉️ Mail Yaz
      </button>
    );

  return (
    <div className="w-full rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold">Yeni Mail</h2>
        <button onClick={() => setOpen(false)} className="text-sm text-slate-500 hover:underline">
          Kapat
        </button>
      </div>
      <form onSubmit={onSubmit} className="space-y-3">
        <input
          value={to}
          onChange={(e) => setTo(e.target.value)}
          placeholder="alici@alfabe.co veya dis e-posta adresi"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
          required
        />
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Konu"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
          required
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Mesajınız..."
          rows={6}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
          required
        />
        {error && (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        )}
        {okMsg && (
          <div className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{okMsg}</div>
        )}
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-indigo-600 px-5 py-2.5 font-semibold text-white shadow hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "Gönderiliyor..." : "Gönder"}
        </button>
      </form>
    </div>
  );
}
