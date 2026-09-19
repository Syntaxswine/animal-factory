# Guard alertness and personalities — proposal and tracking record

Opened 2026-09-16 on branch `tactics-guard-alertness`, stacked on `tactics-sight-lobes` (SIGHT.md). Direction from the user: guns alert guards at twice their range; guards, like mercs, get different personalities; that needs an alert / at-rest rule set first; twelve personalities, expanding what the friendly-fire reactions began; then, later the same day, personalities drawn at random from twelve Jungian archetypes rather than authored per guard.

## Status

| Stage | Scope | State |
| --- | --- | --- |
| G1 | Gunshot alarm at twice weapon range, for squad and guard shooters | Built on this branch, tests in `tests/tactics-alarm.test.mjs` |
| G2 | Guard alert states: rest, suspicious, alert, searching, stand-down, broken; combat can end without killing everyone; return to post; a left map settles by the campaign clock | Built on branch `tactics-guard-states` (2026-09-17), tests in `tests/tactics-guard-states.test.mjs` |
| G3 | Twelve Jungian archetypes drawn at random; bonds derived by wheel + affinity + friction (`dist/tactics/archetypes.js`); traits scale the state machine; six bond rungs; barks in register | Built on branch `tactics-archetypes` (2026-09-17), tests in `tests/tactics-archetypes.test.mjs` |
| G4 | Shouted alarms between guards, guard-to-guard friendly-fire reactions and grudges, grief | Built on branch `tactics-shouts` (2026-09-18), tests in `tests/tactics-shouts.test.mjs` |
| G5 | Happiness meter: opposing mercs on one local map lose 5 a day; 24 hours at zero and the merc quits; liked partners, grief, capture, clean wins | Built on branch `tactics-happiness` (2026-09-18), tests in `tests/tactics-happiness.test.mjs` |

Same gates as the other arcs: full suite green, 20-seed balance before and after, hostile review of at least 4/5 before the next stage.

Integration review: G2 through G5 are implemented and included in the canonical integration. G3's module `dist/tactics/archetypes.js` is imported by the engine, and the bond script prints from it. See [G3/G4 integration checks](G3-G4-INTEGRATION-REVIEW.md) and [G5/hiring integration checks](G5-HIRING-INTEGRATION-REVIEW.md) for validation; the implementation sections below distinguish built behavior from remaining proposals.

## Historical baseline before G2

These bullets describe the original baseline, not current G2 behavior.

- `alert` is a single boolean per guard. It becomes true when the squad identifies the guard, when the guard identifies a squad member, when the guard is attacked, or (G1) when a gun fires within twice its range. It never becomes false. Combat lasts until every alerted guard is dead.
- Non-alert guards do nothing except investigate: a footstep within 10 tiles (3 sneaking) or a peripheral glimpse gives them a `lastHeard` cell on the 6-tile grid and 12 investigation steps toward it, after which they stop where they are. They never return to post.
- Alert guards run one routine: shoot the nearest identified squad member, else reload, else walk toward `lastKnown`, else rotate 45° a turn. No cover use, no retreat, no cooperation.
- Mercs have authored personalities (`personalities.js`): six traits, bonds, quips, stress and fatigue meters, and a friendly-fire reaction that can retaliate. Guards have none of this. Guard names are fixed: Boris, Lev, Grigori, Oleg, Pavel, Igor, Anton, Vadim, Yuri, Sasha, Pyotr, Nikolai, in map order.

## G1: the gunshot alarm (built)

A firearm discharge (anything with a magazine: pistol, shotgun, SMG, rifle, AK, HMG, sniper, grenade, launcher, RPG, flamethrower) alerts every non-alert guard within **twice the weapon's range**, whoever fired it. Alerted listeners get `lastKnown` set to the shooter's approximate position on the 6-tile grid, so they converge on the report rather than on the exact tile. Guards already alert keep their existing fix. Beyond that ring the old 30-tile suspicion still applies to squad shooters.

| Weapon | Range | Alarm radius |
| --- | --- | --- |
| TT-33 pistol | 12 | 24 |
| Shotgun | 12 | 24 |
| SMG | 20 | 40 |
| Mosin-Nagant | 24 | 48 |
| AK-47 | 24 | 48 |
| HMG | 28 | 56 |
| Sniper rifle | 36 | 72 |
| Grenade (thrown) | 10 | 20 |
| Grenade launcher | 22 | 44 |
| RPG | 40 | 80 |
| Flamethrower | 10 | 20 |
| Knife, fists | 1 | none |

Radii follow the catalog automatically (the rule is 2 x range at fire time); this table was refreshed 2026-09-16 after the weapon-range revision on tactics-prototype (9aeb801, 5b4e0bb). With the longer ranges the old 30-tile suspicion ring only matters for the pistol, shotgun, grenade and flamethrower; every other report already alerts further than it carries suspicion.

Open question for the reviewer: `mag` is the discriminator, so a thrown grenade (no muzzle report) alarms at 20 around the THROWER, not around the impact, and the flamethrower (mag 4, a jet with no report) alarms at 20 as well; blasts themselves make no noise at all (`explosives.js` has no noise or alarm term). If a blast should carry, give explosives their own noise term at the impact in `detonate`, and give the flamethrower a jet term, rather than reusing weapon range.

Balance on the current tip (2026-09-16, after Codex's weapon revision 5b4e0bb and the retreat commit): 19/20, seed 1949 lost, identical to a clean-HEAD control worktree; the 18/2 record below is against the older sight-lobes tip 9c0dac1 and is not re-baselined here.

## G2: alert states

**Built 2026-09-17** on branch `tactics-guard-states`, on top of the playtest follow-ups (`threatens()`, `stepInvestigation`, the engagement economy). Tests: `tests/tactics-guard-states.test.mjs` (19 cases) plus two re-pinned cases in `tests/tactics-pacing.test.mjs`.

One state per guard, `g.state`, with `g.alert` kept as the boolean the rest of the engine reads: it is true only in Alert, so `threatens()`, the guard phase, the alarm and the travel gate are unchanged. Transitions are the rules below; the archetype traits (G3, built) scale the numbers per guard. Every counter in rounds ticks at the end of a guard phase; in real time the same transitions happen on arrival and sweep; a map the squad has left settles by the campaign clock on re-entry.

| State | What the guard does | Leaves when |
| --- | --- | --- |
| **Rest** | Holds post facing its post heading. Sight lobe and hearing as today; a wary guard (one that has stood down once on this map) hears footsteps 1.5× as far. | Footstep or glimpse → Suspicious. Identification, a hit, a gunshot within alarm radius → Alert (a shout, G4, will join that list). |
| **Suspicious** | Walks toward the `lastHeard` cell for up to N = 12 steps (18 wary), then sweeps two quarter turns on the spot; a fresh footstep re-aims it. Real time only: in turn mode it waits. | Anything Alert-worthy → Alert. Arrived, out of steps or unable to get there → Stand-down. |
| **Alert** | Today's combat routine: fires on what it identifies, closes on the freshest fix (identification, colleague's report, gunshot). Beyond two-turn reach it closes in real time. | Turn mode: no squad member identified by this guard for K = 3 consecutive rounds → Searching. Real time: reaches (or cannot reach) its fix and identifies nobody → sweeps 8 ticks → Searching. Nerve broken → Broken. |
| **Searching** | Goes to `lastKnown` (skipped when the Alert sweep already happened there), then to up to M = 4 of the neighbouring 6-tile report cells, nearest first, sweeping 8 ticks at each; in turn mode it walks with its AP and leaves one cell per arrival. Never fires: it has no target. A footstep re-centres the search on the sound. | Identification → Alert. Cells exhausted → Stand-down. |
| **Stand-down** | Walks back to the post tile, or to the ring around it when a body or a colleague stands on it. Three failed route searches in a row (walled in) and it rests where its last partial route left it. | Arrives → Rest, wary, facing its post heading. Any trigger → the corresponding state. |
| **Broken** | Nerve breaks when a hit leaves the guard standing at or below a third of its health (`NERVE`). A later shot, hit or miss, only tells it where the shooter is; it never steps into ground fire. It steps away from the last threat, choosing the tile that ends nearest an ally or its post, and does not fire unless cornered: no legal step increases its distance from the threat. Cornered in turn mode it strikes at what it can see and stays broken; cornered in real time (no attacks there) it turns to fight, which is Alert. | R = 2 rounds unshot (the hit round does not count; 12 ticks in real time) → Alert if a target is known, else Stand-down. A hit while broken restarts the count. |

Constants (`engine.js`): `ALERT_ROUNDS 3, SEARCH_CELLS 4, BROKEN_ROUNDS 2, SUSPICION_STEPS 12, SUSPICION_SWEEP 2, WARY_HEARING 1.5, WARY_STEPS 1.5, NERVE 1/3, ROUND_MINUTES 10, REALTIME_ROUND_TICKS 6, STANDOFF_TRIES 3, BARK_RANGE 30`. `SWEEP_TICKS 8` is the follow-ups' constant. Shout radius will follow the archetype table in G4 (base 12, Ruler 20), never the officer role.

**What holds the map.** Contact is unchanged: an alert guard that could bring a squad member under fire within two of its turns, a pending casualty or fire, or the squad having opened fire this turn. The engagement economy (`s.alerted`, live AP, the warnings) holds while any guard is Alert, Searching or Broken; it releases when the last of them stands down ("Area clear"). So a searching guard four tiles away with a clear line of fire is not contact until it identifies someone, and a squad that slips out of sight is out of turn mode within K rounds while its AP stays live. The travel marker refuses only while a guard is Alert.

**Barks.** A transition speaks when the squad could hear it (thirty tiles) or already sees the guard: "Boris: \"Who's there?\"", "Boris lost the trail and is searching.", "Boris gave up the search.", "Boris is back at post.", "Boris breaks and runs.", "Boris is cornered and turns to fight." G3 gives each archetype its own lines. The app tags a detected guard with `?`, `SEARCHING`, `STANDING DOWN` or `BROKEN`.

**The campaign clock.** The squad's side of "combat can end" is already built (RULES.md, "Retreat and border crossings"): members walk off the map across its 3-tile border and the map keeps its alerted guards. A map the squad has left advances no rounds, so `settleGuards(map, minutes)` runs on re-entry (`world.js` `arrive()` stamps `leftAt` when a map is left and settles by the difference), one round per ROUND_MINUTES = 10: a suspicious or standing-down guard is home and wary within a round; an alert or broken guard needs K rounds to reach its fix and drop to Searching, then one round per remaining cell to stand down and walk home; the walk itself is not charged. The shortest possible return is two crossings = 120 minutes = 12 rounds, so a squad that steps out and straight back always finds the guards at post and wary, never mid-search: that is the intended price of a retreat, the guards regroup faster than the squad can. Acceptance, staged by writing the clock in a test: 20 minutes leaves them Alert where they stood; 60 minutes finds them Searching around `lastKnown` with one cell left; 120 minutes finds every guard at post and wary; the real there-and-back across a border is measured at exactly 120 minutes.

**Posts.** A guard's start tile and heading are its post (`g.post`). Patrol routes are a later addition; the state machine does not depend on them.

**Acceptance properties, all tested.** A guard cannot skip from Rest to Searching (rounds do nothing to a resting guard; a glimpse or footstep makes it Suspicious; only K rounds of Alert or an Alert sweep reach Searching). Stand-down always ends at the post, beside an occupied post, or where the guard stands after three failed routes, never stalled. A wall blocks every sight-based transition and none of the sound-based ones. Combat ends within K rounds of the last identification if nobody fires; the walk to `lastKnown` and the M cells then run in real time. A broken guard runs, does not fire, and comes back Alert after R rounds unshot; cornered, it fights. The existing bot cannot exploit "Area quiet" by standing still next to an alerted guard: identification, not motion, is the trigger, and a still worker in front of an alert guard is contact on the next refresh.

**Balance (headless bot, factory map, seeds 1947–1986, per-seed timeout 150 s, control = the tip 8d84afc in a detached worktree; branch measured at 713b02a, after review round 1).** The bot was not changed; it does not chase a fleeing guard and does not read the new states.

| Measure, 40 seeds | Control 8d84afc | G2 branch |
| --- | --- | --- |
| Wins / losses | 40 / 0 | 37 / 3 (1961, 1965, 1972) |
| Stalls, timeouts | 0, 0 | 0, 0 |
| Friendly-fire hits (log lines) | 250 | 259 |
| Comrades downed by friendly fire | 71 | 72 |
| Retaliation shots | 54 | 61 |
| Fuel-tank explosions | 15 | 13 |
| Mean surviving squad HP at the end | 185 | 165 |
| Mean rounds | 9.9 | 9.8 |
| Guards that broke and ran | – | 62 (1.6 a run) |
| Alert → Searching drops | – | 146 |

Reading: friendly fire is not what G2 changed (the hit count is flat), and each of the three losses is the personality system's retaliation spiral or a flamethrower burst arriving in the same round, chains the control also rolls but survives. What G2 changed is that a guard at a third of its health now runs instead of standing to be finished (1.6 a run), and comes back Alert two rounds later while the bot has moved on; searching guards re-approach from the report cells rather than converging on a stale fix. Both are the design, and they cost the squad about twenty HP a run on average. The levers, all scaled per archetype in G3: `NERVE` (higher breaks more guards), `BROKEN_ROUNDS` (longer keeps them away), `ALERT_ROUNDS` (K). Counted with a log-cap-raised copy of each tree and a 40-seed script; the balance table alone is blind to the mechanism.

**Hostile review 2026-09-17 (one reviewer, two rounds).** Round 1 scored 3/5: a shot that missed a broken guard cured it (two raw `alert=true` writes in `attack()` predating G2, fixed by routing them through `targeted()`); turn-mode Searching ran the eight unbounded path searches per step (104 s per guard phase with 35 searchers on the south-fence map, now the bounded router); the clock settle ignored fires; a broken guard would flee into ground fire; nine of twenty-five mutants survived (K, R in real time, NERVE, wary steps, the re-centred search, the walled-in stand-down), each now pinned in `tests/tactics-guard-states.test.mjs`. Round 2 on 713b02a scored 4/5, merge with follow-ups: the turn-mode search phase with 35 searchers on the south-fence map costs about 3 s (one bounded route per searcher per step; caching the route across the steps of a turn, as real time already does with `g.route`, would take it under a second); the clock credits nothing below K rounds (20 minutes away leaves the Alert counter at zero, as the doc says); the timeout choice and the cornered strike got their own falsifiers after the round (19 cases).

**Left for later.** Guards returning to a patrol route rather than a fixed post. (Shouts as an Alert trigger are G4 and the trait scaling and barks G3, both built below.)

## G3: twelve archetypes, drawn at random

**Built 2026-09-17** on branch `tactics-archetypes`, stacked on G2. Module `dist/tactics/archetypes.js` holds the twelve entries (want, fear, register, failure, ten traits, shout radius for G4, two barks per state), the bond rules (`bond(from,to)`, which `tools/archetype-bonds.mjs` now only prints), the six rungs, and the draw. Tests: `tests/tactics-archetypes.test.mjs` (ten cases).

- **The knob.** `createGame(seed, map, detect, difficulty, {social})`: plain `createGame` leaves `s.rules.social` false and the G2 base numbers; `createWorld` (the campaign, the browser) turns it on. The neutral-knob falsifier holds: with the knob off, twenty headless-bot runs on the factory hash identically to the G2 tip 4124ea2 (units, rounds, phase, log).
- **The draw.** A guard's archetype is a hash of the campaign's roster seed, the map's name and the guard's index (`drawArchetype`), so a seed reproduces its roster, every map draws its own, and no RNG stream moves; the socialSeed plan in "Assignment" below is superseded. `createWorld(map, difficulty, rosterSeed)`: the app draws a new roster seed for every new campaign (the ballistic seed stays 1947); tests and the balance tool use 1947. Guards may repeat archetypes. `drawSquad(seed)` gives four distinct archetypes for a future recruit squad. The four authored mercs carry their tags (Yakov Ruler, Anya Rebel, Misha Creator, Vera Caregiver) always, and their authored bonds are their resting level (`social.resting`); `restingBond(a,b)` answers the authored value where one exists and the matrix otherwise.
- **Traits scale G2.** Scale = 0.5 + trait/100 (a trait of 50 is the base). Hearing radius × vigilance scale (Sage 1.4, Jester 0.9); suspicion steps × initiative scale (Hero 17, Explorer 16, Sage 8); report cells and the K rounds before an alert guard loses the trail × vigilance scale (Sage: 4 rounds, 6 cells); nerve breaks at (1 − nerve/100) × ⅔ of health (Hero 10 %, Innocent 47 %, the base a third), and a broken guard stays broken for round(4 × (1 − nerve/100)) rounds (Innocent 3, Hero 1). The same 19-of-45 hit breaks an Innocent or a Lover and leaves a Hero or an Everyman Alert. Obedience is stored for G4.
- **Barks.** Every transition speaks in the archetype's register (curly quotes, the merc channel's), the two lines per state alternating per guard and state; the alert line is spoken on an identification, a hit or a cornered turn, never by the ring a report alerts (that chorus is G4's shout to design). Without an archetype the G2 line stands.
- **Rungs.** Six rungs on the bond scale (bonded 60, trusted 25, cautious 0, strained −34, resented −69, feud), `rungOf` labels the merc sheet, and under the knob the friendly-fire retaliation chance is scaled by rung: bonded never, trusted half, cautious as written, strained 1.5×, resented and feud 2× (capped at the formula's .95). The rung that answers a hit is the rung before it: the hit's own bond loss cannot talk a bonded comrade into firing back. The merc tags, resting levels and rung labels are present in plain games too; only the retaliation scale and the drift are behind the knob. `opposing` (resented or worse) and `liked` (trusted or better) are the G5 predicates.
- **Resting level.** Rest pulls every merc bond toward its resting level by 10 % of the remaining distance per 8 hours, compounding (a 48-hour rest closes 47 %; `driftBonds`, called from downtime rest and medical rest under the knob, never from training); a crossed rung is logged either way ("Anya's regard for Yakov rises to strained", "Yakov's regard for Anya falls to trusted").
- **Balance** (headless bot, factory map, seeds 1947–1986, log cap raised in a detached copy of f3382f3 so the counts are complete; the bot reads none of the new fields):

| Measure, 40 seeds | Control 8d84afc | G2 (713b02a) | G3 knob off (f3382f3) | G3 knob on |
| --- | --- | --- | --- | --- |
| Wins / losses | 40 / 0 | 37 / 3 | 37 / 3 (the same three) | 39 / 1 (1961) |
| Friendly-fire hits | 250 | 259 | 259 | 287 |
| Retaliation shots | 54 | 61 | 61 | 104 |
| Comrades downed by friendly fire | 71 | 72 | 72 | 91 |
| Mean surviving squad HP | 185 | 165 | 165 | 154 |
| Mean rounds | 9.9 | 9.8 | 9.8 | 10.2 |

Reading: knob off is G2 to the count, as the hash check says. Knob on, the archetype guards cost the squad another eleven HP a run (Heroes and Rulers do not break where the base guard did; Sages hear and search further), and the rungs raise the retaliation count (Anya and Misha rest at −10, strained, so their exchanges run at 1.5×; the authored roster has no bonded pair to damp anything) while the loss count fell to one; one loss in forty and three in forty are within the dice, so the honest claim is "no harder to win, a little more expensive, and noisier between the mercs". The levers stay per archetype: the wheel amplitude and the friction weight in the matrix set the roster's temperature; the trait scales set the guards' bite.

- **Clock settle.** A broken guard on a map the squad has left serves its own R first (nerve), then K (vigilance) like any alert guard: a Hero is Alert again after 10 minutes, an Innocent after 30.
- **Hostile review 2026-09-18 (one reviewer, two rounds).** Round 1 scored 3/5: the rung after a hit's own bond loss answered it (a bonded comrade could be talked into firing back), every campaign and map drew the same roster from seed 1947, a report made the whole alert ring shout, the clock settle skipped a broken guard's own R, drift was linear per call; all fixed with falsifiers. Round 2 on 6339fd9 scored 4/5, merge; its five surviving mutants (the per-guard K on the clock, the turn-mode R, the above-threshold refresh, the fix-less broken guard, the yard's roster seed) are pinned in the last test case. Follow-up left: the knob-on tick costs about 16 % more on the 36-guard map, from trait-scaled movement, not from barks.
- **Not built here.** The six proposed bond events (survived a contact, covered by overwatch, left bleeding…), recruitment cards, initial guard-to-guard and captor bonds in play (`restingBond` answers the matrix; nothing stores or moves a guard's bonds yet, that is G4's incidents) and the formation rules per rung.

Direction 2026-09-16: personalities are randomly selected from twelve archetypes, not authored per guard. Another agent suggested the Jungian twelve, each defined by a want, a fear, a way of speaking and a failure mode:

| Archetype | Wants | Fears | Speaks | Fails by |
| --- | --- | --- | --- | --- |
| Innocent | safety and simple happiness | doing something wrong | plainly, trusts first | denial: ignoring what is ugly until it bites |
| Everyman | to belong | standing out, being left behind | common sense, understatement | going along with the crowd against their own judgment |
| Hero | to prove worth through hard action | weakness | challenges and deadlines | arrogance: picking fights that did not need fighting |
| Caregiver | to protect others | selfishness in themselves | warmly, asks what you need | martyrdom and smothering, helping past the point of being asked |
| Explorer | freedom and new ground | being trapped or conforming | restlessly, about the next place | never committing, wandering when staying was the task |
| Rebel | to break what is broken | being powerless | bluntly, provokes on purpose | destroying things that worked, revolt as habit |
| Lover | intimacy and beauty | being unwanted | sensory detail and devotion | losing self in the other, pleasing rather than telling the truth |
| Creator | to make something that lasts | mediocrity | ideas and half-finished sketches | perfectionism, never shipping |
| Jester | to enjoy the moment, make others laugh | boredom, being boring | jokes that carry the true thing | frivolity, joking through the moment that needed seriousness |
| Sage | to understand | being deceived or ignorant | carefully, cites, qualifies | paralysis: studying instead of acting |
| Magician | to transform situations | unintended consequences | systems and hidden levers | manipulation: treating people as parts |
| Ruler | order and control | chaos, being overthrown | decisions and responsibilities | authoritarianism: control past the point of usefulness |

### Who gets along and who is at each other's throats

Bonds are derived, not authored, by three rules (`tools/archetype-bonds.mjs` prints the matrix):

1. **The wheel.** Pearson's four orientations, 30° apart in this order: Innocent, Sage, Explorer (independence); Rebel, Magician, Hero (risk and mastery); Lover, Jester, Everyman (belonging); Caregiver, Ruler, Creator (stability and control). Opposite orientations sit 180° apart. Base bond = 30·cos(angle between them): +30 for the same, +26 next door, 0 at a right angle, −30 opposite.
2. **Affinity, +15 both ways**, where wants complete each other: Innocent–Caregiver, Innocent–Ruler, Everyman–Caregiver, Everyman–Jester, Hero–Ruler, Hero–Rebel, Caregiver–Lover, Explorer–Rebel, Explorer–Sage, Creator–Magician, Creator–Sage, Jester–Lover, Sage–Magician, Ruler–Creator, Rebel–Magician.
3. **Friction, −15 one way**, when A's failure mode is exactly what B fears: B resents A. The Rebel's habit of breaking what worked hits the Ruler's fear of chaos, the Innocent's need for safety, the Creator's lasting work and the Everyman's crowd. The Magician's manipulation hits five fears (wrongdoing, exclusion, being unwanted, selfishness, powerlessness). The Jester's frivolity hits four. The full failure-to-fear map is in the script.

Same-archetype pairs start at +30, minus 10 for the competitive types (Hero, Ruler, Rebel, Jester, Magician: two Rulers on one shift is one Ruler too many) and plus 10 for the cooperative ones (Everyman, Caregiver, Innocent).

The resulting initial bond seeds (row regards column; the merc bond scale is −100..100 and these are starting values, not ceilings):

| regards → | Inno | Sage | Expl | Rebe | Magi | Hero | Love | Jest | Ever | Care | Rule | Crea |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Innocent** | +40 | +26 | +15 | -15 | -30 | -41 | -30 | -26 | -15 | +15 | +30 | +26 |
| **Sage** | +11 | +30 | +41 | +15 | +15 | -15 | -41 | -45 | -41 | -15 | 0 | +30 |
| **Explorer** | +15 | +26 | +30 | +41 | +15 | 0 | -15 | -26 | -30 | -41 | -30 | 0 |
| **Rebel** | 0 | 0 | +41 | +20 | +26 | +30 | 0 | -15 | -41 | -45 | -41 | -15 |
| **Magician** | -30 | +15 | +15 | +41 | +20 | +26 | +15 | 0 | -15 | -26 | -30 | -11 |
| **Hero** | -26 | -30 | 0 | +30 | +26 | +20 | +11 | 0 | -15 | -30 | -11 | -45 |
| **Lover** | -30 | -26 | -15 | 0 | 0 | +26 | +30 | +41 | +15 | +15 | -15 | -26 |
| **Jester** | -26 | -30 | -26 | -15 | 0 | +15 | +41 | +20 | +41 | +15 | -15 | -15 |
| **Everyman** | -15 | -26 | -45 | -41 | -30 | -15 | +15 | +41 | +40 | +41 | +15 | 0 |
| **Caregiver** | +15 | -15 | -26 | -30 | -41 | -30 | +15 | 0 | +41 | +40 | +26 | +15 |
| **Ruler** | +30 | 0 | -30 | -41 | -30 | -26 | -15 | -15 | +15 | +26 | +20 | +26 |
| **Creator** | +26 | +30 | 0 | -30 | -11 | -30 | -26 | -15 | 0 | +15 | +41 | +30 |

**Allies, both ways:** Explorer–Rebel (+41/+41), Lover–Jester, Jester–Everyman, Everyman–Caregiver (all +41/+41), Sage–Explorer (+41/+26), Rebel–Magician, Ruler–Creator, Innocent–Ruler, Sage–Creator, Rebel–Hero.

**At each other's throats:** Rebel–Ruler (−41/−41), Rebel–Everyman (−41/−41), Hero–Creator (−45/−30), Rebel–Caregiver (−45/−30), Explorer–Everyman (−30/−45), Sage–Jester (−45/−30), Magician–Caregiver, Explorer–Caregiver, Sage–Everyman, Sage–Lover.

**One-sided, which is where the drama is:** the Sage admires the Explorer more than the Explorer notices (+41/+26); the Magician wants the Rebel as an instrument more than the Rebel wants the Magician (+41/+26); the Creator looks up to the Ruler, who barely rates them (+41/+26); the Innocent trusts the Sage (+26), who finds the Innocent's denial tiresome (+11); the Lover is drawn to the Hero (+26), who returns +11. These asymmetric pairs are what the friendly-fire reaction turns into grudges: the one who cared more takes the hit harder.

Across all 66 pairs the mean two-way sum is −7 and 32 pairs are negative in both directions, so a random four-merc squad is fractious by default. That is a knob: the wheel amplitude (30) sets how much orientation matters, the friction weight (15) how much failure modes matter. Halving the amplitude gives a mostly neutral roster with a few feuds.

### What an archetype does in the guard state machine

The four state-machine traits from G2 come from the archetype; Codex's six merc traits are set in the same table so the retaliation formula works unchanged.

| Archetype | Vigilance | Nerve | Initiative | Obedience | Aggression | Pride | Discipline | Forgiveness | Loyalty | Humor | On the gate |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Innocent | 60 | 30 | 30 | 80 | 20 | 30 | 60 | 85 | 70 | 40 | Trusts the quiet. Slow to believe a shadow is a threat, quick to break when it is. |
| Everyman | 50 | 45 | 30 | 85 | 35 | 35 | 60 | 60 | 75 | 50 | Does what the others do. Goes where the shout goes. |
| Hero | 60 | 85 | 95 | 40 | 85 | 80 | 55 | 30 | 60 | 45 | Pursues at a run. First through the door, first to pick the fight. |
| Caregiver | 65 | 55 | 60 | 60 | 30 | 40 | 70 | 80 | 95 | 35 | Runs to whoever is hit. Stands over the wounded instead of firing. |
| Explorer | 85 | 50 | 80 | 20 | 50 | 55 | 30 | 55 | 40 | 60 | Investigates furthest and longest, then does not come back to post. |
| Rebel | 55 | 75 | 90 | 10 | 90 | 75 | 20 | 20 | 35 | 55 | Ignores the shout, ignores the post, provokes the mercs and the officer alike. |
| Lover | 45 | 35 | 40 | 65 | 30 | 50 | 45 | 70 | 85 | 50 | Stays close to a bonded colleague; breaks when that colleague falls. |
| Creator | 55 | 45 | 25 | 45 | 30 | 60 | 75 | 50 | 55 | 40 | Holds post and improves it: cover, angles. Slow to leave. |
| Jester | 40 | 40 | 55 | 30 | 45 | 45 | 25 | 65 | 60 | 95 | Barks constantly, which is noise. Dozy on watch, lively in contact. |
| Sage | 90 | 50 | 20 | 55 | 25 | 55 | 85 | 55 | 50 | 30 | Notices everything, acts late. Long searches, patient overwatch. |
| Magician | 70 | 60 | 65 | 25 | 55 | 65 | 60 | 35 | 40 | 45 | Flanks. Uses the alarm to move others, keeps its own fix. |
| Ruler | 70 | 70 | 45 | 50 | 55 | 85 | 90 | 30 | 65 | 25 | Holds post, shouts furthest, expects the shout obeyed. Stands down last. |

Species traits (SIGHT.md) and archetype traits stack; the archetype never changes what a species can see.

### Assignment

- *(Superseded by the Built block: the draw is a hash, not a stream.)* Guards draw an archetype from the social RNG stream at map creation (never the ballistic stream), so a seed reproduces its roster. `s.socialSeed` is seeded lazily today (first `friendlyReaction`), so drawing at creation shifts every later social roll: the build must hold the draw off behind its knob in the old fixtures and hash-equal the old rig with the knob neutral before turning it on. Guards may repeat archetypes; the twelve factory names stay as names.
- A merc squad draws four distinct archetypes. The four authored mercs keep their authored bonds and gain an archetype tag for the state-machine traits: Yakov Ruler, Anya Rebel, Misha Creator, Vera Caregiver. The derived matrix scores Yakov–Anya at −41 both ways, Anya–Misha at −15/−30 and Yakov–Vera at +26/+26. That does NOT match the hand-written bonds in every case: `personalities.js` authors Yakov–Anya at +5/+5. Decision (2026-09-16, for the reviewer to confirm): for the four authored mercs the authored value is the resting level and the archetype tag drives state-machine traits only; the matrix is the resting level for random draws (guards, recruits). If the boss prefers the matrix for the authored four, Yakov and Anya start resented and the demo squad has a feud from day one.
- Initial bonds among guards, among mercs, and between a captured merc and its captors all come from the matrix; the friendly-fire reaction, the kill relief and the stress meters then move them as today.
- Each archetype ships with two barks per state, in its speech register from the table above, in the map log with the merc channel's quotes.

### Levels of getting along

Direction 2026-09-16: a bond needs rungs, not just a number, and mercs are the cleaner case because recruitment shows the friction before anyone signs. The matrix value is a **resting level**; events push a bond away from it and rest pulls it back, so feuds cool but incompatibility never disappears.

Six rungs on the existing −100..100 scale, retaining the four existing labels (`personalities.js` has trusted / cautious / strained / resented today) and adding bonded at the top and feud at the bottom:

| Rung | Range | Label | What it does for mercs | What it does for guards |
| --- | --- | --- | --- | --- |
| Bonded | 60 and up | bonded | Never retaliates (the rung before the hit answers it). Stress halves when adjacent to the other. Formation orders keep the pair together. Takes a stress spike when the other is downed. | Runs to the other when hit. Shares the other's fix on a shout regardless of obedience. Breaks when the other is killed unless nerve is high. |
| Trusted | 25 to 59 | trusted | Retaliation chance at half the formula. Adjacent transfers and stabilizing at normal cost. Friendly barks. | Answers the other's shout. Holds a flank next to them. |
| Cautious | 0 to 24 | cautious trust | The formula as written. Neutral barks. | The formula as written. Obedience check as written. |
| Strained | −34 to −1 | strained | Retaliation at 1.5×. Needling barks. Formation orders keep the pair apart by one tile. Transfers cost +1 AP: the handover is grudging. | Ignores the other's shout unless obedience is high. Won't stand adjacent at post. |
| Resented | −35 to −69 | resented | Retaliation at 2×, and a near miss (a bullet passing within a tile) counts as a hit for the incident ledger. Stabilizing the other costs double medical AP. Drops out of group moves the other leads. | Never answers the shout. Investigates away from, not toward, the other. A shot that passes near the other is not corrected for. |
| Feud | −70 and below | feud | Everything above, and at the end of a map either party may refuse the next contract while the other is on the roster: the recruitment screen says so. | If the officer (the Ruler on the map, or the highest-discipline guard) is down, the pair may fire on each other in contact, using the same ammunition-limited retaliation rule. |

**What moves a bond.** Two events exist today: friendly fire (−8 and −20% of the damage fraction) and stabilizing (+20). Proposed additions, all on the social RNG stream and all logged as memories:

| Event | Change | Who |
| --- | --- | --- |
| Survived a contact together, both alive at the end | +3 | each pair present |
| An overwatch or reaction shot that hit the enemy targeting the other | +10 | the one covered, toward the coverer |
| A kill made while the other was bleeding or downed within 6 tiles | +8 | the downed, toward the killer |
| Left bleeding within reach while the other spent its AP elsewhere | −15 | the bleeder, toward each comrade who could have reached |
| The other's death | stress +25 for a bonded partner, +15 for trusted; a feud partner gets relief instead (happiness effects in G5) | survivors |
| Rest between maps, per 8 hours | 10% of the distance back toward the resting level | every pair |

A pair that starts strained can therefore climb to trusted through a good campaign, and drops back toward strained only slowly; a bonded pair that suffers one careless burst falls to cautious and recovers by resting. Rungs are crossed, and the log says so ("Anya no longer trusts Misha").

**Recruitment.** *(Built 2026-09-18 as the hiring hall: ECONOMY.md, "Mercenary contracts".)* When replacement recruitment exists (STORY.md lists it as unbuilt), the candidate card shows the archetype in its speech register and the predicted rung with every current squad member, as labels not numbers: "would get on with Vera; would clash with Anya; Yakov would not trust her at first." A candidate in a predicted feud with anyone on the roster says so and asks a higher fee. The player is choosing the squad's temperature; the game should never hide it. For guards none of this is shown; the player learns a roster's rungs by watching who answers whose shout.

**Levels of not getting along have different shapes.** Strained is verbal: barks, a grudging handover. Resented is physical: spacing, refusals, carelessness. Feud is structural: someone leaves, or someone shoots. That ladder is what makes the friendly-fire trance more than a coin flip: the same burst that a trusted comrade shrugs off is, for a resented one, the excuse they were waiting for.

## G4: shouts and guard-on-guard incidents

**Built 2026-09-18** on branch `tactics-shouts`, stacked on G3. Everything here sits behind the campaign's social knob (`s.rules.social`): a plain `createGame` is G2 to the count (twenty headless runs hash identically to the G3 tip 591b142), the campaign and the browser play with it on. Tests: `tests/tactics-shouts.test.mjs` (ten cases).

- **The shout.** An Alert guard shouts once, on entering the state, whatever put it there (a sighting, a gunshot alarm, a hit, a colleague's shout). The shout is its alert bark, in register. Every colleague within its archetype's radius (table below; base 12, Rebel 0) that is not already Alert or Broken hears it: one that heeds it takes the shouter's fix and goes Alert, and shouts in turn, so an alarm runs down a chain of obedient guards (bounded by their radii; a guard already Alert keeps its own, better fix; one trigger asks each guard once, whether the trigger is a shout, a whole attack with its alarm ring and replies, a guard phase's recoveries or a refresh's sightings, so a listener that declined is not re-asked by every relay, though a listener bonded to a later shouter in the same trigger still answers it (the asked set blocks rolls, never a bonded answer); the shouter asks its whole ring before any answer relays, so a colleague bonded to the shouter is asked by the shouter and never first by a stranger's relay; a Jester's joke is not an ask, its listener stays askable; the campaign clock settle is sealed, no shout propagates during it, since what the guards said to each other while the squad was away is not simulated); a resting or stood-down one that does not heed goes Suspicious toward the shouter's own tile, while a suspicious or searching one keeps its own trail (review round 1: a searcher at feud with the shouter used to abandon the merc's trail for the colleague's tile). Guards alerted by a shout answer without their own alert bark, and a guard alerted by a gunshot report (`alarm`, silent since G3's review) propagates the same way without speaking: one bark per cascade, plus the answer counts. A shout without a fix (a guard hit by a colleague's stray, a guard catching fire) rallies the others on the shouter. A Jester's listeners only ever go Suspicious: the joke is not believed. The squad hears the shout and the answer count when the shouter is within thirty tiles or in sight ("1 guard answers Boris's shout.").
- **Heeding.** The listener's bond toward the shouter decides first: resented or feud ignores the shout, bonded always answers; anyone else rolls its obedience trait (Everyman 85, Innocent 80 … Explorer 20, Rebel 10) on the social stream, so no shout moves a bullet (`s.seed` is untouched, pinned).
- **Guard on guard.** Bullets already hit the first body on the ray, so a guard's rifle finds a colleague as readily as a merc's does. Under the knob every guard keeps the mercs' ledger (`g.social`: stress, bonds, incidents, memories) and the friendly-fire reaction is the one function for both teams (`friendlyReaction`, reading the archetype's traits and three `hit` lines where a merc reads its authored personality): a hit costs the victim ten stress plus the injury strain a merc would take, a grudge and a bond loss from the archetype matrix's resting value, a line in register ("Oi. Other way, mate."), and the same retaliation roll, scaled by rung, bounded by ammunition. Grigori shooting back at Pyotr mid-firefight is the intended chaos.
- **Grief.** A guard whose trusted or bonded colleague falls within thirty tiles takes 15 or 25 stress and remembers it; when its stress passes its nerve trait it breaks on the spot, away from the killer if the killer is not a guard and away from where the colleague fell otherwise (an Innocent at nerve 30 breaks on a bonded death if it already carried ten; a Hero at 85 only if it already carried more than sixty). Stress is the mercs' meter and, under the knob, guards now take the same injury strain a merc does from any hit (`injuryStrain`, a no-op for guards before G4: 10 plus 35 × the share of health lost), so a wounded guard grieves harder; this is the main new driver of the knob-on balance below. The grief line ("Lev saw Boris fall.") is logged only when the squad can see the mourner. A colleague's bullet as the cause applies the G5 quantities: the mourner's bond toward the killer drops a further 40 (trusted 20) and its grudge rises by the same. Guards work stress off at the mercs' resting rate on the campaign clock (`settleGuards`).
- **Not built.** Guard-to-guard bonds moving with shared contacts (the six bond events), formation effects per rung, patrol routes. The UI shows nothing new beyond the log: no stress or bond readout for guards.
- **Balance** (headless bot, factory map, seeds 1947–1986, knob on in both trees, the log cap bypassed in the instrument so the counts are complete; the bot reads none of the new fields). Knob off, twenty runs hash identically to the G3 tip 6339fd9 (cca0f8f changes no engine code).

| Measure, 40 seeds | G3 (6339fd9) | G4 (this branch) |
| --- | --- | --- |
| Wins / losses | 37 / 3 (1958, 1964, 1972) | 38 / 2 (1957, 1964) |
| Shouts with an answer / guards answering | 0 / 0 | 131 / 245 |
| Guard-on-guard hits / retaliation shots | 31 / 0 | 36 / 4 |
| Merc friendly-fire hits / retaliation shots | 242 / 85 | 213 / 74 |
| Guards broken | 83 | 139 |
| Grief lines (mourner in sight) | 0 | 131 |
| Contact openings | 47 | 89 |
| Mean surviving squad HP | 145 | 178 |
| Mean rounds | 10.1 | 11.6 |

Reading: no harder to win (two losses against three is inside the dice, and the seeds differ). Shouts bring the guards in about six times a run and the guards arrive piecemeal, so the squad ends thirty HP healthier over a fight a round and a half longer; the guards break two-thirds more often, the grief rule and the injury stress they now carry doing most of it, and the merc friendly-fire count falls with fewer guards standing in the squad's lines of fire at once. Guard-on-guard incidents are rare on the factory roster (four retaliation shots in forty runs): the bullets that find a colleague mostly find one already Alert, and a Rebel with a rifle at feud is the case that shoots back. Contact openings nearly double: guards alerted beyond two-turn reach close in real time and flip the map into a turn as they arrive, one at a time. That churn ("CONTACT" / "Area quiet" alternating) is the pacing cost of the arc and the first thing to watch in a browser playtest; a hysteresis on the contact rule would be the lever if it grates.

**Hostile review 2026-09-18** (one reviewer, three rounds, probes and a 46-mutant sandbox; recorded in the commit messages). Round 1 scored 3/5: a searching listener at feud with the shouter had its trail re-centred on the colleague's tile, and every relay re-asked a listener that had declined; also the Hero sentence above was false and guards' injury stress was undocumented. Round 2 scored 3/5: the asked set was scoped to one shout, so an alarm ring re-asked a decliner once per ring member; depth-first recursion let a stranger's relay ask a bonded listener before its friend did; a broken guard recovering to Alert inside the campaign-clock settle left a resting colleague Alert for good. Round 3 scored 4/5, merge with follow-ups, all taken: the asked set blocks rolls but never a bonded answer; a whole attack and a guard phase's recoveries are single triggers; the cornered fix got its falsifier. Reviewer's alert-count probe on the south-fence map (36 guards, a muzzle on every guard tile, three rosters): a rifle report puts 11.3 guards in Alert and the cascade 11.7, a pistol 3.9 and 4.3, at most four more at a ring's edge, never a map-wide wave, and no answer line ever landed within the squad's hearing. Equivalent mutants left as they are: the second pass's state guard and the knob check inside `shout()`.

Direction 2026-09-16 (the proposal the build follows):

- An Alert guard shouts once on entering the state: guards within the shout radius that pass their obedience check take the shouter's `lastKnown` and go Alert; the rest go Suspicious toward the shouter. Shout modifiers follow the assigned archetype, not a fixed guard name (names carry no traits under G3). Radius by archetype, base 12:

| Archetype | Radius | Why |
| --- | --- | --- |
| Ruler | 20 | Expects to be obeyed and projects |
| Hero | 16 | Challenges out loud |
| Caregiver | 14 | Calls for the others' sake |
| Everyman | 12 | The base |
| Jester | 12 | Loud, but listeners go Suspicious rather than Alert: the joke is not believed |
| Lover | 10 | Calls to the bonded partner first |
| Creator | 10 | |
| Innocent | 8 | Unsure it is real |
| Sage | 8 | Reports carefully, late |
| Explorer | 6 | Usually elsewhere |
| Magician | 6 | Keeps its own fix and uses the shout to move others |
| Rebel | 0 | Does not shout for anyone |
- Bullets already hit the first body on the ray regardless of team, so guards can shoot guards. Reuse `friendlyReaction`: stress, bond loss, grudge, a bark, and the same retaliation chance. Grigori shooting back at Pyotr in the middle of a firefight is the intended kind of chaos, bounded by the existing "ammunition-limited retaliation" rule.
- A guard whose bonded colleague is killed gains stress and, if nerve is low, can break on the spot.

## G5: happiness and quitting

**Built 2026-09-18** on branch `tactics-happiness`, off the canonical tip 6eec4c6 (G3 and G4 integrated). Module `dist/tactics/happiness.js` (pure: units in, log lines out; the clock is the campaign clock in minutes), wired from `world.js` (every clock advance: exploration ticks, downtime, the hour on the road) and from the engine (deaths, captures, stabilizations, the end of a contact). The meter exists only in the campaign: a plain `createGame` gives the mercs no meter and no event touches them, so a plain game stays G4 to the byte. Tests: `tests/tactics-happiness.test.mjs` (eleven cases, the nine acceptance checks among them).

- **The meter.** `u.social.happiness`, 0..100, 100 at the start; shown on the character sheet beside stress and fatigue. Settled pro rata whenever the clock advances, all four sources of time alike (`settleMorale`): 5 per 24 hours per opposing partner (rung resented or feud) on the same local map; with none present, one rate in two tiers (decision 2): +5 a day, or +10 when every opposing partner is deployed on another local map; liked partners present add 5 (bonded) or 2 (trusted) a day each. A crosser waiting beyond a map edge counts as on its destination. A partner's rung rising lifts the meter 5 when the rise is new ground for the pair or ends a day or more spent at the lower rung (per pair the best rung reached, the rung it stands at and since when are remembered), so a bond wobbling across one boundary under rest drift and friendly fire pays nothing, while a real fall followed by weeks of reconciliation pays again; a fixture or a hand-over that moves a bond is read on the next tick.
- **Quitting.** Exactly zero for 24 consecutive clock hours (the meter's change over a clock interval is a constant rate after the instantaneous rung bonus, so the moment it empties is the crossing of that line, stamped where it falls inside the interval: one 48-hour rest and two of 24 agree to the minute, and downtime drifts bonds and settles the meter in one-hour slices so a rung boundary the drift crosses changes the rate at the same hour whatever the chunking; a meter an event emptied is stamped at the start of the next clock advance, one frame in play; the timer resets the moment the meter rises, taking the decision to walk with it) and the merc quits at the next safe moment: at once on a calm map (no guard alert, nothing engaged), otherwise when the contact ends (the map won, or the last alerted guard stood down); a map change ends a contact without the lift. At the end of a contact the walk comes before the clean-win lift: a merc still at zero then leaves even when the fight it leaves was clean. When every merc has quit the map reads "The squad has walked out." and the run is lost, as with every other empty roster. `quit` is a roster state beside captured and dead: the merc keeps its skills, level, history and what it holds, leaves the map (`alive()` is false for it, it is no occupant and no target), and stays in the run record. The squad card reads "QUITS IN N h" while the timer runs and "QUIT" after; the log names the cause ("Anya has had enough of Yakov and Misha (24 hours at zero)."). Its liked partners lose 15 (bonded) or 5 (trusted). Re-recruiting a quit merc waits for a recruitment system; there is none.
- **Loss of a partner** (`partnerLost`, at the rung in force, resting level ignored). Death: bonded −75 happiness and +25 stress ("Vera has not spoken since Misha died."), trusted −35 / +15, cautious +10 stress, strained +5, resented nothing, feud −10 stress (relief, "Anya will not mourn Misha."). Killed by a squadmate's bullet: the survivor's grudge against the killer rises at 2× (trusted 1.5×) of a 20-point step and its bond toward the killer drops a further 40 (trusted 20), decision 4. Capture (a stabilized comrade left behind on a crossed map): −20 bonded, −10 trusted, once; the rescue hook (`partnerRescued`, +15 / +5, net −5 as decision 3 asks) exists but nothing calls it until a rescue facility does. A total defeat nobody escaped settles nothing (the run is over); when crossers escaped a lost map, they grieve the comrades it cost by the same table. A merc that quit travels with the squad as a record only: no body on any map, nothing for a bullet or a blast to find, nothing drawn.
- **What lifts it.** A contact won with nobody down: +5 to everyone on contract ("A clean fight: the squad's spirits lift."; the engine keeps `s.fight` from CONTACT to the contact's end and marks any casualty). Stabilizing a liked partner: the medic feels +5 (bonded) or +3 (trusted) on top of the patient's bond gain. Pay day: not built (ECONOMY.md has no wages).
- **Guards** carry no meter (their `g.social` has no happiness field), so they are never partners and never quit.
- **Honest caveat.** The squad travels as one: today the only way two mercs are on different local maps is the window of a retreat, when the crossers wait beyond the edge. The +10 separation tier and the "field them apart" lever are built and pinned, and wait for a roster that can be split.
- **Hostile review 2026-09-18** (one reviewer, two rounds, probes and a 69-mutant sandbox; recorded in the commit messages). Round 1 scored 3/5: a quit merc travelled to the next map as a body (placed on a landing tile, admitted by the bullet and blast filters, drawn); crossers who escaped a lost map felt no grief; the calm-map quit fired while alerted guards were closing; a lifted meter did not cancel a pending walk; `s.fight` outlived a map change; a dozen table numbers had no falsifier. Round 2 on the fixes scored 4/5, merge with follow-ups, all taken: the rung bonus pays new ground or reconciliation after a day at the lower rung (its "best rung only" first cut rewarded no reconciliation); the whole squad walking out is named; the end-of-contact order is stated. Knob off: six-seed digests identical to the canonical tip in both rounds. **Codex's integration review (`GTP/G5-REVIEW-FOR-CLAUDE.md`, 2026-09-18) held #10 at 3da0187:** the zero timer was stamped at the end of the interval that emptied the meter, so a 48-hour training block left a merc unquit where two 24-hour blocks walked it (zero reached 192 minutes in, eligible 1440 later, inside either schedule). Fixed as above (the crossing inside the interval; hourly slices for rest drift), with the regression it asked for.
- **Balance.** The headless bot plays one map and never runs the campaign clock, so the benchmark cannot see the meter; what it can see is the death events' stress on the survivors. Forty seeds (1947–1986), knob on, against the canonical tip 6eec4c6: every total identical (38 / 2, 131 shouts answered, 36 guard-on-guard hits, 213 merc friendly-fire hits and 74 retaliations, 139 guards broken, mean squad HP 178 over 11.6 rounds) and no seed changed its result; knob off, twenty runs hash identically. G5 is balance-neutral where the benchmark looks; the benchmark says nothing about the meter or the quit timer. Their evidence is `tests/tactics-happiness.test.mjs`: the nine acceptance checks, and the downtime-chunking regression Codex's review asked for (one 48-hour block, two of 24 and six of 8 give the same happiness, the same zero stamp and the same quit, training and rest alike, and the 24-hour boundary is exact).

Direction 2026-09-16: personalities conflict when mercs with opposing personalities are on the same map tile; every day they spend together their happiness goes down a little, 5 out of 100; if happiness stays at zero for 24 hours the merc quits.

Assumptions taken, each reversible:

- "Map tile" means the same **local map** on the overmap, the unit the squad travels between. Two mercs on different local maps are apart; the same 240×240 map is together, whatever their tile distance.
- "Opposing" means the pair's current rung is **resented or feud** (bond −35 or below). A strained pair does not decay happiness; it only bickers. Since bonds move, a pair can become opposing through friendly fire, or stop being opposing through a good campaign.
- Decay is **per opposing partner**: a merc in two opposing pairs loses 10 a day.

### The rules

- Every merc has **happiness**, 0..100, starting at 100 on recruitment. It is a separate meter from stress (combat, short-term) and fatigue (rest debt). Shown on the character sheet beside them.
- Time is the campaign clock (`world.js`): exploration minutes, one hour per travel, the hours chosen for rest and training. Happiness is settled whenever that clock advances, at **5 per 24 clock hours per opposing partner on the same local map**, pro rata, so eight hours together cost 1.67.
- A merc whose happiness has been **exactly zero for 24 consecutive clock hours** quits at the next safe moment: the end of the current contact, or immediately if the squad is exploring. Quitting is a new roster state, `quit`, alongside captured and dead: the merc keeps its skills and history in the roster snapshot (a quit merc can be re-recruited later at a price), takes its held weapons and pack, and leaves its loot-pile claims.
- The 24-hour timer resets the moment happiness rises above zero. A merc at zero is shown as "about to quit" with the hours remaining, so the player is never surprised.
- The game logs the rung and the cause: "Anya has had enough of Yakov (2 days together, happiness 0)."
- A merc that crossed a map edge and is waiting beyond it (RULES.md, retreat) counts as on its destination map from the moment it crosses, for decay, the separation bonus and "quits at the end of the current contact" alike (it is in no contact while waiting).

### What raises happiness (proposals, so the meter is not a one-way ratchet)

| Source | Change |
| --- | --- |
| A clock day with no opposing partner on this local map (including a merc that has no opposing partner at all) | +5 |
| Instead of the +5: a clock day when the merc HAS opposing partners and every one of them is on a different local map | +10 |
| A contact won with no squad casualty | +5 |
| A bonded or trusted partner present on the same map, per day | +5 / +2 each (see below) |
| Pay day, if a wage or contract system is ever built (ECONOMY.md has none today; proposal only) | +10 |
| A partner's rung crossing upward (strained → cautious, or better) | +5 once |

The separation bonus is the design lever: the player can keep two mercs who hate each other by never fielding them together, at the cost of a thinner squad on each map. That is the "cleaner with mercs" case from recruitment carried into the campaign: the friction is visible, and managing it is play.

### People a merc likes working with

Direction 2026-09-16: there should also be people that mercs like working with, giving a bonus to happiness, and mercs should feel extra upset if that merc is killed.

"Likes working with" is the bonded or trusted rung, the mirror of "opposing". The same rung that governs retaliation and formation governs the meter, so the player reads one relationship, not two.

| Event | Bonded partner (60 and up) | Trusted partner (25 to 59) |
| --- | --- | --- |
| A clock day together on the same local map | +5 | +2 |
| That partner killed | −75 happiness, stress +25 | −35 happiness, stress +15 |
| That partner captured | −20 once, at the moment of capture; +15 once on the rescue (net −5); dies in captivity: a further −55 | −10 once; +5 once on the rescue; dies in captivity: a further −25 |
| That partner quits | −15 | −5 |
| That partner stabilized by this merc | +5 (relief), on top of the bond gain | +3 |

The daily bonus stacks per liked partner and offsets decay from opposing ones, so a merc who hates one squadmate but is bonded to two others gains 5 happiness a day: +10 − 5. Deaths are settled at the moment of death, at the rung in force then, and they ignore the resting level: a feud partner's death gives relief (stress −10) and no happiness change; a cautious partner's death is proposed to affect stress only, with the amount still to be specified.

The grief case is the intended consequence: a merc at or below 75 happiness who loses a bonded partner drops to zero on the spot and, if nothing lifts the meter within 24 clock hours, walks; a merc above 75 keeps the remainder, at most 25. (Direction 2026-09-16: −75 rather than a full wipe.) A separate map from the opposing partner or a casualty-free win is what lifts it. The log names the reason: "Vera has not spoken since Misha died."

If the killer was a squadmate (friendly fire), the survivor's grudge against the killer uses the existing incident ledger at the dead partner's rung as a multiplier: a bonded partner killed by a comrade's burst is the fastest route to a feud in the game.

### Guards

Guards do not quit; they are not on contract. A guard roster's opposing pairs express themselves through the rungs (shouts ignored, flanks not held, feuds when the officer falls), not through a meter.

### Acceptance checks

1. Two mercs at rung cautious on the same map for ten clock days lose nothing.
2. Two mercs at rung resented on the same map lose exactly 5 per 24 clock hours each, pro rata across rest, travel and exploration minutes.
3. A merc at zero for 23 hours who is separated from the opposing partner for one hour recovers above zero and the timer resets.
4. A merc at zero for 24 hours quits at the end of the current contact, never mid-contact, and appears in the roster snapshot as `quit` with skills intact.
5. Happiness never leaves 0..100; the clock rollover at midnight does not double-settle.
6. A guard never has a happiness meter.
7. A bonded partner on the same map adds exactly 5 per 24 clock hours, and offsets an opposing partner to a net zero.
8. A bonded partner's death subtracts 75 happiness and adds 25 stress at once; a feud partner's death costs no happiness and relieves 10 stress.
9. A bonded partner killed by a squadmate's bullet raises the survivor's grudge against that squadmate by the bonded multiplier.

### Decisions from the integration review (resolved 2026-09-16)

The four items the integration review left open, answered so implementation can start. The G3 assignment bullets, the G5 recovery table and the partner tables above are to be read with these.

1. **Assignment.** The four authored mercs keep Codex's hand-written bonds as both their initial and their resting level toward each other; the archetype tag (Yakov Ruler, Anya Rebel, Misha Creator, Vera Caregiver) supplies only the state-machine and merc traits. Every other pair, meaning random recruit to random recruit, random recruit to authored merc, guard to guard, and captive to captor, takes the matrix value as both initial and resting level. One rule: authored beats derived wherever an authored value exists.
2. **Recovery.** The two daily bonuses do not stack; they are one rate with two tiers. A merc with no opposing partner present on its current map gains +5 a day, including a merc with no opposing partners at all. If the merc has at least one opposing partner and every one of them is deployed on a different local map, the rate is +10 instead, because the player paid for the separation with a thinner squad. The liked-partner bonus stacks on top of either tier, and acceptance check 7 holds because the tier bonus never applies while an opposing partner is present.
3. **Capture.** A one-time loss followed by a partial recovery. Capture subtracts 20 (bonded) or 10 (trusted) once, at the moment of capture; nothing further accrues while the partner is held. Rescue adds 15 (bonded) or 5 (trusted) once, so the net after a rescue is −5. If the captive dies in captivity the death penalty applies minus what capture already took: 55 bonded, 25 trusted.
4. **Quantities.** A bonded partner killed by a squadmate's bullet: the survivor's incident ledger against the killer gains grudge at 2× (trusted 1.5×) and the survivor's bond toward the killer drops a further 40 (trusted 20) on top of the ordinary friendly-fire loss. A cautious partner's death adds 10 stress; strained 5; resented 0; feud relieves 10, as already stated.

Shout radii by archetype are in G4. The retreat rule's consequences for G2 (a second, campaign-clock settle for maps the squad has left) and for G5 (a waiting crosser counts as on its destination map) are recorded in those sections.

## Balance record

### G1, 2026-09-16

Seeds 1947–1966, the same bot, against the sight-lobes tip 9c0dac1.

| | Sight lobes | + gunshot alarm |
| --- | --- | --- |
| Won / lost | 15 / 5 | 18 / 2 |
| Stalled or hung | 0 | 0 |
| Mean survivors on a win | 2.53 | 2.78 |
| Mean squad HP on a win | 180 | 186 |
| Mean rounds on a win | 12.5 | 10.6 |

Losses on 1961 and 1963. The alarm made the factory easier for the frontal bot, not harder: each report pulls every guard within the ring off its post toward the shooter's approximate cell, and a set squad with 85 accuracy wins those meeting engagements against 55-accuracy guards arriving one by one. That is the expected consequence of alert guards having no other behaviour than pursuit; G2's hold, search and break behaviours and G3's initiative trait are what would let some guards stay put or take cover instead. Treat this number as a baseline for G2, not as a tuning target.

Per seed:

| Seed | Sight lobes | + alarm |
| --- | --- | --- |
| 1947 | see SIGHT.md | won r14, 2 up, 112 HP |
| 1948 | see SIGHT.md | won r11, 2 up, 193 HP |
| 1949 | see SIGHT.md | won r12, 2 up, 73 HP |
| 1950 | see SIGHT.md | won r7, 4 up, 212 HP |
| 1951 | see SIGHT.md | won r7, 4 up, 301 HP |
| 1952 | see SIGHT.md | won r12, 3 up, 167 HP |
| 1953 | see SIGHT.md | won r9, 3 up, 261 HP |
| 1954 | see SIGHT.md | won r9, 3 up, 180 HP |
| 1955 | see SIGHT.md | won r11, 2 up, 179 HP |
| 1956 | see SIGHT.md | won r9, 3 up, 185 HP |
| 1957 | see SIGHT.md | won r9, 3 up, 213 HP |
| 1958 | see SIGHT.md | won r10, 3 up, 285 HP |
| 1959 | see SIGHT.md | won r16, 2 up, 37 HP |
| 1960 | see SIGHT.md | won r9, 3 up, 225 HP |
| 1961 | see SIGHT.md | lost r14, 1 guards left |
| 1962 | see SIGHT.md | won r13, 3 up, 267 HP |
| 1963 | see SIGHT.md | lost r7, 2 guards left |
| 1964 | see SIGHT.md | won r13, 2 up, 127 HP |
| 1965 | see SIGHT.md | won r10, 3 up, 78 HP |
| 1966 | see SIGHT.md | won r10, 3 up, 252 HP |


## Sources and lineage

The merc side is Codex's `personalities.js` (commits a2a11a9 "Give mercs personalities and ammunition-limited friendly-fire retaliation" and e600265 "Track injury stress and fatigue"). The sight side is SIGHT.md. Nothing here claims biological accuracy; these are stylised people, like the mercs.
