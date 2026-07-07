import { LIVE_FEED } from "@/lib/opsData";
import { ChannelBadge, EmptyState, SectionCard, TableShell, Td, Th } from "./ui";

const RES_STYLE: Record<string, string> = {
  ai: "bg-emerald-50 text-emerald-700 border-emerald-200",
  escalated: "bg-amber-50 text-amber-700 border-amber-200",
  pending: "bg-slate-50 text-slate-500 border-slate-200",
};
const RES_LABEL: Record<string, string> = { ai: "AI-resolved", escalated: "Escalated", pending: "Pending" };

export default function QueryFeedTable({ district }: { district: string }) {
  const rows = LIVE_FEED.filter((r) => district === "All districts" || r.district === district);

  return (
    <SectionCard title="Live query feed" sub="Most recent farmer queries across channels" pad={false}>
      {rows.length === 0 ? (
        <EmptyState title={`No queries from ${district} in the last hour`} hint="Switch to All districts to see the national feed." />
      ) : (
        <TableShell maxH="max-h-80">
          <thead>
            <tr>
              <Th>Farmer</Th>
              <Th>Location</Th>
              <Th>Channel</Th>
              <Th>Language</Th>
              <Th>Crop</Th>
              <Th>Issue</Th>
              <Th>Resolution</Th>
              <Th right>Received</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={`${r.name}-${i}`} className="hover:bg-slate-50">
                <Td className="font-medium text-slate-900">{r.name}</Td>
                <Td>
                  {r.village}, {r.district}
                  <span className="ml-1 text-slate-400">· {r.state}</span>
                </Td>
                <Td><ChannelBadge channel={r.channel} /></Td>
                <Td>{r.lang}</Td>
                <Td>{r.crop}</Td>
                <Td className="max-w-56 truncate">{r.issue}</Td>
                <Td>
                  <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${RES_STYLE[r.resolution]}`}>
                    {RES_LABEL[r.resolution]}
                  </span>
                </Td>
                <Td right className="text-slate-400">{r.time}</Td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      )}
    </SectionCard>
  );
}
