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
Spending and offline production are not implemented.

## Rest and training

On a cleared map, a stationary squad can rest or train for 1, 4 or 8 hours through
the overmap. Rest restores 10% of maximum HP per hour (rounded up for the selected
duration, capped at maximum HP) and refills AP. Training grants 25 XP per hour to
each available troop below level 10; every 100 XP grants a level and three skill
points through the same progression rules as combat. Assign points on the existing
character sheet. Training does not heal. Dead and captured troops receive neither
healing nor XP, and unresolved casualties block downtime. Time jumps affect the
entire campaign and continue factory production.

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
