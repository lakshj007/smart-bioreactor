import { useState, useRef, useEffect } from "react";
import {
  MessageCircle,
  X,
  Send,
  Sparkles,
  Volume2,
  VolumeX,
  Bot,
  User,
  Loader2,
} from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function AssistantSidebar() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [ttsPlaying, setTtsPlaying] = useState(false);
  const [insightLoading, setInsightLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  async function playTTS(text: string) {
    if (!ttsEnabled) return;
    setTtsPlaying(true);

    // Try ElevenLabs first, fall back to browser speechSynthesis
    try {
      const resp = await fetch("/api/assistant/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!resp.ok) throw new Error("TTS API unavailable");
      const contentType = resp.headers.get("content-type") ?? "";
      if (!contentType.includes("audio")) throw new Error("Not audio");
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => {
        setTtsPlaying(false);
        URL.revokeObjectURL(url);
      };
      audio.play();
      return;
    } catch {
      // Fall through to browser TTS
    }

    // Browser-native TTS fallback
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      // Pick a good voice if available
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(
        (v) => v.name.includes("Samantha") || v.name.includes("Karen") || v.name.includes("Google")
      );
      if (preferred) utterance.voice = preferred;
      utterance.onend = () => setTtsPlaying(false);
      utterance.onerror = () => setTtsPlaying(false);
      window.speechSynthesis.speak(utterance);
    } else {
      setTtsPlaying(false);
    }
  }

  function stopTTS() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setTtsPlaying(false);
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { role: "user", content: text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const resp = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: updatedMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });
      const data = await resp.json();
      const reply = data.response ?? "No response received.";
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      playTTS(reply);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Connection error. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function getInsight() {
    if (insightLoading) return;
    setInsightLoading(true);
    try {
      const resp = await fetch("/api/assistant/insight");
      const data = await resp.json();
      const reply = data.response ?? "Could not generate insight.";
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      playTTS(reply);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Could not generate insight. Try again." },
      ]);
    } finally {
      setInsightLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <>
      {/* Floating toggle button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-full transition-all duration-300 hover:-translate-y-0.5 cursor-pointer"
          style={{
            background: "linear-gradient(135deg, #5EE7C8 0%, #4FB6FF 100%)",
            color: "#06151A",
            boxShadow:
              "0 8px 32px rgba(94, 231, 200, 0.3), 0 0 60px rgba(94, 231, 200, 0.1)",
          }}
        >
          <Bot size={18} />
          <span className="text-sm font-semibold tracking-tight">
            AI Assistant
          </span>
        </button>
      )}

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40"
          style={{ background: "rgba(0,0,0,0.3)", backdropFilter: "blur(2px)" }}
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar panel */}
      <div
        className={`fixed top-0 right-0 bottom-0 z-50 flex flex-col ${
          open ? "animate-slide-in-right" : "translate-x-full"
        }`}
        style={{
          width: "min(420px, 100vw)",
          background:
            "linear-gradient(180deg, rgba(18, 18, 22, 0.95), rgba(10, 10, 14, 0.98))",
          backdropFilter: "blur(40px)",
          borderLeft: "1px solid rgba(255,255,255,0.06)",
          display: open ? "flex" : "none",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 shrink-0"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, rgba(94,231,200,0.15), rgba(79,182,255,0.15))",
                border: "1px solid rgba(94,231,200,0.2)",
              }}
            >
              <Bot size={16} style={{ color: "var(--accent)" }} />
            </div>
            <div>
              <h3
                className="text-sm font-semibold tracking-tight"
                style={{ color: "var(--text-primary)" }}
              >
                BioSphere AI
              </h3>
              <p
                className="text-[10px] tracking-wider uppercase"
                style={{ color: "var(--text-muted)" }}
              >
                Powered by Cerebras
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* TTS toggle */}
            <button
              onClick={() => {
                if (ttsPlaying) stopTTS();
                setTtsEnabled((v) => !v);
              }}
              title={ttsEnabled ? "Disable voice" : "Enable voice"}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer"
              style={{
                background: ttsEnabled
                  ? "rgba(94, 231, 200, 0.12)"
                  : "rgba(255,255,255,0.04)",
                border: `1px solid ${
                  ttsEnabled
                    ? "rgba(94, 231, 200, 0.25)"
                    : "rgba(255,255,255,0.06)"
                }`,
                color: ttsEnabled ? "var(--accent)" : "var(--text-muted)",
              }}
            >
              {ttsEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
            </button>

            {/* Close */}
            <button
              onClick={() => setOpen(false)}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.06)",
                color: "var(--text-muted)",
              }}
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Quick Insight button */}
        <div className="px-5 py-3 shrink-0">
          <button
            onClick={getInsight}
            disabled={insightLoading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer"
            style={{
              background: insightLoading
                ? "rgba(94, 231, 200, 0.06)"
                : "linear-gradient(135deg, rgba(94,231,200,0.10), rgba(79,182,255,0.08))",
              border: "1px solid rgba(94, 231, 200, 0.18)",
              color: "var(--accent)",
            }}
          >
            {insightLoading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Sparkles size={14} />
            )}
            {insightLoading ? "Analyzing reactor..." : "Quick Insight"}
          </button>
        </div>

        {/* Messages */}
        <div
          className="flex-1 overflow-y-auto px-5 py-3 space-y-4"
          style={{ scrollbarWidth: "thin" }}
        >
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(94,231,200,0.08), rgba(79,182,255,0.06))",
                  border: "1px solid rgba(94, 231, 200, 0.12)",
                }}
              >
                <MessageCircle
                  size={24}
                  style={{ color: "var(--accent)", opacity: 0.6 }}
                />
              </div>
              <p
                className="text-sm font-medium mb-1"
                style={{ color: "var(--text-secondary)" }}
              >
                Ask about your reactor
              </p>
              <p
                className="text-xs leading-relaxed"
                style={{ color: "var(--text-muted)" }}
              >
                I have access to live sensor data and can help with optimization,
                troubleshooting, and analysis.
              </p>
              <div className="mt-5 flex flex-wrap gap-2 justify-center">
                {[
                  "How's my reactor doing?",
                  "Should I adjust the pH?",
                  "Optimize growth rate",
                ].map((q) => (
                  <button
                    key={q}
                    onClick={() => {
                      setInput(q);
                      inputRef.current?.focus();
                    }}
                    className="px-3 py-1.5 rounded-lg text-[11px] transition-all cursor-pointer"
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-3 ${
                msg.role === "user" ? "flex-row-reverse" : "flex-row"
              }`}
            >
              {/* Avatar */}
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                style={{
                  background:
                    msg.role === "assistant"
                      ? "linear-gradient(135deg, rgba(94,231,200,0.12), rgba(79,182,255,0.10))"
                      : "rgba(255,255,255,0.06)",
                  border: `1px solid ${
                    msg.role === "assistant"
                      ? "rgba(94,231,200,0.2)"
                      : "rgba(255,255,255,0.08)"
                  }`,
                }}
              >
                {msg.role === "assistant" ? (
                  <Bot size={13} style={{ color: "var(--accent)" }} />
                ) : (
                  <User size={13} style={{ color: "var(--text-secondary)" }} />
                )}
              </div>

              {/* Bubble */}
              <div
                className="rounded-xl px-3.5 py-2.5 max-w-[80%]"
                style={{
                  background:
                    msg.role === "assistant"
                      ? "rgba(255,255,255,0.03)"
                      : "rgba(94, 231, 200, 0.08)",
                  border: `1px solid ${
                    msg.role === "assistant"
                      ? "rgba(255,255,255,0.06)"
                      : "rgba(94, 231, 200, 0.15)"
                  }`,
                }}
              >
                <p
                  className="text-[13px] leading-relaxed whitespace-pre-wrap"
                  style={{
                    color:
                      msg.role === "assistant"
                        ? "var(--text-secondary)"
                        : "var(--text-primary)",
                  }}
                >
                  {msg.content}
                </p>
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {loading && (
            <div className="flex gap-3">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(94,231,200,0.12), rgba(79,182,255,0.10))",
                  border: "1px solid rgba(94,231,200,0.2)",
                }}
              >
                <Bot size={13} style={{ color: "var(--accent)" }} />
              </div>
              <div
                className="rounded-xl px-3.5 py-2.5 flex items-center gap-2"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <Loader2
                  size={14}
                  className="animate-spin"
                  style={{ color: "var(--accent)" }}
                />
                <span
                  className="text-xs"
                  style={{ color: "var(--text-muted)" }}
                >
                  Thinking...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* TTS playing indicator */}
        {ttsPlaying && (
          <div
            className="mx-5 mb-2 flex items-center gap-2 px-3 py-2 rounded-lg text-[11px]"
            style={{
              background: "rgba(94, 231, 200, 0.06)",
              border: "1px solid rgba(94, 231, 200, 0.12)",
              color: "var(--accent)",
            }}
          >
            <Volume2 size={12} className="animate-glow-pulse" />
            Speaking...
            <button
              onClick={stopTTS}
              className="ml-auto text-[10px] uppercase tracking-wider cursor-pointer"
              style={{ color: "var(--text-muted)", background: "none", border: "none" }}
            >
              Stop
            </button>
          </div>
        )}

        {/* Input area */}
        <div
          className="px-5 py-4 shrink-0"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div
            className="flex items-center gap-2 rounded-xl px-3 py-2"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your reactor..."
              disabled={loading}
              className="flex-1 bg-transparent outline-none text-sm"
              style={{
                color: "var(--text-primary)",
                caretColor: "var(--accent)",
              }}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer"
              style={{
                background:
                  input.trim() && !loading
                    ? "linear-gradient(135deg, #5EE7C8, #4FB6FF)"
                    : "rgba(255,255,255,0.04)",
                color: input.trim() && !loading ? "#06151A" : "var(--text-muted)",
              }}
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
