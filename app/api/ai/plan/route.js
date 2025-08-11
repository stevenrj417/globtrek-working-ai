export const runtime = "nodejs"; // make sure we're using Node runtime

import OpenAI from "openai";
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req) {
  try {
    const { destination, days } = await req.json();

    const prompt = `Create a detailed travel itinerary for ${days} days in ${destination}.
Include flight ballpark, lodging per night, activities by day, local food recs, and a total estimated cost. Keep it concise but specific.`;

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.5,
      messages: [
        { role: "system", content: "You are a travel planning assistant for GlobTrek. Return a 4–7 day, day-by-day itinerary with rough USD costs." },
        { role: "user", content: prompt }
      ]
    });

    const plan = response.choices?.[0]?.message?.content || "";
    return new Response(JSON.stringify({ plan }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: String(error?.message || error) }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
