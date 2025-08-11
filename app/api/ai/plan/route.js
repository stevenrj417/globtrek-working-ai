// app/api/ai/plan/route.js
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { destination, days } = await request.json();

    if (!destination || !days) {
      return NextResponse.json(
        { error: "Destination and days are required." },
        { status: 400 }
      );
    }

    // TEMP FAKE RESPONSE — replace with your AI logic
    const plan = `Here’s your ${days}-day trip plan for ${destination}: 
    - Day 1: Arrival and explore the city center
    - Day 2: Sightseeing and local food
    - Day 3: Adventure activity
    - Day 4: Relax and shopping
    - Day 5: Departure`;

    return NextResponse.json({ plan });
  } catch (error) {
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}
