# Six playtest follow-ups

Handoff audited 2026-09-17 against source through `41615e8`. This records the
six improvement threads from the full-battle discussion. A conversation answer
is not evidence that a feature shipped. Update this file when completing work.

| Thread | Status | Remaining work |
| --- | --- | --- |
| 1. Group movement and squad cohesion | Partial | Better rally completion and bounded pursuit in the automated player. |
| 2. Local alerts and combat pacing | Implemented 2026-09-17 | None from this discussion; rule in RULES.md, Local alerts and combat pacing. |
| 3. Clearer stealth opening | Implemented | Further quiet-approach playtesting; guaranteed knife takedowns were not implemented or agreed. |
| 4. Scavenging and supply sharing | Implemented 2026-09-17 | Unloading recovered guns is still an unconfirmed suggestion, not built. |
| 5. Overwatch feedback and direction | Implemented | No remaining requirement from this discussion. |
| 6. Casualty recovery / evacuation | Implemented 2026-09-17 | None from this discussion; decisions recorded in RULES.md, Casualty recovery. |

## 1. Group movement and cohesion

Existing: browser group selection and formation movement, plus automated-player
regrouping and scavenging (`moveGroup`, `stepGroupMovement` in the engine;
`tools/tactics-squad-bot.mjs`). These are not a guarantee that the full squad
arrives together. The bot is a test controller, not browser merc automation.

The playtest recommendations were to require all surviving squad members inside
a rally radius before advancing a waypoint, and stop chasing a relocated rear
guard indefinitely. These are recorded recommendations, not additional user
decisions. See [the run](playtests/2026-09-17-south-fence/README.md).

Suggested verification: an exhausted trailing merc prevents premature waypoint
completion; a displaced target causes reassessment rather than an unlimited chase.

## 2. Local alerts and combat pacing

User direction: hearing a sound alone should not lock the whole map into turns.
Unseen enemies can investigate in real time. Require tactical turns when an
actively approaching opponent can get within shooting range in two turns;
otherwise give a general warning such as “You are pretty sure someone heard that.”

Implemented 2026-09-17: `threatens()` / `reachable()` in `engine.js` decide
contact (`refresh`), alert guards beyond the two-turn reach close in real time
through `stepInvestigation`, and the warning is logged once per newly alerted
guard. The headless player runs the same real-time tick.

The estimate walks the real movement graph for two turns of the guard's AP and
traces the shooting rays, so walls and detours count. Bleeding, recovery and fire
remain pending and keep turn mode regardless of guard reach. AP is live across
the engagement: while any guard is alert, actions other than walking cost their
combat AP even in real time, nothing refills until a guard phase ends, and any
squad attack from real time opens a turn that holds until the squad ends it, so
a transition cannot refill a turn and real-time fire is never free. Alert guards
that reach their fix and see nobody stand down. Verified in
`tests/tactics-pacing.test.mjs` (ten cases): distant searches stay real time,
an approaching threat switches at exactly the two-turn reach, walls change the
estimate, transitions neither refill AP nor skip casualty timers, real-time fire
is charged, alert decays, and a tick on the 36-guard playtest map stays inside
the frame budget.

## 3. Clearer stealth opening

Delivered in `f6dc4fc`: guard awareness is independent of squad visibility;
directional detection is probabilistic and reduced by cover, sneaking and stance;
woodland zones reduce sight through them; guard facing is editable. The first
guard in the current `Factory-test.json` faces away from the west entrance.
Existing browser designs need that updated file reimported.

See [stealth rules and limitations](STEALTH.md), `tests/tactics-stealth.test.mjs`
and `dist/tactics/woodland.js`. Knives still use ordinary damage, and nearby
footsteps can trigger investigation. Do not claim a guaranteed silent takedown.

## 4. Scavenging and supply sharing

User direction: the player should not know everything an enemy carries. Bodies
are containers with randomized loot based on the enemy's equipment. Nearby mercs
can pass equipment. Do not add an omniscient “useful loot nearby” listing.

Implemented 2026-09-17 (`rollLoot`, `searchBody`, `searchPreview`, `pileOpen`,
`pileContents`, `SEARCH_COST` in `engine.js`; RULES.md "Bodies as containers"):
a fallen guard's body is a closed container whose contents are rolled once from
its own equipment (guns with their loaded rounds, 40–100% of each reserve stack)
and hidden until a comrade beside it searches it for 3 AP in combat (free in
real time). Adjacent mercs give items through `inventoryTransfer` as before; the
adjacency rule (same floor, cardinal neighbour, open intervening edge) is now
`adjacentTo` and shared with searching.

Revealing contents on search is built (the search button and cursor action; the
combat log names what was found). Unloading recovered guns is not built: the user
has not confirmed it. Loaded ammunition accounting and backpack capacity are
unchanged: a taken gun holds exactly the rounds it was found with.

Verified in `tests/tactics-bodies.test.mjs`: contents hidden before discovery,
a second search cannot reroll, drops fit the equipment (kinds carried, counts
bounded, loaded rounds exact), transfers conserve items and loaded rounds, and
the automated player obeys the same discovery rules (values nothing unsearched,
searches, then takes).

## 5. Overwatch feedback and direction

Delivered in `67d4244`, public deployment `ef58cae`: direct a cone by pointing and
clicking; brighter gold shows visible torso firing areas, darker gold shows
obstructed areas or areas outside identification range. A facing line helps with
wide species fields. The distance slider defaults to weapon range and can be
shortened. The reserved reaction actually holds fire beyond that chosen distance.

See `dist/tactics/overwatch-view.js`, `overwatchRange`, `withinOverwatch`,
`setOverwatch`, and `tests/tactics-overwatch-view.test.mjs`. Existing one-shot,
AP reservation and cancellation rules remain. Live browser verification passed.

## 6. Casualty recovery instead of carrying

User proposal: when injured badly enough to be downed, fatigue reaches maximum;
after three turns the merc has recovered enough to move again. Implemented
2026-09-17 in `engine.js` (`beginRecovery`, `recovering`, `RECOVERY_TURNS`,
`RECOVERY_HP`; `collapse` in `personalities.js`). The earlier carry/drag
recommendation is not an accepted requirement for this solution.

Decisions made at implementation (the refinements had been suggested, not
confirmed): the three turns are full squad turns beginning after the stabilization,
so the medic's own turn does not count; on Easy the count starts at the downing.
The comrade stands at 5 HP with fatigue left at 100 and a normal AP refill (no
stamina/AP penalty exists to restore partially). Another hit while down kills, as
before: interruption is death, not a reset. Rest is unavailable while anyone is
down, so it can neither stop bleeding nor hurry recovery.

The old encounter-end recovery path is removed: a stabilized comrade is pending
like a bleeding one, so the map stays in turn mode until the counter runs out and
is won afterwards. Dead and captured mercs never stand up; a comrade left
recovering when the squad crosses the map edge is captured.

Verified in `tests/tactics-recovery.test.mjs`: downing versus ordinary injury
(fatigue 100 only at the downing), three full turns without an off-by-one (turns
N+1..N+3 after a stabilization in N), Easy auto-stabilization counting from the
downing, a blast during recovery, retreat abandonment, encounter completion
waiting for the comrade, and the phase never dropping to real time while one is
down. Squad card reads "STABILIZED · up in N turns".

## Evidence

The post-overwatch merge passed 342 tests and the asset check. Those passing tests
validate existing features, not the pending requirements above. This handoff is a
documentation audit; it does not implement the remaining gameplay changes.
