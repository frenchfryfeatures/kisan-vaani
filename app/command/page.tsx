import type { Metadata } from "next";
import CommandClient from "@/components/CommandClient";

export const metadata: Metadata = {
  title: "Kisan Alert Command Center — KisanVaani",
  description: "District-level outbreak detection and alert broadcast, powered by aggregated farmer queries.",
};

export default function CommandPage() {
  return <CommandClient />;
}
