# Automated squad player

`tools/tactics-squad-bot.mjs` drives headless playtests through the normal game engine. It does not enable automatic control of the user's mercs in the browser game. Guard positions are known for navigation; shots still obey normal visibility, collision, ammunition and AP rules. Results are functional tests, not human difficulty estimates.

## Default behavior

- Seek previously seen compatible ammunition within 20 tiles; replenish up to roughly two magazines.
- Collect and equip stronger loaded conventional guns, including the HMG. Respect backpack capacity and equip AP. Avoid automatically adopting explosives or flamethrowers because they require separate friendly-fire tactics.
- Exchange an empty or depleted gun for a better-loaded copy by dropping the old weapon and collecting the replacement. No ammunition is created or magically transferred between guns.
- Prefer reloading/upgrading over fallback to a sidearm. Immediate threats take priority over travelling to loot. A gun with an empty magazine is only a candidate when its reload is affordable now (3 AP in combat); otherwise the free held-slot swap onto it and the fallback off it chased each other until the action cap (fixed 2026-09-17, `ready` in the bot; the 20-seed run had stalled on 10 seeds at 2c767ae).
- Alternate merc decisions, stabilize adjacent bleeding comrades when possible, and regroup when separation exceeds 12 tiles. A waiting gunner can cover regrouping with overwatch.
- Cache legal routes. The test player searches approach goals together; every actual movement step is still checked and charged by the engine.

## Quiet approach and coordinated ambush orders

`--quiet-opening` enables sneaking before the opening attack and prefers a knife in melee or a pistol against an isolated visible guard. This is a preference, not a guaranteed stealth kill. A pistol still produces a 24-tile gunshot alert; knives use the quieter melee rules.

For the suggested south-fence approach, supply an ordered JSON plan with actual map coordinates: sneak, attack the first guard, move south, cut a chosen chain-link edge, approach the rear guard, position teammates, reserve overwatch, then lure a guard toward that position. A `lure` order is an ordinary withdrawal to a waypoint: enemies must detect/hear and pursue through their real AI; it never forces aggression or movement.

Supported orders:

```json
[
  {"type":"sneak","unit":0,"enabled":true},
  {"type":"attack","unit":0,"target":4,"weapon":"pistol","zone":"head"},
  {"type":"move","unit":0,"x":10,"y":20,"z":0},
  {"type":"cut","unit":0,"edge":"e:10:20"},
  {"type":"overwatch","unit":1,"heading":90},
  {"type":"lure","unit":0,"x":10,"y":18,"z":0}
]
```

Those coordinates are schema examples, not a verified route through Factory-test.json. Unit IDs 0–3 are the mercs. Guards begin at 4. Cut orders approach the edge, equip cutters, then pay the normal 4 AP cutting cost. Overwatch is reserved during combat and spends AP up front; ammunition is consumed only if it fires. Attack orders continue until their target falls. Orders pause for enemy turns when AP runs out. After the plan, default scavenging/combat behavior resumes.

## Running

```powershell
node tools/tactics-balance.mjs --runs 1 --seed 1947 --output artifacts/scavenging-smoke.json
node tools/tactics-balance.mjs --map Factory-test.json --quiet-opening --orders approach.json --max-actions 20000 --output artifacts/planned-battle.json
```

The CLI returns a nonzero status for an unfinished or stalled run and records decisions in the output JSON. The verified smaller Factory-template smoke battle completed in 11 rounds with three survivors, 13 scavenges, and seven weapon equips; Vera collected/equipped the HMG. The subsequent full-map south-fence run is recorded below.

## Recorded full-map run

[2026-09-17 south-fence browser playtest](playtests/2026-09-17-south-fence/README.md): all 36 guards defeated, all four mercs survived, round 139. Includes the exact map, seeded result, route/controller, stage screenshots, and observed deviations from the intended stealth/ambush plan.
