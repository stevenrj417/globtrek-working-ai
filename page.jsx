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
    try {
      const res = await fetch("/api/ai/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ destination, days })
      });
      const data = await res.json();
      setPlan(data.plan || "No plan returned.");
    } catch {
      setPlan("Error contacting AI.");
    }
    setLoading(false);
  }

  return (
    <main style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Globtrek AI Trip Planner</h1>
      <input 
        placeholder="Destination" 
        value={destination} 
        onChange={e => setDestination(e.target.value)} 
        style={{ margin: "0.5rem", padding: "0.5rem" }}
      />
      <input 
        placeholder="Days" 
        value={days} 
        onChange={e => setDays(e.target.value)} 
        style={{ margin: "0.5rem", padding: "0.5rem" }}
      />
      <button onClick={getPlan} disabled={loading} style={{ padding: "0.5rem", margin: "0.5rem" }}>
        {loading ? "Planning…" : "Get Plan"}
      </button>
      {plan && (
        <pre style={{ whiteSpace: "pre-wrap", background: "#eef", padding: "1rem", marginTop: "1rem" }}>
          {plan}
        </pre>
      )}
    </main>
  );
}
