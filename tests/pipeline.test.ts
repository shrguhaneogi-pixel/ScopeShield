import { beforeEach, describe, expect, it } from "vitest";
import { analyzeRequest } from "../lib/pipeline";

beforeEach(() => { delete process.env.INFERENCE_MODE; });

describe("mock analysis pipeline", () => {
  it("decomposes a request and produces a verified, source-grounded draft", async () => {
    const result = await analyzeRequest({ contractId: "software-msa", message: "Could we add a native mobile app?", tone: "COLLABORATIVE" });
    expect(result.analyses).toHaveLength(1);
    expect(result.analyses[0]).toMatchObject({ verdict: "OUT_OF_SCOPE", citationVerified: true });
    expect(result.draft).toContain("separate estimate");
  });
});
