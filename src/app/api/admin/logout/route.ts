import { NextRequest, NextResponse } from "next/server";
import { destroySession } from "@/lib/auth";
import { jsonError, verifySameOrigin } from "@/lib/security";

export async function POST(request: NextRequest) {
  if (!verifySameOrigin(request)) return jsonError("Origin tidak valid", 403);
  await destroySession();
  return NextResponse.json({ ok: true });
}