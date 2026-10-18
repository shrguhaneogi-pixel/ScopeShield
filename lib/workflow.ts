import { createStep, createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";
import { ModelAnalysisSchema } from "./schemas";
import type { AnalysisProvider } from "./providers";

declare global {
  var __scopeShieldProvider: AnalysisProvider | undefined;
}

const inputSchema = z.object({ message: z.string(), contractText: z.string() });
const analysisStep = createStep({
  id: "decompose-client-request",
  description: "Decompose a client message into typed atomic asks using the configured provider.",
  inputSchema,
  outputSchema: ModelAnalysisSchema,
  execute: async ({ inputData }) => {
    const provider = globalThis.__scopeShieldProvider;
    if (!provider) throw new Error("Analysis provider was not configured for the Mastra workflow.");
    return provider.analyze(inputData.message, inputData.contractText);
  }
});

export const analysisWorkflow = createWorkflow({
  id: "scope-analysis",
  inputSchema,
  outputSchema: ModelAnalysisSchema
}).then(analysisStep).commit();

export async function runAnalysisWorkflow(provider: AnalysisProvider, message: string, contractText: string) {
  globalThis.__scopeShieldProvider = provider;
  try {
    const run = await analysisWorkflow.createRun();
    const result = await run.start({ inputData: { message, contractText } });
    if (result.status !== "success") throw new Error("Mastra analysis workflow failed.");
    return ModelAnalysisSchema.parse(result.result);
  } finally {
    delete globalThis.__scopeShieldProvider;
  }
}
