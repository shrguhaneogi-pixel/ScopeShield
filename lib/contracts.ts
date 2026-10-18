import type { Contract } from "./schemas";

export const sampleContracts: Contract[] = [
  {
    id: "software-msa",
    name: "Software Development MSA",
    clauses: [
      { id: "clause-001", title: "1. Services", body: "The Consultant will design and develop the web application described in the attached statement of work.", category: "DELIVERABLES" },
      { id: "clause-002", title: "2. Exclusions", body: "Services do not include native mobile applications, data migration, copywriting, or third-party subscription fees.", category: "EXCLUSIONS" },
      { id: "clause-003", title: "3. Revisions", body: "Each deliverable includes up to two rounds of revisions. Additional revisions are billed at $150 per hour.", category: "REVISIONS" },
      { id: "clause-004", title: "4. Schedule", body: "The Consultant will deliver the first working build by June 30, 2026, subject to timely client feedback.", category: "TIMELINE" }
    ]
  },
  {
    id: "brand-design-sow",
    name: "Brand Design SOW",
    clauses: [
      { id: "clause-001", title: "1. Deliverables", body: "The Designer will provide one primary logo, a secondary mark, and a one-page brand guide.", category: "DELIVERABLES" },
      { id: "clause-002", title: "2. Feedback and revisions", body: "The project includes two rounds of consolidated, objective feedback. New concepts requested after approval are out of scope.", category: "REVISIONS" },
      { id: "clause-003", title: "3. Exclusions", body: "Photography, custom illustration, font licensing, and production-ready packaging files are excluded.", category: "EXCLUSIONS" },
      { id: "clause-004", title: "4. Timeline", body: "Final logo files will be supplied within ten business days of the final feedback round.", category: "TIMELINE" }
    ]
  }
];

export function getContract(id: string): Contract | undefined {
  return sampleContracts.find((contract) => contract.id === id);
}
