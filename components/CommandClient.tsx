"use client";

// KisanVaani Ops — professional command center for District Agriculture Officers.
// White-theme, data-first console: overview KPIs + charts, weather alerts,
// disease outbreaks, RSK/KVK escalation queue, broadcast log, farmer registry.

import { useCallback, useRef, useState } from "react";
import { CircleCheck } from "lucide-react";
import type { EscalationTicket } from "@/lib/types";
import { BROADCAST_SEED, ESCALATIONS, type BroadcastRecord } from "@/lib/opsData";
import Sidebar, { type OpsTab } from "./command/Sidebar";
import TopBar from "./command/TopBar";
import KpiCards from "./command/KpiCards";
import { LanguageDonut, QueryVolumeChart, TopCropsChart } from "./command/Charts";
import QueryFeedTable from "./command/QueryFeedTable";
import AlertsPanel from "./command/AlertsPanel";
import OutbreaksPanel from "./command/OutbreaksPanel";
import EscalationsPanel from "./command/EscalationsPanel";
import BroadcastsPanel from "./command/BroadcastsPanel";
import RegistryTable from "./command/RegistryTable";
import BroadcastComposer, { type ComposeTarget } from "./command/BroadcastComposer";

export default function CommandClient() {
  const [tab, setTab] = useState<OpsTab>("overview");
  const [district, setDistrict] = useState("All districts");

  // escalation tickets are mutable local state (assign / reply / close actions)
  const [tickets, setTickets] = useState<EscalationTicket[]>(ESCALATIONS);
  const updateTicket = useCallback((id: string, patch: Partial<EscalationTicket>) => {
    setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }, []);

  // broadcast log grows as the composer queues sends
  const [broadcasts, setBroadcasts] = useState<BroadcastRecord[]>(BROADCAST_SEED);
  const [composeTarget, setComposeTarget] = useState<ComposeTarget | null>(null);
  const nextBrdId = useRef(1042);

  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 4500);
  }, []);

  const queueBroadcast = useCallback(
    ({ target, message, channels }: { target: ComposeTarget; message: string; channels: string[] }) => {
      const id = `BRD-${nextBrdId.current++}`;
      const rec: BroadcastRecord = {
        id,
        createdAt: new Date().toISOString(),
        kind: target.kind,
        title: target.title,
        district: target.district,
        state: target.state,
        language: target.language,
        channels,
        recipients: target.recipients,
        sent: 0,
        delivered: 0,
        heard: 0,
        status: "queued",
        message,
      };
      setBroadcasts((prev) => [rec, ...prev]);
      showToast(`Broadcast queued · #${id}`);
      // simulate the gateway completing the send
      setTimeout(() => {
        setBroadcasts((prev) =>
          prev.map((b) =>
            b.id === id
              ? {
                  ...b,
                  status: "completed",
                  sent: b.recipients,
                  delivered: Math.round(b.recipients * 0.95),
                  heard: channels.includes("Voice call") ? Math.round(b.recipients * 0.72) : 0,
                }
              : b
          )
        );
      }, 6000);
    },
    [showToast]
  );

  const openEscalations = tickets.filter((t) => t.status === "pending" || t.status === "assigned").length;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <Sidebar
        tab={tab}
        onTab={setTab}
        badges={{ escalations: openEscalations, alerts: 4, outbreaks: 3 }}
      />

      <div className="pl-52">
        <TopBar tab={tab} district={district} onDistrict={setDistrict} />

        <main className="space-y-4 p-4 lg:p-6">
          {tab === "overview" && (
            <>
              <KpiCards />
              <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr_1fr]">
                <QueryVolumeChart />
                <LanguageDonut />
                <TopCropsChart />
              </div>
              <QueryFeedTable district={district} />
            </>
          )}

          {tab === "alerts" && <AlertsPanel district={district} onCompose={setComposeTarget} />}

          {tab === "outbreaks" && <OutbreaksPanel district={district} onCompose={setComposeTarget} />}

          {tab === "escalations" && (
            <EscalationsPanel district={district} tickets={tickets} onUpdate={updateTicket} />
          )}

          {tab === "broadcasts" && <BroadcastsPanel district={district} broadcasts={broadcasts} />}

          {tab === "registry" && <RegistryTable district={district} />}
        </main>
      </div>

      <BroadcastComposer target={composeTarget} onClose={() => setComposeTarget(null)} onSend={queueBroadcast} />

      {toast && (
        <div className="rise fixed bottom-5 left-1/2 z-50 -translate-x-1/2" role="status" aria-live="polite">
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 shadow-lg">
            <CircleCheck className="size-4 text-emerald-600" aria-hidden="true" />
            {toast}
          </div>
        </div>
      )}
    </div>
  );
}
