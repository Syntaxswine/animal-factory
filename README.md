# Animal Factory

A standalone farm logistics prototype inspired by the appetite of the pigs in Animal Farm. Build the wheat → flour → bread chain and deliver to the farmhouse.

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
- **Reset:** restore the starting buildings with no belts. This action can be undone.
- **Connect the example:** connect the starter chain and watch it run.

Gold tiles are outputs; blue tiles are inputs. Conveyors occupy the adjacent outside tile and must enter the input in the arrow's direction. Other building tiles cannot receive goods. Lines reject blocked paths rather than partially placing them.

## Simulation

- Fields produce 1 wheat every 3 seconds.
- Mills consume 2 wheat to make 1 flour in 4 seconds.
- Bakeries consume 2 flour to make 1 bread in 5 seconds.
- The farmhouse accepts and counts bread.
- Buildings hold 8 input items and 4 output items; blocked outputs back up the chain.
- Each conveyor tile holds one parcel. Parcels move every 0.3 simulation seconds; occupied destinations cause backpressure.

The visual treatment is a schematic production plan in agricultural greens, wheat gold, and propaganda red. It is not finished socialist realist artwork. Growing farmhouse geometry, extra appetites, labor, hunger, costs, and saving are future iterations. Reloading starts a fresh farm.

## Verification

```sh
npm run check
```

Checks syntax and headless simulation behavior, including production, blocked output, input port rules, rotation, straight-line placement, collisions, corners, merges, and undo.
