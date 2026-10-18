import { z } from "zod";

export const ClauseSchema = z.object({
  id: z.string().regex(/^clause-\d{3}$/),
  heading: z.string().min(1),
  text: z.string().min(1),
  sourcePage: z.number().int().positive().optional()
});
export type Clause = z.infer<typeof ClauseSchema>;

export const ContractSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  clauses: z.array(ClauseSchema).min(1)
});
export type Contract = z.infer<typeof ContractSchema>;

export const ToneSchema = z.enum(["firm", "neutral", "collaborative"]);
export type Tone = z.infer<typeof ToneSchema>;
export const VerdictSchema = z.enum(["IN_SCOPE", "OUT_OF_SCOPE", "AMBIGUOUS"]);
export type Verdict = z.infer<typeof VerdictSchema>;

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
  asks: z.array(AtomicAskSchema).min(1)
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
  draft: z.string(),
  revision: z.number().int().positive(),
  createdAt: z.string()
});
export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;

export const AnalyzeRequestSchema = z.object({
  contractId: z.string().min(1),
  message: z.string().min(1).max(10000),
  tone: ToneSchema.default("neutral"),
  revision: z.number().int().positive().default(1)
});
