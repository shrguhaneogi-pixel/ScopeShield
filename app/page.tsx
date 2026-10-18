"use client";

import { useState } from "react";
import { ShieldAlert, ShieldCheck } from "lucide-react";
import type { AnalysisResult, Tone } from "@/lib/schemas";
import { sampleContracts } from "@/lib/contracts";

const examples = [
  "Could we also add a native mobile app and make three more revision rounds?",
  "The client wants another logo concept after approving the first direction."
];

export default function Home() {
  const [contractId, setContractId] = useState(sampleContracts[0].id);
  const [contractText, setContractText] = useState(sampleContracts[0].clauses.map((clause) => `${clause.title}\n${clause.body}`).join("\n\n"));
  const [contractFile, setContractFile] = useState<File>();
  const [message, setMessage] = useState(examples[0]);
  const [tone, setTone] = useState<Tone>("NEUTRAL");
  const [result, setResult] = useState<AnalysisResult>();
  const [revision, setRevision] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function analyze() {
    setLoading(true); setError("");
    try {
      const body = new FormData();
      body.set("clientMessage", message);
      body.set("tone", tone);
      body.set("revision", String(revision));
      if (contractFile) body.set("contractFile", contractFile);
      else {
        body.set("contractText", contractText);
        if (contractId) body.set("contractId", contractId);
      }
      const response = await fetch("/api/analyze", { method: "POST", body });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setResult(data); setRevision((current) => current + 1);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Analysis failed."); }
    finally { setLoading(false); }
  }

  return (
    <main className="min-h-screen">
      <header className="border-b border-[var(--line)] bg-white/70">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--green)] text-white"><ShieldCheck size={21} /></div><span className="serif text-2xl font-bold">ScopeShield</span></div>
          <div className="text-right"><p className="text-sm font-semibold">Protect your scope.</p><p className="text-xs text-[var(--muted)]">Preserve your client relationships.</p></div>
        </div>
      </header>
      <div className="mx-auto grid max-w-[1400px] gap-8 px-6 py-8 lg:grid-cols-[280px_1fr_340px]">
        <aside>
          <p className="mb-3 text-xs font-bold uppercase tracking-[.18em] text-[var(--muted)]">Signed contracts</p>
          <div className="space-y-2">
            {sampleContracts.map((contract) => <button key={contract.id} onClick={() => { setContractId(contract.id); setContractText(contract.clauses.map((clause) => `${clause.title}\n${clause.body}`).join("\n\n")); }} className={`w-full rounded-xl border p-4 text-left transition ${contractId === contract.id ? "border-[var(--green)] bg-[var(--mint)]" : "border-[var(--line)] bg-white hover:border-[var(--green)]"}`}><p className="font-semibold">{contract.name}</p><p className="mt-1 text-xs text-[var(--muted)]">{contract.clauses.length} canonical clauses</p></button>)}
          </div>
          <p className="mb-3 mt-8 text-xs font-bold uppercase tracking-[.18em] text-[var(--muted)]">Clause navigator</p>
          <div className="space-y-2">{sampleContracts.find((item) => item.id === contractId)?.clauses.map((clause) => <div key={clause.id} className="rounded-lg border border-[var(--line)] bg-white p-3 text-sm"><span className="mr-2 font-mono text-xs text-[var(--green)]">{clause.id}</span>{clause.title.replace(/^\d+\.\s*/, "")}</div>)}</div>
        </aside>
        <section>
          <div className="mb-5"><p className="text-xs font-bold uppercase tracking-[.18em] text-[var(--green)]">Request analysis</p><h1 className="serif mt-2 text-4xl font-bold">Is this in scope?</h1><p className="mt-2 max-w-2xl text-[var(--muted)]">AI interprets the request. Deterministic verification checks every citation against your signed contract.</p></div>
          <div className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm">
            <label className="text-sm font-semibold" htmlFor="contract-file">Upload contract PDF</label>
            <input id="contract-file" type="file" accept="application/pdf,.pdf" onChange={(event) => setContractFile(event.target.files?.[0])} className="mt-3 block w-full text-sm text-[var(--muted)]" />
            <label className="mt-4 block text-sm font-semibold" htmlFor="contract">Canonical contract text</label>
            <textarea id="contract" value={contractText} onChange={(event) => { setContractText(event.target.value); setContractId(""); }} className="mt-3 min-h-28 w-full resize-y rounded-xl border border-[var(--line)] bg-[var(--paper)] p-4 text-sm outline-none focus:border-[var(--green)]" />
            <label className="text-sm font-semibold" htmlFor="message">Paste the client request</label>
            <textarea id="message" value={message} onChange={(event) => setMessage(event.target.value)} className="mt-3 min-h-36 w-full resize-y rounded-xl border border-[var(--line)] bg-[var(--paper)] p-4 outline-none focus:border-[var(--green)]" />
            <div className="mt-3 flex flex-wrap gap-2">{examples.map((example) => <button key={example} onClick={() => setMessage(example)} className="rounded-full border border-[var(--line)] px-3 py-1.5 text-xs text-[var(--muted)] hover:border-[var(--green)]">Try example</button>)}</div>
            <div className="mt-5 flex items-end justify-between gap-4"><label className="text-sm font-semibold">Response tone<select value={tone} onChange={(event) => setTone(event.target.value as Tone)} className="ml-3 rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm font-normal"><option value="FIRM">Firm</option><option value="NEUTRAL">Neutral</option><option value="COLLABORATIVE">Collaborative</option></select></label><button onClick={analyze} disabled={loading || !message.trim()} className="rounded-lg bg-[var(--green)] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50">{loading ? "Checking..." : "Analyze request"}</button></div>
            {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-[var(--red)]">{error}</p>}
          </div>
          {result && <div className="mt-6 space-y-3">{result.analyses.map((analysis) => <article key={analysis.askId} className="rounded-xl border border-[var(--line)] bg-white p-5"><div className="flex items-center justify-between"><p className="font-semibold">Atomic ask: {analysis.askId}</p><span className={`rounded-full px-3 py-1 text-xs font-bold ${analysis.verdict === "IN_SCOPE" ? "bg-green-100 text-[var(--green)]" : analysis.verdict === "OUT_OF_SCOPE" ? "bg-orange-100 text-[var(--amber)]" : "bg-red-100 text-[var(--red)]"}`}>{analysis.verdict.replace("_", " ")}</span></div><p className="mt-3 text-sm text-[var(--muted)]">Citation {analysis.citationVerified ? "verified" : "not verified"} · {analysis.clauseId ?? "No clause cited"}</p>{analysis.warnings.map((warning) => <p key={warning} className="mt-2 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-[var(--red)]"><ShieldAlert size={17} />{warning}</p>)}</article>)}</div>}
        </section>
        <aside className="rounded-2xl border border-[var(--line)] bg-[#f0f5f1] p-5"><p className="text-xs font-bold uppercase tracking-[.18em] text-[var(--green)]">Verified response</p><h2 className="serif mt-2 text-2xl font-bold">Draft to send</h2>{result ? <><p className="mt-5 whitespace-pre-wrap text-sm leading-6">{result.draft}</p><div className="mt-6 border-t border-[var(--line)] pt-4 text-xs text-[var(--muted)]">Revision {result.revision} · Generated from verified facts only</div></> : <p className="mt-5 text-sm leading-6 text-[var(--muted)]">Analyze a request to generate a response grounded in your selected contract.</p>}</aside>
      </div>
    </main>
  );
}
