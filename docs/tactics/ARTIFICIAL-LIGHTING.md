# Artificial light and detection — parcel I

Parcel I of [SCENERY-PORT-HANDOFF.md](SCENERY-PORT-HANDOFF.md): lamps and fires give light at night,
and light decides how far away an animal can be seen. Spotlight and tower beams are parcel J.

![The real game at midnight, same map. Left: no lamp, and the guard 37 tiles east has not noticed the squad. Right: a floor lamp beside them, and the guard has.](artificial-lighting.png)

*The real game (`index.html?map=custom`, a playtest map starting at 00:00, one goat guard 37 tiles east
of the squad, facing it), shot headless. With no lamp the log reads "Local map ready". With a floor lamp
two tiles from the squad it reads "CONTACT … You have been seen". At noon, with no lamp, it reads
CONTACT too, exactly as before this parcel.*

## The rule

Two decisions from the boss, 24 September 2026:
- **Night hides you.**
- **"15 is good, but the full distance if someone is illuminated by a light."**

So:

```
light  = min(1, daylight + sum over lit bulbs of falloff(distance), each only if nothing solid is between)
range  = sightRange × (0.25 + 0.75 × light)
```

- **`daylight`** is S2's `daylightStrength`: 1 all day, 0 at night, easing through dawn (05:00–06:00) and
  dusk (18:00–20:00).
  - By day the multiplier is exactly 1, so **every map plays exactly as before until dusk**. A test
    checks that at noon with and without lamps.
- **`sightRange`** is the existing cap: 60 tiles, less for a sneaking target. In the dark, 60 becomes 15.
- **`falloff`** is the 3D branch's `lightBrightness`: 100% within 5 tiles, then half for every 5 more,
  and nothing past 30. So an animal within five tiles of a lit bulb is seen from the full 60. Seven tiles
  away it gets half light and 37.5 tiles, and so on out.
- **The light is the target's own**, at its torso. It is traced from the torso to each bulb through the
  solids that sight and bullets already use, without bodies, and without the fixture's own footprint.
  A wall between a lamp and an animal leaves the animal dark.
- It feeds `perceive`, so it covers both directions: guards seeing the squad, and the squad seeing
  guards. A guard standing under a streetlight is visible from across the yard, and one in the dark is
  not.
- **Light never gets around the sight cone or line of sight.** It only changes how far the cap reaches.

**What is not changed:** terrain visibility (75 tiles) and the fog of war. At night you still see the
ground; you do not see the animals on it.

## Which lights, and when

`light-sources.js` is the 3D branch's, ported at `b23334c`:
- **Kinds:** all thirteen light forms, with the same bulb positions and heights, the 30-tile range and the
  stepped falloff.
- **Schedule:** electric lamps come on for the night, 18:00 to 06:00; fires always burn. A prop's
  `lightMode` can force either way: `on` or `off`. A damaged fixture (`condition` below 100) is dark.
- **Rotation:** here a rotated prop is mirrored, `(x, y) → (y, x)`, and the bulb mirrors with the art.
  There it is turned a quarter.
- **Spot sources** (the three towers and `spotlight`) give no light in this parcel. They are aimed
  beams that sweep, and parcel J brings them, under the boss's spotting rule: spotted at once only when
  a guard mans the tower or has line of sight.
- **The two wall fixtures** light like the rest once they are placed (open question 5, now answered).

**The editor:** a Light selector beside Rotate, with the options Automatic, Always on and Off.
- Automatic is recorded as no field at all, so maps that never use it are unchanged.
- On and off are recorded only on lamps and fires.
- The field survives export, import and reload, which is tested.

## Clock

The campaign clock lives on the world. A map's game state now holds the **same object**: `world.js`
hands it over when it creates the first map and on travel. So detection reads the clock as it moves. A
game with no world reads the map's own start time, or 08:00. That is `stateMinutes`.

## Drawing

![22:00: warm pools around the two fires, a pale one under the floor lamp, and the dark beyond](artificial-lighting-pools.png)

The drawn light is the tactical rule itself, not a picture of light:
- Every tile within 15 of a bulb gets the same `lampStrength` sum detection uses, at a body's torso
  height, from every bulb out to 30. A test checks that tile for tile.
- The lit tiles become one pixel each of a small light map. That is drawn through the isometric transform
  with smoothing, so pools are soft but stop at walls.
- It is drawn additively, in S2's **overlay** pass, over the night wash.
  - The brief said the `light` pass, under the props. I tried that first, and under the wash the pools
    read as orange dirt, because the wash darkens light as much as ground.
  - Over it, the light lifts the dark instead, and it lights the animals standing in it, which is what
    light should do.
- **Only on seen ground**, so a lamp in unexplored territory does not give itself away. Clipped to the map.
- **Colour:** the strongest bulb's. Fires are orange (`0xffae55`), electric lamps pale (`0xffe5b2`),
  as on the 3D branch.
- **Strength:** alpha 0.3 at full night, eased by the same daylight curve. Nothing is drawn by day, even
  for a fire that is burning.

At night the selected animal's sight cone shrinks with the dark to 60 × (0.25 + 0.75 × daylight). That is
what that animal can see of an unlit target. A lit guard can still be seen from further away than the cone
shows.

## Cost

Measured on this machine:

| what | when | cost |
| --- | --- | --- |
| detection, a night step: 20 lamps, 40 guards × 4 squad, both ways | every step | 21 ms (3.4 ms at noon) |
| lit tiles: 4 lamps / 20 lamps | when a bulb switches, or a wall, door or prop changes | 42 ms / 950 ms |
| light map redraw as the explored area grows | every step while exploring | about a millisecond |

**Detection is memoised per point and height,** for one state revision and one minute. So forty guards
looking at four animals trace four points, not a hundred and sixty. The lit tiles recompute only when
geometry or the lit bulbs change, never because an animal moved.

**A map with twenty lamps pauses for about a second at dusk,** and again whenever a door opens at night.
Per-bulb caching would remove that, and it is recorded below.

## Not done

- **Spotlight and tower beams:** parcel J.
- **Per-bulb caching for the drawn light,** to remove the dusk pause on lamp-heavy maps.
- **Upper floors.** Light is traced in 3D, and a bulb lights across floors wherever the trace allows, but
  the drawn pools are per level. A lamp on floor 2 does not draw a pool on the ground floor.
- **Flickering flames** on the four fire kinds: B's follow-up.

## Files

Parcel I owns `light-sources.js` and `light-render.js` (both new), `engine.js`'s detection, this document
and its figure, and `tests/tactics-light.test.mjs`. Outside that:

- `world.js` (S2): two lines hand the map state the campaign clock.
- `app.js` (S2):
  - the pass install;
  - the sight cone's night reach.
- `editor.html`, `editor.js` (S1), `editor-model.js` (S2): the Light selector and its record.
- `SIGHT.md`: a paragraph at the head of the model saying night scales the cap.
- `SCENERY-PORT-HANDOFF.md` and `SCENERY-HANDOFF-2026-09-24.md`: the claim and the delivered record.

## Verification

- `npm run check` passes: 544 tests, 534 before.
- **Mutation round,** in a sandbox copy that passed unmutated first: 26 of 27 caught.
  - The survivor, removing the drawn light's in-bounds check, is **equivalent**: the trace already refuses
    a ray from off the map. The check stays because it saves those traces.
  - The round found three real gaps, and each has a test now:
    - the bedside table is the one lamp with cover, so its own footprint can shadow its bulb;
    - two lamps must not add past daylight;
    - a fire burning at noon must still draw nothing.
  - It also found a mismatch between drawn and detected light at the edge of overlapping pools. The drawing
    counted only the bulbs within 15 tiles; it now sums every bulb detection counts.
- The real game, with a control, as in the figure above.
