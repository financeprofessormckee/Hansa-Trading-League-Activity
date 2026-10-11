# Hansa review: targeted fixes and teaching polish

Reviewed against initial commit `1d0d5677070fe200bc9b84626fc87e3c0667fd36`.
This is a proposed contribution for the maintainer's review, not a teaching-release
certification or a change to the project's licensing and attribution.

## Assessment

The core is unusually disciplined for a small prototype: deterministic accounting,
separate model/view/controller files, explicit transport labor, exporter-owned
production constraints, atomic admission, tolerance handling, and a substantial
independent test oracle. The stated intent is an economic experiment in voluntary
cooperation, not a conquest game. Preserve it.

I found no demonstrated arithmetic defect in the reviewed fixtures or the existing
model suite. The main opportunities are explaining what the calculations mean and
making experimentation easier. The source of scope and attribution is this
repository's README, SPECIFICATION, and DESIGN; the historical instructions were
not independently retrieved during this review.

## Findings and proposed treatment

| Finding | Consequence | Targeted proposal | Larger proposal |
| --- | --- | --- | --- |
| Completed outcomes reuse preview phrases such as “Candidate: joins this turn” and “Member: leaves after this turn.” | A historical record reads like an unexecuted proposal. | Render completed decisions in past tense in results and history. | Retain the correction. |
| A refused proposal can also say a member “will leave.” | Suggests a change will happen despite atomic execution being blocked. | Make departures conditional and explicitly state no membership changed. | Add per-city council verdicts. |
| All four production inputs have the same accessible name; answer selectors and check buttons repeat names too. | A screen-reader controls list cannot distinguish the city or exercise. | Include city/exercise in accessible names. | Retain native, named controls. |
| Exercise loading changes content well above the clicked button. | Students must rediscover where the newly loaded plan is. | Focus the plan heading; add section navigation and a return link. | Organize planning and feedback as a workspace. |
| Failed previews leave the generic preview hint. | Recovery instructions are less direct than the displayed errors. | Set an explicit correction-and-preview hint. | Also show invalid budgets locally. |
| The fourth self-check's correct choice says “No; absolute productivity differs.” | Gives the wrong causal emphasis for a comparative-advantage lesson. | Say relative production costs are the same. | Add a same-plan comparison across economies. |
| Opportunity costs must be calculated mentally from labor costs. | The key lesson is less visible than absolute productivity. | Add cloth forgone per grain, clearly excluding transport. | Show city-level costs next to planning decisions. |
| A 780px shipment table requires horizontal scrolling on phones. | Labels and actions cannot all be inspected together. | Preserve the existing table in the small patch. | Use shipment cards with responsive labeled controls. |
| Changing the scenario also clears the plan; the transport exercise changes shares and quantities. | Comparing the exercises does not isolate the effect of transport costs. | Retain the documented reset behavior. | Compare an identical plan and membership under all three economies without executing. |
| Six identical turns repeat identical gains by design. | The game can be “solved” by repeating the worked example rather than exploring. | Keep rules and explain repeatability. | Add explicit experiments and a turn-by-turn debrief, without random shocks or changing incentives. |

## Economic cross-check

For production costs `a` and `b`, and `L` labor devoted to grain, autarky utility is
`2 sqrt((L/a) ((100-L)/b))`. Its maximum is at `L = 50`, giving
`100 / sqrt(a*b)`. The opportunity cost of one grain is `a/b` cloth.

| Worked Alder–Birch exchange | Each city |
| --- | ---: |
| Units exported | 50 |
| Transport labor at 0.1 per unit | 5 |
| Specialized output | 95 |
| Own good retained / other good imported | 45 / 50 |
| Utility | 94.868329805 |
| Autarky utility | 70.710678119 |
| Gain | 24.157651686 |

Total turn gain is `48.315303373`; six repetitions give `289.891820237`.
Summed utility is the game's explicitly chosen index, not a welfare measure with
an independently justified interpersonal interpretation. Positive total gains do
not guarantee every city gains, so individual admission/departure tests remain
essential. No optimization or alternative welfare rule is introduced.

## Validation

- Existing model suite: **345,992 assertions**, including an independent accounting
  oracle and 3,000 generated feasible plans; passed.
- Browser suite covers unique control names, exercise focus, the worked exchange,
  six-turn completion, refused proposals, completed membership language, invalid
  input recovery, candidate removal, preview invalidation, and all four self-checks.
- Browser runs on both `file://` and local HTTP, with overflow checks at 1280, 640,
  375, and 320 CSS pixels. Node 24 and Chromium 153 were used in review.
- No production dependency, service, storage, telemetry, external font, or build
  step is added. Playwright is optional development tooling.

These checks are not a WCAG conformance audit. Real screen-reader testing, Safari
and Firefox coverage, and classroom observation remain appropriate before teaching
release. Institutional branding and all original credits remain intact.
