import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { FALLBACK_ADVISORY, type Lang } from "@/lib/data";

const LANG_NAME: Record<Lang, string> = {
  hi: "Hindi (Devanagari script)",
  en: "simple Indian English",
  mr: "Marathi (Devanagari script)",
  te: "Telugu (Telugu script)",
};

export async function POST(req: NextRequest) {
  const { query, lang = "hi", channel = "ivr" } = (await req.json()) as {
    query: string;
    lang: Lang;
    channel: "ivr" | "sms";
  };

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ text: FALLBACK_ADVISORY[lang][channel], source: "fallback" });
  }

  const channelRules =
    channel === "sms"
      ? `This reply will be sent as an SMS to a basic feature phone.
- Maximum 300 characters total.
- Use the native script of the language.
- Include: likely problem, 1-2 concrete actions with exact dosage (e.g. "नीम तेल 5ml/L"), and the Kisan Call Centre number 1800-180-1551.
- No markdown, no emojis except at most one ⚠️.`
      : `This reply will be READ ALOUD over a phone call (IVR) to a farmer who may not read or write.
- Spoken, warm, conversational style — like a trusted agriculture officer.
- 60-90 words. Short sentences.
- Say numbers and dosages in words where natural.
- No markdown, no lists, no symbols — pure speakable text.
- End by telling them they can call again anytime.`;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const result = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
      contents: `A farmer contacted the KisanVaani crop advisory line. Their message (may be shorthand SMS code or spoken sentence): "${query}"`,
      config: {
        systemInstruction: `You are KisanVaani, an expert Indian agricultural extension advisor (like a Krishi Vigyan Kendra scientist). You give practical, safe, low-cost advice suited to smallholder farmers in India. Prefer IPM/organic first, then chemical options with exact dosages. Respond ONLY in ${LANG_NAME[lang]}.\n${channelRules}`,
        temperature: 0.4,
      },
    });
    const text = result.text?.trim();
    if (!text) throw new Error("empty response");
    return NextResponse.json({ text, source: "gemini" });
  } catch (err) {
    console.error("advisory gemini error:", err instanceof Error ? err.message : err);
    return NextResponse.json({ text: FALLBACK_ADVISORY[lang][channel], source: "fallback" });
  }
}
