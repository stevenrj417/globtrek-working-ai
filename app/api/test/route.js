export async function GET() {
  return new Response("TEST ENDPOINT WORKS", {
    status: 200,
    headers: { "Content-Type": "text/plain" }
  });
}
