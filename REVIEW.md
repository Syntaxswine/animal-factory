# Settlement implementation: hostile review gates

Each section was submitted sequentially to the `hostile_review` subagent for read-only adversarial inspection. No later section began until the prior section scored at least 4/5.

| Section | Review result | Evidence and response |
| --- | --- | --- |
| Housing, population and jobs | Initially 3/5; re-review 4/5 | Reviewer reproduced a permanent vacancy caused by an unrelated construction action during a distant food trip. Employment now uses stable home-to-work reachability, not the resident's transient position. Added regression for distant food trips, sealed housing and restored access. 36 checks passed. |
| Streets and daily journeys | 4/5 | Reviewed road preference, speed, conveyor crossings, placement collisions, undo, physical attendance, home time and next-day production. 40 checks passed. |
| Neighborhood services | 4/5 | Reviewed path-limited coverage, clinic attendance and shifts, stocked kitchen meals, fallback rations, wellbeing bounds and productivity. 45 checks passed. |
| Pigs' estate and integration | 4/5 | Reviewed food-share conservation, alcohol exclusion, one-time upgrade spending, accumulated attendant service, daily stock deductions and undo. 52 checks passed. Reviewer also simulated every starter for 30 minutes with continued production, working food pickup and no nonfinite values or negative stock. |

The final review identified a nonblocking clarity issue: the alcohol and cake starters do not produce the estate's required daily bread. Added a visible per-layout note explaining the additional bread chain needed.

Local browser checks covered the new housing and employment display, streets connecting homes/jobs/depot, service construction tools, estate policy selection, retained-stock and allowance UI, and browser error logs. This review establishes a tested prototype, not final economic balance. Saving, full societal collapse and universal construction costs remain future work.
