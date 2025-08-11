"use client";
import { useState } from "react";

export default function Home() {
  const [destination, setDestination] = useState("");
  const [days, setDays] = useState("");
  const [out, setOut] = useState("");
  const [loading, setLoading] = useState(false);

  async function plan() {
    if (!destination || !days) return alert("Fill destination + days");
    setLoading(true);
    setOut("Thinking…");
    try {
      const r = await fetch("/api/ai/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ destination, days })
      });
      const data = await r.json();
      setOut(data.plan || data.error || "No result");
    } catch (e) {
      setOut("Error talking to AI.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{maxWidth:860, margin:"40px auto", padding:"0 16px"}}>
      <h1 style={{fontSize:32, fontWeight:800}}>Globtrek — AI Planner</h1>

      <div style={{display:"grid", gap:8, marginTop:12}}>
        <input
          placeholder="Destination (e.g., Thailand)"
          value={destination}
          onChange={e=>setDestination(e.target.value)}
          style={{padding:12, border:"1px solid #ddd", borderRadius:8}}
        />
        <input
          placeholder="Days (e.g., 7)"
          value={days}
          onChange={e=>setDays(e.target.value)}
          style={{padding:12, border:"1px solid #ddd", borderRadius:8}}
        />
        <button
          onClick={plan}
          disabled={loading}
          style={{padding:"12px 16px", borderRadius:8, background:"#199fff", color:"#fff", fontWeight:700}}
        >
          {loading ? "Planning…" : "Plan my trip"}
        </button>
      </div>

      <pre style={{whiteSpace:"pre-wrap", background:"#f7f7f9", padding:16, borderRadius:8, marginTop:16}}>
        {out || "Your itinerary will appear here…"}
      </pre>
    </main>
  );
}
