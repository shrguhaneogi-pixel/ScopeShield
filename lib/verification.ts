import type {
  AtomicAsk,
  Contract,
  ContractClause,
  DraftResponse,
  RawExtractionAsk,
  Tone,
  Verification,
  VerifiedAskResult,
  Verdict
} from "./schemas";

function normalize(value: string): string {
  return value
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function findClause(clauseId: string | null, clauses: ContractClause[]): ContractClause | undefined {
  return clauseId ? clauses.find((clause) => clause.id === clauseId) : undefined;
}

function verifyRawAsk(ask: RawExtractionAsk, clauses: ContractClause[]): VerifiedAskResult {
  const clause = findClause(ask.citedClauseId, clauses);
  const quoteVerified = Boolean(clause && ask.verbatimQuote && normalize(clause.body).includes(normalize(ask.verbatimQuote)));
  const citationVerified = Boolean(clause && quoteVerified);
  const verificationNote = citationVerified
    ? `Verified exact quote against ${clause?.id}.`
    : "Citation failed verification: Quoted text was not found in original contract.";
  return {
    ...ask,
    citationVerified,
    verificationNote,
    deterministicOverrideApplied: !citationVerified,
    verdict: citationVerified ? ask.verdict : "AMBIGUOUS"
  };
}

export function verifyCitations(asks: RawExtractionAsk[], clauses: ContractClause[]): VerifiedAskResult[] {
  return asks.map((ask) => verifyRawAsk(ask, clauses));
}

export function verifyAsk(ask: AtomicAsk, contract: Contract): Verification {
  const rawAsk: RawExtractionAsk = {
    askId: ask.id,
    extractedText: ask.summary,
    verdict: "IN_SCOPE",
    rationale: ask.summary,
    citedClauseId: ask.clauseId,
    verbatimQuote: ask.verbatimQuote
  };
  const verified = verifyRawAsk(rawAsk, contract.clauses);
  const clause = findClause(ask.clauseId, contract.clauses);
  const limitChecks = [];
  if (ask.type === "revision") {
    const cap = clause?.body.match(/up to (\w+) rounds/i)?.[1];
    limitChecks.push({
      name: "revision cap",
      passed: Boolean(cap),
      detail: cap ? `Contract cap: ${cap} rounds.` : "No revision cap found in the cited clause."
    });
  }
  const verdict: Verdict = !verified.citationVerified
    ? "AMBIGUOUS"
    : ask.type === "new_work" && /exclude|not include|out of scope/i.test(clause?.body ?? "")
      ? "OUT_OF_SCOPE"
      : limitChecks.some((check) => !check.passed) ? "AMBIGUOUS" : "IN_SCOPE";
  return {
    askId: ask.id,
    clauseId: ask.clauseId,
    citationVerified: verified.citationVerified,
    quoteVerified: verified.citationVerified,
    limitChecks,
    verdict,
    warnings: verified.citationVerified ? [] : [verified.verificationNote]
  };
}

export function draftResponse(verifications: Verification[], tone: Tone): string {
  if (verifications.some((item) => item.verdict === "AMBIGUOUS")) return "I need to confirm one detail against the signed agreement before I can give you a definitive answer. Could you clarify the deliverable or share the relevant context?";
  if (verifications.every((item) => item.verdict === "OUT_OF_SCOPE")) return tone === "FIRM" ? "Thanks for the request. This falls outside our signed scope, so I can provide a separate estimate for the additional work." : "Thanks for the request. This appears to be outside the signed scope; I can prepare a separate estimate if helpful.";
  return tone === "COLLABORATIVE" ? "Thanks for the thoughtful request. This is covered by our current scope, and I’m happy to fold it into the next delivery." : "Thanks for the request. This is covered by the signed scope and will be included in the next delivery.";
}

export function draftVerifiedResponse(asks: VerifiedAskResult[], tone: Tone): DraftResponse {
  const ambiguous = asks.some((ask) => ask.verdict === "AMBIGUOUS");
  const outOfScope = asks.length > 0 && asks.every((ask) => ask.verdict === "OUT_OF_SCOPE");
  const emailBody = ambiguous
    ? "I need to confirm one detail against the signed agreement before I can give you a definitive answer. Could you clarify the deliverable or share the relevant context?"
    : outOfScope
      ? tone === "FIRM" ? "Thanks for the request. This falls outside our signed scope, so I can provide a separate estimate for the additional work." : "Thanks for the request. This appears to be outside the signed scope; I can prepare a separate estimate if helpful."
      : tone === "COLLABORATIVE" ? "Thanks for the thoughtful request. This is covered by our current scope, and I’m happy to fold it into the next delivery." : "Thanks for the request. This is covered by the signed scope and will be included in the next delivery.";
  return {
    tone,
    emailBody,
    referencedClauses: asks.filter((ask) => ask.citationVerified && ask.citedClauseId).map((ask) => ask.citedClauseId as string)
  };
}
