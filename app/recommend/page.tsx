import type { Metadata } from "next";
import RecommendClient from "@/components/RecommendClient";

export const metadata: Metadata = {
  title: "Crop Advisor — KisanVaani",
  description:
    "What should I sow? Satellite soil grids (ISRIC), Soil Health Card records, a 16-day forecast and live Agmarknet mandi prices — reasoned over ICAR agronomy into ranked crop recommendations for your plot.",
};

export default function RecommendPage() {
  return <RecommendClient />;
}
