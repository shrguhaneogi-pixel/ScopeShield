import { getContract } from "./contracts";
import { createProvider } from "./providers";
import { AnalyzeRequestSchema, AnalysisResultSchema } from "./schemas";
import { draftResponse, verifyAsk } from "./verification";
import { runAnalysisWorkflow } from "./workflow";

export async function analyzeRequest(input: unknown) {
  const request = AnalyzeRequestSchema.parse(input);
  const contract = getContract(request.contractId);
  if (!contract) throw new Error("Contract not found.");
  const provider = createProvider();
  const modelAnalysis = await runAnalysisWorkflow(provider, request.message, contract.clauses.map((clause) => `${clause.id}: ${clause.text}`).join("\n"));
  const analyses = modelAnalysis.asks.map((ask) => verifyAsk(ask, contract));
  return AnalysisResultSchema.parse({
    contractId: contract.id,
    message: request.message,
    analyses,
    draft: draftResponse(analyses, request.tone),
    revision: request.revision,
    createdAt: new Date().toISOString()
  });
}
