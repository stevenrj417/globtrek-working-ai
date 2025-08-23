import { NextResponse } from "next/server";

export const dynamic = "force-dynamic"; // ensure server runtime (not static)

const MODEL = "gpt-4o-mini";

function clampDays(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 1;
  return Math.max(1, Math.min(30, Math.floor(x)));
}

export async function POST(req) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }

    const body = await req.json();
    const destination = String(body.destination || "").trim();
    const days = clampDays(body.days || 0);
    const budget = String(body.budget || "").trim();
    const pace = String(body.pace || "").trim();
    const interests = Array.isArray(body.interests) ? body.interests.slice(0, 8) : [];
    const followUpAnswers = body.followUpAnswers || {};

    const merged = {
      destination,
      days,
      budget: followUpAnswers.budget || budget,
      pace: followUpAnswers.pace || pace,
      interests: followUpAnswers.interests || interests,
    };

    // Ask for missing info
    const needs = [];
    if (!merged.destination) needs.push("destination");
    if (!merged.days || merged.days < 1) needs.push("days");
    if (!merged.budget) needs.push("budget");
    if (!merged.pace) needs.push("pace");
    if (!merged.interests?.length) needs.push("interests");

    if (needs.length) {
      const questions = [];
      if (needs.includes("destination")) questions.push("Where do you want to go?");
      if (needs.includes("days")) questions.push("How many days are you traveling?");
      if (needs.includes("budget")) questions.push("What’s your budget? (low / mid / high)");
      if (needs.includes("pace")) questions.push("What pace do you want? (relaxed / balanced / packed)");
      if (needs.includes("interests")) questions.push("Top interests? (food, history, nature, nightlife, art, shopping)");
      return NextResponse.json({ status: "need_info", needs, questions });
    }

    // Structured output contract
    const system =
      `You are GlobTrek, a meticulous trip designer. Return ONLY valid JSON with shape:
{
  "summary": "…",
  "best_time": "…",
  "daily": [
    {"day":1,"theme":"…","morning":"…","afternoon":"…","evening":"…","neighborhoods":["…"],"food":["…"],"notes":"…"}
  ],
  "estimated_costs": {"currency": "USD", "per_day": {"low":0,"mid":0,"high":0}, "notes": "…"},
  "tips": ["…","…"],
  "next_questions": ["…","…"]
}
Keep it destination-specific and geographically sensible. Prefer public transit where it fits. Avoid fake prices; give ranges.`;

    const user =
      `Destination: ${merged.destination}
Days: ${merged.days}
Budget: ${merged.budget}
Pace: ${merged.pace}
Interests: ${(merged.interests || []).join(", ") || "general"}

Constraints:
- daily must have exactly ${merged.days} items numbered 1..${merged.days}.
- Include neighborhoods/areas each day.
- Include at least 2 food ideas per day when possible.`;

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

    const ai = await resp.json();
    const content = ai?.choices?.[0]?.message?.content?.trim() || "";

    let json = null;
    try { json = JSON.parse(content); } catch {}

    // Text fallback for your <pre>
    let textPlan = "No plan returned.";
    if (json?.daily?.length) {
      const lines = [
        `GlobTrek — ${merged.destination} • ${merged.days} days`,
        "",
        json.summary ? `Summary: ${json.summary}` : "",
        json.best_time ? `When to go: ${json.best_time}` : "",
        "",
        ...json.daily.map((d) => ([
          `Day ${d.day}: ${d.theme || "Explore"}`,
          d.morning ? `  Morning: ${d.morning}` : "",
          d.afternoon ? `  Afternoon: ${d.afternoon}` : "",
          d.evening ? `  Evening: ${d.evening}` : "",
          d.neighborhoods?.length ? `  Areas: ${d.neighborhoods.join(", ")}` : "",
          d.food?.length ? `  Food: ${d.food.join(" • ")}` : "",
          d.notes ? `  Notes: ${d.notes}` : "",
          ""
        ].filter(Boolean).join("\n")))
      ].filter(Boolean);
      textPlan = lines.join("\n");
    } else if (content) {
      textPlan = content;
    }

    return NextResponse.json({
      status: "ok",
      plan: textPlan,
      planJson: json,
      next_questions: json?.next_questions || [],
    });
  } catch (err) {
    return NextResponse.json(
      { error: `Planner failed: ${err?.message || "unknown"}` },
      { status: 500 }
    );
  }
}
