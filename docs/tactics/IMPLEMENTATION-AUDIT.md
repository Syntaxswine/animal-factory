# Conversation implementation audit — 2026-09-16

This audit separates implemented requests from remaining work and suggestions. It covers the gameplay discussion in this thread; it does not assume work in other agents’ branches is already canonical.

## Corrected in this update

- All requested ranges: unarmed/knife 1, flamethrower 10, pistol/shotgun 12, SMG 20, AK-47/rifle 24, heavy machine gun 28, grenade launcher 22 effective, sniper 36, RPG 40 effective.
- Diagonal melee adjacency with walls and solid corners still blocking attacks.
- Playable shotgun, sniper rifle, SMG and heavy machine gun, finished character sprites, equipment icons, finite ammunition, inventory, supply pickups and editor support.
- Accuracy scaled to weapon range, poor pistol accuracy, six physical shotgun pellets per shell, sniper 8-AP shots and flamethrower damage falloff (180 through 3 tiles; 45 at 10).

## Verified existing requests

- Head / weapon / torso / legs aim, torso default, stance and cover hiding individual regions.
- Physical bullet and explosive scatter, friendly fire, explosive wall and prop destruction.
- Launcher and RPG firing beyond effective range with heavy scatter; height advantage extends grenade/launcher reach.
- Flamethrower tank detonation: 25% torso and 90% held-weapon hits, fatal wearer and adjacent blast, five-tile fire and three-turn panic.
- Authored merc personalities, relationship history, zero-AP retaliatory shots consuming ammunition, and chains of reactions.
- Stress and fatigue meters: injuries increase both, kills reduce stress, rest reduces both.

## Remaining work — not represented as completed

- **Sight overlay:** the displayed sight shapes still show theoretical range through walls. Exact obstacle-clipped visibility polygons remain planned. Actual detection and shooting do obey obstacles.
- **Structural destruction:** explosives breach wall edges and remove props, but floor slabs remain intact. Structural roof/floor collapse and destruction of decorative background industrial buildings are not implemented.
- **Armor:** wearable armor and armor mitigation are not implemented. Pistol rounds, SMG rounds and buckshot share a pistol penetration class, reserved for future armor resolution.

Fatigue penalties, grenade bouncing/fuses, and a fully biological vision simulation were not agreed implementations in this thread. Fatigue is currently measured without AP/accuracy penalties. Partial target rendering uses sampled body bands, not exact silhouette masking.
