import OpenAI from "openai";
import { DraftResponseSchema, ModelAnalysisSchema, RawExtractionAskSchema, type DraftResponse, type RawExtractionAsk } from "./schemas";

export interface AnalysisProvider {
  analyze(message: string, contractText: string): Promise<RawExtractionAsk[]>;
  draft(verifiedAsks: unknown[], tone: "FIRM" | "NEUTRAL" | "COLLABORATIVE"): Promise<DraftResponse>;
}

function mockAnalysis(message: string): RawExtractionAsk[] {
  const lower = message.toLowerCase();
  const asks = [];
  if (lower.includes("mobile")) asks.push({ askId: "ask-1", extractedText: "Build a native mobile application", verdict: "OUT_OF_SCOPE", rationale: "The request names an excluded deliverable.", citedClauseId: "clause-002", verbatimQuote: "Services do not include native mobile applications, data migration, copywriting, or third-party subscription fees." });
  if (lower.includes("revision") || lower.includes("feedback")) asks.push({ askId: `ask-${asks.length + 1}`, extractedText: "Request another revision round", verdict: "IN_SCOPE", rationale: "The request concerns the revision allowance.", citedClauseId: "clause-003", verbatimQuote: "Each deliverable includes up to two rounds of revisions. Additional revisions are billed at $150 per hour." });
  if (lower.includes("logo") || lower.includes("brand")) asks.push({ askId: `ask-${asks.length + 1}`, extractedText: "Create or change a brand deliverable", verdict: "IN_SCOPE", rationale: "The request concerns a listed brand deliverable.", citedClauseId: "clause-001", verbatimQuote: "The Designer will provide one primary logo, a secondary mark, and a one-page brand guide." });
  if (!asks.length) asks.push({ askId: "ask-1", extractedText: message.slice(0, 100), verdict: "AMBIGUOUS", rationale: "No deterministic contract evidence was identified.", citedClauseId: null, verbatimQuote: null });
  return asks.map((ask) => RawExtractionAskSchema.parse(ask));
}

export class MockProvider implements AnalysisProvider {
  async analyze(message: string, contractText: string): Promise<RawExtractionAsk[]> {
    void contractText;
    return mockAnalysis(message);
  }
  async draft(verifiedAsks: unknown[], tone: "FIRM" | "NEUTRAL" | "COLLABORATIVE"): Promise<DraftResponse> {
    return DraftResponseSchema.parse({ tone, emailBody: verifiedAsks.some((ask) => (ask as { verdict: string }).verdict === "OUT_OF_SCOPE") ? "Thanks for the request. This appears to be outside the signed scope; I can prepare a separate estimate if helpful." : "Thanks for the request. This is covered by the signed scope and will be included in the next delivery.", referencedClauses: [] });
  }
}

export class OpenAICompatibleProvider implements AnalysisProvider {
  private client: OpenAI;
  constructor(apiKey: string, baseURL: string, model: string) {
    this.client = new OpenAI({ apiKey, baseURL });
    this.model = model;
  }
  private model: string;
  async analyze(message: string, contractText: string): Promise<RawExtractionAsk[]> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "Return only JSON matching { asks: [{ askId, extractedText, verdict, rationale, citedClauseId, verbatimQuote }] }. Never invent quotes; use null when no exact evidence." },
        { role: "user", content: `Contract:\n${contractText}\n\nClient request:\n${message}` }
      ]
    });
    const content = response.choices[0]?.message.content;
    if (!content) throw new Error("Inference endpoint returned no analysis.");
    const parsed = ModelAnalysisSchema.parse(JSON.parse(content));
    return parsed.asks;
  }
  async draft(verifiedAsks: unknown[], tone: "FIRM" | "NEUTRAL" | "COLLABORATIVE"): Promise<DraftResponse> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "Return only JSON matching { tone, emailBody, referencedClauses }. Draft only from the supplied verified asks; do not add facts." },
        { role: "user", content: JSON.stringify({ tone, verifiedAsks }) }
      ]
    });
    const content = response.choices[0]?.message.content;
    if (!content) throw new Error("Inference endpoint returned no draft response.");
    return DraftResponseSchema.parse(JSON.parse(content));
  }
}

export function createProvider(): AnalysisProvider {
  if (process.env.INFERENCE_MODE === "openai-compatible") {
    const apiKey = process.env.INFERENCE_API_KEY;
    const baseURL = process.env.INFERENCE_BASE_URL;
    const model = process.env.INFERENCE_MODEL ?? "google/gemma-4";
    if (!apiKey || !baseURL) throw new Error("INFERENCE_API_KEY and INFERENCE_BASE_URL are required for live inference.");
    return new OpenAICompatibleProvider(apiKey, baseURL, model);
  }
  return new MockProvider();
}
