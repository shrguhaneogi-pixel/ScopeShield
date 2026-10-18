import { ContractClauseSchema, ContractSchema, type ContractClause, type Contract } from "./schemas";
import { extractText } from "unpdf";

function categoryForHeading(heading: string): ContractClause["category"] {
  const value = heading.toLowerCase();
  if (/revision|feedback/.test(value)) return "REVISIONS";
  if (/timeline|schedule|deadline/.test(value)) return "TIMELINE";
  if (/exclusion|out of scope/.test(value)) return "EXCLUSIONS";
  if (/payment|fee|invoice/.test(value)) return "PAYMENT";
  if (/ip|intellectual|ownership|license/.test(value)) return "LEGAL_IP";
  return "DELIVERABLES";
}

export function segmentClauses(text: string): ContractClause[] {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const clauses: ContractClause[] = [];
  let current: { heading: string; body: string[] } | undefined;
  for (const line of lines) {
    const heading = line.match(/^(?:(?:section|article)\s+)?(\d+(?:\.\d+)*)(?:[.)]\s*|\s+-\s*|\s+)(.+)$/i);
    if (heading) {
      if (current) clauses.push({ id: `clause-${String(clauses.length + 1).padStart(3, "0")}`, title: current.heading, body: current.body.join(" "), category: categoryForHeading(current.heading) });
      current = { heading: `${heading[1]}. ${heading[2]}`, body: [] };
    } else if (current) current.body.push(line);
  }
  if (current) clauses.push({ id: `clause-${String(clauses.length + 1).padStart(3, "0")}`, title: current.heading, body: current.body.join(" "), category: categoryForHeading(current.heading) });
  return clauses.map((clause) => ContractClauseSchema.parse(clause));
}

export function contractFromText(id: string, name: string, text: string): Contract {
  return ContractSchema.parse({ id, name, clauses: segmentClauses(text) });
}

export async function contractFromPdf(id: string, name: string, data: Uint8Array): Promise<Contract> {
  const extracted = await extractText(data, { mergePages: true });
  if (typeof extracted.text !== "string" || !extracted.text.trim()) throw new Error("The PDF did not contain extractable text.");
  return contractFromText(id, name, extracted.text);
}
