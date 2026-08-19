"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function SearchForm({ compact }: { compact?: boolean }) {
  const router = useRouter();
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get("q") ?? "");
  const [druk, setDruk] = useState(sp.get("druk") ?? "");
  const [from, setFrom] = useState(sp.get("from") ?? "");
  const [to, setTo] = useState(sp.get("to") ?? "");
  const [result, setResult] = useState(sp.get("result") ?? "");
  const [open, setOpen] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (druk.trim()) params.set("druk", druk.trim());
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (result) params.set("result", result);
    router.push(`/glosowania${params.toString() ? `?${params}` : ""}`);
  }

  const input =
    "w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/40";

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Szukaj głosowania — np. „podatek”, „mieszkania”, „Ukraina”"
          className={`${input} ${compact ? "" : "py-3 text-base"}`}
          aria-label="Szukaj głosowania"
        />
        <button
          type="submit"
          className="shrink-0 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 text-sm transition-colors"
        >
          Szukaj
        </button>
      </div>

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="text-xs font-semibold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
      >
        {open ? "− Ukryj filtry" : "+ Filtry zaawansowane"}
      </button>

      {open && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <label className="text-[11px] font-semibold text-zinc-500 space-y-1">
            Nr druku
            <input value={druk} onChange={(e) => setDruk(e.target.value)} inputMode="numeric" className={input} />
          </label>
          <label className="text-[11px] font-semibold text-zinc-500 space-y-1">
            Od
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={input} />
          </label>
          <label className="text-[11px] font-semibold text-zinc-500 space-y-1">
            Do
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={input} />
          </label>
          <label className="text-[11px] font-semibold text-zinc-500 space-y-1">
            Wynik
            <select value={result} onChange={(e) => setResult(e.target.value)} className={input}>
              <option value="">Wszystkie</option>
              <option value="passed">Przyjęte</option>
              <option value="rejected">Odrzucone</option>
            </select>
          </label>
        </div>
      )}
    </form>
  );
}
