# G2 canonical integration review

Approved `tactics-guard-states` through `4124ea2` against canonical `f468298`. The merge is clean. Existing authored-map startup, cache handling, touch camera gestures, confirmation dialogs, ground-fire animation and overwatch work are retained. The 3D experiment is not included.

G2 implements Rest, Suspicious, Alert, Searching, Stand-down and Broken states; investigation and return to post; wary hearing; morale breaks; and campaign-clock settling of maps left by the squad. G3–G5 remain separate proposals.

## Integration corrections

- State labels previously rendered near ground level before actor sprites and could be covered by those sprites. They now render above the guard health bar, after its sprite, with the same detection and floor restrictions.
- Corrected the tracking document's obsolete statement that G2 was still a proposal, and explicitly marked the old behavior description as historical.

## Independent validation

- All 416 repository tests passed, including G2 transitions, broken-guard hit/miss behavior, return to post, occupied/unreachable posts, campaign re-entry, fire expiry, pacing, recovery, retreat and default-map checks. Asset verification passed.
- Pages packaging succeeded. After the label correction, app syntax and browser checks passed. Browser verification loaded the authored 36-guard factory without JavaScript/resource errors and exercised all four state labels in an instrumented local scene. The Broken label was visually inspected above the health bar.
- Ran the existing headless factory benchmark for seeds 1947–1966 before and after G2. Control: 20 wins, zero losses or stalls. Integration: 18 wins, losses on 1961 and 1965, zero stalls. Control was run at `8d84afc`; its engine, world and bot files are identical to canonical `f468298`. This benchmark uses the original generated factory fixture, not a balance certification of the newly authored 36-guard map.
- The integration outcomes match the overlapping seeds in Claude's recorded 40-seed run. Changed outcomes are expected from fleeing and searching behavior; the tests and completed runs provide no blocking evidence of an integration regression.

## Remaining limits

Searching guards still recalculate bounded routes during turn-mode movement. Claude measured approximately three seconds for a 35-searcher guard phase; route reuse remains a performance follow-up. Campaign settling deliberately uses coarse ten-minute rounds and does not credit partial Alert time below its threshold. Neither is a new merge conflict or an unimplemented acceptance criterion.

This review approves source integration. The separate public Pages repository is not deployed by this source push.
