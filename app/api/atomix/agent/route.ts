import { NextRequest, NextResponse } from "next/server";
import { runSiteAgent } from "../../../lib/site-agent";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (String(body?.phrase ?? "").trim() !== "Atomix28") {
    return NextResponse.json({ error: "Invalid Atomix access phrase." }, { status: 401 });
  }
  const objective = String(body?.objective ?? "").trim();
  if (!objective) return NextResponse.json({ error: "An objective is required." }, { status: 400 });

  const result = await runSiteAgent(objective.slice(0, 2000), String(body?.context?.page ?? "/"), Array.isArray(body?.history) ? body.history : []);
  return NextResponse.json({ mode: "agentic", ...result });
}
