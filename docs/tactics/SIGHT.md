# Sight lobes — proposal and tracking record

Opened 2026-09-16 on branch `tactics-sight-lobes`. Goal: replace the flat pie-slice sight cone with a vision model whose shape and behaviour come from measured animal vision and from target-acquisition science, while staying cheap on a 240×240 tile grid and legible with mirror-only sprites.

## Status

| Stage | Scope | State |
| --- | --- | --- |
| 1 | Species sight lobes, motion-gated detection, detect/identify split feeding suspicion, orienting reflex | Built on `tactics-sight-lobes`, 271 tests green, balance recorded below; awaiting hostile review |
| 2 | Exact visibility polygon by angular sweep over wall edges; overlay clipped by occlusion | Planned |
| 3 | Eye height by stance; per-zone target heights so cover hides zones, not whole units | Implemented; validation recorded below |
| 4 | Heading wedge under sprites; guard lobe preview on hover | Planned |

Each stage needs the full suite green, the 20-seed balance run reported before and after, and a hostile review of at least 4/5 before the next stage starts, matching the existing gates in REVIEW.md.

## What exists today (tip a9ac02f → 1dda9d5)

- One half-angle per unit (`cone`, 120° default; 150/160/170/210° for horse/goat/donkey/sheep via traits). A target is in sight when the bearing to its tile centre is within `cone/2` of the heading. Binary, uniform inside, hard edge.
- Circular range caps: 60 tiles for characters, 75 for terrain, independent of bearing. Sneaking targets shrink the character cap by a flat amount.
- One centre-to-centre occlusion ray at a fixed eye height of 1.3, regardless of stance.
- The cone overlay draws the unoccluded fan, so it shows tiles behind walls as if visible.
- Guards start with `cone: 120` and no species sight at all.

## The science this model uses

**Field shape differs by ecology.** Grazing prey have lateral eyes, horizontal pupils and a horizontal visual streak: a nearly complete field with a narrow binocular core. Predators and omnivores have frontal eyes: a narrower field with a wider binocular core. Measured totals and binocular overlaps:

| Species | Total field | Binocular | Source |
| --- | --- | --- | --- |
| Horse (donkey treated the same) | ~350° | 55–65° | [UC Davis Horse Report](https://cehhorsereport.vetmed.ucdavis.edu/news/equine-vision-and-performance) |
| Sheep | 270–320° (wool narrows it) | 30–40° | [Open Sanctuary](https://opensanctuary.org/the-ewe-nique-world-of-sheep-sight/), [Farm Sanctuary](https://www.farmsanctuary.org/news-stories/ten-facts-about-sheep/) |
| Goat | 320–340° | ~50° (sheep-like) | [Goat Journal](https://goatjournal.iamcountryside.com/ownership/goat-eyes-senses/) |
| Cattle | ~330° | 25–50° | [AnimalHandling101](https://animalhandling101.fandom.com/wiki/Cattle_field_of_vision_and_flight_zones) |
| Chicken | ~300° | ~26–30° | [Poultry Extension](https://poultry.extension.org/articles/poultry-anatomy/how-well-can-chickens-see/), [Lafeber](https://lafeber.com/backyard-chickens/chickens-see-differently-than-humans/) |
| Pig | ~310° | 35–50° | [Open Sanctuary](https://opensanctuary.org/pig-vision-more-than-meets-the-eye/) |
| Dog | ~240° | 30–60° | [VIN / WALTHAM](https://www.vin.com/apputil/content/defaultadv1.aspx?pId=11132&id=3844144) |
| Red fox | ~260° | ~40° | [Wildlife Online](https://www.wildlifeonline.me.uk/animals/article/red-fox-senses) |
| Striped skunk | field not well measured; acuity very poor, useful sight only a few metres | — | [Visual acuity in the striped skunk, PubMed](https://pubmed.ncbi.nlm.nih.gov/28333485/) |
| Human (reference) | ~200° | ~120° | same VIN source |

**Acuity falls hyperbolically with eccentricity.** Resolution threshold T(E) = T0 · (1 + E/E2), where E2 is the eccentricity at which foveal acuity has halved; for human resolution E2 is about 1–2°. ([Strasburger & Pöppel, Visual field](http://hans-strasburger.userweb.mwn.de/reprints/674VisualFieldED.pdf); [Ophthalmic & Physiological Optics 1996](https://link.springer.com/article/10.1046/j.1475-1313.1996.96833618.x).) Along an ungulate's visual streak the fall-off is slow horizontally, which in a ground-plane game means a wide band of usable acuity.

**Periphery is a motion detector.** Rod-dominated peripheral retina resolves little detail but responds strongly to movement. A still object at the edge of the field is far harder to notice than a moving one. (Standard result; the same VIN and Strasburger references.)

**Detection, recognition and identification are different ranges.** The Johnson criteria put detection at ~1.0 resolvable cycle across the target's critical dimension, recognition at ~4.0 and identification at ~6.4. ([Johnson's criteria, Wikipedia](https://en.wikipedia.org/wiki/Johnson's_criteria); [OSTI history](https://www.osti.gov/servlets/purl/1222446).) At the game's 60-tile cap a foveal view resolves a body many times over, so on axis both coincide; the ratio matters in the periphery, where acuity is the limit.

## The model

**Since parcel I (24 September 2026), night scales the character cap.** `R` is multiplied by
`0.25 + 0.75 × light`. `light` is the target's own illumination: daylight plus lamps and fires, capped
at 1. So an unlit animal at night is seen from 15 tiles, and one in a lamp's first band from the full 60.
By day the multiplier is exactly 1. The terrain cap is unchanged. See
[ARTIFICIAL-LIGHTING.md](ARTIFICIAL-LIGHTING.md).

All angles in degrees, `e` = absolute bearing offset from the heading, `R` = 60 tiles (characters) or 75 (terrain), per-species parameters `field` (total), `bino` (total binocular), `e2` (acuity half-fall eccentricity beyond the binocular edge, in the ground plane), `floor` (peripheral identification fraction), optional `range` multiplier.

```
outside:    e > field/2                     → nothing
acuity:     f(e) = 1                        for e ≤ bino/2
            f(e) = max(floor, 1/(1+(e−bino/2)/e2))   otherwise
identify:   d ≤ R · range · f(e) · sneak    → full contact, aim zones, targeting
detect:     d ≤ R · range · min(1, 6.4·f(e)) · sneak, and the target moved since the
            last refresh (or fired)         → glimpse: approximate marker, suspicion
```

`sneak` is the existing sneaking reduction expressed as a fraction of the 60-tile cap. Walls block both outcomes; a glimpse never passes a wall. Because 6.4·floor exceeds 1 for every species, a moving target is detected at full range anywhere inside the field; the periphery's weakness shows up as the inability to identify, not the inability to notice. Stationary targets in the periphery are only found inside the identification lobe.

Game parameters chosen from the table (half of `field` and `bino` is what the code compares against):

| Species | field | bino | e2 | floor | range | Why |
| --- | --- | --- | --- | --- | --- | --- |
| horse, donkey | 350 | 60 | 60 | 0.40 | 1 | equid streak, 5° rear blind spot |
| goat | 330 | 50 | 60 | 0.40 | 1 | |
| cow | 330 | 40 | 60 | 0.40 | 1 | |
| sheep | 300 | 35 | 60 | 0.40 | 1 | wool narrows the field |
| hen | 300 | 26 | 45 | 0.35 | 1 | lateral eyes, small overlap |
| pig-foreman, pig-director | 310 | 42 | 30 | 0.35 | 1 | omnivore, poorer acuity |
| skunk | 240 | 40 | 15 | 0.30 | 0.5 | very poor acuity, sight half range |
| unknown species (fallback) | 200 | 120 | 15 | 0.30 | 1 | human-like |

Consequences worth stating: workers and guards alike now have a rear blind spot of 10–60°, not 150–240°; what they lose is the ability to recognise anything off-axis. Free turning stays. The player's stealth window is the monocular band: crossing it still while a guard looks elsewhere is safe, moving in it is a glimpse that sends the guard to investigate, and being inside the binocular core within range is contact.

### Detect outcome semantics

- Squad glimpses a guard: `s.glimpses[id] = {x, y, z}`; the map shows an unknown-movement marker, no species, name, weapon or targeting. Queued movement stops once per new glimpse. No combat starts.
- Guard glimpses a squad member and is not alert: the guard gets the existing hearing-style suspicion (`lastHeard` rounded to the 6-tile grid, 12 investigation steps). Investigation turns the guard toward the marker; its binocular core then decides whether the glimpse becomes contact.
- Identification by either side is contact, exactly as today.
- Firing marks the shooter as moved for that refresh.
- Orienting reflex: an attack from outside the victim's field spins the victim toward the attacker. Turning is free, and this is what any animal does when struck from behind. Found by the balance bot on seed 1955, where the last guard knifed a horse from inside its 10° rear notch for 1,500 actions while the bot never turned.

### Terrain reveal

Terrain uses the detect lobe (full 75 tiles inside the field). Fields near 350° mean a stationary observer maps almost everything around it, which is what a grazing animal actually does.

## Geometry stages after this one

**Stage 2, exact visibility.** Walls are shared-edge segments and props are boxes, so the visibility polygon from an eye point is an angular sweep over segments, O(n log n) in the segments inside range. Intersect with the lobe, rasterise to tiles for the rule, project the vertices for the overlay. Isometric projection of a ground polygon is affine, so the overlay is just the projected polygon with two shaded zones. This removes tile-centre aliasing at the lobe edge, where a one-tile target at 60 tiles subtends about 1°, and it stops the overlay from drawing through walls.

**Stage 3, heights.** Eye at 1.3 standing, 0.9 kneeling, 0.35 prone, using the height the occlusion code already carries. Rays to the target's head, torso and legs heights separately, so a one-metre crate hides legs but not the head and only zones with a clear ray are offered for aimed fire. On the sprite side partial visibility is a vertical clip of the sprite at the occluder's height.

**Stage 4, legibility.** Sprites face left or right only, so heading must be drawn: a small wedge under the feet, quantised to eight directions for readability, plus the enemy's identification lobe on hover.

## Acceptance checks (properties, not screenshots)

1. Identification range is non-increasing in `e`, equal to the cap inside the binocular core, zero beyond the field.
2. Identification range never exceeds detection range at any bearing.
3. A wider field with the same other parameters sees a superset of tiles.
4. A still target beyond the identification lobe but inside the field is unseen; the same target after one step is glimpsed, not identified, and cannot be targeted.
5. A guard that glimpses a moving squad member acquires suspicion, not alert; identification produces alert.
6. Neither outcome passes a wall.
7. Every roster species has a sight entry with `bino ≤ field ≤ 360`.
8. The full suite and the 20-seed balance run, before and after, with the numbers recorded here.

## Open questions

- Should identification also gate overwatch reactions, or should a reserved shot fire at a glimpse in its lane? Currently overwatch revalidates `canSee`, so it needs identification.
- Whether the squad's shared glimpse markers should be exact tiles or the same 6-tile rounding guards get.
- Night and lighting are outside this proposal; the fox and skunk have tapeta and would need a light term.

## Balance record

Stage 1, 2026-09-16, seeds 1947–1966, the same bot (with the no-guards-pending fix) on both trees. The bot walks straight at the nearest guard and never turns, sneaks or uses cover.

| | Baseline 1ab171c | Sight lobes |
| --- | --- | --- |
| Won / lost | 16 / 0 | 15 / 5 |
| Stalled at the 1,500-action cap | 2 (1948, 1960) | 0 |
| Hung inside one action for over 150 s | 2 (1951, 1953) | 0 |
| Mean survivors on a win | 2.00 | 2.53 |
| Mean squad HP on a win | 121 | 180 |
| Mean rounds on a win | 14.8 | 12.5 |

Reading: fights now resolve faster and wins are cleaner, but five seeds are outright losses where the baseline won three (1947, 1949, 1963, 1965) and hung on one (1953). Guards with 310–350° fields alert each other far more readily than 120° cones did, so a frontal bot draws a converging group. Whether that is the right difficulty for a human who uses facing, stealth and cover is a tuning question for the next pass; the levers are the guard species floor (peripheral identification fraction) and a guard range multiplier. The baseline stalls are the blind-notch standoff the orienting reflex fixes; the baseline hangs were not investigated here.

Per seed:

| Seed | Baseline 1ab171c | Sight lobes |
| --- | --- | --- |
| 1947 | won r21, 1 up, 55 HP | lost r14, 1 guards left |
| 1948 | STALLED at 1500 actions | won r10, 4 up, 348 HP |
| 1949 | won r15, 2 up, 193 HP | lost r16, 2 guards left |
| 1950 | won r11, 3 up, 140 HP | won r11, 3 up, 292 HP |
| 1951 | HUNG >150 s | won r14, 2 up, 146 HP |
| 1952 | won r22, 2 up, 35 HP | won r15, 2 up, 88 HP |
| 1953 | HUNG >150 s | lost r11, 4 guards left |
| 1954 | won r12, 2 up, 147 HP | won r17, 1 up, 102 HP |
| 1955 | won r9, 3 up, 147 HP | won r13, 1 up, 57 HP |
| 1956 | won r11, 2 up, 132 HP | won r15, 2 up, 174 HP |
| 1957 | won r14, 2 up, 92 HP | won r14, 2 up, 110 HP |
| 1958 | won r16, 3 up, 167 HP | won r14, 2 up, 165 HP |
| 1959 | won r12, 2 up, 179 HP | won r15, 3 up, 208 HP |
| 1960 | STALLED at 1500 actions | won r13, 3 up, 190 HP |
| 1961 | won r15, 1 up, 89 HP | won r10, 3 up, 56 HP |
| 1962 | won r18, 2 up, 117 HP | won r7, 4 up, 269 HP |
| 1963 | won r17, 2 up, 88 HP | lost r16, 1 guards left |
| 1964 | won r12, 2 up, 157 HP | won r9, 3 up, 243 HP |
| 1965 | won r17, 2 up, 107 HP | lost r14, 2 guards left |
| 1966 | won r15, 1 up, 90 HP | won r10, 3 up, 252 HP |


## Stance and exposed-zone layer — 2026-09-16

Built on canonical sight-lobe commit `d332ecd`. Species fields, peripheral detection and identification curves are retained. The angular-sweep visibility polygon remains a separate planned stage.

- Standing / kneeling / prone eye heights are 1.3 / 0.9 / 0.35 world units, shared with the existing projectile origin model. These are game-scale dimensions, not new animal measurements.
- Sight and bullets share wall, window, floor, low-cover and prop collision geometry. Character bodies intercept bullets but do not block vision. Exact diagonal contact with a solid tile corner now blocks both.
- A character can be perceived when at least one sampled body region is exposed. Head, torso and legs use the existing projectile target heights; weapon aim uses the target's held-weapon height. Personal identification and a clear ray to the selected region are required to shoot it. Shared squad sight never grants an individual shooter a ray through cover.
- Terrain visibility includes low-cover heights and stance in its cache key. Changing stance immediately refreshes visibility while preserving discovered terrain and the established AP rules.
- Hidden aim options are disabled. Torso remains the default; the player explicitly chooses an exposed alternative. Enemy AI can choose an exposed head, legs or weapon when torso fire is blocked. Reserved overwatch retains its existing torso-shot policy.
- Enemy artwork is clipped into sampled head/torso/leg bands using the union of identifying squad members' views. This is a readable approximation of partial exposure, not a pixel-accurate visibility mask or a model of anatomical shapes.

Validation: 279 tests passed, including seven new height/cover cases, plus browser checks of disabled leg aim, selectable head aim and partial sprite rendering. An old stance fixture incorrectly combined exploration with an already-alert guard; it now creates a genuinely unalerted exploration state. The existing diagonal-wall regression caught the projectile corner gap, which was fixed in the shared collision path.

Adversarial self-review covered silent cache staleness after stance changes and explosions, corner leaks shared by sight and bullets, AP loss on rejected aim, shared-sight targeting through personal cover, enemy refusal to attack exposed regions, and floors between vertically aligned units. The regression suite covers these cases. The sprite band approximation and unclipped range overlay remain explicit limitations; no independent reviewer score is claimed for this pass.

### Stance-layer balance check

Twenty isolated runs per version, seeds 1947–1966, against the canonical `d332ecd` baseline. Both versions: **15 wins, 5 losses, no stalls or timeouts**. Every paired run matched on outcome, actions, rounds, survivors, remaining guards and squad HP. The bot stays standing and uses torso shots, so this is a regression check, not evidence about the difficulty of deliberate stance/cover tactics.

| Seed | Both outcomes | Rounds | Survivors | Squad HP |
| --- | --- | --- | --- | --- |
| 1947 | lost | 14 | 0 | 0 |
| 1948 | won | 10 | 4 | 348 |
| 1949 | lost | 16 | 0 | 0 |
| 1950 | won | 11 | 3 | 292 |
| 1951 | won | 14 | 2 | 146 |
| 1952 | won | 15 | 2 | 88 |
| 1953 | lost | 11 | 0 | 0 |
| 1954 | won | 17 | 1 | 102 |
| 1955 | won | 13 | 1 | 57 |
| 1956 | won | 15 | 2 | 174 |
| 1957 | won | 14 | 2 | 110 |
| 1958 | won | 14 | 2 | 165 |
| 1959 | won | 15 | 3 | 208 |
| 1960 | won | 13 | 3 | 190 |
| 1961 | won | 10 | 3 | 56 |
| 1962 | won | 7 | 4 | 269 |
| 1963 | lost | 16 | 0 | 0 |
| 1964 | won | 9 | 3 | 243 |
| 1965 | lost | 14 | 0 | 0 |
| 1966 | won | 10 | 3 | 252 |
