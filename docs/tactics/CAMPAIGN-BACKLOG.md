# Campaign economy backlog: to decide and to build

Opened 2026-09-19 from the boss's economy direction (ECONOMY.md, "Towns, factories and social
services"). Each item names what the tree has at 1c14d9b, what still has to be decided before
it can be built, and what building it means. Nothing here is built. Update this file when an
item is decided or shipped; a conversation answer is not evidence that a feature exists.

| # | Item | Decided | Built | Depends on |
| --- | --- | --- | --- | --- |
| 1 | Starting cash and the tutorial bonus | partly (the numbers) | no | 2 |
| 2 | The tutorial | no | no | 3, 12 |
| 3 | Towns on the overmap | no | no | — |
| 4 | Investing in a building (the workshop) | partly (the numbers) | no | 3 |
| 5 | Upkeep on the clock | no | no | 3 |
| 6 | Social services and welfare | no | no | 3, 5 |
| 7 | Holding and losing a town | no | no | 3, 6, 8 |
| 8 | Security: garrisons and what stays behind | no | no | 3, 7 |
| 9 | The three factories and the factory rate | partly (three, big) | no | 3 |
| 10 | Repair equipment and weapon condition | no | no | 4 |
| 11 | Welfare and the endings | no | no | 6, STORY.md |
| 12 | Campaign persistence across reload | no | no | — |
| 13 | Campaign continuation after a wipe | no (STORY.md q3) | no | 12 |

## 1. Starting cash and the tutorial bonus

Direction: $20,000 at the start; a small cash bonus for finishing the tutorial.

Tree: `createWorld` in `world.js` starts the treasury at $0. A campaign's only income is factory
production; its only sink is the hiring hall. There is nothing to finish and nothing to pay a
bonus for.

To decide: the size of the bonus and what "finishing" is (the last tutorial map won, or a
checklist of lessons); whether $20,000 is the same on every difficulty; whether the bonus is
cash alone or comes with the first pointer to the three factories (item 9).

To build: the starting figure (one number); a tutorial-complete event that pays once and is
recorded on the world so a reload (item 12) does not pay it again.

## 2. The tutorial

Direction: it does not exist yet; it is expected to take about a week of in-game time.

Tree: the authored factory map (36 guards, four comrades) is the opening. The clock runs one
game minute per real second, an hour on the road, rest blocks of 1/4/8/24/48 hours; a week of
game time is therefore almost all downtime and travel, paced by the player's rest and travel
choices, not by fights. Restart and reload discard the campaign, so a week-long tutorial cannot
be left and resumed today (item 12).

To decide: what the week teaches and in what order (movement, sight and stealth, a first fight,
a rest, a cheap day-contract hire, a comparison with a discounted week contract, the workshop
investment, travel to a second map); whether that lesson needs an authored $100 candidate
(the daily slate does not guarantee that exact price); whether the proposed week-contract
"trap" means paying up front for a poor fit, since the weekly rate itself is discounted; whether the week is a
floor (the bonus waits for day 7) or an estimate; whether the tutorial town is the first of the
campaign's towns or a separate opening; what happens if the squad wipes during it (item 13).

To build: the tutorial town's map(s) and their guard rosters; the lesson prompts; the completion
event (item 1).

## 3. Towns on the overmap

Direction: the opening town; after the tutorial, three larger factories nearby.

Tree: location types are `factory` and `yard` (`world.locations`); the overmap is three tiles in
a row (factory, yard, outer factory) with income scaling by shortest route from the start. A
map's liberation (`phase==='won'`) is permanent. The overmap screen shows treasury, production
and each tile's status.

To decide: what a town is as a location type and what is on its tile (the map the player fights
on, the buildings that can be invested in, the services it carries); the campaign's first shape
(one town, three factories, the yard: where each sits and how far); whether a town has a map to
clear at all or is taken by holding its factory; what the overmap card shows for a town
(services, upkeep, the investments, the hold).

To build: the `town` location type with its own record on the world (investments, services,
hold state); the overmap card; the first authored layout.

## 4. Investing in a building (the workshop)

Direction: the opening town's small workshop, a little garage; invest $500 and it generates
$300 every three days for as long as you hold the town; it unlocks repair equipment.

Tree: no purchase or upgrade on a location exists. Income is per location per hour in
`factoryIncome`; there is no three-day cadence, only a continuous rate with a fractional
remainder. `advanceTime` is the one place income lands.

To decide: whether the payout is a lump every three days (a visible event, "The garage paid
$300") or the equivalent $100 a day continuous rate that the existing calculation already
handles; whether the workshop is one instance of a general building-investment mechanic (other
towns, other buildings, other prices) or a one-off; whether an investment survives losing and
retaking the town (item 7); what the garage's repair unlock means once item 10 exists.

To build: an investment action on the overmap card gated by treasury and hold; the payout,
either as an event on the clock or as a term in `incomePerHour`; the log line and the treasury
display; the unlock flag the repair item (10) reads.

## 5. Upkeep on the clock

Direction: taking over a town also takes over its social services; with the factories come other
expenses.

Tree: nothing drains the treasury as time passes. Contracts are paid up front; there is no daily
wage (ECONOMY.md "Not built"). ECONOMY.md holds up the single elapsed-time calculation as a
principle: every interval, in play, travel, rest and training, uses `advanceTime`. Upkeep belongs
there, so a town's services cost the same whether the squad fights, sleeps or walks.

To decide: whether upkeep is continuous (a negative rate) or periodic (a bill on a cadence, like
the workshop's payout); what happens when the treasury cannot pay (services lapse, item 6; debt;
a floor at $0); whether upkeep is shown on the overmap as net production.

To build: a negative term in the per-hour calculation or a scheduled bill, with a shortfall rule;
the "+$N / hour" summary becoming a net figure; tests that a week of rest and a week of play cost
the same.

## 6. Social services and welfare

Direction: the player balances security needs against the social welfare of the people being
liberated.

Tree: nothing. STORY.md's direction already has pacification infrastructure overlapping with
public services, disabling a coercive installation interrupting useful work, and "protection or
restoration of essential services" as a requirement of the self-government ending.

To decide: what the services are (candidates: clinics and hospitals, since hospital and lab props
are already in the maps; food; power and water; schools) and whether each is a line item or
welfare is one figure; who sets the bill (STORY.md insists local people do not receive
sovereignty from gunmen, so a town's own institutions presenting a bill the player funds or
refuses keeps that intact, where a slider the mercs set from the overmap would not); how welfare
is shown (a town meter, a report at the bill, lines in the log); what neglect does in the short
term (services lapse, production falls, the town stops holding for you: item 7) and the long term
(item 11).

To build: a services record per town; the bill or rate (item 5); the welfare state and its
display; the consequences.

## 7. Holding and losing a town

Direction: the workshop pays "as long as you hold the town".

Tree: a won map stays won. No guard returns, nothing is retaken, and a town cannot be lost.
A map left mid-fight keeps its guards' alert and fix and settles by the clock on return; that
is the only sense in which a map changes while the squad is away.

To decide: what "hold" means and how a town is lost. Proposal: the two ways fall out of the
direction itself, too little security and it is retaken (a counter-attack the player must
answer, or a garrison that loses), too little welfare and the people stop holding it for you.
Whether losing a town is a fight on the town's map (the squad returns to guards) or an overmap
event; whether investments (item 4) and services (item 6) survive a loss and a retaking; what a
lost town costs beyond its income.

To build: the hold state on the town record; the loss triggers and their timers on the clock;
the retaking; the overmap warning before it happens.

## 8. Security: garrisons and what stays behind

Direction: "balance security needs" against welfare.

Tree: travel gathers every standing member within two tiles of the marker and takes them all;
only casualties are left behind, and those are captured or die (`abandonCasualties`). There is
no way to leave a healthy merc on a map, so there is no garrison. Security spending today is
the hiring hall alone.

To decide: whether security is a garrison (mercs left on the town, off the squad, paid by their
contracts) or a purchase (a town guard the player funds as a service, item 5), or both; what a
garrison does when the town is attacked (item 7): fights automatically, holds by the numbers, or
calls the squad back; how a garrisoned merc's contract, meter (GUARDS.md G5) and bonds behave
while it is away from the squad.

To build: a leave-behind action on a held town; the town's security figure; its role in the
loss rule.

## 9. The three factories and the factory rate

Direction: after the tutorial the player is pointed to three larger factories nearby; they are
the campaign's big money makers.

Tree: a liberated factory pays $100 an hour plus $100 per step from the start, forever. Beside
the workshop's $100 a day that is 24x per interval, which is right if factories are the prize
and towns the trickle, and wrong if the two are meant to sit on one scale. During a week-long
tutorial a $100-an-hour factory would pay $16,800 and swamp both the bonus and the workshop.

To decide: whether the factory rate stays, comes down toward the town scale, or is set per
factory by authoring; whether "larger" means a bigger map (more guards, more sectors) or a bigger
payout or both; whether factories carry upkeep of their own (their workers are people too:
item 6) or only towns do; how the player is "pointed" (the overmap reveals them at tutorial's
end; a message; a sponsor's brief per STORY.md).

To build: the three authored factory maps and their overmap placement; the reveal at tutorial's
end; the rate.

## 10. Repair equipment and weapon condition

Direction: the workshop unlocks repair equipment.

Tree: weapons have no condition; nothing wears, jams or breaks. REVIEW.md's open question 5
asked whether weapons should be limited by loadouts, scarce ammunition, loot and repairs; ammo
scarcity and loot were built, repairs were not. Inventory is a spatial 6x3 backpack with two
ready slots; a repair kit would be an item like a medkit.

To decide: what wears (a condition per weapon that falls with shots fired, or with hits taken; a
jam chance at low condition; a break) and whether armour or tools wear too; whether repair is an
action in the field with a kit (AP, like stabilizing) or only at the workshop between fights;
what "unlocks" means: the kit appears in loot and the hall, or repair becomes possible at all.

To build: condition on weapon records and its effect on fire; the repair kit item and action;
the workshop's role; the sheet and card showing condition.

## 11. Welfare and the endings

Direction: implicit in "the social welfare of the people you are liberating"; STORY.md's four
endings.

Tree: no ending exists. STORY.md proposes regime continuity, corporate victory, failed
liberation and self-government, with self-government requiring essential services protected or
restored, a local coalition, independent supplies and no successor monopoly. Nothing in code
tracks any of it.

To decide: how welfare accrues toward an ending. Proposal: neglected services should count
toward failed liberation and regime continuity, not only cost money, or players will treat
welfare as a cost to minimise; whether the accrual is visible (a campaign objective with a
figure) or only reported at the end (STORY.md asks for visible objectives, several ways to
satisfy them, not opaque flags).

To build: a campaign ledger the endings read; the objective display.

## 12. Campaign persistence across reload

Direction: none, but a week-long tutorial and a campaign of held towns require it.

Tree: restart and reload discard the clock, the treasury and every map. The only stored state is
the playtest map in session storage. ECONOMY.md and STORY.md both list persistence as
unimplemented.

To decide: what is saved (the world record, every map state, the roster and its ledgers, the
towns) and when (every clock advance, on leaving a map, on demand); whether offline production
(ECONOMY.md: not implemented) accrues while the tab is closed, which the direction's three-day
payout makes a live question.

To build: serialise and restore the world; a save slot; the version stamp a later schema change
needs.

## 13. Campaign continuation after a wipe

Direction: none new; STORY.md's decision 3.

Tree: a wipe records captured and dead comrades on the defeated map's state and stops the clock.
The hiring hall cannot hire on a lost map. Captured mercs keep identity, skills and history for
the planned rescue facility.

To decide: reserve mercenaries, new recruits from the hall at a held town, or another
established team; what a wipe costs the held towns (item 7).

To build: the continuation path; hiring from a held town after a wipe.
