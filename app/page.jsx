"use client";
import { useState } from "react";

export default function HomePage() {
  const [destination, setDestination] = useState("");
  const [days, setDays] = useState("");
  const [plan, setPlan] = useState("");
  const [loading, setLoading] = useState(false);

  async function getPlan() {
    if (!destination || !days) return alert("Enter destination & days");
    setLoading(true);
    setPlan("");
    try {
      const res = await fetch("/api/ai/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ destination, days: Number(days) })
      });
      const data = await res.json();
      setPlan(data.plan || data.error || "No plan returned.");
    } catch {
      setPlan("Error contacting planner.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ padding: "2rem", maxWidth: 700, margin: "0 auto" }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12 }}>
        Globtrek — AI Trip Planner
      </h1>
      <div style={{ display: "grid", gap: 10, marginBottom: 12 }}>
        <input
          placeholder="Destination (e.g., Thailand)"
          value={destination}
          onChange={e => setDestination(e.target.value)}
          style={{ padding: 10, border: "1px solid #ddd", borderRadius: 8 }}
        />
        <input
          placeholder="Days (e.g., 7)"
          value={days}
          onChange={e => setDays(e.target.value)}
          inputMode="numeric"
          style={{ padding: 10, border: "1px solid #ddd", borderRadius: 8 }}
        />
        <button
          onClick={getPlan}
          disabled={loading}
          style={{
            padding: "10px 14px",
            borderRadius: 8,
            background: "#199fff",
            color: "#fff",
            fontWeight: 700,
            border: "none",
            cursor: "pointer",
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? "Planning…" : "Generate Plan"}
        </button>
      </div>
      {plan && (
        <pre style={{
          whiteSpace: "pre-wrap",
          background: "#f6f9ff",
          border: "1px solid #e6eefc",
          padding: 12,
          borderRadius: 8
        }}>
          {plan}
        </pre>
      )}
    </main>
  );
}
