# Animal Factory

A standalone farm logistics prototype inspired by the appetite of the pigs in Animal Farm. Build connected production chains and supply bread, alcohol, and cakes to the farmhouse.

## Play locally

Requires Node.js 22 or newer. No dependencies or build step.

```sh
npm run serve
```

Open http://127.0.0.1:4318. The game is also a plain static site under `dist/`.

## Controls

- **1:** conveyor. Drag to place a straight line, snapped to the dominant axis. Travel follows the drag direction. Start a second line on the end tile to make a corner.
- **2 / 3 / 4:** wheat field / mill / bakery. Click to place a 3 × 3 footprint.
- **R:** rotate the next building or single conveyor tile clockwise.
- **5:** inspect building inventory and status.
- **6:** remove buildings or drag to remove belts. The farmhouse is fixed.
- **Right-drag / Alt-drag:** pan. Mouse wheel or +/−: zoom. Arrow keys pan while the map has focus.
- **Space:** pause while the map has focus.
- **Undo:** restore the previous construction action, including simulation state at that moment.
- **Starter layout:** choose bread, alcohol, or cakes. Each starts with machines placed and belts missing. Changes can be undone.
- **Reset:** restore the selected starter layout with no belts. This action can be undone.
- **Connect the example:** connect the starter chain and watch it run.

Gold tiles are outputs; blue tiles are inputs. Conveyors occupy the adjacent outside tile and must enter the input in the arrow's direction. Other building tiles cannot receive goods. Lines reject blocked paths rather than partially placing them.

## Production chains

- **Bread:** wheat field → wheat → mill → flour → bakery → bread.
- **Alcohol:** orchard → fruit → press → juice → fermentation barrels → fermented juice → bottling works → alcohol.
- **Milk:** wheat field → wheat → feed mill → animal feed → dairy → milk.
- **Cakes:** flour + milk + sugar → cake kitchen → cake. The prototype sugar works grows and refines beet sugar on site.

Each recipe and its duration appears in the construction palette and inspector. All buildings occupy 3 × 3 tiles. Outputs are gold and inputs blue. Each ingredient has a dedicated input tile; hover over it to see the material name. Rotation changes all port positions and their entry directions. The painted machine illustration retains its camera angle while the logical ports rotate.

Buildings hold up to 8 of **each** input and 4 outputs. They wait for all recipe ingredients and stop when output storage fills. Belts hold one parcel per tile, advance every 0.3 simulation seconds, and back up when blocked. The farmhouse accepts bread, alcohol, and cake at separate ports and counts deliveries.

## Artwork

The game uses 32 transparent character poses (8 animals × 4), 8 animation strips and 12 transparent building sprites. Workers and pigs appear beside machinery. Character movement is visual only; no labor or hunger simulation is implemented yet. The walk poses are a coarse two-frame draft, and left-facing characters are mirrored.

Open **View the character & machine sheets** in the sidebar (or `/sprites.html`) to inspect all sprites on light, dark, farm and checkerboard backgrounds. PNG assets and the character manifest live in `dist/assets/`. Source art, generation prompts and review sheets live in `art/`.

Growing farmhouse geometry, escalating appetites, worker hunger, costs, and saving remain future iterations. Reloading starts a fresh farm.

## Verification

```sh
npm run check
```

Checks syntax, all production chains, ingredient-specific ports in every rotation, inventory backpressure, straight-line placement, collisions, corners, merges, undo, and sprite dimensions/RGBA format.
