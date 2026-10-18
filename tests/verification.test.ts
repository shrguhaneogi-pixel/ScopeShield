import { describe, expect, it } from "vitest";
import { sampleContracts } from "../lib/contracts";
import { segmentClauses } from "../lib/ingestion";
import { verifyAsk, verifyCitations } from "../lib/verification";
import { AtomicAskSchema, RawExtractionAskSchema } from "../lib/schemas";

const software = sampleContracts[0];

describe("deterministic citation verification", () => {
  it("accepts an exact quote from the cited canonical clause", () => {
    const ask = AtomicAskSchema.parse({ id: "ask-1", summary: "mobile", deliverable: "mobile", type: "new_work", clauseId: "clause-002", verbatimQuote: "Services do not include native mobile applications, data migration, copywriting, or third-party subscription fees." });
    expect(verifyAsk(ask, software)).toMatchObject({ citationVerified: true, verdict: "OUT_OF_SCOPE" });
  });

  it("downgrades a manufactured or mismatched quote to AMBIGUOUS", () => {
    const ask = AtomicAskSchema.parse({ id: "ask-1", summary: "mobile", deliverable: "mobile", type: "new_work", clauseId: "clause-002", verbatimQuote: "The contract excludes all mobile work and charges a $500 fee." });
    expect(verifyAsk(ask, software)).toMatchObject({ citationVerified: false, quoteVerified: false, verdict: "AMBIGUOUS" });
  });

  it("does not trust an uncited ask", () => {
    const ask = AtomicAskSchema.parse({ id: "ask-1", summary: "unknown", deliverable: "unknown", type: "other", clauseId: null, verbatimQuote: null });
    expect(verifyAsk(ask, software).verdict).toBe("AMBIGUOUS");
  });

  it("verifies the new batch extraction shape without accepting paraphrases", () => {
    const asks = [RawExtractionAskSchema.parse({
      askId: "ask-raw",
      extractedText: "native mobile app",
      verdict: "OUT_OF_SCOPE",
      rationale: "Excluded deliverable.",
      citedClauseId: "clause-002",
      verbatimQuote: "The contract excludes all mobile work."
    })];
    expect(verifyCitations(asks, software.clauses)[0]).toMatchObject({ citationVerified: false, verdict: "AMBIGUOUS" });
  });
});

describe("contract ingestion", () => {
  it("segments numbered clauses deterministically", () => {
    const clauses = segmentClauses("Section 1. Services\nBuild the thing.\n\n2) Exclusions\nNo support.");
    expect(clauses).toHaveLength(2);
    expect(clauses[1]).toMatchObject({ id: "clause-002", title: "2. Exclusions", body: "No support.", category: "EXCLUSIONS" });
  });
});
