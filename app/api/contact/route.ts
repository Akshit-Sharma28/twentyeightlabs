import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const type = String(body?.type ?? "").trim();
  const email = String(body?.email ?? "").trim();
  const context = String(body?.context ?? "").trim();

  if (!type || !email || !context) {
    return NextResponse.json(
      { error: "Project type, reply email, and brief are required." },
      { status: 400 }
    );
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { error: "Use a valid reply email." },
      { status: 400 }
    );
  }

  if (context.length < 20) {
    return NextResponse.json(
      { error: "Brief should be at least 20 characters." },
      { status: 400 }
    );
  }

  const webhookUrl = process.env.CONTACT_WEBHOOK_URL;
  const lead = {
    type,
    email,
    context,
    source: "twentyeightlab.com/contact",
    receivedAt: new Date().toISOString(),
  };

  if (!webhookUrl) {
    return NextResponse.json(
      {
        error:
          "Contact webhook is not configured. Set CONTACT_WEBHOOK_URL in Vercel.",
      },
      { status: 503 }
    );
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(lead),
  }).catch(() => null);

  if (!response?.ok) {
    return NextResponse.json(
      { error: "Could not submit the brief right now." },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true });
}
