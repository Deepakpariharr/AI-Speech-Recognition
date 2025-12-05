import React, { useEffect, useRef, useState } from "react";
import { parseTranscript, createTask } from "../api/api";

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition || null;

export default function VoiceRecorder({ onParsed, onTaskCreated, onError }) {
  const recRef = useRef(null);
  const listeningRef = useRef(false);
  const accumulatedFinalRef = useRef("");
  const restartTimeoutRef = useRef(null);

  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [displayText, setDisplayText] = useState("");
  const [autoCreate, setAutoCreate] = useState(true);

  function extractDescriptionFallback(fullText, parsed) {
    let text = String(fullText || "").trim();
    if (!text) return "";

    const pTitle = (parsed?.title || "").trim();
    if (pTitle && text.toLowerCase().startsWith(pTitle.toLowerCase())) {
      text = text.slice(pTitle.length).trim();
    }

    const m = text.match(/(?:description|desc)[:\-\s]+(.+)/i);
    if (m && m[1]) return m[1].trim();

    const firstSentenceEnd = text.search(/[.?!]\s/);
    if (firstSentenceEnd > -1) {
      const after = text.slice(firstSentenceEnd + 2).trim();
      if (after) return after;
    }

    const tokens = text.split(/\s+/);
    if (tokens.length > 6) return tokens.slice(6).join(" ");
    return text;
  }

  function normalizeParsed(parsed, fullText) {
    const p = parsed || {};
    const normalized = {
      title: p.title ?? "",
      description: p.description ?? "",
      priority: p.priority ?? "Medium",
      status: p.status ?? "To Do",
      dueDate: p.dueDate ?? "",
    };

    if (!normalized.title) {
      const firstWords = (fullText || "").split(/\s+/).slice(0, 6).join(" ");
      normalized.title = firstWords || "";
    }

    if (!normalized.description || !normalized.description.trim()) {
      normalized.description = extractDescriptionFallback(fullText, normalized) || "";
    }

    return normalized;
  }

  useEffect(() => {
    if (!SpeechRecognition) {
      onError && onError("SpeechRecognition not supported in this browser");
      return;
    }

    const rec = new SpeechRecognition();
    rec.lang = "en-US";
    rec.interimResults = true;
    rec.continuous = true;
    rec.maxAlternatives = 1;

    rec.onresult = async (ev) => {
      let interimText = "";
      let finalChunk = "";

      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const r = ev.results[i];
        if (r.isFinal) finalChunk += (finalChunk ? " " : "") + r[0].transcript.trim();
        else interimText += (interimText ? " " : "") + r[0].transcript;
      }

      setInterim(interimText);

      if (finalChunk) {
        accumulatedFinalRef.current = (accumulatedFinalRef.current ? accumulatedFinalRef.current + " " : "") + finalChunk;
        const full = accumulatedFinalRef.current.trim();
        setDisplayText(full);
        setInterim("");

        try {
          const parseResp = await parseTranscript(full);
          const parsedObj = parseResp?.parsed ?? parseResp;
          const normalized = normalizeParsed(parsedObj, full);

          if (autoCreate) {
            try {
              const created = await createTask(normalized);
              onTaskCreated && onTaskCreated(created);
            } catch (createErr) {
              console.error("[VoiceRecorder] auto-create failed:", createErr);
              onError && onError(createErr);
              onParsed && onParsed(normalized);
            }
          } else {
            onParsed && onParsed(normalized);
          }
        } catch (parseErr) {
          console.error("[VoiceRecorder] parseTranscript failed:", parseErr);
          onError && onError(parseErr);
          const fallback = normalizeParsed({}, full);
          if (autoCreate) {
            try {
              const created = await createTask(fallback);
              onTaskCreated && onTaskCreated(created);
            } catch (createErr2) {
              console.error("[VoiceRecorder] fallback create failed:", createErr2);
              onError && onError(createErr2);
              onParsed && onParsed(fallback);
            }
          } else {
            onParsed && onParsed(fallback);
          }
        }
      } else {
        setDisplayText((accumulatedFinalRef.current ? accumulatedFinalRef.current + " " : "") + interimText);
      }
    };

    rec.onerror = (ev) => {
      console.warn("[VoiceRecorder] recognition error:", ev);
      onError && onError(ev);
      listeningRef.current = false;
      setListening(false);
    };

    rec.onend = () => {
      if (listeningRef.current) {
        restartTimeoutRef.current = setTimeout(() => {
          try {
            rec.start();
            console.debug("[VoiceRecorder] restarted recognition after end");
          } catch (e) {
            console.error("[VoiceRecorder] restart failed", e);
            listeningRef.current = false;
            setListening(false);
          }
        }, 300);
      } else {
        setListening(false);
      }
    };

    recRef.current = rec;
    return () => {
      try {
        if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
        rec.onresult = null;
        rec.onend = null;
        rec.onerror = null;
        try { rec.stop(); } catch (e) {}
      } catch (e) {}
      recRef.current = null;
    };
  }, [autoCreate]);

  const start = () => {
    if (!recRef.current) {
      onError && onError("SpeechRecognition not ready");
      return;
    }
    try {
      accumulatedFinalRef.current = "";
      recRef.current.start();
      listeningRef.current = true;
      setListening(true);
      setInterim("");
      setDisplayText("");
    } catch (e) {
      console.error("[VoiceRecorder] start error", e);
      onError && onError(e);
    }
  };

  const stop = () => {
    listeningRef.current = false;
    setListening(false);
    try {
      recRef.current && recRef.current.stop();
    } catch (e) {}
  };

  return (
    <div style={{
      position: "fixed",
      left: 20,
      bottom: 20,
      zIndex: 10000,
      display: "flex",
      gap: 10,
      alignItems: "flex-start",
      pointerEvents: "auto"
    }}>
      <button
        onClick={() => (listening ? stop() : start())}
        title={listening ? "Stop recording" : "Start recording"}
        style={{
          width: 52,
          height: 52,
          borderRadius: 12,
          fontSize: 18,
          background: listening ? "#fee2e2" : "#f0f9ff",
          border: "1px solid #ddd",
          cursor: "pointer"
        }}
      >
        {listening ? "●" : "◯"}
      </button>

      <div style={{
        width: 300,
        background: "#fff",
        padding: 12,
        borderRadius: 10,
        boxShadow: "0 10px 30px rgba(0,0,0,0.08)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div style={{ fontWeight: 700 }}>Transcript</div>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
            <input
              type="checkbox"
              checked={autoCreate}
              onChange={(e) => setAutoCreate(e.target.checked)}
            />
            <span>{autoCreate ? "Auto-create" : "Review before create"}</span>
          </label>
        </div>

        <div style={{ minHeight: 48, maxHeight: 140, overflowY: "auto", whiteSpace: "pre-wrap", fontSize: 14 }}>
          {displayText || <span style={{ opacity: 0.6 }}>Click the circle and speak…</span>}
        </div>
      </div>
    </div>
  );
}
