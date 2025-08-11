// app/api/ai/plan/route.js
export const runtime = "edge"; // fast + no SDK install needed

// Simple GET so visiting /api/ai/plan in a browser returns something (not 405)
export async function GET() {
  return new Response("ok", { headers: { "Content-Type": "text/plain" } });
}

// Real planner endpoint
export async function POST(req) {
  try {
    const { destination, days } = await req.json();

    if (!destination || !days) {
      return new Response(
        JSON.stringify({ error: "Missing destination or days" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const prompt = `Create a detailed travel itinerary for ${days} days in ${destination}.
Include flight ballpark, lodging per night, activities by day, local food recs, and a total estimated cost. Keep it concise but specific.`;

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.5,
        messages: [
          { role: "system", content: "You are Globtrek’s travel agent. Return a 4–7 day, day-by-day itinerary with rough costs in USD." },
          { role: "user", content: prompt }
        ]
      })
    });

    if (!r.ok) {
      const text = await r.text();
      return new Response(text || "Upstream error", {
        status: r.status,
        headers: { "Content-Type": "text/plain" }
      });
    }

    const data = await r.json();
    const plan = data.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ plan }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message || e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
