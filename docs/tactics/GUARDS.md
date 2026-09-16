# Guard alertness and personalities — proposal and tracking record

Opened 2026-09-16 on branch `tactics-guard-alertness`, stacked on `tactics-sight-lobes` (SIGHT.md). Direction from the user: guns alert guards at twice their range; guards, like mercs, get different personalities; that needs an alert / at-rest rule set first; twelve personalities, expanding what the friendly-fire reactions began.

## Status

| Stage | Scope | State |
| --- | --- | --- |
| G1 | Gunshot alarm at twice weapon range, for squad and guard shooters | Built on this branch, tests in `tests/tactics-alarm.test.mjs` |
| G2 | Guard alert states: rest, suspicious, alert, searching, stand-down, broken; combat can end without killing everyone; return to post | Planned, awaiting review of this document |
| G3 | Twelve authored guard personalities driving vigilance, nerve, initiative, obedience, barks and stress | Planned |
| G4 | Shouted alarms between guards, guard-to-guard friendly-fire reactions and grudges | Planned |

Same gates as the other arcs: full suite green, 20-seed balance before and after, hostile review of at least 4/5 before the next stage.

## What exists today

- `alert` is a single boolean per guard. It becomes true when the squad identifies the guard, when the guard identifies a squad member, when the guard is attacked, or (G1) when a gun fires within twice its range. It never becomes false. Combat lasts until every alerted guard is dead.
- Non-alert guards do nothing except investigate: a footstep within 10 tiles (3 sneaking) or a peripheral glimpse gives them a `lastHeard` cell on the 6-tile grid and 12 investigation steps toward it, after which they stop where they are. They never return to post.
- Alert guards run one routine: shoot the nearest identified squad member, else reload, else walk toward `lastKnown`, else rotate 45° a turn. No cover use, no retreat, no cooperation.
- Mercs have authored personalities (`personalities.js`): six traits, bonds, quips, stress and fatigue meters, and a friendly-fire reaction that can retaliate. Guards have none of this. Guard names are fixed: Boris, Lev, Grigori, Oleg, Pavel, Igor, Anton, Vadim, Yuri, Sasha, Pyotr, Nikolai, in map order.

## G1: the gunshot alarm (built)

A firearm discharge (anything with a magazine: pistol, rifle, AK, grenade, launcher, RPG, flamethrower) alerts every non-alert guard within **twice the weapon's range**, whoever fired it. Alerted listeners get `lastKnown` set to the shooter's approximate position on the 6-tile grid, so they converge on the report rather than on the exact tile. Guards already alert keep their existing fix. Beyond that ring the old 30-tile suspicion still applies to squad shooters.

| Weapon | Range | Alarm radius |
| --- | --- | --- |
| TT-33 pistol | 8 | 16 |
| AK-47 | 10 | 20 |
| Mosin-Nagant | 14 | 28 |
| Grenade (thrown) | 10 | 20 |
| Grenade launcher | 22 | 44 |
| RPG | 40 | 80 |
| Flamethrower | 3 | 6 |
| Knife, fists | 1 | none |

Open question for the reviewer: a thrown grenade has no muzzle report, only a blast; if the blast should carry further than 20 tiles, give explosives their own noise term in `detonate` rather than the weapon's range.

## G2: alert states

One state per guard, replacing the boolean. Transitions are the rules; personality parameters (G3) scale the numbers.

| State | What the guard does | Leaves when |
| --- | --- | --- |
| **Rest** | Holds post facing its assigned heading. Sight lobe and hearing as today. | Footstep or glimpse → Suspicious. Identification, being attacked, gunshot within alarm radius, or a shout → Alert. |
| **Suspicious** | Walks toward the `lastHeard` cell for up to *N* steps, then sweeps: two 90° turns on the spot. | Anything Alert-worthy → Alert. Steps exhausted → Stand-down. |
| **Alert** | Today's combat routine, plus a shout (G4). Tracks the freshest of: identified target, colleague's shout, gunshot report. | No squad member identified by this guard for *K* consecutive rounds → Searching. Nerve broken → Broken. |
| **Searching** | Goes to `lastKnown`, sweeps, then checks the neighbouring 6-tile cells for *M* rounds. | Identification → Alert. Rounds exhausted → Stand-down. |
| **Stand-down** | Walks back to post. Vigilance raised for the rest of the map (wary: suspicion radius +50%, longer investigation). | Arrives → Rest (wary). Any trigger → the corresponding state. |
| **Broken** | Moves away from the last threat toward the nearest ally or post, does not fire unless cornered. | *R* rounds unshot → Alert if a target is known, else Stand-down. |

Proposed defaults, before personality scaling: N = 12, K = 3, M = 4, R = 2, shout radius 12 (officers 20).

**Combat can end.** Contact is any guard in Alert or Searching. When none remain, the phase returns to real-time exploration even with guards alive: "Area quiet." Bleeding and burning still hold combat open as today. This is the "at rest" the user asked for, and it makes stealth and disengagement real options instead of a fight to the last guard.

**Posts.** A guard's start tile and heading are its post. Patrol routes are a later addition; the state machine does not depend on them.

**Acceptance properties.** A guard cannot skip from Rest to Searching. Stand-down always ends at the post or in a higher state, never stalled. A wall blocks every sight-based transition and none of the sound-based ones. Combat ends within K+M rounds of the last identification if nobody fires. The existing bot cannot exploit "Area quiet" by standing still next to an alerted guard.

## G3: twelve personalities

Same authored-person approach as the mercs, with the six existing traits (aggression, pride, discipline, forgiveness, loyalty, humor) plus four guard-specific ones that the state machine reads:

- **vigilance** scales the suspicion radius, glimpse-to-suspicion chance and N. Dozy guards ignore small noises; jumpy ones investigate everything.
- **nerve** sets the break point: HP fraction and allies-lost count at which Alert becomes Broken. Zealots never break.
- **initiative** decides whether a guard leaves post to pursue or holds and lets the fight come to it; also the Searching radius.
- **obedience** gates response to shouts and rallies: high follows the officer's fix, low keeps its own.

Stress and fatigue reuse the merc meters: being shot raises stress, a kill relieves it, high stress lowers accuracy and nerve.

| # | Name | Species and weapon at the factory | Archetype | Vigilance | Nerve | Initiative | Obedience | Voice |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Boris | pig-foreman, pistol | The shift sergeant. Twenty years on the gate. Holds post, rallies the others, counts them like tools. | 70 | 80 | 40 | 60 | "Positions. Nobody improvises." |
| 2 | Lev | cow, rifle | The conscript. Three weeks in, jumps at pallets. Investigates everything, breaks early. | 90 | 25 | 50 | 85 | "Did you hear that? I heard that." |
| 3 | Grigori | pig-foreman, pistol | The brute. Pursues at a run, ignores cover, holds grudges against anyone who shoots near him. | 50 | 75 | 95 | 30 | "Come out. It goes worse if I have to look." |
| 4 | Oleg | donkey, knife | The dozer. Half asleep at rest, slow to notice, then stubborn as a gate. Knife because he lost the pistol. | 20 | 70 | 30 | 50 | "...what. What is it." |
| 5 | Pavel | pig-foreman, flamethrower | By the book. Never leaves post unless ordered, follows Boris exactly, reads the manual aloud. | 60 | 60 | 15 | 100 | "Procedure eleven. I am applying procedure eleven." |
| 6 | Igor | goat, pistol | The coward. Hides at the first shot, runs at half health, would surrender if the game allowed it. | 65 | 10 | 20 | 40 | "I only work here. I am not paid for this part." |
| 7 | Anton | cow, rifle | The curious one. Investigates furthest and longest, narrates his own patrol, forgets to be afraid. | 80 | 50 | 70 | 45 | "Interesting. That crate was not there this morning." |
| 8 | Vadim | pig-foreman, pistol | The hunter. Patient, holds cover, waits for the shot. The first guard to use overwatch when guards get it. | 75 | 65 | 35 | 35 | "Take your time. I have all of mine." |
| 9 | Yuri | pig-foreman, pistol | The comrade. Rushes to whoever is shot or shouting. High loyalty, the strongest bonds in the roster. | 55 | 60 | 80 | 70 | "Hold on, I am coming, do not do anything clever." |
| 10 | Sasha | donkey, knife | The zealot. Believes the posters. Charges, never retreats, never breaks. | 60 | 100 | 100 | 90 | "The Directorate sees you. I am its eyes today." |
| 11 | Pyotr | cow, rifle | The drinker. Accuracy down, hearing down, turns to random headings, sings. Loud, so his shots carry further. | 30 | 45 | 40 | 20 | "Which way is the noise. Both. Fine." |
| 12 | Nikolai | pig-foreman, AK-47 | The careerist officer. Stays back, shouts the alarm furthest, takes the credit, is first to stand down when it turns. | 65 | 35 | 25 | 10 | "Report. Someone report so I can report it." |

Each entry ships with background, motivation and temperament lines in the merc format, two barks per state that a bark is worth (contact, investigating, breaking, standing down), and a bond table among the twelve (Boris trusts Pavel and Yuri, resents Nikolai; Grigori and Igor despise each other; Lev looks to Boris; Pyotr is nobody's favourite). Barks use the same log channel as merc dialogue and the same social RNG stream, so they never consume ballistic randomness.

Where names repeat on generated 46-guard maps, the thirteenth guard onward draws a personality by seed from the same twelve, with the name suffixed as today.

## G4: shouts and guard-on-guard incidents

- An Alert guard shouts once on entering the state: guards within the shout radius that pass their obedience check take the shouter's `lastKnown` and go Alert; the rest go Suspicious toward the shouter. Nikolai's shout carries 20; Igor's is a whisper.
- Bullets already hit the first body on the ray regardless of team, so guards can shoot guards. Reuse `friendlyReaction`: stress, bond loss, grudge, a bark, and the same retaliation chance. Grigori shooting back at Pyotr in the middle of a firefight is the intended kind of chaos, bounded by the existing "ammunition-limited retaliation" rule.
- A guard whose bonded colleague is killed gains stress and, if nerve is low, can break on the spot.

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
