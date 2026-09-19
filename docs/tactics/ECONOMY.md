# Factory income

The campaign clock starts at Day 1, 08:00. One real second advances one game minute
during visible play, including combat and the overmap. Hidden tabs and the field
manual pause the clock without catch-up; defeat stops it. Travel takes one hour.
Rejected travel does not advance the clock.

Clearing all guards and resolving casualties changes a local map to `won`, making
its factory productive. The starting factory pays $100 per game hour. Each step
along the shortest route from the original starting location adds $100 per hour:
the outer factory, two steps away, pays $300 per hour. The freight yard earns
nothing. Rates do not change when the squad moves. Fractional dollars accumulate
between updates, so frame rate does not affect earnings.

The overmap shows the treasury, total production, and each location's liberation
status and potential income. Production continues during play, travel, rest and
training using the same elapsed-time calculation. Restart and reload discard the
clock and treasury along with the existing session-only campaign.
Offline production is not implemented. The treasury's first sink is the hiring hall below.

## Rest and training

On a cleared map, a stationary squad can rest or train for 1, 4, 8, 24 or 48 hours
through the overmap. Ordinary rest restores 1/48 of maximum HP per hour and refills
AP. Fractional HP carries between rests so repeated short rests do not accelerate
recovery. Full recovery from near-zero HP takes about two days.

Medical care lets the player choose a living medic with Medical 25 or higher. It
uses one pooled squad medkit per wounded troop to begin a 24-hour assisted-rest
course, restoring 1/24 maximum HP per rest hour (about one day for full recovery).
Unfinished treatment continues through later ordinary or medical rests without
another kit. Healthy troops use no supplies; insufficient supplies reject the
whole treatment before time or supplies are spent. Treatment hours are resting
hours; travel and training do not heal or consume the remaining course.

Training grants 25 XP per hour to
each available troop below level 10; every 100 XP grants a level and three skill
points through the same progression rules as combat. Assign points on the existing
character sheet. Training does not heal. Dead and captured troops receive neither
healing nor XP, and unresolved casualties block downtime. Time jumps affect the
entire campaign and continue factory production.

## Mercenary contracts — 2026-09-18

Direction (the boss, 2026-09-18): a hiring screen with a cropped sprite portrait, the merc's stats, its personality type and the types it does and does not work well with, the equipment it comes with, and its price by the day, the week and the month; rates from $100 a day to $10,000 a day, a week costing about five days and a month about twelve; the $100 merc next to useless, the $10,000 merc able to clear a map alone.

Built on branch `tactics-hiring`, stacked on G5 (PR #10): module `dist/tactics/recruits.js` (pure: candidates, the rate and kit ladders, compatibility, the portrait crop, contract arithmetic), `world.js` (the hall: `candidates`, `hire`, `renew`, `release`, `settleContracts`, `enlist`), the engine's stable unit ids, and the **Mercenaries** screen in `app.js`. Tests: `tests/tactics-hiring.test.mjs` (20 cases).

**The hall.** Open **Mercenaries** from the header or the overmap. Hiring is gated like rest: a cleared map, no queued movement, nobody waiting beyond an edge, no unresolved casualty (`hiringReason`). Each campaign day offers six candidates (`slate`): slot *i* draws its grade inside [*i*/6, (*i*+1)/6), so every day has a cheap hand and a dear one; name, species (horse, goat, donkey, sheep, cow, hen, skunk) and archetype are hashes of the campaign's roster seed, the day and the slot, never an RNG stream, so a campaign reproduces its slates and nothing here moves a bullet or a social roll. Names are unique on the slate and against the roster (a taken name walks forward through the pool of 36; none is a comrade's or a guard's). A signed candidate leaves the slate, and signing one never renames another card that day (today's own hires are left out of the roster names the walk avoids); when the pool has run dry (every name once on the roster stays taken, the ledger being keyed by name) a name takes a numeral, Marina II. The slate turns over at midnight and only the day's signed keys are kept. The roster holds eight on contract.

**The rate.** A candidate's grade *g* (0..1) sets its daily rate at $100 × 100^*g*, on a clean figure (tens under a thousand, hundreds under ten thousand): $100 at 0, $1,000 at ½, $10,000 at 1. A week is 5 + *c* days' rate and a month 12 + 2*c*, where *c* is the archetype's commitment: −½ for the types that want to belong or to keep order (Ruler, Innocent, Everyman, Caregiver, Lover), +½ for the free spirits (Explorer, Rebel, Jester, Magician), 0 otherwise. So a week runs 4.5 to 5.5 days' rate and a month 11 to 13. A candidate whose predicted footing with any comrade on the roster is opposing (resented or feud at the matrix's resting level) asks 20 % more, and the card and the log say with whom.

**What the rate buys**, monotonically in the grade:

| | Grade 0 ($100) | Grade 1 ($10,000) | The comrades |
| --- | --- | --- | --- |
| Base health / AP / accuracy | 60 / 9 / 55 | 160 / 16 / 115 | 100 / 12 / 85 (between grades .40 and .45: $630–$790 a day) |
| Base medical / stealth | 0 / 10 | 60 / 60 | 0–100 / 20 |
| Level, points spent | 1, none | 10, 27 by the archetype's profile (a Hero: shooting 14, vitality 9, mobility 4) | 1 |
| Kit | a knife and the clothes they stand in | sniper rifle (15 reserve), AK-47 (90), three grenades, 3 medkits, cutters | per comrade |

The kit ladder: knife; pistol and knife with 8 rounds and a medkit from grade .15; rifle and pistol, cutters from .35; AK-47 and pistol with 60 rounds and 2 medkits from .55; sniper rifle and AK-47 from .75; grenades and 3 medkits from .9. Species traits stack on the base as they do for the comrades (`recalculate` reads `u.base`; a unit without one keeps the comrades' numbers, so nothing changes for them). A recruit's later levels and points work as today.

**The card** shows the portrait (the head and shoulders of the standing sprite: a 128-pixel square centred on the figure's axis at the top of its content box, `portraitCrop`), the numbers a hire would have, the training ranks, the species line, the archetype in one line (wants, fears, speaks) and its pitch in register, **works well with** (the types liked both ways at the resting level of the matrix) and **does not work with** (opposing either way), the predicted footing with each comrade on the roster as labels (would get on with Vera; would take time with Yakov; would grate on Misha; would clash with Anya: the lower of the two directions decides), the kit, and the three prices.

**A hire** is paid from the treasury up front, arrives beside the selected comrade on free ground (`enlist`: the same landing search as travel), carries a campaign id from 1000 (`world.nextId`; ids are stable across maps and the engine now looks units up by id, `unit(s,id)`, so a fifth merc and a map's guard number 4 no longer collide), keeps the archetype's ledger: its bonds toward every comrade and theirs toward it at the matrix's resting level, happiness 100 under the campaign knob, the archetype's hit lines for friendly fire, its sheet from the archetype. The desk's cards and the 1–9 keys follow roster order, not the id.

**Contracts** run on the campaign clock (`u.contract`: term, from, until, paid, renewals). Every clock advance settles them: a contract past its minute is up ("X's contract is up."), and the merc walks at the next quiet moment: at once on a calm map, otherwise when the contact ends, through the G5 quit path with its own line ("X's contract has ended: X has left the squad."), taking what it carries; a liked partner's departure costs the meter as a quit does. Renew from the hall while the map is quiet: renewal extends from the contract's end, so renewing early loses nothing, and pay day lifts the meter by 10 (the row GUARDS.md G5 left as a proposal). Pay a merc off and it leaves now, nothing refunded. The four comrades are never on contract: they stay for the cause. A merc whose contract runs out in a fight keeps fighting until the map is quiet, and can be renewed meanwhile (renewal is the one contract action allowed mid-fight, from the minute it is renewed; paying off waits for the quiet, since the merc leaves at once). A contract walk that empties the map is the defeat the G5 walk-out is ("The squad has walked out."). A contractor that has gone stays in the map's unit list as a record, summarised on one line of the hall and off the desk and the inventory tabs.

**Balance** (headless bot, factory map, seeds 1947–1966, campaign knob on; `tools/tactics-balance.mjs --roster`):

| Roster | Wins / losses | Reading |
| --- | --- | --- |
| The four comrades (control) | 18 / 2 | Unchanged: knob off and on, twenty seeds hash-identical to the G5 tip ed88234. |
| The comrades and a $100 hand | 20 / 0 | The hand arms itself from the start piles (11.6 scavenges a run against the control's 10.1) and draws fire; within the dice of the control. |
| A $100 hand alone | 0 / 20 | Dead by round 6 on average, gun or no gun. |
| A $10,000 veteran alone | 17 / 20 | Clears the map with 86–215 HP left; the three losses are the bot walking into the flamethrower guard. |

The ends of the ladder do what the brief says at the bot's skill; a human should do better with the veteran and no better with the hand. Levers: `BASE_LOW`/`BASE_HIGH`, the kit thresholds, `SURCHARGE`, `COMMITMENT`, `ROSTER_MAX`, `SLATE`.

**Hostile review 2026-09-18** (one reviewer per round with probes and a mutation sandbox, then three independent refuters per finding; every finding below was upheld by all three unless noted; recorded in the commit messages). Round 1 on 260318e scored 3/5: signing one candidate renamed another card the same day (the slate re-walked every slot past a roster that now held the signed name; 102 of 300 day-0 slates walk a name), the 36-name pool ran dry after some thirty hires and offered a name still on contract (the ledger is keyed by name), the last body walking out on a calm map left the map won with no squad, the card promised a renewal no path allowed, a 20 / 20 typo, the 1–4 labels, thirteen of 41 mutants surviving on numbers asserted against their own constants, and gone contractors keeping a card and an inventory tab for ever; fixed in 45098bd. Round 2 on 45098bd scored 3/5: the one major was the fix that became the next defect: making renewal legal mid-fight made the engine's own end-of-contact walk reachable, and it walked the last body after the defeat check (a won map with nobody on it, nothing actionable); the re-entry after each of the three contact ends now declares the walk-out defeat. Its minors: a merc that walked inside a rest was healed and trained after leaving (contracts now settle after the block), a recruit's ledger named the dead and the gone, no thanks line for a recruit's medic, six vacuous assertions (the hire's landing beside the selected comrade, the arrival fallback, xp and cutters, one-sided trouble, the comrades' spawn record), and one finding refuted 0/3 (the hall is modal, so the movement queue it ignores is frozen while it is open); fixed in 3657a70, the neutral-knob instrument widened to whole unit records. A third round was started on 3657a70 and stopped when the boss sent the branch to the architect. Reviewer probes that found no defect are worth keeping: expiry while downed (the map stays in turn mode, the walk waits), expiry while waiting beyond an edge (the crossing is cleared), a hire at 23:59, a fractional clock, stale ids, money to the dollar, a lost map (nothing settles; the retreat's arrival walks a contract that ended on the road), 400 days of daily hiring (404 records, every name unique, the longest "Lyudmila VIII"), and the balance table reproducing to the run.

**Not built.** A daily wage drawn from the treasury (contracts are paid up front); re-recruiting a merc that quit; hiring on a lost map (campaign continuation after a wipe is STORY.md's open question 3); the rescue facility; bond events beyond the matrix at signing. Deliberate, noted by the review: the surcharge is frozen into the signed rate (a merc keeps its price whoever leaves the roster later); a contract that runs out inside a rest or training block is healed or trained for the block (it did the hours) and walks at the block's end; a contract that runs out during the hour on the road walks on arrival (renew before travelling: the card shows the hours left); when a contract's end and the meter's day at zero land in the same clock advance the meter's walk is the one recorded (a test-only case: the app's ticks are a frame apart); gone contractors stay on the map's unit list as records (a world-level ledger is the follow-up if a long campaign makes the list heavy). A recruit's ledger names only the members on contract when it signs.

# Towns, factories and social services — direction 2026-09-19

Direction (the boss, 2026-09-19, in three instalments; recorded as given, nothing below it is built):

- The game opens with $20,000 cash and a small cash bonus when the tutorial is finished. The tutorial does not exist yet; it is expected to take about a week of in-game time.
- The opening town has a small workshop, a little garage. It unlocks repair equipment, and investing $500 in it makes it generate $300 every three days for as long as you hold the town.
- After the tutorial the player is pointed to three larger factories nearby. Those are the campaign's big money makers.
- With them come other expenses: taking over a town also takes over its social services, so the player balances security needs against the social welfare of the people being liberated.

**Against the tree** (1c14d9b). The treasury starts at $0; a liberated factory pays $100 an hour, $2,400 a day, forever; the overmap is three tiles (the starting factory, the freight yard, the outer factory) with income scaling by distance from the start. Contracts are prepaid and nothing drains the treasury on the clock: `advanceTime` in `world.js` is the one place income lands, and the doc above holds that up as a principle, so upkeep belongs in the same calculation. There is no town location type (`factory` and `yard` only), no purchase or investment on a location, no way to lose a won map (liberation is permanent), no weapon condition or repair anywhere (REVIEW.md's open question 5, never built), no tutorial, no social services and no welfare ledger. The hiring ladder runs $100 to $10,000 a day with comrade-grade help at $630–790, so $20,000 is a war chest: a month of one comrade-grade merc, or two days of the $10,000 veteran, not a wage fund.

**What the numbers say.** The workshop averages $100 a day. With discrete $300 payouts every three days after investment, it recovers the $500 at the second payout, six elapsed days after investment; continuous accrual would instead break even after five days. If invested in at the start of a seven-day tutorial and held throughout, it pays twice ($600) before the bonus lands, so the lesson it teaches is that investing early and holding pays, in a sum small enough that the bankroll stays the real budget. A $100-an-hour factory during the same week would hand over $16,800 and swamp both, so either factories come after the tutorial (as the direction has it) or the rate comes down toward the town scale. On the current clock (one game minute a real second, an hour on the road, rest blocks to 48 hours) a week of game time is almost all downtime and travel, so the tutorial's length is paced by rest and travel choices, not by fights.

**Where it meets STORY.md.** The self-government ending requires protection or restoration of essential services, and the pacification note has coercive installations overlapping with public services. This direction turns those into a ledger. Proposals, not decisions: neglected services should accrue toward the failed-liberation ending, not only cost money, or players will treat welfare as a cost; the two ways to lose a town fall out naturally (too little security and it is retaken, too little welfare and the people stop holding it for you) and would answer what "as long as you hold the town" means; and since STORY.md insists local people do not receive sovereignty from gunmen, a welfare bill the town's own institutions present, which the player funds or refuses, keeps that intact where a slider the mercs set from the overmap would not.

**Decisions to make before building** (each expanded in CAMPAIGN-BACKLOG.md with what the tree has, what to decide and what to build)**.** What a town is on the overmap and how the tutorial town, the three factories and the yard sit on it; whether the factory rate stays at $100 an hour or scales to the town's $100 a day; what "holding" a town means and how one is lost; whether repair equipment implies weapon condition, and what wears; what the tutorial teaches (a cheap day contract and the commitment-versus-discount tradeoff of a week contract; an exact $100 candidate would need authoring, and the proposed "trap" needs definition because weekly rates are discounted) and when the bonus pays; and how social services are costed and by whom the bill is set.

# Sprite integration

The builder groups environment props into factory, lab/medical, hospital,
containers and field supplies. Props use explicit occupancy, cover and sight rules
in `environment.js`; art crops and edge anchors are in `prop-art.js`. Regenerate
the latter with `tools/catalog-environment.py` (Pillow required).

Hospital and lab furniture appear in generated maps. The starting map includes a
bed, IV stand, medicine cabinet, toolbox and spare parts. Jail barriers block
movement but allow sight; cut fence artwork represents an open crossing. Open and
closed containers and loose field supplies are scenery, without new loot or
treatment interactions. Medkits and wire cutters also appear in the inventory UI.

Guard outfit selection supports Worker and Red Hats, preserving the choice through
map/block export and playtest. Generated guards wear Red Hats. Missing outfit frames
(some unarmed stances and species) use the existing worker art.
