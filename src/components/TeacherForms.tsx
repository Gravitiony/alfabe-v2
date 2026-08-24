"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ClassOption {
  id: string;
  name: string;
}

export function CreateClassForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    try {
      const res = await fetch("/api/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      setMsg(res.ok ? `Sınıf oluşturuldu: ${data.classroom.name}` : data.error);
      if (res.ok) {
        setName("");
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex gap-2">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Sınıf adı, örn. 5-A"
        className="flex-1 rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
        required
      />
      <button
        type="submit"
        disabled={loading}
        className="whitespace-nowrap rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white shadow hover:bg-indigo-700 disabled:opacity-50"
      >
        Sınıf Oluştur
      </button>
      {msg && <span className="self-center text-xs text-slate-500">{msg}</span>}
    </form>
  );
}

export function AddStudentForm({ classrooms }: { classrooms: ClassOption[] }) {
  const router = useRouter();
  const [classId, setClassId] = useState(classrooms[0]?.id ?? "");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    try {
      const res = await fetch("/api/classes/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classId, username, displayName, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setMsg({
          ok: true,
          text: `Öğrenci eklendi: ${username}@alfabe.co`,
        });
        setUsername("");
        setDisplayName("");
        setPassword("");
        router.refresh();
      } else {
        setMsg({ ok: false, text: data.error || "Hata" });
      }
    } finally {
      setLoading(false);
    }
  }

  if (classrooms.length === 0)
    return (
      <p className="text-sm text-slate-400">Öğrenci eklemek için önce bir sınıf oluşturun.</p>
    );

  return (
    <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
      <select
        value={classId}
        onChange={(e) => setClassId(e.target.value)}
        className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
      >
        {classrooms.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <input
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Öğrenci kullanıcı adı"
        className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
        required
      />
      <input
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        placeholder="Ad Soyad"
        className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Geçici şifre"
        className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
        required
      />
      <div className="sm:col-span-2 flex items-center gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white shadow hover:bg-indigo-700 disabled:opacity-50"
        >
          Öğrenci Ekle
        </button>
        {msg && (
          <span className={`text-xs ${msg.ok ? "text-green-600" : "text-red-600"}`}>
            {msg.text}
          </span>
        )}
      </div>
    </form>
  );
}

export function AssignHomeworkForm({ classrooms }: { classrooms: ClassOption[] }) {
  const router = useRouter();
  const [classId, setClassId] = useState(classrooms[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    try {
      const res = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classId, title, description, dueAt }),
      });
      const data = await res.json();
      if (res.ok) {
        setMsg("Ödev atandı.");
        setTitle("");
        setDescription("");
        setDueAt("");
        router.refresh();
      } else {
        setMsg(data.error || "Hata");
      }
    } finally {
      setLoading(false);
    }
  }

  if (classrooms.length === 0)
    return <p className="text-sm text-slate-400">Ödev atamak için önce bir sınıf oluşturun.</p>;

  return (
    <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
      <select
        value={classId}
        onChange={(e) => setClassId(e.target.value)}
        className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
      >
        {classrooms.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Ödev başlığı"
        className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
        required
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Açıklama"
        rows={3}
        className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500 sm:col-span-2"
      />
      <label className="text-xs text-slate-500 sm:col-span-1">
        Son tarih
        <input
          type="datetime-local"
          value={dueAt}
          onChange={(e) => setDueAt(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
        />
      </label>
      <div className="flex items-center gap-3 sm:col-span-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white shadow hover:bg-indigo-700 disabled:opacity-50"
        >
          Ödev Ata
        </button>
        {msg && <span className="text-xs text-slate-500">{msg}</span>}
      </div>
    </form>
  );
}
