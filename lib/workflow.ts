import { createStep, createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";
import { DraftResponseSchema, RawExtractionAskSchema, type ContractClause, type DraftResponse } from "./schemas";
import type { AnalysisProvider } from "./providers";
import { verifyCitations } from "./verification";

declare global {
  var __scopeShieldProvider: AnalysisProvider | undefined;
}

const inputSchema = z.object({
  message: z.string(),
  contractText: z.string(),
  clauses: z.array(z.object({ id: z.string(), title: z.string(), body: z.string(), category: z.string() })),
  tone: z.enum(["firm", "neutral", "collaborative"])
});
const extractionOutputSchema = z.object({
  asks: z.array(RawExtractionAskSchema),
  clauses: inputSchema.shape.clauses,
  tone: inputSchema.shape.tone
});
const extractionStep = createStep({
  id: "analyze-client-request",
  description: "Extract typed atomic asks and provisional evidence from the client message.",
  inputSchema,
  outputSchema: extractionOutputSchema,
  execute: async ({ inputData }) => {
    const provider = globalThis.__scopeShieldProvider;
    if (!provider) throw new Error("Analysis provider was not configured for the Mastra workflow.");
    return {
      asks: await provider.analyze(inputData.message, inputData.contractText),
      clauses: inputData.clauses,
      tone: inputData.tone
    };
  }
});

const workflowOutputSchema = z.object({ verifiedAsks: z.array(z.any()), draft: DraftResponseSchema });
const draftStep = createStep({
  id: "draft-verified-response",
  description: "Verify citations locally and draft only from verified results.",
  inputSchema: extractionOutputSchema,
  outputSchema: workflowOutputSchema,
  execute: async ({ inputData }) => {
    const provider = globalThis.__scopeShieldProvider;
    if (!provider) throw new Error("Analysis provider was not configured for the Mastra workflow.");
    const verified = verifyCitations(inputData.asks, inputData.clauses as ContractClause[]);
    return { verifiedAsks: verified, draft: await provider.draft(verified, inputData.tone) };
  }
});

export const analysisWorkflow = createWorkflow({
  id: "scope-analysis",
  inputSchema,
  outputSchema: workflowOutputSchema
})
  .then(extractionStep)
  .map(async ({ getStepResult }) => getStepResult(extractionStep))
  .then(draftStep)
  .commit();

export async function runAnalysisWorkflow(provider: AnalysisProvider, input: z.input<typeof inputSchema>) {
  globalThis.__scopeShieldProvider = provider;
  try {
    const run = await analysisWorkflow.createRun();
    const result = await run.start({ inputData: input });
    if (result.status !== "success") throw new Error("Mastra analysis workflow failed.");
    return workflowOutputSchema.parse(result.result);
  } finally {
    delete globalThis.__scopeShieldProvider;
  }
}
