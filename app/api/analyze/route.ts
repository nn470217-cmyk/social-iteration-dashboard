import { NextRequest, NextResponse } from "next/server";
import { analyzeRecords } from "@/lib/analyze";
import type { ContentRecord } from "@/types/social";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    records?: ContentRecord[];
  };

  return NextResponse.json({
    ok: true,
    analysis: analyzeRecords(body.records ?? [])
  });
}
