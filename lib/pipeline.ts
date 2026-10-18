import { getContract } from "./contracts";
import { createProvider } from "./providers";
import { AnalyzeRequestSchema, AnalysisResultSchema } from "./schemas";
import { runAnalysisWorkflow } from "./workflow";

export async function analyzeRequest(input: unknown) {
  const request = AnalyzeRequestSchema.parse(input);
  const contract = request.contractId ? getContract(request.contractId) : undefined;
  if (!contract && !request.contractText) throw new Error("Contract not found.");
  const provider = createProvider();
  const clauses = contract?.clauses ?? [];
  if (!clauses.length && request.contractText) {
    const { contractFromText } = await import("./ingestion");
    const parsed = contractFromText("uploaded-contract", "Uploaded contract", request.contractText);
    clauses.push(...parsed.clauses);
  }
  const message = request.message ?? request.clientMessage;
  if (!message) throw new Error("Client message is required.");
  const workflowResult = await runAnalysisWorkflow(provider, {
    message,
    contractText: request.contractText ?? clauses.map((clause) => `${clause.id}: ${clause.body}`).join("\n"),
    clauses,
    tone: request.tone
  });
  const analyses = workflowResult.verifiedAsks.map((ask) => ({
    askId: ask.askId,
    clauseId: ask.citedClauseId,
    citationVerified: ask.citationVerified,
    quoteVerified: ask.citationVerified,
    limitChecks: [],
    verdict: ask.verdict,
    warnings: ask.citationVerified ? [] : [ask.verificationNote]
  }));
  return AnalysisResultSchema.parse({
    contractId: contract?.id ?? "uploaded-contract",
    message,
    analyses,
    verifiedAsks: workflowResult.verifiedAsks,
    draft: workflowResult.draft.emailBody,
    draftResponse: workflowResult.draft,
    revision: request.revision,
    createdAt: new Date().toISOString()
  });
}
