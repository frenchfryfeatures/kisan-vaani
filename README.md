# 🌾 KisanVaani — किसानवाणी

**Voice & SMS crop advisory in Indic languages, with Gemini-powered disease diagnosis from photos — designed for low-connectivity, non-smartphone farmers.**

Built for **Build with AI: Code for Communities** (Google Cloud × Hack2Skill) — **Track 4: Kisan Alert**, a problem statement submitted by a sitting Member of Parliament.

> आवाज़ ही असली ऐप है — *the voice is the real app.*

## The gap we close

India has 146M+ farm holdings, 86% of them smallholders. Roughly **45% of rural users are on feature phones** — no apps, no data plans, often oral-first communication. Existing agri-advisory apps assume a smartphone the farmer doesn't have. Meanwhile 15–25% of yield is lost to pests and disease, and there is ~1 extension officer per 1,100 farmers.

KisanVaani meets farmers on the phones they already own:

| Channel | How it works | Farmer needs |
|---|---|---|
| 📞 **Voice call (IVR)** | Farmer dials a toll-free number, speaks their problem in their language, hears the advisory on the same call | any phone, zero literacy |
| ✉️ **SMS** | Shorthand like `KAPAS PILA PATTA` → native-script reply with exact dosages in ≤2 SMS segments | any handset, 2G |
| 📷 **Photo → voice note** | Farmer (or the village relay worker / sahayak) sends a crop photo; Gemini diagnoses; farmer receives a spoken voice note in their language | one smartphone per village |

### The "Alert" layer — what makes this bigger than an answer-bot

Every call, SMS and photo is a structured, geotagged signal. When reports of the same disease cluster in one block, KisanVaani flags an **outbreak days before it becomes visible crop loss** and lets the District Agriculture Officer broadcast a voice + SMS alert to every registered farmer in the affected radius. That district command center is the view built for the MP's office, DAO and KVK.

## Live demo

- **Landing / pitch:** `/`
- **Farmer simulator** (feature phone with IVR + SMS + photo diagnosis): `/demo`
- **District command center** (outbreak detection + broadcast): `/command`

The simulator reproduces the farmer experience in the browser: browser speech-synthesis stands in for the IVR line, and the SMS thread stands in for the gateway. **The AI is real** — advisory generation and photo diagnosis are live Gemini 2.5 Flash calls. Try uploading any crop/leaf photo.

## Architecture

```
Farmer (feature phone)
  │  voice call / SMS / photo-via-relay
  ▼
IVR + SMS gateway (Exotel/Twilio; simulated in browser for the demo)
  │  ASR: Bhashini / Google Cloud Speech (Indic)   [demo: Web Speech API]
  ▼
Gemini 2.5 Flash (Google AI)
  ├─ advisory generation in hi/en/mr/te (channel-aware: spoken style vs ≤300-char SMS)
  ├─ multimodal disease diagnosis with schema-enforced structured JSON output
  └─ grounding roadmap: Kisan Call Centre Q&A corpus (AIKosh), crop calendars, IMD weather
  ▼
Reply: TTS voice on the same call / native-script SMS / voice note
  ▼
Kisan Alert command center — every query logged, geotagged (cell tower),
clustered into outbreak early-warnings, broadcast to affected villages
```

**Graceful degradation:** if the Gemini API is unreachable, every endpoint serves expert-written cached advisories — the farmer always gets an answer.

## Stack

- **Next.js 16** (App Router) + React 19 + Tailwind v4
- **`@google/genai`** — Gemini 2.5 Flash: text advisory + multimodal vision with `responseSchema` structured output
- Web Speech API (TTS + ASR) simulating the telephony voice channel
- Production path: Vertex AI, Cloud Speech / Bhashini ASR-TTS, Exotel IVR + SMS shortcode

## Run locally

```bash
npm install
echo "GEMINI_API_KEY=your_key" > .env.local   # aistudio.google.com — free tier works
npm run dev -- -p 3100
```

Without a key the app still runs fully on cached fallback advisories.

## Pilot plan (what we'd do with the MP's office)

1. **Weeks 1–4:** toll-free line + SMS shortcode live in one block (~2,000 farmers), onboarding via gram panchayat & KVK, registration by missed call.
2. **Months 2–4:** district scale; KVK scientists review low-confidence diagnoses (every correction improves the corpus); outbreak alerts go live.
3. **Unit economics:** < ₹12 per farmer per season (~6 advisories + 2 alerts) — cheaper than one wasted pesticide spray.

## Data & grounding sources

- [Kisan Call Centre transcripts (AIKosh / IndiaAI)](https://aikosh.indiaai.gov.in/home/datasets/details/kisan_call_centre_kcc_transcripts_of_farmers_queries_and_answers.html) — real farmer Q&A for grounding and evaluation
- ICAR/KVK package-of-practices for dosage guardrails
- IMD district forecasts for weather-aware advisories (roadmap)

---

*Built with ❤️ for the farmers of India.*
