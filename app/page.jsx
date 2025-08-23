"use client";
import { useState } from "react";

// helper: match questions to keys
function inferKey(q) {
  const s = q.toLowerCase();
  if (s.includes("budget")) return "budget";
  if (s.includes("pace")) return "pace";
  if (s.includes("days")) return "days";
  if (s.includes("destination")) return "destination";
  if (s.includes("interest")) return "interests";
  if (s.includes("month")) return "month";
  if (s.includes("start")) return "startCity";
  if (s.includes("traveler")) return "travelers";
  return "extra";
}

export default function HomePage() {
  const [destination, setDestination] = useState("");
  const [days, setDays] = useState("");
  const [plan, setPlan] = useState("");
  const [loading, setLoading] = useState(false);

  // new state for follow-ups
  const [needs, setNeeds] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});

  async function getPlan(e) {
    e?.preventDefault();
    setLoading(true);
    setPlan("");

    try {
      const res = await fetch("/api/ai/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination,
          days: Number(days),
          followUpAnswers: answers,
        }),
      });

      const data = await res.json();

      if (data.status === "need_info") {
        setNeeds(data.needs || []);
        setQuestions(data.questions || []);
        setPlan("");
        return;
      }

      setNeeds([]);
      setQuestions([]);
      setPlan(data.plan || "NO PLAN RETURNED.");
    } catch {
      setPlan("ERROR CONTACTING PLANNER.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ padding: "2rem", maxWidth: 700, margin: "0 auto" }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12 }}>
        GlobTrek — AI Trip Planner
      </h1>

      <form onSubmit={getPlan} style={{ display: "grid", gap: 10, marginBottom: 12 }}>
        <input
          placeholder="Destination (e.g., Thailand)"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          style={{ padding: 10, border: "1px solid #ddd", borderRadius: 8 }}
        />
        <input
          placeholder="Days (e.g., 7)"
          value={days}
          onChange={(e) => setDays(e.target.value)}
          inputMode="numeric"
          style={{ padding: 10, border: "1px solid #ddd", borderRadius: 8 }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "10px 14px",
            borderRadius: 8,
            background: "#199fff",
            color: "#fff",
            fontWeight: 700,
            border: "none",
            cursor: "pointer",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "Planning…" : "Generate Plan"}
        </button>
      </form>

      {/* follow-up questions block */}
      {questions.length > 0 && (
        <div style={{ marginTop: 12, padding: 12, border: "1px solid #eee", borderRadius: 8 }}>
          <h3 style={{ marginTop: 0 }}>Follow-up questions</h3>
          {questions.map((q, i) => (
            <div key={i} style={{ marginBottom: 8 }}>
              <div style={{ fontWeight: 700 }}>{q}</div>
              <input
                style={{
                  width: "100%",
                  padding: 8,
                  border: "1px solid #ddd",
                  borderRadius: 6,
                }}
                onChange={(e) =>
                  setAnswers((a) => ({ ...a, [inferKey(q)]: e.target.value }))
                }
              />
            </div>
          ))}
          <button
            onClick={getPlan}
            style={{
              marginTop: 8,
              padding: "8px 12px",
              borderRadius: 6,
              background: "#111",
              color: "#fff",
            }}
          >
            Answer & Continue
          </button>
        </div>
      )}

      {plan && (
        <pre
          style={{
            whiteSpace: "pre-wrap",
            background: "#f6f9ff",
            border: "1px solid #e6eefc",
            padding: 12,
            borderRadius: 8,
            marginTop: 12,
          }}
        >
          {plan}
        </pre>
      )}
    </main>
  );
}
