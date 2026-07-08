# KisanVaani — किसानवाणी

KisanVaani is a farm-advisory platform for Indian farmers who do not own smartphones. It delivers AI-assisted advice over voice calls and SMS in 12+ Indian languages with automatic spoken-language detection, diagnoses crop disease from photos, recommends crops from satellite and Soil Health Card data, issues dry-spell and heavy-rain zone alerts, reads out live mandi prices, and escalates uncertain or severe cases to human experts at Rythu Seva Kendras (RSKs) and Krishi Vigyan Kendras (KVKs).

## Problem

India has more than 146 million farm holdings; 86% are smallholders. Roughly 45% of rural users carry feature phones — no apps, no data plans, oral-first. Existing agri-apps assume a smartphone the farmer does not have, while an estimated 15–25% of yield is lost to pests, disease, and mistimed irrigation. KisanVaani works on the phones farmers already own, and aggregates every interaction into district-level intelligence for agriculture officers.

## Modules

| Module | Description | Route |
|---|---|---|
| Voice IVR and SMS advisory | The farmer calls a toll-free number or texts shorthand (e.g. `KAPAS PILA PATTA`); Gemini answers in their language — spoken on the call, native script by SMS. Option 2 reads live mandi prices. | `/demo` |
| Spoken-language auto-detection | The farmer speaks in any Indian language; Gemini identifies the language from the audio itself and replies in it. 12 languages ship with full UI and samples; detection is not limited to these. | `/demo` (Auto mode) |
| Crop recommendation | Satellite soil grids (ISRIC SoilGrids, 250 m), live Government of India Soil Health Card data, 16-day weather, and ICAR agronomy produce ranked, explained crop choices with mandi price context. | `/recommend` |
| Dry-spell and heavy-rain zone alerts | IMD-threshold detection (dry spell; heavy rain ≥64.5 mm/day; very heavy ≥115.6 mm/day) across the district registry, resolved to the affected blocks; broadcasts voice and SMS only to farmers in the zone. | `/command` (Weather alerts) |
| WhatsApp photo and voice support | The farmer sends a crop photo or voice note and receives an AI diagnosis with a voice-note reply. A website link reaches feature phones by SMS. | `/whatsapp` |
| RSK/KVK expert escalation | Low-confidence or severe diagnoses become tickets for Rythu Seva Kendras (AP) and Krishi Vigyan Kendras (national) with a 48-hour SLA — AI first, humans in the loop. | `/command` (Escalations) |

The operations console at `/command` serves the District Agriculture Officer and the MP's office: KPIs, weather-alert composer, disease-outbreak clusters, escalation queue, broadcast log, and farmer registry.

## Data sources

- Soil Health Card (soilhealth.dac.gov.in) — district N/P/K/OC/pH and micronutrient distributions; GraphQL; updated daily
- Agmarknet 2.0 open API (api.agmarknet.gov.in) — same-day mandi modal prices; Directorate of Marketing & Inspection
- ISRIC SoilGrids v2 — 250 m satellite-derived soil properties and WRB classification, mapped to Indian soil types
- NASA POWER — agroclimate data for any Indian coordinate
- Open-Meteo — 16-day forecasts, ET₀, soil moisture (production source: IMD Agromet Advisory Services)
- ICAR / SAU Package of Practices and FAO Table 14 — embedded, citation-backed agronomy table
- Kisan Call Centre corpus (AIKosh/IndiaAI) — planned grounding data

A note on ground sensors: no public real-time farm-level sensor network exists in India today (WINDS data is procurement-gated; IMD's AWS portal is not publicly accessible). Irrigation guidance therefore uses satellite-derived soil moisture, ET₀, and forecasts. The production plan treats ground sensors as a partnership goal, not an assumed dependency.

## Architecture

```
Farmer (any phone)
  │  voice call / SMS / WhatsApp photo or voice note
  ▼
Channel layer — IVR, SMS gateway, WhatsApp Cloud API
  (simulated in the demo; Exotel/Meta in production)
  ▼
Gemini 2.5 Flash
  ├─ language detection and transcription from raw audio (verified: webm/opus inline)
  ├─ multimodal disease diagnosis (schema-enforced JSON)
  ├─ crop recommendation over live soil, weather, and agronomy data
  └─ channel-aware advisory generation (spoken IVR style; SMS ≤300 characters)
  ▼
Data layer — interactions logged and geotagged
  ├─ outbreak clustering → disease early warnings
  ├─ weather scan → dry-spell and heavy-rain zone alerts by block
  └─ escalation tickets → RSK/KVK officers (48-hour SLA)
  ▼
Operations console — District Agriculture Officer / MP office
```

Every API route falls back to cached, expert-written data if a live source is unavailable, so the farmer always receives an answer.

## Run locally

```bash
npm install
echo "GEMINI_API_KEY=your_key" > .env.local   # aistudio.google.com; free tier is sufficient
npm run dev -- -p 3100
```

## Pilot plan

1. Weeks 1–4: toll-free number and SMS shortcode in one block (~2,000 farmers); onboarding through gram panchayats and the local KVK; missed-call registration.
2. Months 2–4: district scale; KVK/RSK officers review low-confidence diagnoses; weather-zone alerts live for the District Agriculture Officer.
3. Estimated operating cost: under ₹12 per farmer per season.

## Repository notes

`research/*.json` contains the verified data-source research (endpoints, quirks, thresholds) this build is grounded on.

Team Vishwakarma Devs — Build with AI: Code for Communities (Google Cloud × Hack2Skill), Track 4: Kisan Alert.
