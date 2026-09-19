# G5 and mercenary hiring integration review

Reviewed 2026-09-18 against canonical `6eec4c6`, integrating `tactics-hiring` at `f6897da`, including the G5 timer correction `ed88234`.

The original blocking G5 reproduction is resolved: with happiness 2 and three opposing partners, one 48-hour training block and two 24-hour blocks both record zero at campaign minute 672 and leave the merc marked quit at minute 3360. The happiness tests also cover rest slicing and deferred departure during combat.

Hiring adds daily candidates, prepaid contracts, renewal and release, and stable IDs for recruits across maps. Browser checks on the authored factory verified that hiring is initially disabled, then exercised six candidate cards, hiring, renewal, selecting recruit 1000, opening its inventory and releasing it on a cleared map. No browser exceptions or failed asset requests occurred.

One integration correction: departed mercs must retain their progression record rather than receive XP from later squad kills. `awardCombatXP` now excludes quit mercs; a regression test verifies their XP, level and skill points remain unchanged while active mercs earn XP.

Validation: full check suite and tactical asset verification; Pages distribution build; 20 social-enabled combat seeds 1947–1966 match the previous G3/G4 baseline exactly, including every recorded bot event (18 wins, 2 losses). These combat runs do not exercise campaign-clock mechanics; the campaign tests and browser checks cover those separately.

Delivery targets the canonical 2D source branch `tactics-prototype`. The separate Pages distribution and experimental 3D project are not deployed by this integration.
