# Red Shift — mechanics direction and completion record

The five-stage implementation order below was completed on 2026-09-15; the final section records the reviewed behavior and supersedes historical proposals.

Recorded from the user's answers on 2026-09-14. These are design decisions for the next implementation pass, not a description of features already present in the playable prototype. The initial prototype contract remains in `dist/tactics/DESIGN.md`; its free test armoury, unlimited reserves, uniform stats and death-only model will be superseded during implementation.

## Confirmed direction

| System | User direction |
| --- | --- |
| Easy difficulty | Fallen characters automatically revive with 5 HP. The exact revival timing is not yet decided. |
| Harder difficulties | Downed characters need medical care within a few turns to prevent bleeding out. Surviving characters recover after battle. Six squad-turn ends to stabilize; death on timeout; stabilized survivors recover to 5 HP (implemented). |
| Progression | Level-ups award skill points that the player assigns. |
| Species | Species can favor particular classes through traits: fox stealth affinity is an example. HP, AP, shooting ability and sight-cone differences are all supported directions. Exact traits and values are pending. |
| Movement | Individual control plus optional multi-selection and formation orders (implemented). |
| Inventory | Abundant loot with limited carrying capacity. Ammunition scarcity and its placement across maps matter. A strong weapon can arrive early with only the ammunition already loaded, with resupply several maps later. |
| Weapon slots | A primary and a secondary weapon; switching between those two equipped weapons is free. |
| Tactical systems | Stealth, overwatch, sight cones and aimed shots. Line of sight is a central mechanic. |
| Story | Deferred entirely. The user wants mechanics only at this stage. |

## Proposed rules to make those choices playable

These are implementation proposals, not additional decisions attributed to the user.

### Injury and difficulty

Use explicit states: active, downed, stabilized and dead. A downed or stabilized character cannot take normal combat actions. Medical stabilization stops the countdown; it does not silently grant a fresh combat turn. Count bleed-out once per full round, with a visible counter and a clearly explained deadline. A character downed late in a round must receive the same rescue opportunity as one downed early.

Recommended Easy timing: revive at encounter end with 5 HP. This avoids repeatedly reviving into enemy fire and eliminates an unlimited mid-combat revival loop. Keep whole-squad defeat as a separate rule to decide: does Easy allow a costly retreat, or require a retry? Do not assume the current prototype's defeat rule is the final answer.

Superseded: the implemented harder-mode timer is six squad-turn ends to stabilize. Whether a dead character is permanently lost, and the HP restored after a successful encounter, remain open. Encounter completion must check pending casualties explicitly; merely losing sight of enemies must not trigger recovery or reset a countdown.

### Skill points and species

Keep species traits separate from trainable skills and equipment. Species should create useful tendencies without locking a character out of a class. Display every modifier on the character sheet and in affected previews. A fox might begin with a stealth advantage; a sturdy species might trade mobility for HP; a broad sight cone might trade distant precision for peripheral awareness. These are stylized game traits, not claims of biological accuracy.

Use one authoritative maximum HP/AP calculation. Apply point allocations atomically and prevent spending unavailable points. Define XP awards, skill list, points per level, respec policy and whether there are fixed classes before implementing progression. Avoid rewards for repeatedly healing or harming the same friendly target.

### Backpack and two equipped weapons

The backpack is storage; the two weapon slots define the free combat swap. Moving a third weapon out of the backpack is a separate equip action, with its AP cost still to be tuned. This prevents unlimited free cycling through the entire inventory.

Each physical weapon stores its own loaded rounds; carried ammunition exists as finite inventory stacks. Switching, dropping, looting or re-equipping must preserve ammunition. Reload transfers actual compatible rounds and never conjures a full magazine. Reject overweight or otherwise invalid transfers without deleting items. Early powerful weapons should clearly communicate their rare ammunition requirement.

Capacity could use weight, a spatial grid, or both; this choice is still open. Loot containers, corpses, the ground and exchanges between adjacent squad members should share one transfer model. Persistent campaign inventories and authored supply placement are prerequisites for scarcity across several maps; the single factory map can test the same model with sparse supplies first.

### Facing, sight and aimed fire

Build one shared visibility query combining facing, sight cone, distance and terrain occlusion. Player detection, enemy detection, targeting previews and overwatch must agree. Shared squad knowledge can show a target while the selected shooter lacks a personal firing solution; the interface must distinguish those cases. Hearing should create suspicion or a last-heard location, not reveal an exact enemy through walls.

Show cones when relevant rather than covering the map with permanent overlays. Allow deliberate facing changes and decide their AP cost. Species cone width affects awareness; it must not bypass walls. Last-known enemy positions should be clearly marked as memory.

Overwatch reserves AP and binds to the chosen equipped weapon, firing arc, available rounds and reaction limit. Free weapon swapping must not transfer a reserved reaction to a different weapon or duplicate reserved AP. The shooter still needs a valid visible target when the reaction resolves.

Aimed shots should offer transparent tradeoffs: extra AP and/or lower hit chance in exchange for precision or a specific effect. First test ordinary versus carefully aimed fire. Body-part targeting can follow, with explained chances and effects, rather than adding several unexplained hit rolls immediately. Exact targeting modes are not yet fixed.

## Implementation order and review gates

Preserve the four-versus-twelve factory as the test fixture. Require a hostile review of at least 4/5 after each completed part, fixing blockers before the next part.

1. Facing, shared sight rules, explicit cone previews and detection tests. Keep existing individual movement.
2. Two weapon slots, finite ammunition and capacity-limited loot transfers. Remove test-armoury exploits before attaching reactions to weapons.
3. Stealth, investigation, overwatch and aimed fire using the shared perception and inventory rules.
4. Difficulty-dependent downing, treatment, bleed-out and post-encounter recovery; cover full-squad defeat and timing edge cases.
5. Character sheet, level-up skill allocation and species modifiers. Introduce new species sprites when their traits have useful test cases.

Acceptance checks should test interactions as well as individual systems: turning across a wall, a free swap during overwatch, an empty rare weapon, an inventory transfer at capacity, a downing just before round end, and leaving contact while a comrade is bleeding out. Exact trait values, AP tuning and XP values remain balance parameters rather than story commitments.

## Current priority: maps and authoring

The user has explicitly deferred story work. Build edge-based walls, distinct local maps connected through an overmap, and a map tool for manual block placement and generation before returning to the other proposed mechanics. Walls occupy the boundary between tiles; they do not consume either tile. No narrative, factions, dialogue, or campaign plot should be added in this pass.

## Sequential mechanics pass — 2026-09-15

1. Facing and shared sight: complete, hostile review 4/5. 120° default, 75/60 tile limits, terrain occlusion, personal firing cone, free manual turning, explicit cone guide. Formation movement retained. 161 tests passed; browser confirmed free combat turning.

2. Inventory: complete, hostile review 4/5. Two slots with free swaps; stored secondary equip 3 AP, finite compatible reserves, partial reloads, 16 kg capacity including utilities, one carried weapon per type, ground/dead-guard loot and adjacent transfers. Existing local-map travel preserves inventories and piles. 164 tests passed; browser verified free swap and reserve display.

3. Stealth, investigation and reactions: complete, hostile review 4/5. Sneaking adds 2 AP/cardinal step and reduces detection range; noise yields an approximate search area. One overwatch shot reserves AP now and revalidates cone/weapon/ammunition during the enemy turn; switching or turning cancels without refund. Aimed fire retained. Group movement shares noise and reservation rules. 170 tests passed, browser confirmed controls and accounting.

4. Difficulty and casualties: complete, hostile review 4/5. Next-run Easy/Standard selection; Easy auto-stabilizes and recovers to 5 HP after encounter; Standard six-turn treatment deadline. Whole-squad incapacitation requires retry in both modes. Difficulty follows travel. 173 tests passed and browser verified setting changes only on Restart.

5. Character sheet and progression: complete, hostile review 4/5. Shared 25 XP per defeated guard, three points per 100 XP, level cap10; five trainable skills, no free healing or AP refill. Separate horse/goat/donkey/sheep traits use existing art and appear on sheets. Training between encounters; no respec yet. 177 tests passed and browser verified species-derived stats. Stage1 default cones are superseded for these four species by their displayed trait values; guards retain120°.

Open tuning questions: weight-only versus spatial backpacks; inventory duplicates and authored supply placement; respec and XP pacing; future species roster (including foxes); Easy whole-squad retreat versus retry. Story remains deferred. Campaign progress persists across local-map travel in the current run; reload still starts a new run.
