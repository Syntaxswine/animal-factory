# G3 and G4 canonical integration review

Approved G3 `tactics-archetypes` through `cca0f8f` and its stacked G4 `tactics-shouts` through `30d8f8f` against canonical `178cc4c`. The combined merge is clean. The authored map, ground fire, camera controls and guard state labels are retained. No 3D assets are included.

G3 adds deterministic roster archetypes, trait-scaled guard states, voiced barks, bond rungs and rest drift. G4 adds bounded shout cascades, guard friendly-fire reactions and grief. Campaign play enables these features; plain `createGame` retains the social-disabled baseline. G5 happiness and quitting remain proposals.

## Independent checks

- All 447 repository tests and asset verification passed. Reviewed the archetype, social ledger, attack, shout cascade, clock settling and campaign initialization changes. Regression tests cover social/ballistic stream separation, one obedience roll per trigger, bonded exceptions, search-trail preservation, friendly-fire retaliation, grief and sealed clock settling.
- Seeds 1947–1966: canonical control won 18/20, losing 1961 and 1965; the combined social-enabled build won 18/20, losing 1957 and 1964. No run stalled. Mean surviving squad HP was 119.45 versus 147.15. These small-sample results establish completion, not equivalent difficulty.
- With social features disabled, all 20 combined-build outputs match canonical exactly, including bot events.
- These headless runs use the original factory benchmark, not the newer authored 36-guard map. Claude's separate G3/G4 balance records remain in GUARDS.md.
- Browser verification loaded the authored 36-guard map with social mode enabled and all 36 guards carrying archetypes and ledgers. All four guard state labels rendered. No JavaScript or resource errors occurred.
- Pages packaging passed and includes the new archetypes module. Whitespace checks passed.

## Correction and remaining scope

Corrected the stale tracking paragraph that described G4 as unimplemented. No gameplay correction was needed for this integration. Existing turn-mode search routing cost and the documented trait-scaled investigation overhead remain performance follow-ups. Static browser checks and the benchmark do not certify the full authored map's balance.

This approves source integration into `Syntaxswine/animal-factory`, branch `tactics-prototype`. Its source push does not deploy the separate sprite Pages repository or synchronize the experimental 3D project.
