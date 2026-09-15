# Factory income

Each successful overmap journey pays every liberated factory. Clearing all guards
and resolving casualties changes a local map to `won`, making its factory productive.
The starting factory pays $100 per journey. Each step along the shortest route from
the original starting location adds $100: the outer factory, two steps away, pays
$300. The freight yard earns nothing. Rates do not change when the squad moves.

The overmap shows the treasury, total production, and each location's liberation
status and potential income. Opening the overmap or attempting blocked travel
does not advance production. Returning along an existing route does. Restart and
reload discard the treasury along with the existing session-only campaign.
Spending and offline production are not implemented.

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
