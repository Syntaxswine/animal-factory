# Hostile review record — Red Shift

2026-09-14. A dedicated hostile-review subagent reviewed each stage. The next stage began only after a score of at least 4/5.

| Gate | Score | Findings and resolution |
| --- | --- | --- |
| Mechanics contract | 4/5 pass | Prevent LOS-breaking AP reset. Alerted guards now keep combat active until defeated; opening attacks spend combat AP. |
| Engine and regression tests | 4/5 pass | 13 tests and 20-seed state-invariant probe passed. Guards now hold firing position when they lack shot AP, instead of wasting movement. A regression test was added. |
| Interface and play validation | 4/5 pass | Code and combat screenshot reviewed. Recompute click hit testing after camera changes; include both tactics modules in npm syntax checks. Both fixed. |
| User direction follow-up | 4.5/5 pass | Design-only review against the seven-answer summary. Confirmed rules are separate from proposals and unresolved choices; no blockers. Aimed-shot modes remain open. |

Final suite: 45 tests, syntax checks and inherited asset validation pass. Twenty complete deterministic balance runs (seeds 1947–1966) yielded twenty victories, four survivors each, 6–9 rounds and 202–383 total remaining squad HP. The navigation bot knows enemy positions, but every action uses the normal visibility, path, AP, ammunition, hit and AI rules. These tests establish a forgiving playable baseline; they do not establish experienced-player difficulty.

Browser checks by main agent: real-time movement; movement interrupted by contact at the north workshop; target chance; AK burst consumes 6 AP and three rounds; changing squad members preserves independent AP; Anya moves eight tiles for eight AP; enemy phase locks actions; guard damage resolves; round two restores squad AP; Anya's blocked line of fire rejects attack; Yakov defeats a guard, which updates the objective to 1/12 and clears the target. Restart, help and camera controls checked separately. The reviewer could inspect the combat screenshot but its browser surface was unavailable, so interactive observations came from the main agent.

Artwork: existing Animal Factory painted animal frames and industrial building sprites. Roofless workshop walls, floor and cover geometry are intentionally simple in this mechanics slice. Dedicated armed and attack poses remain future work.

## Questions for the next iteration

These historical questions were answered by the user. See [the recorded direction](DIRECTION.md) for confirmed decisions, proposals and remaining choices.

1. Should fallen squad members die permanently, become incapacitated for rescue, or recover after the mission?
2. Should characters grow through fixed roles, skill use, or freely assigned points? What makes each animal species distinct mechanically?
3. Keep the shared squad AP turn, or add individual initiative, reaction fire and overwatch?
4. Should exploration move the whole squad in formation by default, with individual control available for scouting?
5. Should weapons be limited by actual carried loadouts, scarce ammo, loot and repairs, or stay freely switchable while testing?
6. Add stealth/noise and patrols next, or deepen combat with aimed shots, suppression, stances and destructible cover?
7. Is the campaign about a workers’ revolt, rival state factions, or survival after the factory regime collapses? This will guide objectives, dialogue and progression.

## Map-tool implementation review — 2026-09-14

Story work was removed from the active direction. The map-tool pass was completed in three reviewed stages:

| Gate | Score | Evidence and fixes |
| --- | --- | --- |
| Shared-edge walls | 4/5 pass | 21 tactics tests, 200 generated layouts and 13,440 reciprocal LOS comparisons. Required follow-up: cleared/empty maps must remain walkable. |
| Local maps and overmap | 4.5/5 pass | World regressions and 50 repeated round trips preserved HP, ammunition, equipment, casualties and unit counts; occupied arrivals avoid overlaps. Cleared-map movement fixed. |
| Editor and integration | 4/5 pass | Full suite: 63 tests. Undo branching, immutable playtest blueprints and malformed import rejection also probed. Unfinished drafts can be exported as well as saved/imported. |

Browser checks by the main agent covered thin-wall rendering, gathering at the marker, overmap travel into Yard test, editor wall placement and undo, seeded generation, saving/loading a draft, a room stamp on a blank map, a one-guard custom playtest with the correct objective, and returning to the unchanged blueprint. Browser testing found a shadowed state variable in the overmap callback; it was corrected and successful travel was retested. Editor/preview console checks were clean.

The final edge-wall balance smoke test cleared all twelve guards in all twenty runs (5–7 rounds; 3–4 squad survivors). Local map state persists in-session; reload still resets the run. Maps are fixed at 28×24; overmap node editing and campaign saving are future work. Imported unfinished maps can be repaired in the editor, but strict validation is required to playtest.
