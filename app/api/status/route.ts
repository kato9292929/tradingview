import { getLogs } from "@/lib/store";

export async function GET() {
  const logs = getLogs();
  return Response.json({ logs });
}
