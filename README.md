# Animal Factory

A standalone settlement and farm logistics prototype inspired by the appetite of the pigs in Animal Farm. Build connected production chains and supply bread, alcohol, and cakes to the farmhouse.

## Play online

[Play Animal Factory](https://syntaxswine.github.io/animal-factory-play/) · [Sprite viewer](https://syntaxswine.github.io/animal-factory-play/sprites.html)

GitHub Pages serves the browser-ready files from [Syntaxswine/animal-factory-play](https://github.com/Syntaxswine/animal-factory-play), using the root of its `main` branch. This development repository remains private. The public repository contains only `dist/` contents; it excludes raw source-art sheets, prompts, local tools, dependencies, and development history.

To publish an update, run `npm run check`, copy the contents of `dist/` into the public repository checkout, then commit and push that checkout's `main` branch. GitHub Pages redeploys automatically. Development-repository pushes alone do not publish the public build.

## Play locally

Requires Node.js 22 or newer. No dependencies or build step.

```sh
npm run serve
```

Open http://127.0.0.1:4318. The game is also a plain static site under `dist/`.

## Controls

- **1:** conveyor. Drag along either isometric diagonal to place a straight line, snapped to the dominant grid axis. Travel follows the drag direction. Start a second line on the end tile to make a corner.
- **7:** street. Drag straight lines. Streets double walking speed and make marked pedestrian crossings where they overlap conveyors. Remove clears both layers on a crossing.
- **2 / 3 / 4:** wheat field / mill / bakery. Click to place a 3 × 3 footprint.
- **R:** rotate the next building or single conveyor tile clockwise.
- **5:** inspect building inventory and status.
- **6:** remove buildings or drag to remove belts. The farmhouse is fixed.
- **Right-drag / Alt-drag:** pan. Mouse wheel or +/−: zoom. Arrow keys pan while the map has focus.
- **Space:** pause while the map has focus.
- **Undo:** restore the previous construction action, including simulation state at that moment.
- **Starter layout:** choose bread, alcohol, or cakes. Each starts with machines placed and belts missing. Changes can be undone.
- **Reset:** restore the selected starter layout with no belts. This action can be undone.
- **Connect the example:** connect the starter chain and the farmhouse-to-depot ration line, then watch it run.

Gold docks are production outputs; blue docks are inputs; the green farmhouse dock supplies worker rations. Conveyors occupy the adjacent outside tile and must enter the input in the arrow's direction. Other building tiles cannot receive goods. Lines reject blocked paths rather than partially placing them. The diamond grid, sprites, port arrows, conveyor direction and mouse picking share one isometric camera.

## Production chains

- **Bread:** wheat field → wheat → mill → flour → bakery → bread.
- **Alcohol:** orchard → fruit → press → juice → fermentation barrels → fermented juice → bottling works → alcohol.
- **Milk:** wheat field → wheat → feed mill → animal feed → dairy → milk.
- **Cakes:** flour + milk + sugar → cake kitchen → cake. The prototype sugar works grows and refines beet sugar on site.

Each recipe and its duration appears in the construction palette and inspector. All buildings occupy 3 × 3 tiles. Outputs are gold and inputs blue. Each ingredient has a dedicated input tile; hover over it to see the material name. Rotation changes all port positions and their entry directions. The painted machine illustration retains its camera angle while the logical ports rotate.

Production buildings hold up to 8 of **each** input and 4 outputs. They wait for all recipe ingredients and stop when output storage fills. Belts hold one parcel per tile, advance every 0.3 simulation seconds, and back up when blocked. The farmhouse accepts bread, alcohol, and cake at separate ports and counts deliveries.

## Workers and food return

Workers’ cottages house three residents each. Machines do not create workers: residents fill one job per production building, within 36 reachable walking tiles. Vacant machines stop producing. Housing demolition makes its residents leave, and jobs are reassigned after construction changes. The population and jobs bar and building inspector expose vacancies. Two pigs patrol the farmhouse. Animals walk on open ground around their workplaces, avoiding building footprints and conveyors except at marked street crossings. Residents commute during a 140-second work shift, then return home for 40 seconds. Production requires the assigned worker physically at work; food trips and long commutes reduce output. Streets are preferred when they save travel time. Employment eligibility remains based on the stable home-to-job route, never a temporary meal trip. Leave gaps for foot traffic. New construction relocates any animal it covers to the nearest open tile, and undo restores the whole simulation state.

By default, the farmhouse returns 20% of bread and cake deliveries as **worker rations**. In **Pigs’ estate**, select 10% austerity, 20% standard or 40% generous rations. This affects future deliveries only; queued rations are preserved. The remainder is retained by the pigs. Alcohol is exclusively retained for the pigs. Connect the green output dock to a **Ration depot**, found under **Worker provisions**. Each depot occupies 3 × 3 tiles and stockpiles up to 32 rations. Workers prefer a stocked depot they can reach and collect meals from open ground around its perimeter. Multiple workers can visit without reserving the entire stockpile. Keep walking routes open.

An accessible conveyor end still works as a fallback when there is no reachable depot with available stock. Workers must walk to an adjacent tile to collect the parcel. Depots accept only rations at their marked green input, whose position rotates with R. They do not require an extra worker. Inspect a depot to see its stockpile and meals served.

A ration restores 25 food points. Workers start with some food and lose 4.5 points per simulation minute. Below 30 food points, their building's production gradually falls toward 50% speed. The workforce bar tracks average food and meals collected; inspect a building to see its worker's food, activity and productivity. These are initial prototype tuning values.

The farmhouse always accepts correctly routed bread, cake and alcohol, even when its ration outlet is blocked or a depot is full. It holds four prepared rations and queues the remaining food share for later conversion without a storage cap. Clearing the return line drains that queue; the inspector shows queued rations. Full depots back up only the return conveyor, never farmhouse intake. The alcohol starter demonstrates its production chain only; add bread or cake production if you want to feed its workers.

## Neighborhood services

Build services under **Worker provisions**. A **Village well** supplies homes within 12 reachable walking tiles. A **Clinic** covers the same distance while its assigned worker is physically present during the work shift. Water supports health, clinics speed recovery, and hunger and missing water gradually damage health. Services, food and employment affect contentment. Health and contentment modify productivity; both are visible in the settlement bar and worker inspector. Service reach is refreshed every two simulation seconds and follows open paths, including street crossings.

A **Communal kitchen** stores 32 incoming rations like a depot. With a cook present it restores 40 food per ration instead of 25. When unstaffed or closed it still serves ordinary rations. Clinics and kitchens use the same resident workforce as factories, so build housing before expanding services. Food pickup remains available at depots and conveyor ends.

## The pigs’ estate

Open **Pigs’ estate** above the starter selector to see retained goods, approval, daily demands and expansion requirements. The estate expands through three levels. A **Private pavilion** takes a 3 × 3 plot and a resident attendant away from other jobs. Level II needs one staffed pavilion plus 20 bread and 5 alcohol. Level III needs two staffed pavilions plus 35 bread, 10 alcohol and 8 cake. Expansion spends retained stock once; it does not touch queued worker rations.

Every 180-second day, the pigs consume a real allowance from retained stock: level I takes 4 bread; level II takes 6 bread and 2 alcohol; level III takes 8 bread, 3 alcohol and 2 cake. Each required pavilion needs 60 seconds of actual attendance for full daily service. Meeting the allowance and service raises approval by 8; shortfalls reduce it. Estate privilege, austerity and pressure from dissatisfied pigs reduce worker contentment, which affects productivity. Generous rations improve food security but leave less stock for estate expansion and allowances.

Construction currently uses space and labor rather than a universal currency. The three starter layouts are production examples; build additional chains on the same map to supply a higher-level estate. These are initial tuning values, not a finished difficulty curve.

## Artwork

The game uses 32 transparent character poses (8 animals × 4), 8 animation strips and 12 painted building sprites plus isometric vector illustrations for cottages, ration depots and neighborhood services. Animals occupy real ground positions outside the buildings and are drawn in depth order. Walk animation follows actual movement. The walk poses are a coarse two-frame draft, and left-facing characters are mirrored.

Open **View the character & machine sheets** in the sidebar (or `/sprites.html`) to inspect all sprites on light, dark, farm and checkerboard backgrounds. PNG assets and the character manifest live in `dist/assets/`. Source art, generation prompts and review sheets live in `art/`.

More detailed estate artwork, universal construction costs, saving, and a full society-collapse model remain future iterations. Reloading starts a fresh farm.

## Review gates

See [REVIEW.md](REVIEW.md) for the hostile review record for this implementation.

## Verification

```sh
npm run check
```

Checks syntax, all production chains, ingredient-specific ports in every rotation, inventory backpressure, isometric picking, straight-line placement, collisions, corners, merges, walking around obstacles, reachable and blocked ration pickups, food conversion, uninterrupted farmhouse intake, depot capacity and preference, conveyor fallback, hunger effects, undo, and sprite dimensions/RGBA format.
