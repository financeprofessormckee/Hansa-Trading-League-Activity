# Hansa — browser specification (v1)

- **Decided:** 2026-10-02 by Eric McKee; David Friedman's review is invited.
- **Reference:** proposal 27, recorded in DESIGN.md. Live instructions were unavailable during planning. Fresh code, no legacy import.

## Objective and adaptations

Small solitaire activity: build a trading league through comparative advantage and mutual gains rather than conquest. Six deterministic turns; students plan every participating city's production and shipments. Four fictional cities, two goods, the utility function, numeric costs, simultaneous invitations, and scoring below are Eric's selected browser adaptations, not claims of historical fidelity. Trade-mission costs, negotiated guarantees, competing leagues, historical maps, optimization, editable economies, persistence, services, and analytics are deferred.

## Model

Every city gets 100 labor each turn. Grain/cloth labor costs, ordered Alder, Birch, Cedar, Dune: [1,2], [2,1], [2,4], [1,1]. Utility is 2√(grain×cloth), an illustrative index rather than money or welfare evidence. Autarky splits labor equally and achieves 100/√(grain cost×cloth cost). For each participating city the student chooses the grain-production share (0–100%) of labor remaining after transportation; all remaining labor produces cloth. Outsiders consume autarky output.

Shipments use direct reciprocal routes. Alder–Birch and Birch–Cedar are water routes (0.1 labor per unit); the other four pairs are land (0.4). Exporters pay transport labor for both goods. Exports must come from the city's own production, never imports. Consumption = production + imports − exports. No goods, unused labor, or utility carry between turns; production and route costs never change within a session.

Three scenarios: Inexpensive transport (default) uses the costs above; Expensive transport multiplies route costs by 15; Equal opportunity costs uses [1,2], [2,4], [3,6], [0.5,1] and inexpensive routes. Changing scenario or Restart clears turns, score, history, draft, previews and self-check completion. Restart retains the selected scenario.

Alder starts as the sole member. Outsider checkboxes propose candidates; their shipments and production are conditional on simultaneous admission. All candidates must exceed their autarky utility by more than 1e−9 or the entire turn is blocked, with refusals explained; no partial admissions/trades. Existing members below autarky by more than 1e−9 may execute a warned loss and leave before the next turn; equality permits staying. Score is the sum of all participating cities' utility minus autarky, including losses and newly admitted cities. Outside cities contribute zero. Track cumulative total and each city's gains. An empty league may advance in autarky or recruit a new beneficial group. After turn six disable execution and show the final outcomes and membership history.

Draft: candidate IDs, four production shares, and 0–24 shipment rows (exporter, importer, good, quantity). Repeated route/good rows are summed. Zero quantities are allowed. Reject blank/nonfinite/nonnumeric shares or quantities, shares outside 0–100%, quantities outside 0–200, unknown/inactive cities, self-shipment, unknown goods, excess transport labor, and exports exceeding own production. Full precision internally; absolute tolerance 1e−9 for feasibility/membership, clamping only negligible negative residuals. Display up to six fractional digits, scientific notation for nonzero magnitudes below 0.000001; annotate differences hidden by rounding. Invalid turns retain the state/history.

Preview is explicit and shows labor, production, imports/exports, consumption, utility/baselines, admissions/refusals/departures, and proposed score. A physically valid preview can still be blocked by refusals. Edits invalidate previews and completion. Execute recomputes and atomically applies the current validated draft; a preview is required in the UI. After execution clear preview/candidates. Retain shares/shipments when nobody leaves; following departures reset all shares to 50% and shipments to none. No storage or inventories result from retaining instructions.

## Interface and teaching checks

Local classic scripts js/model.js, js/view.js, js/app.js separate economic math, rendering, and controls. HansaModel exposes scenario/city/good metadata, initial state/draft creation, route/autarky calculations, validation/preview/execution, and prompt fixtures/checks for browser/CommonJS. No network API/save format. Preserve local WT masthead and David Friedman/Eric McKee credits, plus historical Tom Courtney/Mikel Evins credits.

Native checkboxes, numeric shares, Add shipment and individual Remove controls. Removing a candidate removes only connected shipments and resets that city's share. Structural changes restore focus to an appropriate remaining control. Map is a labelled schematic, not geographical navigation; route/cost tables and all-city result/history tables provide equivalent values. Associated errors, first-error focus on failed Preview, deliberate polite status, skip link, visible unobscured focus, controls ≥44px, 320px reflow and labelled keyboard-focusable table scrollers; no dragging or playback. Reduced-motion CSS. Functional checks do not certify conformance.

Optional worked example resets to Inexpensive transport, Alder/Birch shares 100/0, Birch candidate, reciprocal 50-unit grain/cloth shipments. Each pays 5 transport labor, produces 95 units, consumes own/imported goods 45/50, and reaches utility 94.868330 versus 70.710678. Loading never previews or executes.

Four optional self-checks reset/load exact drafts, requiring Preview plus the correct conceptual answer (refused but physically feasible previews count): (1) default autarky: 50/50 labor yields 50 grain/25 cloth in Alder; (2) worked example: different opportunity costs permit mutual gains; (3) Expensive transport, Alder/Birch shares 50/50, Birch candidate, reciprocal 10-unit grain/cloth shipments: 15 labor transport, utility 63.737744, Birch refuses; (4) Equal opportunity costs, Alder/Birch shares 100/0, Birch candidate, 20 grain Alder→Birch and 10 cloth Birch→Alder: both lose versus autarky, so specialization does not guarantee mutual gains. Any edit, execution, restart or scenario change clears completion.

## Verification and freeze

Independent autarky maxima, conservation, labor/exports, scoring, joins/refusals/leaves, empty recovery, simultaneous four-city gains, six-turn completion, resets, repeated rows, invalid-input immutability/tolerance, and all prompts. Browser keyboard/pointer workflows, errors/focus, preview invalidation, final history, file/HTTP agreement, desktop/mobile inspection; all seven pages at 1280/640/375/320px; links/assets/Parsing, contrast and handoff limits. Record evidence/limitations in VERIFICATION.md (in the authoring collection).

Private commit/push and freeze verified v1 with the existing six, which remain unchanged. After David's feedback and before teaching release, complete WCAG 2.2/2.1 AA audit including Parsing and ACCESSIBILITY.md plus Accessibility Conformance Report.docx. Real screen-reader/classroom assessment and release terms remain pending. No public publishing, deployment, outreach, or license selection.

## Approved development revision — 2026-10-22

Eric McKee approved adoption of JfowlerSIAI's public PR #2 (the trading workspace), commit `6f98825815a63adf69e0f0fe4dada574b3457c1c`, based on `1d0d5677070fe200bc9b84626fc87e3c0667fd36`. PR #2 is built directly on the targeted PR #1 (`0cd9dfe`), so all of PR #1's changes are included and it is not adopted separately. The v1 specification above is retained as history; this revision supersedes its layout and development freeze. David's review is invited. Public transfer, merging, and deployment are separate tasks.

The four cities, grain and cloth, three economies, six deterministic turns, utility index, cumulative gains above autarky, exporter-paid transport, direct routes without re-exporting, and atomic voluntary admission are unchanged. `js/model.js` differs from v1 only in prompt 4's correct-answer wording ("No; relative production costs are the same"); all formulas, fixtures and accounting are identical. The approved revision adds:

- PR #1's fixes: completed decisions in the past tense; departures on a refused proposal stated conditionally, with no membership change; an opportunity-cost (cloth forgone per grain) column; section navigation and a return-to-plan link; focus moving to the plan when an example or exercise loads; city- and exercise-specific accessible names; and a correction hint after an invalid preview.
- City cards with absolute and opportunity costs beside each share input, Cloth/Half/Grain presets (0/50/100% grain, never executing a turn), and a labor-use preview taken from `HansaModel.preview`; invalid drafts show the model's actual constraints.
- A fieldset cargo manifest showing each shipment's direct-route cost and the exporter's transport labor, usable at 320px; a schematic chart highlighting pairs with planned cargo.
- Council cards with each city's gain, utility, baseline and decision; the full production, flow and outcome tables in an expandable accounting section.
- "Compare economies": the same invitations, membership, shares, quantities and turn evaluated in every scenario against its own autarky baseline. It never changes state or awards points, distinguishes physically impossible, refused and accepted plans, is cleared by draft edits, and is disabled after turn six.
- A six-turn progress indicator, ledger discussion prompts, and a user-initiated full-precision CSV of completed turns. No autosave, upload or student identifiers.

`js/learning.js` (comparison and CSV) is DOM-free and tested by `tests/learning-tests.cjs`. `tests/ui-tests.cjs` and `package.json` (Playwright) are developer-only; the delivered page loads only local classic scripts and stylesheets. Preserve the MIT license and JfowlerSIAI contribution credit alongside the original and historical credits. Fresh adoption verification is in VERIFICATION.md (in the authoring collection); the imported REVIEW.md and WORKSPACE_PROPOSAL.md are historical contributor evidence. Freeze again after verification pending Eric's desktop/phone review and requested corrections.
