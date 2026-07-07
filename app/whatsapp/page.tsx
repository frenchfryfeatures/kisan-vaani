import type { Metadata } from "next";
import WhatsAppClient from "@/components/WhatsAppClient";

export const metadata: Metadata = {
  title: "WhatsApp Channel — KisanVaani",
  description:
    "Pixel-faithful WhatsApp Business simulator: send a crop photo or a voice note and get a Gemini diagnosis back as a voice note — plus the real wa.me deep link and the Cloud API production path.",
};

export default function WhatsAppPage() {
  return <WhatsAppClient />;
}
