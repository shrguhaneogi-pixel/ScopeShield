import { NextResponse } from "next/server";
import { analyzeRequest } from "@/lib/pipeline";

export async function POST(request: Request) {
  try {
    const result = await analyzeRequest(await request.json());
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to analyze request.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
