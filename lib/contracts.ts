import type { Contract } from "./schemas";

export const sampleContracts: Contract[] = [
  {
    id: "software-msa",
    name: "Software Development MSA",
    clauses: [
      { id: "clause-001", heading: "1. Services", text: "The Consultant will design and develop the web application described in the attached statement of work." },
      { id: "clause-002", heading: "2. Exclusions", text: "Services do not include native mobile applications, data migration, copywriting, or third-party subscription fees." },
      { id: "clause-003", heading: "3. Revisions", text: "Each deliverable includes up to two rounds of revisions. Additional revisions are billed at $150 per hour." },
      { id: "clause-004", heading: "4. Schedule", text: "The Consultant will deliver the first working build by June 30, 2026, subject to timely client feedback." }
    ]
  },
  {
    id: "brand-design-sow",
    name: "Brand Design SOW",
    clauses: [
      { id: "clause-001", heading: "1. Deliverables", text: "The Designer will provide one primary logo, a secondary mark, and a one-page brand guide." },
      { id: "clause-002", heading: "2. Feedback and revisions", text: "The project includes two rounds of consolidated, objective feedback. New concepts requested after approval are out of scope." },
      { id: "clause-003", heading: "3. Exclusions", text: "Photography, custom illustration, font licensing, and production-ready packaging files are excluded." },
      { id: "clause-004", heading: "4. Timeline", text: "Final logo files will be supplied within ten business days of the final feedback round." }
    ]
  }
];

export function getContract(id: string): Contract | undefined {
  return sampleContracts.find((contract) => contract.id === id);
}
