# Separate 3D weapons on the accepted horse

The user requested converting the entire weapon catalog to separate 3D models, using the accepted painted 10,300-triangle horse to test them. Open `/tactics/horse-weapons.html` for the workshop. Choose any weapon, compare its original sprite with the equipped horse at native or close scale, turn the character, or inspect the independent weapon alone. Contact markers and wireframe are available.

This covers all twelve weapon IDs in `engine.js`, plus an empty-hands state. `launcher` uses the existing `grenade-launcher` artwork. The original 480-triangle rifle is reused. Other assets are authored in `weapon-models.js`, with shaped profiles, cylinders, bevels and deliberately placed steel edges, seams, wood-atlas surfaces and accessory detail. No character geometry, paint asset, gameplay statistics, inventory rules or firing simulation is changed.

## Catalog and handling

| Weapon | Defining modeled features | Equipped pose |
| --- | --- | --- |
| NR-40 knife | Bright shaped blade, guard, wrapped handle | One hand, down/outward |
| TT-33 pistol | Compact slide, grip, guard, sights and serrations | One hand, low carry |
| Mosin-Nagant | Existing wood stock/fore-end, barrel and bolt | Existing two-hand carry |
| AK-47 | Curved magazine, wooden furniture, gas tube, receiver detail | Two hands |
| PPSh | Drum magazine, perforated barrel shroud, wooden stock | Two hands |
| Heavy machine gun | Perforated jacket, ammunition box, linked hanging belt and bipod | Two hands |
| Pump shotgun | Ribbed wooden pump, barrel and separate magazine tube | Two hands |
| Sniper rifle | Long fore-end/barrel, scope, mounts and turret | Two hands |
| Fragmentation grenade | Segmented body, neck, lever and ring | One raised hand |
| Grenade launcher | Exposed revolving chamber structure, short wide barrel, wood stock | Two hands |
| RPG | Rear flare, launcher tube, grips, folding sight, large pointed warhead | Shoulder carry |
| Flamethrower | Separate projector, twin tanks, shoulder straps, fittings and connected hose | Two hands and spine-mounted pack |

Assets use local +X along the barrel/blade axis and named grip/support contacts. Firearm/launcher/flame muzzle anchors match the rendered opening. The knife has a tip and the grenade has a release anchor; neither pretends to have a firearm muzzle. The loaded RPG's anchor is the launch-tube mouth, not the warhead nose. These are asset landmarks, not integration with the gameplay projectile origin.

`horse-light-model.js` adds `equipWeapon()`, preserving its default rifle behavior and existing character comparison. Each asset supplies its own position, orientation and one-/two-hand contact set. The flamethrower mount attaches to the spine; its hose is a separate curved mesh whose ends follow the tank outlet and projector inlet. Selecting hands detaches the entire previous weapon, mount and hose. The caller owns and disposes equipped assets; the workshop disposes each previous selection and its contact markers.

## Checks and evidence

Twelve focused tests pass across the character, projection and weapon suites. A snapshot captured at `138aacb` freezes the accepted shotgun and flamethrower geometry, materials and equipped carry, including the hose. Weapon checks compare the catalog with the actual engine catalog; validate hand contact against deformed hand vertices and actual weapon triangles; verify the visible muzzle-opening center at four headings; verify both hose ends against rendered tube-ring centers; and prove that switching to hands removes the backpack/hose from the scene graph. The hand-surface threshold remains 0.015 world units; weapon contact points may sit inside a grip and must be within 0.026 units of its surface.

`tools/horse-weapons-review.mjs` captures all thirteen states at native 58 CSS pixels/world unit and close scale, twelve standalone assets, and rear/side inspection of the HMG, RPG and flamethrower. It checks browser/shader/resource errors, contact alignment, triangle budgets below 3,000 per weapon, and repeated switching with stable renderer geometry counts. Evidence and actual per-weapon counts are in `hybrid-review/weapon-models/checks.json`. The Pages build includes the factory and workshop.

First hostile review: **7/10**. It found buried launcher chamber detail, disconnected-looking ammunition, plain receivers and a cramped RPG grip. The revision exposes the chambers, adds a connected belt feed/backing/link structure, shapes and details the receivers, and moves the RPG grip forward. The first-pass independent review gave **9/10 for the bounded weapon-model and equipped-pose deliverable**; the architect subsequently found that this over-weighted function and required a stronger visual pass. The reviewer confirmed resolved chamber/belt/receiver/RPG issues, convincing rear-view tank/hose attachment, and independently passed all eleven tests. Metal finishes remain simpler than the painted character, and native-scale long-gun distinctions are subtler than the close views.

The horse's hands remain an accepted weakness. This pass tests static equipped poses and assets; it does not demonstrate reloads, throwing, recoil, aiming transitions, firing effects, kneeling/prone handling or unrestricted animation. The revised six weapons use unlit procedural painted values; the accepted baselines retain their previous lit materials. These presentation treatments still need evaluation in an integrated scene. Canonical gameplay and the full graphics merge are untouched.

## Visual revision after architect review of `138aacb`

The shotgun and flamethrower are frozen. The character, attachment system and original rifle are unchanged. Six weapons receive distinct major shapes rather than another subdivision pass:

- AK: stamped receiver and rounded dust cover, angular butt, forward-bowed magazine with curved stamped ribs.
- PPSh: continuous dropped-comb wooden wrist, rounded action, drum and perforated shroud.
- Sniper: continuous walnut stock and fore-end beneath a narrow bolt action, separate bent bolt and scope.
- Grenade launcher: short broad butt and its own hinge frame around the exposed chamber assembly.
- HMG: deeper receiver and feed lid, a connected belt curving out from the feed and hanging down beside the ammunition box.
- RPG: clamped tube, ribbed heat sleeve, shoulder saddle, separate sight bracket and shaped warhead with a shoulder seam and nose fuse. Its carry sits beside the neck on the shoulder.

These six use dark metal, warm wood grain, painted top planes and irregular value patches implemented in the material shader. This is procedural surface treatment, not a hand-painted texture atlas. The workshop compares the revised assets against the existing sprites at 58 CSS pixels/world unit as well as close scale. Fine surface details contribute mainly in close view; magazines, chambers, scopes, barrel lengths and equipment mass carry the distinction at gameplay scale.

The stricter visual review progressed from **8/10** (dense woven-looking materials, excessive AK hook, sparse belt) to **8.5/10** (shape issues resolved, metal too faint at native size) and finally **9/10** after selective upper metal highlights. The final reviewer independently passed all four weapon tests. All twelve focused horse/paint/weapon tests, browser captures and the Pages build pass. Shotgun/flamethrower screenshot files also remain byte-identical to the accepted baseline.

Final revised triangle counts: AK 1,340; PPSh 952; sniper 1,056; grenade launcher 1,060; HMG 2,740; RPG 1,608. These counts include accessories. The surface finish remains simpler and more geometric than authored sprite paint. The 9/10 is the subagent's approval of this static asset/carry revision, not architect acceptance, gameplay readiness or approval to merge the graphics branch.
