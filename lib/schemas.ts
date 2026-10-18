import { z } from "zod";

export const ClauseCategoryEnum = z.enum([
  "DELIVERABLES",
  "REVISIONS",
  "TIMELINE",
  "EXCLUSIONS",
  "PAYMENT",
  "LEGAL_IP"
]);
export type ClauseCategory = z.infer<typeof ClauseCategoryEnum>;

export const ContractClauseSchema = z.object({
  id: z.string().regex(/^clause-\d{3}$/),
  title: z.string().min(1),
  body: z.string().min(1),
  category: ClauseCategoryEnum,
  sourcePage: z.number().int().positive().optional()
});
export type ContractClause = z.infer<typeof ContractClauseSchema>;

export const ClauseSchema = ContractClauseSchema.transform((clause) => ({
  ...clause,
  heading: clause.title,
  text: clause.body
}));
export type Clause = ContractClause & { heading: string; text: string };

export const ContractSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  clauses: z.array(ContractClauseSchema).min(1)
});
export type Contract = z.infer<typeof ContractSchema>;

export const ToneSchema = z.enum(["firm", "neutral", "collaborative"]);
export type Tone = z.infer<typeof ToneSchema>;
export const VerdictStateEnum = z.enum(["IN_SCOPE", "OUT_OF_SCOPE", "AMBIGUOUS"]);
export const VerdictSchema = VerdictStateEnum;
export type Verdict = z.infer<typeof VerdictSchema>;

export const RawExtractionAskSchema = z.object({
  id: z.string().min(1),
  extractedText: z.string().min(1),
  verdict: VerdictStateEnum,
  rationale: z.string().min(1),
  citedClauseId: z.string().regex(/^clause-\d{3}$/).nullable(),
  verbatimQuote: z.string().min(1).nullable()
});
export type RawExtractionAsk = z.infer<typeof RawExtractionAskSchema>;

export const VerifiedAskResultSchema = RawExtractionAskSchema.extend({
  citationVerified: z.boolean(),
  verificationNote: z.string().min(1)
});
export type VerifiedAskResult = z.infer<typeof VerifiedAskResultSchema>;

export const DraftResponseSchema = z.object({
  tone: ToneSchema,
  emailBody: z.string().min(1),
  referencedClauses: z.array(z.string().regex(/^clause-\d{3}$/))
});
export type DraftResponse = z.infer<typeof DraftResponseSchema>;

export const AtomicAskSchema = z.object({
  id: z.string().min(1),
  summary: z.string().min(1),
  deliverable: z.string().min(1),
  type: z.enum(["new_work", "revision", "deadline", "question", "other"]),
  clauseId: z.string().regex(/^clause-\d{3}$/).nullable(),
  verbatimQuote: z.string().min(1).nullable(),
  requestedAt: z.string().optional()
});
export type AtomicAsk = z.infer<typeof AtomicAskSchema>;

export const ModelAnalysisSchema = z.object({
  asks: z.array(RawExtractionAskSchema).min(1)
});
export type ModelAnalysis = z.infer<typeof ModelAnalysisSchema>;

export const VerificationSchema = z.object({
  askId: z.string(),
  clauseId: z.string().nullable(),
  citationVerified: z.boolean(),
  quoteVerified: z.boolean(),
  limitChecks: z.array(z.object({
    name: z.string(),
    passed: z.boolean(),
    detail: z.string()
  })),
  verdict: VerdictSchema,
  warnings: z.array(z.string())
});
export type Verification = z.infer<typeof VerificationSchema>;

export const AnalysisResultSchema = z.object({
  contractId: z.string(),
  message: z.string(),
  analyses: z.array(VerificationSchema),
  verifiedAsks: z.array(VerifiedAskResultSchema).default([]),
  draft: z.string(),
  draftResponse: DraftResponseSchema.optional(),
  revision: z.number().int().positive(),
  createdAt: z.string()
});
export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;

export const AnalyzeRequestSchema = z.object({
  contractId: z.string().min(1).optional(),
  contractText: z.string().min(1).optional(),
  message: z.string().min(1).max(10000).optional(),
  clientMessage: z.string().min(1).max(10000).optional(),
  tone: ToneSchema.default("neutral"),
  revision: z.number().int().positive().default(1)
}).refine((input) => Boolean(input.contractId || input.contractText) && Boolean(input.message || input.clientMessage), {
  message: "Provide contractId or contractText, and message or clientMessage."
});
