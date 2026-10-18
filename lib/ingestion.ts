import { ClauseSchema, ContractSchema, type Clause, type Contract } from "./schemas";
import { extractText } from "unpdf";

export function segmentClauses(text: string): Clause[] {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const clauses: Clause[] = [];
  let current: { heading: string; body: string[] } | undefined;
  for (const line of lines) {
    const heading = line.match(/^(\d+)[.)]\s+(.+)$/);
    if (heading) {
      if (current) clauses.push({ id: `clause-${String(clauses.length + 1).padStart(3, "0")}`, heading: current.heading, text: current.body.join(" ") });
      current = { heading: `${heading[1]}. ${heading[2]}`, body: [] };
    } else if (current) current.body.push(line);
  }
  if (current) clauses.push({ id: `clause-${String(clauses.length + 1).padStart(3, "0")}`, heading: current.heading, text: current.body.join(" ") });
  return clauses.map((clause) => ClauseSchema.parse(clause));
}

export function contractFromText(id: string, name: string, text: string): Contract {
  return ContractSchema.parse({ id, name, clauses: segmentClauses(text) });
}

export async function contractFromPdf(id: string, name: string, data: Uint8Array): Promise<Contract> {
  const extracted = await extractText(data, { mergePages: true });
  if (typeof extracted.text !== "string" || !extracted.text.trim()) throw new Error("The PDF did not contain extractable text.");
  return contractFromText(id, name, extracted.text);
}
