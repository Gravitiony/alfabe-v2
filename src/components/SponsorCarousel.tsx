"use client";

import { useEffect, useState } from "react";

export interface SponsorItem {
  id: string;
  name: string;
  logoUrl: string;
  websiteUrl: string;
}

export default function SponsorCarousel({ sponsors }: { sponsors: SponsorItem[] }) {
  const [perView, setPerView] = useState(4);
  const [offset, setOffset] = useState(0);
  const [animated, setAnimated] = useState(true);
  const [paused, setPaused] = useState(false);

  const n = sponsors.length;

  useEffect(() => {
    function onResize() {
      const w = window.innerWidth;
      setPerView(w < 640 ? 2 : w < 1024 ? 3 : 4);
    }
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (paused || n <= perView) return;
    const t = setInterval(() => setOffset((o) => o + 1), 3000);
    return () => clearInterval(t);
  }, [paused, n, perView]);

  useEffect(() => {
    if (!animated) {
      const raf = requestAnimationFrame(() =>
        requestAnimationFrame(() => setAnimated(true))
      );
      return () => cancelAnimationFrame(raf);
    }
  }, [animated]);

  if (n === 0) return null;

  const items = [...sponsors, ...sponsors, ...sponsors];

  function onTransitionEnd() {
    if (offset >= n) {
      setAnimated(false);
      setOffset((o) => o - n);
    }
  }

  return (
    <div
      className="mx-auto mt-8 max-w-4xl overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        className="flex"
        style={{
          transform: `translateX(-${offset * (100 / perView)}%)`,
          transition: animated ? "transform 600ms ease" : "none",
        }}
        onTransitionEnd={onTransitionEnd}
      >
        {items.map((s, i) => (
          <div
            key={`${s.id}-${i}`}
            className="flex-none px-3"
            style={{ width: `${100 / perView}%` }}
          >
            <a
              href={s.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              title={s.name}
              className="group block text-center"
            >
              <img
                src={s.logoUrl}
                alt={s.name}
                className="mx-auto h-20 w-20 rounded-full border border-slate-200 bg-white object-cover p-1 shadow-sm transition group-hover:scale-110 group-hover:border-indigo-400 md:h-24 md:w-24"
              />
              <span className="mt-2 block truncate text-xs font-medium text-slate-600 group-hover:text-indigo-600">
                {s.name}
              </span>
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
