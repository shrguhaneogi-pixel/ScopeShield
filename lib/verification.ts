import type { AtomicAsk, Contract, Tone, Verification, Verdict } from "./schemas";

function normalize(value: string): string {
  return value.replace(/\s+/g, " ").trim().toLocaleLowerCase();
}

export function verifyAsk(ask: AtomicAsk, contract: Contract): Verification {
  const clause = ask.clauseId ? contract.clauses.find((item) => item.id === ask.clauseId) : undefined;
  const quoteVerified = Boolean(clause && ask.verbatimQuote && normalize(clause.text).includes(normalize(ask.verbatimQuote)));
  const citationVerified = Boolean(clause && quoteVerified);
  const warnings: string[] = [];
  if (!citationVerified) warnings.push("The cited evidence could not be verified verbatim against the canonical contract.");
  const limitChecks = [];
  if (ask.type === "revision") {
    const cap = clause?.text.match(/up to (\w+) rounds/i)?.[1];
    limitChecks.push({ name: "revision cap", passed: Boolean(cap), detail: cap ? `Contract cap: ${cap} rounds.` : "No revision cap found in the cited clause." });
  }
  const verdict: Verdict = !citationVerified ? "AMBIGUOUS" : ask.type === "new_work" && /exclude|not include|out of scope/i.test(clause?.text ?? "") ? "OUT_OF_SCOPE" : limitChecks.some((check) => !check.passed) ? "AMBIGUOUS" : "IN_SCOPE";
  return { askId: ask.id, clauseId: ask.clauseId, citationVerified, quoteVerified, limitChecks, verdict, warnings };
}

export function draftResponse(verifications: Verification[], tone: Tone): string {
  if (verifications.some((item) => item.verdict === "AMBIGUOUS")) return "I need to confirm one detail against the signed agreement before I can give you a definitive answer. Could you clarify the deliverable or share the relevant context?";
  if (verifications.every((item) => item.verdict === "OUT_OF_SCOPE")) return tone === "firm" ? "Thanks for the request. This falls outside our signed scope, so I can provide a separate estimate for the additional work." : "Thanks for the request. This appears to be outside the signed scope; I can prepare a separate estimate if helpful.";
  return tone === "collaborative" ? "Thanks for the thoughtful request. This is covered by our current scope, and I’m happy to fold it into the next delivery." : "Thanks for the request. This is covered by the signed scope and will be included in the next delivery.";
}
