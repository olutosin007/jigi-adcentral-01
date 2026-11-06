# 10-minute demo script — Flow A + B

**Goal:** Prove *On-brand drafts. Client yes. Same place.* in under 10 minutes.  
**Source:** [04-key-user-flows-01.md](./04-key-user-flows-01.md) §6 · PRODUCT_STRATEGY §9

## Prep (once)

1. `cd uiux/jigi-app && pnpm dev:full`  
2. Signed-in Agency user (or signup → org type Agency → journey choice)  
3. Optional: brand kit with colours/voice for richer Brand Guardian  
4. Second browser / incognito for Guest Decide (or same browser — practice allowed)

## Script (~8–10 min)

| Min | Step | Say |
|-----|------|-----|
| 0:00 | Work home | “Jobs and the activation checklist — outcome is a Decide link, not a folder.” |
| 0:45 | Generate now *or* campaign generate | “Idea-first or brand-first — same handoff.” Produce one image/copy. |
| 2:30 | Brand Guardian on asset / Decide chrome | “Machine check beside the creative — soft-gate, human still decides.” |
| 3:30 | Send → Share Decide link | “Copy Guest Decide link — client needs no account.” |
| 5:00 | Open `/r/:token` (incognito) | “Asset-first. Brand Guardian one-liner. One action group.” |
| 6:30 | Approve (or request changes) | “Audit trail. Agency sees waiting → approved.” |
| 8:00 | Back in app — Decisions / Approved | “This is the yes you can prove.” |
| 9:00 | Close | Packaging / pilot ask if needed — not the hero. |

## Pass / fail

**Pass:** Candidate → Decide link → decision recorded in &lt;10 minutes without Slack/email as the system of record.  
**Fail:** Cannot submit without bypassing APIs; Guest Decide broken; Brand Guardian missing on Decide; &gt;10 min of chrome hunting.

## Notes

- Demo seed brand deferred (plan §11 default).  
- Self-open Decide link counts for activation practice.  
- fal smoke optional: `node scripts/smoke-fal.mjs` (needs `FAL_KEY`).
