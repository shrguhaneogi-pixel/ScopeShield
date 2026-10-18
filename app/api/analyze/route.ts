import { NextResponse } from "next/server";
import { analyzeRequest } from "@/lib/pipeline";
import { extractContractText } from "@/lib/ingestion";

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") ?? "";
    const input = contentType.includes("multipart/form-data")
      ? await parseMultipartRequest(await request.formData())
      : await request.json();
    const result = await analyzeRequest(input);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to analyze request.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

async function parseMultipartRequest(form: FormData) {
  const contractFile = form.get("contractFile");
  const contractText = contractFile instanceof File
    ? await extractContractText(Buffer.from(await contractFile.arrayBuffer()))
    : String(form.get("contractText") ?? "");
  return {
    contractText,
    clientMessage: String(form.get("clientMessage") ?? ""),
    tone: String(form.get("tone") ?? "NEUTRAL"),
    revision: Number(form.get("revision") ?? 1)
  };
}
