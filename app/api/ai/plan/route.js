// app/api/ai/plan/route.js
import { NextResponse } from "next/server";

const MODEL = "gpt-4o-mini"; // fast + good

function clampDays(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 1;
  return Math.max(1, Math.min(30, Math.floor(x)));
}

export async function POST(req) {
  try {
    const body = await req.json();

    const destination = String(body.destination ?? "").trim();
    const days = clampDays(body.days ?? 0);
    const budget = String(body.budget ?? "").trim();       // "low" | "mid" | "high"
    const pace = String(body.pace ?? "").trim();           // "relaxed" | "balanced" | "packed"
    const interests = Array.isArray(body.interests) ? body.interests.slice(0,8) : [];
    const month = String(body.month ?? "").trim();         // e.g., "October"
    const travelers = Math.max(1, Number(body.travelers ?? 1));
    const startCity = String(body.startCity ?? "").trim();
    const followUpAnswers = body.followUpAnswers ?? {};    // { budget: "mid", pace:"balanced", ... }

    // merge follow-up answers if provided
    const merged = {
      destination,
      days,
      budget: followUpAnswers.budget || budget,
      pace: followUpAnswers.pace || pace,
      interests: followUpAnswers.interests || interests,
      month: followUpAnswers.month || month,
      travelers: Number(followUpAnswers.travelers || travelers),
      startCity: followUpAnswers.startCity || startCity,
    };

    // Decide what we still need
    const needs = [];
    if (!merged.destination) needs.push("destination");
    if (!merged.days || merged.days < 1) needs.push("days");
    if (!merged.budget) needs.push("budget");
    if (!merged.pace) needs.push("pace");
    if (!merged.interests?.length) needs.push("interests");

    // If missing critical fields, return questions for the UI to ask
    if (needs.length) {
      const questions = [];
      if (needs.includes("destination")) questions.push("WHERE DO YOU WANT TO GO?");
      if (needs.includes("days")) questions.push("HOW MANY DAYS ARE YOU TRAVELING?");
      if (needs.includes("budget")) questions.push("WHAT’S YOUR BUDGET? (LOW / MID / HIGH)");
      if (needs.includes("pace")) questions.push("WHAT PACE DO YOU WANT? (RELAXED / BALANCED / PACKED)");
      if (needs.includes("interests")) questions.push("WHAT ARE YOUR TOP INTERESTS? (FOOD, HISTORY, NATURE, NIGHTLIFE, ART, SHOPPING)");
      return NextResponse.json({
        status: "need_info",
        needs,
        questions,
      });
    }

    // Persona + JSON contract
    const system = `
YOU ARE GLOBTREK — HYPE, CLEAR, MAIN-CHARACTER ENERGY. THINK STEP-BY-STEP BUT RETURN ONLY JSON.
OUTPUT STRICTLY:
{
  "summary": "one short paragraph",
  "best_time": "1-2 sentences tailored to the month if provided",
  "daily": [
    {"day": 1, "theme": "title", "morning": "...", "afternoon": "...", "evening": "...", "neighborhoods": ["..."], "food": ["..."], "notes": "..."}
  ],
  "estimated_costs": {"currency": "USD", "per_day": {"low": 0, "mid": 0, "high": 0}, "notes": "..."},
  "tips": ["...", "..."],
  "next_questions": ["one-liner question 1", "one-liner question 2"]
}
NO EXTRA TEXT. REAL AREAS/LANDMARKS. SANE TRANSIT. IF WEATHER MAY HURT PLANS, INCLUDE IN NOTES + SWAPS.
`.trim();

    const user = `
Destination: ${merged.destination}
Days: ${merged.days}
Travelers: ${merged.travelers}
Budget: ${merged.budget}
Pace: ${merged.pace}
Month: ${merged.month || "unspecified"}
Start city: ${merged.startCity || "unspecified"}
Interests: ${Array.isArray(merged.interests) ? merged.interests.join(", ") : merged.interests}

Constraints:
- "daily" must have exactly ${merged.days} items for days 1..${merged.days}.
- Include neighborhoods/areas each day.
- Include at least 2 food ideas per day (casual + local classic) if possible.
- Keep walking/transit realistic; cluster activities geographically.
`.trim();

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.7,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });

    if (!resp.ok) {
      const txt = await resp.text();
      return NextResponse.json({ error: `OpenAI error ${resp.status}: ${txt}` }, { status: 500 });
    }

    const data = await resp.json();
    const content = data?.choices?.[0]?.message?.content?.trim() || "";

    let planJson = null;
    try { planJson = JSON.parse(content); } catch {}

    // Build a plain-text version for your current <pre>
    let planText = "NO PLAN RETURNED.";
    if (planJson?.daily?.length) {
      const lines = [
        `🌍 GLOBTREK — ${merged.destination.toUpperCase()} • ${merged.days} DAYS`,
        "",
        planJson.summary ? `SUMMARY: ${planJson.summary}` : "",
        planJson.best_time ? `WHEN TO GO: ${planJson.best_time}` : "",
        "",
        ...planJson.daily.map(d => ([
          `DAY ${d.day}: ${d.theme || "Explore"}`,
          d.morning ? `  MORNING: ${d.morning}` : "",
          d.afternoon ? `  AFTERNOON: ${d.afternoon}` : "",
          d.evening ? `  EVENING: ${d.evening}` : "",
          d.neighborhoods?.length ? `  AREAS: ${d.neighborhoods.join(", ")}` : "",
          d.food?.length ? `  FOOD: ${d.food.join(" • ")}` : "",
          d.notes ? `  NOTES: ${d.notes}` : "",
          ""
        ].filter(Boolean).join("\n")))
      ].filter(Boolean);
      planText = lines.join("\n");
    } else if (content) {
      planText = content;
    }

    return NextResponse.json({
      status: "ok",
      plan: planText,           // works with your existing UI
      planJson: planJson || null, // optional: render fancy cards later
      asked: Object.keys(followUpAnswers || {}),
      next_questions: planJson?.next_questions || [],
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Planner failed." }, { status: 500 });
  }
}
