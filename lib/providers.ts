import OpenAI from "openai";
import { ModelAnalysisSchema, type ModelAnalysis } from "./schemas";

export interface AnalysisProvider {
  analyze(message: string, contractText: string): Promise<ModelAnalysis>;
}

function mockAnalysis(message: string): ModelAnalysis {
  const lower = message.toLowerCase();
  const asks = [];
  if (lower.includes("mobile")) asks.push({ id: "ask-1", summary: "Build a native mobile application", deliverable: "mobile application", type: "new_work" as const, clauseId: "clause-002", verbatimQuote: "Services do not include native mobile applications, data migration, copywriting, or third-party subscription fees." });
  if (lower.includes("revision") || lower.includes("feedback")) asks.push({ id: `ask-${asks.length + 1}`, summary: "Request another revision round", deliverable: "current deliverable", type: "revision" as const, clauseId: "clause-003", verbatimQuote: "Each deliverable includes up to two rounds of revisions. Additional revisions are billed at $150 per hour." });
  if (lower.includes("logo") || lower.includes("brand")) asks.push({ id: `ask-${asks.length + 1}`, summary: "Create or change a brand deliverable", deliverable: "brand assets", type: "new_work" as const, clauseId: "clause-001", verbatimQuote: "The Designer will provide one primary logo, a secondary mark, and a one-page brand guide." });
  if (!asks.length) asks.push({ id: "ask-1", summary: message.slice(0, 100), deliverable: "requested work", type: "other" as const, clauseId: null, verbatimQuote: null });
  return ModelAnalysisSchema.parse({ asks });
}

export class MockProvider implements AnalysisProvider {
  async analyze(message: string, _contractText: string): Promise<ModelAnalysis> {
    return mockAnalysis(message);
  }
}

export class OpenAICompatibleProvider implements AnalysisProvider {
  private client: OpenAI;
  constructor(apiKey: string, baseURL: string, model: string) {
    this.client = new OpenAI({ apiKey, baseURL });
    this.model = model;
  }
  private model: string;
  async analyze(message: string, contractText: string): Promise<ModelAnalysis> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "Return only JSON matching { asks: [{ id, summary, deliverable, type, clauseId, verbatimQuote }] }. Never invent quotes; use null when no exact evidence." },
        { role: "user", content: `Contract:\n${contractText}\n\nClient request:\n${message}` }
      ]
    });
    const content = response.choices[0]?.message.content;
    if (!content) throw new Error("Inference endpoint returned no analysis.");
    return ModelAnalysisSchema.parse(JSON.parse(content));
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
