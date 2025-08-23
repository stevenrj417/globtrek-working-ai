"use client";
import { useEffect, useRef, useState } from "react";

export default function Page() {
  // Inputs
  const [destination, setDestination] = useState("");
  const [days, setDays] = useState("");
  const [budget, setBudget] = useState("mid");      // low | mid | high
  const [pace, setPace] = useState("balanced");     // relaxed | balanced | packed
  const [interests, setInterests] = useState([]);   // ["food","history",...]

  // Chat state
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Welcome to GlobTrek. Tell me a destination and days, and I’ll craft a tailored plan. Adjust budget, pace, and interests above to shape the vibe.",
    },
  ]);
  const [pendingQuestions, setPendingQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [planJson, setPlanJson] = useState(null);

  const scrollerRef = useRef(null);
  useEffect(() => {
    scrollerRef.current?.scrollTo({
      top: scrollerRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, pendingQuestions, loading]);

  // Palette
  const palette = {
    bg: "linear-gradient(135deg,#0f172a 0%,#0b1220 50%,#0f172a 100%)",
    card: "rgba(255,255,255,0.06)",
    border: "rgba(255,255,255,0.12)",
    glow: "0 10px 30px rgba(0,0,0,0.35)",
    text: "#e5e7eb",
    sub: "#a3a3a3",
    accent: "#45c7ff",
  };

  // Controls
  const chip = (label, active, onClick) => (
    <button
      key={label}
      onClick={onClick}
      style={{
        padding: "8px 12px",
        borderRadius: 999,
        border: `1px solid ${active ? palette.accent : palette.border}`,
        background: active ? "linear-gradient(135deg,#39bdf8,#a66bff)" : palette.card,
        color: active ? "#0b1220" : palette.text,
        fontWeight: 600,
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );

  function toggleInterest(tag) {
    setInterests((arr) =>
      arr.includes(tag) ? arr.filter((x) => x !== tag) : [...arr, tag]
    );
  }

  // Helpers
  function splitInterests(s) {
    return String(s)
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean)
      .slice(0, 8);
  }
  function inferKey(q) {
    const x = q.toLowerCase();
    if (x.includes("budget")) return "budget";
    if (x.includes("pace")) return "pace";
    if (x.includes("days")) return "days";
    if (x.includes("destination")) return "destination";
    if (x.includes("interest")) return "interests";
    if (x.includes("month")) return "month";
    if (x.includes("start")) return "startCity";
    if (x.includes("traveler")) return "travelers";
    return "extra";
  }

  // API call
  async function sendToPlanner(optionalText) {
    setLoading(true);
    setPlanJson(null);

    // Map free-typed answer to the first pending question (if any)
    let followUpAnswers = { ...answers };
    if (pendingQuestions.length && optionalText?.trim()) {
      const key = inferKey(pendingQuestions[0]);
      followUpAnswers = {
        ...followUpAnswers,
        [key]: key === "interests" ? splitInterests(optionalText) : optionalText,
      };
    }

    try {
      const res = await fetch("/api/ai/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination,
          days: Number(days),
          budget,
          pace,
          interests,
          followUpAnswers,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Request failed: ${res.status}`);
      }

      const data = await res.json();

      if (data.status === "need_info") {
        setPendingQuestions(data.questions || []);
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            content: (
              <div>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>
                  I need a couple of quick details:
                </div>
                <ul style={{ marginLeft: 18 }}>
                  {(data.questions || []).map((q, i) => (
                    <li key={i} style={{ margin: "4px 0" }}>
                      {q}
                    </li>
                  ))}
                </ul>
                <div style={{ fontSize: 12, color: palette.sub, marginTop: 6 }}>
                  Answer in one line if you’d like (e.g., “mid budget, relaxed pace”).
                </div>
              </div>
            ),
          },
        ]);
        return;
      }

      setPendingQuestions([]);
      setAnswers({});
      if (data.planJson) setPlanJson(data.planJson);
      setMessages((m) => [
        ...m,
        { role: "assistant", content: data.plan || "No plan returned." },
      ]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: `Planner error: ${err?.message || "unknown"}. Check your key in Vercel and the server logs.`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e?.preventDefault();
    const text = input.trim();
    if (text) setMessages((m) => [...m, { role: "user", content: text }]);
    setInput("");

    // Smart fill: “Rome 4 days”
    const m = text.match(/([A-Za-z\s]+)\s+(\d{1,2})\s*days?/i);
    if (m && !destination && !days) {
      setDestination(m[1].trim());
      setDays(m[2]);
    }

    await sendToPlanner(text);
  }

  return (
    <div style={{ minHeight: "100vh", background: palette.bg, color: palette.text }}>
      {/* Header */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          backdropFilter: "blur(8px)",
          borderBottom: `1px solid ${palette.border}`,
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            padding: "14px 16px",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div
            style={{
              height: 36,
              width: 36,
              borderRadius: 12,
              background: "linear-gradient(135deg,#39bdf8,#a66bff)",
              display: "grid",
              placeItems: "center",
              fontWeight: 900,
              color: "#0b1220",
            }}
          >
            G
          </div>
          <div
            style={{
              fontWeight: 900,
              fontSize: 18,
              background: "linear-gradient(135deg,#e2f7ff,#d7c7ff)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            GlobTrek
          </div>
          <div style={{ marginLeft: "auto", fontSize: 12, color: palette.sub }}>
            Prototype · AI trip planner
          </div>
        </div>
      </header>

      <main
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: 16,
          display: "grid",
          gap: 16,
          gridTemplateColumns: "1fr 360px",
        }}
      >
        {/* Left: Controls + Chat */}
        <section style={{ display: "grid", gap: 16 }}>
          {/* Controls */}
          <div
            style={{
              background: palette.card,
              border: `1px solid ${palette.border}`,
              borderRadius: 20,
              boxShadow: palette.glow,
              padding: 16,
            }}
          >
            <div
              style={{
                display: "grid",
                gap: 12,
                gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
              }}
            >
              <div style={{ gridColumn: "span 2" }}>
                <Label>Destination</Label>
                <Input
                  placeholder="Tokyo, Paris, Oaxaca…"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                />
              </div>
              <div>
                <Label>Days</Label>
                <Input
                  placeholder="5"
                  inputMode="numeric"
                  value={days}
                  onChange={(e) => setDays(e.target.value)}
                />
              </div>
              <div>
                <Label>Budget</Label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {chip("Low", budget === "low", () => setBudget("low"))}
                  {chip("Mid", budget === "mid", () => setBudget("mid"))}
                  {chip("High", budget === "high", () => setBudget("high"))}
                </div>
              </div>
            </div>

            <div style={{ marginTop: 12 }}>
              <Label>Pace</Label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {chip("Relaxed", pace === "relaxed", () => setPace("relaxed"))}
                {chip("Balanced", pace === "balanced", () => setPace("balanced"))}
                {chip("Packed", pace === "packed", () => setPace("packed"))}
              </div>
            </div>

            <div style={{ marginTop: 12 }}>
              <Label>Interests</Label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {[
                  "food",
                  "history",
                  "nature",
                  "nightlife",
                  "art",
                  "shopping",
                  "beaches",
                  "hikes",
                ].map((t) => (
                  <button
                    key={t}
                    onClick={() => toggleInterest(t)}
                    style={{
                      padding: "8px 12px",
                      borderRadius: 999,
                      border: `1px solid ${
                        interests.includes(t) ? palette.accent : palette.border
                      }`,
                      background: interests.includes(t)
                        ? "linear-gradient(135deg,#39bdf8,#a66bff)"
                        : palette.card,
                      color: interests.includes(t) ? "#0b1220" : palette.text,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Chat */}
          <div
            style={{
              background: palette.card,
              border: `1px solid ${palette.border}`,
              borderRadius: 20,
              boxShadow: palette.glow,
              overflow: "hidden",
            }}
          >
            <div
              ref={scrollerRef}
              style={{
                maxHeight: "55vh",
                overflowY: "auto",
                padding: 16,
                display: "grid",
                gap: 12,
              }}
            >
              {messages.map((m, i) => (
                <ChatRow key={i} role={m.role}>
                  {m.content}
                </ChatRow>
              ))}
              {loading && (
                <div style={{ fontSize: 12, color: palette.sub }}>
                  Planning your trip…
                </div>
              )}
            </div>

            <form
              onSubmit={handleSubmit}
              style={{
                borderTop: `1px solid ${palette.border}`,
                padding: 12,
                background: "rgba(8,12,20,0.6)",
              }}
            >
              {pendingQuestions.length > 0 && (
                <div style={{ fontSize: 12, color: palette.sub, marginBottom: 8 }}>
                  I need a bit more: {pendingQuestions.join(" · ")}
                </div>
              )}
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  placeholder={
                    pendingQuestions[0] ||
                    "Try: 7 days in Tokyo with food and museums"
                  }
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  style={{
                    flex: 1,
                    padding: "12px 14px",
                    borderRadius: 14,
                    border: `1px solid ${palette.border}`,
                    background: "rgba(255,255,255,0.06)",
                    color: palette.text,
                    outline: "none",
                  }}
                />
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: "12px 16px",
                    borderRadius: 14,
                    background: "linear-gradient(135deg,#39bdf8,#a66bff)",
                    color: "#0b1220",
                    fontWeight: 800,
                    border: "none",
                    cursor: "pointer",
                    opacity: loading ? 0.7 : 1,
                  }}
                >
                  Send
                </button>
              </div>
            </form>
          </div>
        </section>

        {/* Right: Snapshot */}
        <aside style={{ position: "relative" }}>
          {planJson?.daily?.length ? (
            <div style={{ position: "sticky", top: 16, display: "grid", gap: 12 }}>
              <div
                style={{
                  background: palette.card,
                  border: `1px solid ${palette.border}`,
                  borderRadius: 20,
                  boxShadow: palette.glow,
                  padding: 16,
                }}
              >
                <div style={{ fontWeight: 800, fontSize: 18 }}>Trip snapshot</div>
                {planJson.summary && (
                  <p style={{ color: palette.sub, marginTop: 8 }}>
                    {planJson.summary}
                  </p>
                )}
                {planJson.best_time && (
                  <p style={{ marginTop: 8 }}>
                    <span style={{ opacity: 0.7 }}>When to go:</span>{" "}
                    {planJson.best_time}
                  </p>
                )}
              </div>
              <div
                style={{
                  background: palette.card,
                  border: `1px solid ${palette.border}`,
                  borderRadius: 20,
                  boxShadow: palette.glow,
                  padding: 16,
                }}
              >
                <div style={{ fontWeight: 800, marginBottom: 8 }}>Itinerary</div>
                <ol style={{ maxHeight: "52vh", overflow: "auto", paddingRight: 4 }}>
                  {planJson.daily.map((d) => (
                    <li
                      key={d.day}
                      style={{
                        border: `1px solid ${palette.border}`,
                        background: "rgba(255,255,255,0.05)",
                        borderRadius: 14,
                        padding: 10,
                        marginBottom: 8,
                      }}
                    >
                      <div style={{ fontSize: 12, opacity: 0.7 }}>Day {d.day}</div>
                      <div style={{ fontWeight: 700 }}>{d.theme || "Explore"}</div>
                      {d.neighborhoods?.length ? (
                        <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>
                          Areas: {d.neighborhoods.join(", ")}
                        </div>
                      ) : null}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          ) : (
            <div style={{ position: "sticky", top: 16, color: palette.sub, fontSize: 14 }}>
              Your plan summary will appear here.
            </div>
          )}
        </aside>
      </main>

      <footer style={{ textAlign: "center", padding: 18, color: palette.sub, fontSize: 12 }}>
        Built thoughtfully · GlobTrek prototype
      </footer>
    </div>
  );
}

function Label({ children }) {
  return (
    <div style={{ fontSize: 12, color: "#9aa0a6", marginBottom: 6 }}>{children}</div>
  );
}
function Input(props) {
  return (
    <input
      {...props}
      style={{
        width: "100%",
        padding: "10px 12px",
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(255,255,255,0.06)",
        color: "#e5e7eb",
        outline: "none",
      }}
    />
  );
}
function ChatRow({ role, children }) {
  const isUser = role === "user";
  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        alignItems: "flex-start",
        justifyContent: isUser ? "flex-end" : "flex-start",
      }}
    >
      {!isUser && <AvatarAI />}
      <div
        style={{
          maxWidth: "78%",
          padding: "10px 14px",
          borderRadius: 16,
          background: isUser ? "#1e293b" : "rgba(255,255,255,0.07)",
          border: "1px solid rgba(255,255,255,0.12)",
          color: "#e5e7eb",
        }}
      >
        {typeof children === "string" ? (
          <span style={{ whiteSpace: "pre-wrap" }}>{children}</span>
        ) : (
          children
        )}
      </div>
      {isUser && <AvatarUser />}
    </div>
  );
}
function AvatarAI() {
  return (
    <div
      style={{
        height: 32,
        width: 32,
        borderRadius: 12,
        background: "linear-gradient(135deg,#39bdf8,#a66bff)",
        display: "grid",
        placeItems: "center",
        color: "#0b1220",
        fontWeight: 900,
      }}
    >
      G
    </div>
  );
}
function AvatarUser() {
  return (
    <div
      style={{
        height: 32,
        width: 32,
        borderRadius: 999,
        background: "#3b82f6",
        display: "grid",
        placeItems: "center",
        color: "white",
        fontWeight: 800,
      }}
    >
      U
    </div>
  );
}
