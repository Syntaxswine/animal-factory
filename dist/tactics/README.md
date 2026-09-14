# Red Shift / Factory No. 7

Mechanics prototype in Animal Factory’s Soviet animal setting. Run `npm run serve:tactics`, then open http://127.0.0.1:4327/tactics/index.html. The factory builder remains at `/index.html`.

Four workers face twelve guards. Select a worker, click a reachable tile to walk, and click a visible guard to select a target. Confirm shots with the Attack button. Exploration advances in real time; contact automatically starts squad turns. Each tile costs 1 AP. An encounter ends when every alerted guard is defeated, then exploration resumes. Breaking sight does not reset AP.

Everyone can test hands, NR-40 knife, TT-33 pistol, Mosin-Nagant rifle and AK-47. Equip costs 2 AP; reload costs 3 AP. Weapon magazines persist when switching. Reserve ammunition is unlimited for this test. AK burst costs 6 AP and 3 rounds. Walls stop fire and movement; crates stop movement and provide 25 percentage points of directional cover. Units cannot share tiles. Ranges are in tiles. Hit chances are game balance values, not historical weapon specifications.

Squad: 100 HP, 12 AP, 85 base accuracy. Guards: 45 HP, 7 AP, 55 base accuracy, 65% weapon damage. Guards remember last contact and pursue; unseen unalerted guards hold their posts. Victory requires all twelve defeated. Defeat occurs when all four squad members fall. Restart resets the deterministic encounter.

Existing transparent Animal Factory character poses are reused as-is. They carry their original worker props; dedicated weapon-holding and attack animations are future art work. Existing industrial illustrations decorate the perimeter, with simple roofless walls for playable interiors. This is a tactical mechanics slice, without character progression, campaign, dialogue, inventory weight, healing, saves, overwatch, destructible terrain or sound yet.

## Checks

`npm run check` runs the inherited checks and tactics regression tests. It also checks both tactics modules for syntax errors. `npm run check:tactics-balance` runs twenty complete combat simulations. The bot knows guard positions for navigation but uses the normal combat rules; this is a balance smoke test, not a substitute for player feedback.
