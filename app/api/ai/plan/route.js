import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { destination, days } = await req.json();
    if (!destination || !Number.isFinite(days)) {
      return NextResponse.json({ error: "Missing destination or days" }, { status: 400 });
    }

    const plan = `🌍 GLOBTREK PLAN
DESTINATION: ${destination}
DAYS: ${days}

DAY 1: ARRIVE + LOCAL WALK
DAY 2: CITY CORE + STREET FOOD
DAY 3: DAY TRIP
DAY 4: MUSEUM / MARKET
DAY 5: HIKE / BEACH
${days > 5 ? "DAY 6+: FREE DAY + HIDDEN SPOTS" : ""}`;

    return NextResponse.json({ plan });
  } catch {
    return NextResponse.json({ error: "Planner failed." }, { status: 500 });
  }
}
