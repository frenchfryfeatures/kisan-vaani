"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LANGS, SAMPLE_QUERIES, CASE_STUDIES, type Lang } from "@/lib/data";
import { T } from "@/lib/i18n";
import { speak, stopSpeaking, createRecognizer } from "@/lib/speech";

type Mode = "call" | "sms" | "photo";
type CallState = "idle" | "dialing" | "menu" | "listening" | "thinking" | "answered";
type Bubble = { who: "ivr" | "farmer"; text: string };
type SmsMsg = { who: "farmer" | "kisanvaani"; text: string };

type Diagnosis = {
  is_plant?: boolean;
  plant: string;
  disease_en: string;
  disease_local: string;
  disease_scientific: string;
  confidence: number;
  severity: "low" | "medium" | "high";
  symptoms: string[];
  treatment_organic: string[];
  treatment_chemical: string[];
  prevention: string[];
  urgency: string;
  voice_summary: string;
  source?: string;
};

const MODES: { id: Mode; icon: string; label: string; sub: string }[] = [
  { id: "call", icon: "📞", label: "Voice Call (IVR)", sub: "Zero literacy needed" },
  { id: "sms", icon: "✉️", label: "SMS", sub: "Works on 2G" },
  { id: "photo", icon: "📷", label: "Photo Diagnosis", sub: "Via relay worker" },
];

export default function DemoClient() {
  const [lang, setLang] = useState<Lang>("hi");
  const [mode, setMode] = useState<Mode>("call");
  const bcp47 = LANGS.find((l) => l.code === lang)!.bcp47;
  const t = T[lang];

  // ---- Call state ----
  const [callState, setCallState] = useState<CallState>("idle");
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [callSource, setCallSource] = useState<string | null>(null);
  const [micOn, setMicOn] = useState(false);
  const [micSupported, setMicSupported] = useState(false);
  const [callInput, setCallInput] = useState("");
  const recRef = useRef<{ start: () => void; stop: () => void } | null>(null);
  const screenRef = useRef<HTMLDivElement>(null);

  // ---- SMS state ----
  const [smsThread, setSmsThread] = useState<SmsMsg[]>([]);
  const [smsInput, setSmsInput] = useState("");
  const [smsSending, setSmsSending] = useState(false);
  const [smsSource, setSmsSource] = useState<string | null>(null);

  // ---- Photo state ----
  const [diag, setDiag] = useState<Diagnosis | null>(null);
  const [diagLoading, setDiagLoading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [activeCase, setActiveCase] = useState<string | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const w = window as unknown as Record<string, unknown>;
    setMicSupported(!!(w.SpeechRecognition || w.webkitSpeechRecognition));
    // warm the voice list (loads async in Chrome)
    window.speechSynthesis?.getVoices();
  }, []);

  useEffect(() => {
    screenRef.current?.scrollTo({ top: 99999, behavior: "smooth" });
  }, [bubbles, callState, smsThread]);

  useEffect(() => () => stopSpeaking(), []);

  const endCall = useCallback(() => {
    stopSpeaking();
    recRef.current?.stop?.();
    setCallState("idle");
    setBubbles([]);
    setCallSource(null);
    setMicOn(false);
    setCallInput("");
  }, []);

  // Reset transient state when switching language or mode
  useEffect(() => {
    endCall();
    stopSpeaking();
    setSpeaking(false);
  }, [lang, mode, endCall]);

  const startCall = () => {
    setBubbles([]);
    setCallState("dialing");
    setTimeout(() => {
      setCallState("menu");
      setBubbles([{ who: "ivr", text: t.ivrGreeting }]);
      speak(t.ivrGreeting, bcp47);
    }, 1200);
  };

  const pressKey = (k: string) => {
    if (callState !== "menu") return;
    if (k === "1") {
      stopSpeaking();
      setCallState("listening");
      setBubbles((b) => [...b, { who: "farmer", text: `[ ${k} ]` }, { who: "ivr", text: t.ivrAskProblem }]);
      speak(t.ivrAskProblem, bcp47);
    }
  };

  const submitProblem = async (text: string) => {
    if (!text.trim()) return;
    stopSpeaking();
    setBubbles((b) => [...b, { who: "farmer", text }]);
    setCallState("thinking");
    try {
      const res = await fetch("/api/advisory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: text, lang, channel: "ivr" }),
      });
      const data = await res.json();
      setBubbles((b) => [...b, { who: "ivr", text: data.text }]);
      setCallSource(data.source);
      setCallState("answered");
      speak(data.text, bcp47);
    } catch {
      setCallState("listening");
    }
    setCallInput("");
  };

  const toggleMic = () => {
    if (micOn) {
      recRef.current?.stop?.();
      setMicOn(false);
      return;
    }
    const rec = createRecognizer(
      bcp47,
      (text) => submitProblem(text),
      () => setMicOn(false)
    );
    if (!rec) return;
    recRef.current = rec;
    setMicOn(true);
    rec.start();
  };

  const sendSms = async (text: string) => {
    if (!text.trim() || smsSending) return;
    setSmsThread((th) => [...th, { who: "farmer", text }]);
    setSmsInput("");
    setSmsSending(true);
    try {
      const res = await fetch("/api/advisory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: text, lang, channel: "sms" }),
      });
      const data = await res.json();
      setSmsThread((th) => [...th, { who: "kisanvaani", text: data.text }]);
      setSmsSource(data.source);
    } catch {
      /* keep thread as-is */
    }
    setSmsSending(false);
  };

  const runCase = (id: string) => {
    const c = CASE_STUDIES.find((x) => x.id === id)!;
    stopSpeaking();
    setSpeaking(false);
    setActiveCase(id);
    setPhotoPreview(null);
    setDiag(null);
    setDiagLoading(true);
    setTimeout(() => {
      setDiag({ ...c.diagnosis, is_plant: true, source: "case-study" });
      setDiagLoading(false);
    }, 900);
  };

  const onUpload = (file: File) => {
    stopSpeaking();
    setSpeaking(false);
    setActiveCase(null);
    setDiag(null);
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setPhotoPreview(dataUrl);
      setDiagLoading(true);
      const base64 = dataUrl.split(",")[1];
      const mimeType = dataUrl.slice(5, dataUrl.indexOf(";"));
      try {
        const res = await fetch("/api/diagnose", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64, mimeType, lang }),
        });
        setDiag(await res.json());
      } catch {
        setDiag(null);
      }
      setDiagLoading(false);
    };
    reader.readAsDataURL(file);
  };

  const listenSummary = () => {
    if (!diag) return;
    if (speaking) {
      stopSpeaking();
      setSpeaking(false);
      return;
    }
    setSpeaking(true);
    speak(diag.voice_summary, bcp47, () => setSpeaking(false));
  };

  const sevColor = { low: "bg-leaf-mist text-forest", medium: "bg-amber-100 text-amber-800", high: "bg-red-100 text-clay" };

  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="border-b border-forest/10 bg-paper/90 backdrop-blur sticky top-0 z-20">
        <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
          <Link href="/" className="font-display text-xl font-semibold text-forest">🌾 KisanVaani</Link>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/command" className="text-ink-soft hover:text-forest">Command Center</Link>
            <Link href="/" className="text-ink-soft hover:text-forest">About</Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <header className="mb-6">
          <h1 className="font-display text-3xl font-semibold text-forest">Live Demo — the farmer&rsquo;s side</h1>
          <p className="text-ink-soft mt-1 max-w-2xl">
            This simulator reproduces the exact experience on a <strong>₹1,500 feature phone</strong>. In production the
            same flows run over a real IVR line &amp; SMS gateway — no app, no internet needed on the farmer&rsquo;s side.
          </p>
        </header>

        {/* Language picker */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <span className="text-sm text-ink-soft mr-1">Farmer&rsquo;s language:</span>
          {LANGS.map((l) => (
            <button
              key={l.code}
              onClick={() => setLang(l.code)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition ${
                lang === l.code
                  ? "bg-forest text-paper border-forest"
                  : "bg-white text-ink-soft border-forest/20 hover:border-forest/50"
              }`}
            >
              {l.native}
            </button>
          ))}
        </div>

        {/* Mode tabs */}
        <div className="grid grid-cols-3 gap-3 mb-8 max-w-2xl">
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`rounded-xl border p-3 text-left transition ${
                mode === m.id ? "bg-forest text-paper border-forest shadow-lg" : "bg-white border-forest/15 hover:border-forest/40"
              }`}
            >
              <div className="text-xl">{m.icon}</div>
              <div className="font-semibold text-sm mt-1">{m.label}</div>
              <div className={`text-xs ${mode === m.id ? "text-paper/70" : "text-ink-soft"}`}>{m.sub}</div>
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-[minmax(0,420px)_1fr] gap-10 items-start">
          {/* ================= PHONE / PANEL ================= */}
          <div>
            {mode !== "photo" ? (
              /* Feature phone frame */
              <div className="mx-auto w-[300px] rounded-[2rem] bg-gradient-to-b from-zinc-800 to-zinc-900 p-4 shadow-2xl border border-zinc-700">
                <div className="text-center text-zinc-400 text-[10px] tracking-[0.3em] mb-2">KISANPHONE 105</div>
                {/* Screen */}
                <div ref={screenRef} className="phone-screen rounded-lg h-72 overflow-y-auto p-3 text-[13px] leading-snug">
                  {mode === "call" && (
                    <>
                      {callState === "idle" && (
                        <div className="h-full flex flex-col items-center justify-center text-center text-forest/80">
                          <div className="text-3xl mb-2">🌾</div>
                          <div className="font-semibold">{t.welcome}</div>
                          <div className="text-xs mt-2 text-forest/60">📞 1800-180-KISAN</div>
                          <div className="text-[10px] mt-4 text-forest/50">Press the green button to call</div>
                        </div>
                      )}
                      {callState === "dialing" && (
                        <div className="h-full flex flex-col items-center justify-center text-forest/80">
                          <div className="text-2xl blink">📞</div>
                          <div className="mt-2 text-sm">{t.dialing}</div>
                          <div className="text-xs text-forest/60">1800-180-KISAN</div>
                        </div>
                      )}
                      {(callState === "menu" || callState === "listening" || callState === "thinking" || callState === "answered") && (
                        <div className="space-y-2">
                          <div className="text-center text-[10px] text-forest/60 border-b border-forest/10 pb-1 mb-2">
                            {t.connected} · 00:{String(bubbles.length * 7 + 12).padStart(2, "0")}
                          </div>
                          {bubbles.map((b, i) => (
                            <div key={i} className={`rise max-w-[90%] rounded-lg px-2.5 py-1.5 ${
                              b.who === "ivr" ? "bg-white/80 text-ink" : "bg-forest text-paper ml-auto"
                            }`}>
                              {b.who === "ivr" && <div className="text-[9px] font-semibold text-leaf mb-0.5">KISANVAANI</div>}
                              {b.text}
                            </div>
                          ))}
                          {callState === "thinking" && (
                            <div className="bg-white/80 rounded-lg px-2.5 py-1.5 max-w-[90%] text-ink-soft blink">{t.ivrThinking}</div>
                          )}
                          {callState === "listening" && micOn && (
                            <div className="text-center text-clay text-xs blink mt-2">🎙 {t.speakNow}</div>
                          )}
                        </div>
                      )}
                    </>
                  )}

                  {mode === "sms" && (
                    <div className="space-y-2">
                      <div className="text-center text-[10px] text-forest/60 border-b border-forest/10 pb-1 mb-2">
                        Messages · KISAN (56070)
                      </div>
                      {smsThread.length === 0 && (
                        <div className="text-center text-forest/50 text-xs mt-16">
                          Send crop + problem to shortcode <b>56070</b>
                          <br />
                          <span className="text-[10px]">works on any phone, ₹0.15/SMS</span>
                        </div>
                      )}
                      {smsThread.map((m, i) => (
                        <div key={i} className={`rise max-w-[92%] rounded-lg px-2.5 py-1.5 ${
                          m.who === "kisanvaani" ? "bg-white/80 text-ink" : "bg-forest text-paper ml-auto"
                        }`}>
                          {m.who === "kisanvaani" && <div className="text-[9px] font-semibold text-leaf mb-0.5">KISAN 56070</div>}
                          {m.text}
                        </div>
                      ))}
                      {smsSending && (
                        <div className="bg-white/80 rounded-lg px-2.5 py-1.5 max-w-[90%] text-ink-soft blink">…</div>
                      )}
                    </div>
                  )}
                </div>

                {/* Call buttons */}
                <div className="flex justify-between items-center mt-3 px-2">
                  <button
                    onClick={mode === "call" ? startCall : undefined}
                    disabled={mode !== "call" || callState !== "idle"}
                    className={`w-12 h-12 rounded-full bg-green-600 text-white text-xl flex items-center justify-center keypad-btn disabled:opacity-40 ${
                      mode === "call" && callState === "idle" ? "pulse-ring" : ""
                    }`}
                    aria-label="Start call"
                  >
                    📞
                  </button>
                  <div className="text-zinc-500 text-[9px] text-center leading-tight">IVR DEMO<br />browser voice = phone line</div>
                  <button
                    onClick={endCall}
                    disabled={mode !== "call" || callState === "idle"}
                    className="w-12 h-12 rounded-full bg-red-600 text-white text-xl flex items-center justify-center keypad-btn disabled:opacity-40"
                    aria-label="End call"
                  >
                    ⛔
                  </button>
                </div>

                {/* Keypad */}
                <div className="grid grid-cols-3 gap-1.5 mt-3">
                  {["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"].map((k) => (
                    <button
                      key={k}
                      onClick={() => pressKey(k)}
                      className={`keypad-btn rounded-md py-1.5 text-sm font-semibold border ${
                        k === "1" && callState === "menu"
                          ? "bg-turmeric-soft/90 text-ink border-turmeric"
                          : "bg-zinc-700 text-zinc-200 border-zinc-600"
                      }`}
                    >
                      {k}
                      {k === "1" && <span className="block text-[8px] font-normal -mt-0.5">फसल</span>}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Photo mode panel */
              <div className="rounded-2xl bg-white border border-forest/15 p-5 shadow-sm">
                <h3 className="font-semibold text-forest mb-1">📷 Send a crop photo</h3>
                <p className="text-xs text-ink-soft mb-4">
                  In the field: farmer hands their phone photo to the village <b>relay worker / sahayak</b>, or sends via
                  WhatsApp to <b>+91-98XXX-KISAN</b>. The reply comes back as a <b>voice note in their language</b>.
                </p>
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-full border-2 border-dashed border-leaf/40 rounded-xl p-6 text-center hover:bg-leaf-mist/40 transition"
                >
                  {photoPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photoPreview} alt="uploaded crop" className="max-h-40 mx-auto rounded-lg" />
                  ) : (
                    <>
                      <div className="text-3xl">🍃</div>
                      <div className="text-sm font-medium text-leaf mt-1">Upload a leaf/crop photo</div>
                      <div className="text-xs text-ink-soft">live Gemini vision diagnosis</div>
                    </>
                  )}
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])}
                />
                <div className="text-xs text-ink-soft text-center my-3">— or replay a real field case —</div>
                <div className="space-y-2">
                  {CASE_STUDIES.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => runCase(c.id)}
                      className={`w-full flex items-center gap-3 rounded-xl border p-3 text-left transition ${
                        activeCase === c.id ? "border-forest bg-leaf-mist/50" : "border-forest/15 hover:border-forest/40"
                      }`}
                    >
                      <div className="text-2xl">{c.emoji}</div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold truncate">{c.crop} — {c.farmer}</div>
                        <div className="text-xs text-ink-soft truncate">{c.village} · {c.photoNote}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Under-phone inputs for call & sms */}
            {mode === "call" && callState === "listening" && (
              <div className="mt-4 rounded-xl bg-white border border-forest/15 p-4 rise">
                <div className="text-xs font-semibold text-ink-soft mb-2">
                  🎙 Farmer speaks {micSupported && "(use your mic, or tap a sample)"}:
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {SAMPLE_QUERIES[lang].ivr.map((q) => (
                    <button
                      key={q}
                      onClick={() => submitProblem(q)}
                      className="text-xs bg-leaf-mist text-forest rounded-full px-3 py-1.5 hover:bg-leaf/20 text-left"
                    >
                      &ldquo;{q}&rdquo;
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  {micSupported && (
                    <button
                      onClick={toggleMic}
                      className={`px-3 py-2 rounded-lg text-sm font-medium ${micOn ? "bg-red-600 text-white blink" : "bg-forest text-paper"}`}
                    >
                      {micOn ? "● Rec" : "🎙 Mic"}
                    </button>
                  )}
                  <input
                    value={callInput}
                    onChange={(e) => setCallInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && submitProblem(callInput)}
                    placeholder={t.speakNow}
                    className="flex-1 border border-forest/20 rounded-lg px-3 py-2 text-sm bg-paper focus:outline-none focus:border-forest"
                  />
                  <button onClick={() => submitProblem(callInput)} className="px-3 py-2 rounded-lg bg-turmeric text-white text-sm font-medium">
                    ➤
                  </button>
                </div>
              </div>
            )}

            {mode === "sms" && (
              <div className="mt-4 rounded-xl bg-white border border-forest/15 p-4">
                <div className="flex flex-wrap gap-2 mb-3">
                  {SAMPLE_QUERIES[lang].sms.map((q) => (
                    <button
                      key={q}
                      onClick={() => sendSms(q)}
                      className="text-xs bg-leaf-mist text-forest rounded-full px-3 py-1.5 hover:bg-leaf/20 font-mono"
                    >
                      {q}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    value={smsInput}
                    onChange={(e) => setSmsInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendSms(smsInput)}
                    placeholder={t.smsPlaceholder}
                    className="flex-1 border border-forest/20 rounded-lg px-3 py-2 text-sm bg-paper focus:outline-none focus:border-forest"
                  />
                  <button onClick={() => sendSms(smsInput)} className="px-4 py-2 rounded-lg bg-forest text-paper text-sm font-medium">
                    {t.sendSms}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ================= RIGHT: RESULT / PIPELINE ================= */}
          <div className="space-y-5">
            {/* Photo diagnosis result */}
            {mode === "photo" && (
              <div className="rounded-2xl bg-white border border-forest/15 p-6 shadow-sm min-h-64">
                {!diag && !diagLoading && (
                  <div className="h-full flex flex-col items-center justify-center text-center text-ink-soft py-14">
                    <div className="text-4xl mb-3">🔬</div>
                    <div className="font-medium">Diagnosis appears here</div>
                    <div className="text-xs mt-1">Upload a photo or replay a field case</div>
                  </div>
                )}
                {diagLoading && (
                  <div className="py-14 text-center">
                    <div className="text-4xl blink">🧠</div>
                    <div className="mt-3 font-medium text-forest">Gemini is examining the photo…</div>
                    <div className="text-xs text-ink-soft mt-1">crop → disease → treatment → voice note</div>
                  </div>
                )}
                {diag && !diagLoading && diag.is_plant === false && (
                  <div className="py-14 text-center text-ink-soft">
                    <div className="text-3xl">🤔</div>
                    <div className="mt-2">That doesn&rsquo;t look like a plant — try a crop or leaf photo.</div>
                  </div>
                )}
                {diag && !diagLoading && diag.is_plant !== false && (
                  <div className="rise">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <div className="text-xs text-ink-soft">{diag.plant}</div>
                        <h3 className="font-display text-2xl font-semibold text-forest">{diag.disease_en}</h3>
                        <div className="text-sm text-ink-soft">
                          {diag.disease_local} · <i>{diag.disease_scientific}</i>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${sevColor[diag.severity]}`}>
                          {diag.severity.toUpperCase()}
                        </span>
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-leaf-mist text-forest">
                          {diag.confidence}% match
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 h-1.5 rounded-full bg-forest/10 overflow-hidden">
                      <div className="h-full bg-leaf-bright rounded-full" style={{ width: `${diag.confidence}%` }} />
                    </div>

                    <button
                      onClick={listenSummary}
                      className="mt-4 w-full rounded-xl bg-forest text-paper py-3 font-semibold hover:bg-leaf transition"
                    >
                      {speaking ? t.stop : `${t.listen} — voice note (${LANGS.find((l) => l.code === lang)!.native})`}
                    </button>
                    <div className="text-[11px] text-ink-soft text-center mt-1">
                      ↑ this is what the farmer receives on their phone — no reading required
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4 mt-5">
                      <div className="rounded-xl bg-leaf-mist/50 p-4">
                        <div className="text-xs font-bold text-forest mb-2">🌿 ORGANIC / IPM FIRST</div>
                        <ul className="text-sm space-y-1.5">
                          {diag.treatment_organic.map((x, i) => <li key={i}>• {x}</li>)}
                        </ul>
                      </div>
                      <div className="rounded-xl bg-amber-50 p-4">
                        <div className="text-xs font-bold text-clay mb-2">🧪 IF SEVERE (CHEMICAL)</div>
                        <ul className="text-sm space-y-1.5">
                          {diag.treatment_chemical.map((x, i) => <li key={i}>• {x}</li>)}
                        </ul>
                      </div>
                    </div>

                    <div className="mt-4 rounded-xl border border-forest/10 p-4">
                      <div className="text-xs font-bold text-ink-soft mb-2">SYMPTOMS MATCHED</div>
                      <div className="flex flex-wrap gap-1.5">
                        {diag.symptoms.map((s, i) => (
                          <span key={i} className="text-xs bg-paper-warm rounded-full px-2.5 py-1">{s}</span>
                        ))}
                      </div>
                      <div className="text-xs font-bold text-ink-soft mt-3 mb-1">PREVENT NEXT SEASON</div>
                      <ul className="text-sm space-y-1">{diag.prevention.map((x, i) => <li key={i}>• {x}</li>)}</ul>
                    </div>

                    <div className="mt-4 flex items-start gap-2 rounded-xl bg-red-50 border border-red-100 p-3 text-sm text-clay">
                      <span>⏰</span>
                      <span><b>Urgency:</b> {diag.urgency}</span>
                    </div>

                    <div className="text-[11px] text-ink-soft mt-3 text-right">
                      {diag.source === "gemini" ? "⚡ Live Gemini 2.5 Flash diagnosis" : diag.source === "case-study" ? "📁 Field case study (cached)" : "📁 Cached fallback"}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Pipeline explainer */}
            <div className="rounded-2xl bg-forest text-paper p-6">
              <div className="text-xs font-bold tracking-widest text-leaf-mist/80 mb-3">WHAT JUST HAPPENED — PRODUCTION PIPELINE</div>
              {mode === "call" && (
                <ol className="space-y-2.5 text-sm">
                  <li><b>1 · Missed-call / toll-free IVR</b> — farmer dials 1800-180-KISAN; Exotel/Twilio Voice picks up. Zero cost to farmer.</li>
                  <li><b>2 · Speech → text</b> — Bhashini / Google Cloud Speech ASR in 12+ Indic languages <span className="text-leaf-mist/70">(demo uses your browser&rsquo;s mic + speech engine)</span>.</li>
                  <li><b>3 · Gemini reasons</b> — grounded on Kisan Call Centre Q&amp;A corpus + crop calendar + weather; guardrailed dosages.</li>
                  <li><b>4 · Text → speech</b> — advisory spoken back in the farmer&rsquo;s language on the same call.</li>
                  <li><b>5 · Logged to Kisan Alert</b> — every query feeds district-level outbreak detection. <Link href="/command" className="underline text-turmeric-soft">See command center →</Link></li>
                </ol>
              )}
              {mode === "sms" && (
                <ol className="space-y-2.5 text-sm">
                  <li><b>1 · SMS to shortcode 56070</b> — works on 2G, any handset, ₹0.15. Shorthand like <span className="font-mono">KAPAS PILA PATTA</span> is fine.</li>
                  <li><b>2 · Gemini expands &amp; reasons</b> — understands transliterated Hindi/Marathi/Telugu shorthand, returns advisory in native script.</li>
                  <li><b>3 · Reply in ≤2 SMS segments</b> — exact dosages + Kisan Call Centre number, readable on a black-and-white screen.</li>
                  <li><b>4 · Logged to Kisan Alert</b> — anonymised, geotagged by cell tower for outbreak mapping. <Link href="/command" className="underline text-turmeric-soft">See command center →</Link></li>
                </ol>
              )}
              {mode === "photo" && (
                <ol className="space-y-2.5 text-sm">
                  <li><b>1 · Photo via relay</b> — farmer&rsquo;s own phone, the village sahayak&rsquo;s smartphone, or WhatsApp. One smartphone serves a whole village.</li>
                  <li><b>2 · Gemini 2.5 Flash vision</b> — identifies crop + disease with structured JSON output (schema-enforced, no parsing errors).</li>
                  <li><b>3 · Voice note back</b> — 60-word spoken summary in the farmer&rsquo;s language; full advisory SMS to their feature phone.</li>
                  <li><b>4 · Every diagnosis is a data point</b> — 23 leaf-curl photos from one block = an outbreak alert to 1,240 farmers. <Link href="/command" className="underline text-turmeric-soft">See command center →</Link></li>
                </ol>
              )}
              {(callSource || smsSource) && mode !== "photo" && (
                <div className="text-[11px] text-leaf-mist/70 mt-4 text-right">
                  {(mode === "call" ? callSource : smsSource) === "gemini" ? "⚡ Live Gemini 2.5 Flash response" : "📁 Cached fallback response (offline-safe)"}
                </div>
              )}
            </div>

            {/* Why this matters */}
            <div className="rounded-2xl bg-white border border-forest/15 p-5 text-sm text-ink-soft">
              <b className="text-ink">Why voice &amp; SMS first?</b> ~55% of rural India is not on smartphones, and many who are
              stay off apps due to literacy &amp; data costs. Existing agri-apps skip exactly the farmers who lose the most to
              crop disease. KisanVaani meets farmers on the phones they already own.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
