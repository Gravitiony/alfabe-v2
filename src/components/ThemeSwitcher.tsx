"use client";

import { useEffect, useState } from "react";

const THEMES = [
  { id: "acik", icon: "☀️", label: "Aydınlık" },
  { id: "koyu", icon: "🌙", label: "Karanlık" },
  { id: "okyanus", icon: "🌊", label: "Okyanus" },
] as const;

export default function ThemeSwitcher() {
  const [active, setActive] = useState<string>("acik");

  useEffect(() => {
    setActive(document.documentElement.dataset.theme || "acik");
  }, []);

  function pick(id: string) {
    if (id === "acik") {
      delete document.documentElement.dataset.theme;
    } else {
      document.documentElement.dataset.theme = id;
    }
    localStorage.setItem("alfabe-theme", id);
    document.cookie = `alfabe-theme=${id};path=/;max-age=31536000`;
    setActive(id);
  }

  return (
    <div
      className="fixed bottom-4 right-4 z-40 flex items-center gap-1 rounded-full border border-slate-200 bg-white/95 p-1 shadow-lg backdrop-blur"
      role="group"
      aria-label="Tema seçimi"
    >
      {THEMES.map((t) => (
        <button
          key={t.id}
          onClick={() => pick(t.id)}
          title={t.label}
          aria-label={t.label}
          aria-pressed={active === t.id}
          className={`rounded-full px-3 py-1.5 text-sm transition ${
            active === t.id ? "bg-indigo-600 text-white shadow" : "hover:bg-slate-100"
          }`}
        >
          {t.icon}
        </button>
      ))}
    </div>
  );
}
