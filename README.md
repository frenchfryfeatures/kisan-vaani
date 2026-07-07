# 🌾 KisanVaani — किसानवाणी

**The complete AI farm-advisory platform for the farmers every app leaves behind** — voice & SMS in 12+ Indian languages with automatic spoken-language detection, Gemini disease diagnosis from photos, satellite + Soil Health Card crop recommendations, dry-spell/heavy-rain zone alerts, live mandi prices, and human expert escalation to RSKs/KVKs.

Built by **Team Vishwakarma Devs** for **Build with AI: Code for Communities** (Google Cloud × Hack2Skill) — **Track 4: Kisan Alert**, a problem statement submitted by a sitting Member of Parliament.

> आवाज़ ही असली ऐप है — *the voice is the real app.*

## Why

India has 146M+ farm holdings, 86% smallholders. ~45% of rural users carry feature phones — no apps, no data plans, oral-first. Existing agri-apps assume a smartphone the farmer doesn't have, while 15–25% of yield is lost to pests, disease, and mistimed irrigation. KisanVaani meets farmers on the phones they already own — and turns every interaction into district-level intelligence.

## The six modules

| Module | What it does | Where |
|---|---|---|
| 📞 **Voice IVR + SMS advisory** | Farmer calls a toll-free number or texts shorthand (`KAPAS PILA PATTA`); Gemini answers in their language — spoken on the call, native-script by SMS. Press 2 for live mandi bhav. | `/demo` |
| 🗣 **Any-language auto-detect** | Farmer speaks in *any* Indian language; Gemini identifies the language from the audio itself and replies in it. 12 languages have full UI + samples; detection is unbounded. | `/demo` (Auto mode) |
| 🌱 **Smart crop recommendation** | Satellite soil grids (ISRIC SoilGrids 250m) + **live Government of India Soil Health Card data** + 16-day weather + ICAR agronomy → ranked, explained crop choices with mandi price context. | `/recommend` |
| 🌧 **Dry-spell & heavy-rain zone alerts** | IMD-threshold detection (dry spell, heavy ≥64.5mm/day, very heavy ≥115.6) across the district registry; names the **exact blocks affected**; broadcasts voice+SMS only to farmers in the zone. | `/command` → Weather Alerts |
| 💬 **WhatsApp photo & voice support** | Pixel-faithful WhatsApp flow: send a crop photo or voice note → AI diagnosis + voice-note reply. Website link reaches feature phones by SMS. | `/whatsapp` |
| 🧑‍🌾 **RSK/KVK expert escalation** | Low-confidence or severe diagnoses become tickets for Rythu Seva Kendras (AP) / Krishi Vigyan Kendras (national) with 48h SLA — AI first, humans in the loop. | `/command` → Escalations |

Plus the **Ops Command Center** (`/command`): a white-themed, government-grade console for the District Agriculture Officer and the MP's office — KPIs, weather-alert composer, outbreak radar, escalation queue, broadcast log, farmer registry.

## Real data, verified live (not mockups)

- 🇮🇳 **Soil Health Card** (soilhealth.dac.gov.in) — district N/P/K/OC/pH/micronutrient distributions, GraphQL, updated daily
- 🇮🇳 **Agmarknet 2.0 open API** (api.agmarknet.gov.in) — same-day mandi modal prices, Directorate of Marketing & Inspection
- 🛰 **ISRIC SoilGrids v2** — 250m satellite-derived soil properties + WRB classification → Indian soil types
- 🛰 **NASA POWER** — agroclimate data for any Indian coordinate
- 🌦 **Open-Meteo** — 16-day forecasts, ET₀, soil moisture (production: IMD Agromet Advisory Services)
- 📚 **ICAR / SAU Package of Practices + FAO Table 14** — embedded, citation-backed agronomy table
- 📞 **Kisan Call Centre corpus** (AIKosh/IndiaAI) — grounding roadmap

**A finding we're honest about:** no public real-time farm-level ground-sensor network exists in India today (WINDS is procurement-gated; IMD locked its AWS portal). So irrigation guidance uses satellite-derived soil moisture + ET₀ + forecast — and the production plan names ground sensors as a partnership goal, not a fake dependency.

## Architecture

```
Farmer (any phone)
  │ voice call / SMS / WhatsApp photo & voice note
  ▼
Channel layer — IVR + SMS gateway + WhatsApp Cloud API (simulated in demo; Exotel/Meta in production)
  ▼
Gemini 2.5 Flash
  ├─ language auto-detect + transcription from raw audio (verified: webm/opus inline)
  ├─ multimodal disease diagnosis (schema-enforced JSON)
  ├─ crop recommendation reasoning over live soil/weather/agronomy data
  └─ channel-aware advisory generation (spoken IVR style vs ≤300-char SMS)
  ▼
Data spine — every interaction logged, geotagged
  ├─ outbreak clustering → disease early-warnings
  ├─ weather scan → dry-spell / heavy-rain zone alerts (exact blocks)
  └─ escalation tickets → RSK / KVK officers (48h SLA)
  ▼
Ops Command Center — DAO / MP office console
```

**Graceful degradation everywhere:** every API route falls back to expert-written cached data if a live source hiccups. The farmer always gets an answer; the demo never breaks.

## Run locally

```bash
npm install
echo "GEMINI_API_KEY=your_key" > .env.local   # aistudio.google.com — free tier works
npm run dev -- -p 3100
```

## Pilot plan

1. **Weeks 1–4:** toll-free + SMS shortcode in one block (~2,000 farmers); onboarding via gram panchayat & KVK; missed-call registration.
2. **Months 2–4:** district scale; KVK/RSK officers review low-confidence diagnoses; weather-zone alerts live for the DAO.
3. **Economics:** < ₹12 per farmer per season — cheaper than one wasted pesticide spray.

## Repo notes

`research/*.json` contains the verified data-source research (endpoints, quirks, thresholds) this build is grounded on.

---

*Built with ❤️ by Team Vishwakarma Devs, for the farmers of India.*
