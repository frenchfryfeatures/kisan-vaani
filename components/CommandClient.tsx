"use client";

import { useState } from "react";
import Link from "next/link";
import { QUERY_FEED, OUTBREAKS, WEEKLY_TREND } from "@/lib/data";

const CHANNEL_ICON: Record<string, string> = { call: "📞", sms: "✉️", photo: "📷" };

export default function CommandClient() {
  const [broadcast, setBroadcast] = useState<Record<number, "idle" | "sending" | "sent">>({});

  const sendAlert = (i: number) => {
    setBroadcast((b) => ({ ...b, [i]: "sending" }));
    setTimeout(() => setBroadcast((b) => ({ ...b, [i]: "sent" })), 1600);
  };

  const maxQ = Math.max(...WEEKLY_TREND.map((d) => d.queries));

  return (
    <div className="min-h-screen bg-[#10241a] text-paper">
      <nav className="border-b border-white/10 sticky top-0 z-20 bg-[#10241a]/90 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
          <Link href="/" className="font-display text-xl font-semibold">🌾 KisanVaani</Link>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-turmeric-soft font-medium">Kisan Alert · Command Center</span>
            <Link href="/demo" className="text-paper/70 hover:text-paper">Farmer Demo</Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-semibold">Sehore District — Agriculture Command Center</h1>
            <p className="text-paper/60 mt-1 text-sm">
              The view for the MP&rsquo;s office, District Agriculture Officer &amp; KVK — every farmer query becomes early-warning data.
            </p>
          </div>
          <div className="text-xs bg-white/10 rounded-full px-3 py-1.5">🔴 Live · Tue 8 Jul 2026, 14:20 IST</div>
        </header>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Queries today", value: "178", sub: "↑ 38% vs last Tue" },
            { label: "Farmers registered", value: "12,438", sub: "across 214 villages" },
            { label: "Active outbreak alerts", value: "2", sub: "1 high · 1 medium" },
            { label: "Advisories delivered", value: "41,209", sub: "since pilot start" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl bg-white/5 border border-white/10 p-4">
              <div className="text-2xl font-semibold font-display">{s.value}</div>
              <div className="text-xs text-paper/60 mt-0.5">{s.label}</div>
              <div className="text-[11px] text-leaf-mist/60 mt-1">{s.sub}</div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-[1.2fr_1fr] gap-6 items-start">
          {/* Left column: outbreaks + trend */}
          <div className="space-y-6">
            <section>
              <h2 className="text-sm font-bold tracking-widest text-paper/50 mb-3">⚠️ OUTBREAK DETECTION (auto-clustered from queries)</h2>
              <div className="space-y-4">
                {OUTBREAKS.map((o, i) => (
                  <div key={o.disease} className={`rounded-2xl border p-5 ${
                    o.severity === "high" ? "bg-red-950/40 border-red-500/30" : "bg-amber-950/30 border-amber-500/30"
                  }`}>
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <div className="font-display text-xl font-semibold">{o.disease}</div>
                        <div className="text-sm text-paper/60">{o.block}</div>
                      </div>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        o.severity === "high" ? "bg-red-500/20 text-red-300" : "bg-amber-500/20 text-amber-300"
                      }`}>
                        {o.severity.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-4 mt-3 text-sm">
                      <span><b>{o.reports}</b> reports this week</span>
                      <span className="text-red-300">{o.delta}</span>
                      <span><b>{o.farmersInRadius.toLocaleString()}</b> farmers in {o.radiusKm} km radius</span>
                    </div>
                    <div className="mt-3 rounded-lg bg-black/30 p-3 text-sm text-paper/80 font-mono leading-relaxed">
                      {o.alertText}
                    </div>
                    <button
                      onClick={() => sendAlert(i)}
                      disabled={broadcast[i] === "sending" || broadcast[i] === "sent"}
                      className={`mt-3 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                        broadcast[i] === "sent"
                          ? "bg-leaf-bright/20 text-leaf-mist cursor-default"
                          : "bg-turmeric text-white hover:bg-turmeric/90"
                      }`}
                    >
                      {broadcast[i] === "sending" && "Broadcasting via voice + SMS…"}
                      {broadcast[i] === "sent" && `✓ Alert sent to ${o.farmersInRadius.toLocaleString()} farmers (voice call + SMS)`}
                      {!broadcast[i] && `📢 Broadcast alert to ${o.farmersInRadius.toLocaleString()} farmers`}
                    </button>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl bg-white/5 border border-white/10 p-5">
              <h2 className="text-sm font-bold tracking-widest text-paper/50 mb-4">QUERIES — LAST 7 DAYS</h2>
              <div className="flex items-end gap-3 h-36">
                {WEEKLY_TREND.map((d, i) => (
                  <div key={d.day} className="flex-1 flex flex-col items-center gap-1.5">
                    <div className="text-xs text-paper/70">{d.queries}</div>
                    <div
                      className={`w-full rounded-t-md grow-bar ${i === WEEKLY_TREND.length - 1 ? "bg-turmeric" : "bg-leaf-bright/70"}`}
                      style={{ height: `${(d.queries / maxQ) * 100}%`, animationDelay: `${i * 60}ms` }}
                    />
                    <div className="text-[11px] text-paper/50">{d.day}</div>
                  </div>
                ))}
              </div>
              <div className="text-[11px] text-paper/40 mt-3">
                Spike in cotton queries preceded the leaf-curl outbreak flag by 4 days — the early-warning window that matters.
              </div>
            </section>
          </div>

          {/* Right column: live feed */}
          <section className="rounded-2xl bg-white/5 border border-white/10 p-5">
            <h2 className="text-sm font-bold tracking-widest text-paper/50 mb-4">LIVE QUERY FEED</h2>
            <div className="space-y-3">
              {QUERY_FEED.map((q, i) => (
                <div key={i} className="flex gap-3 items-start rounded-xl bg-black/20 p-3 rise" style={{ animationDelay: `${i * 50}ms` }}>
                  <div className="text-lg">{CHANNEL_ICON[q.channel]}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between gap-2">
                      <span className="text-sm font-semibold truncate">{q.name}</span>
                      <span className="text-[11px] text-paper/40 shrink-0">{q.time}</span>
                    </div>
                    <div className="text-xs text-paper/60">{q.village}, {q.block} · {q.crop}</div>
                    <div className="text-xs text-paper/80 mt-1">&ldquo;{q.issue}&rdquo;</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-[11px] text-paper/40 mt-4">
              Anonymised &amp; geotagged by cell tower. Personally identifiable details visible only to authorised KVK officers.
            </div>
          </section>
        </div>

        <div className="mt-8 rounded-2xl bg-white/5 border border-white/10 p-5 text-sm text-paper/70">
          <b className="text-paper">Why MPs &amp; districts want this:</b> today, disease outbreaks surface only when crop loss is
          already visible — weeks late. Because every KisanVaani call, SMS and photo is a structured, geotagged signal, the
          district sees outbreaks forming in <b>days, not weeks</b>, and can push voice alerts to exactly the affected villages.
          That is the &ldquo;Alert&rdquo; in Kisan Alert.
        </div>
      </main>
    </div>
  );
}
