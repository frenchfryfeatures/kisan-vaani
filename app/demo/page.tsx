import type { Metadata } from "next";
import DemoClient from "@/components/DemoClient";

export const metadata: Metadata = {
  title: "Live Demo — KisanVaani",
  description: "Experience the farmer's side: IVR voice call, SMS advisory, and Gemini photo diagnosis on a simulated feature phone.",
};

export default function DemoPage() {
  return <DemoClient />;
}
