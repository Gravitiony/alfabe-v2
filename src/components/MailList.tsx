"use client";

import { useEffect, useState } from "react";

export interface MailItem {
  id: string;
  subject: string;
  body: string;
  fromName?: string | null;
  fromUsername?: string | null;
  toAddress?: string;
  status?: string;
  createdAt: string;
}

interface Props {
  mails: MailItem[];
  variant?: "inbox" | "sent";
  emptyText?: string;
}

function statusBadge(status?: string) {
  if (status === "FAILED")
    return { cls: "bg-red-100 text-red-700", text: "Başarısız" };
  return { cls: "bg-green-100 text-green-700", text: "Gönderildi" };
}

function fmt(dateStr: string) {
  return new Date(dateStr).toLocaleString("tr-TR");
}

export default function MailList({ mails, variant = "inbox", emptyText }: Props) {
  const [selected, setSelected] = useState<MailItem | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setSelected(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (mails.length === 0)
    return (
      <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-400">
        {emptyText ?? "Henüz mailiniz yok."}
      </p>
    );

  return (
    <>
      <ul className="space-y-3">
        {mails.map((m) => (
          <li key={m.id}>
            <button
              onClick={() => setSelected(m)}
              className="w-full rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-indigo-300 hover:shadow-md"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold">{m.subject}</span>
                {variant === "inbox" ? (
                  <span className="text-xs text-slate-400">detay için tıklayın →</span>
                ) : (
                  (() => {
                    const s = statusBadge(m.status);
                    return (
                      <span className={`rounded-full px-2 py-0.5 text-xs ${s.cls}`}>
                        {s.text}
                      </span>
                    );
                  })()
                )}
              </div>
              <p className="mt-0.5 truncate text-xs text-slate-500">
                {variant === "inbox"
                  ? `${m.fromName ?? m.fromUsername ?? "sistem"} · ${fmt(m.createdAt)}`
                  : `${m.toAddress} · ${fmt(m.createdAt)}`}
              </p>
              <p className="mt-2 line-clamp-1 text-sm text-slate-600">
                {m.body.replace(/\s+/g, " ").slice(0, 120)}
              </p>
            </button>
          </li>
        ))}
      </ul>

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <h3 className="text-xl font-bold">{selected.subject}</h3>
              <button
                onClick={() => setSelected(null)}
                className="rounded-full px-2 py-0.5 text-lg leading-none text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Kapat"
              >
                ×
              </button>
            </div>

            <dl className="mt-4 grid gap-x-6 gap-y-1 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-[auto_1fr]">
              {variant === "inbox" ? (
                <div className="contents">
                  <dt className="font-medium text-slate-500">Kimden:</dt>
                  <dd>
                    {selected.fromName ?? selected.fromUsername ?? "sistem"}
                    {selected.fromUsername && (
                      <span className="ml-1 font-mono text-xs text-slate-400">
                        @{selected.fromUsername}
                      </span>
                    )}
                  </dd>
                </div>
              ) : (
                <div className="contents">
                  <dt className="font-medium text-slate-500">Kime:</dt>
                  <dd className="font-mono text-xs sm:text-sm">{selected.toAddress}</dd>
                </div>
              )}
              <dt className="font-medium text-slate-500">Tarih:</dt>
              <dd>{fmt(selected.createdAt)}</dd>
              <dt className="font-medium text-slate-500">Durum:</dt>
              <dd>
                {(() => {
                  const s = statusBadge(selected.status);
                  return (
                    <span className={`rounded-full px-2 py-0.5 text-xs ${s.cls}`}>{s.text}</span>
                  );
                })()}
              </dd>
            </dl>

            <hr className="my-4 border-slate-200" />
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800">
              {selected.body}
            </p>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelected(null)}
                className="rounded-lg bg-indigo-600 px-5 py-2 font-semibold text-white shadow hover:bg-indigo-700"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
