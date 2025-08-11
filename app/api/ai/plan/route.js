import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(req) {
  try {
    const { destination, days } = await req.json();

    const prompt = `Create a detailed travel itinerary for ${days} days in ${destination}.
    Include flights, hotels, activities, food recommendations, and total estimated costs.`

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a travel planning assistant for GlobTrek." },
        { role: "user", content: prompt }
      ]
    });

    return new Response(
      JSON.stringify({ plan: response.choices[0].message.content }),
      { status: 200 }
    );

  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    );
  }
}
