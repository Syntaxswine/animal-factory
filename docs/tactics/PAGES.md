# Pages distribution and reusable editor designs

The private development repository cannot enable Pages under its current GitHub plan (API422). A public distribution is prepared locally at `.pages-output`, built by `npm run build:tactics-pages`. This copies an explicit list of game/editor modules and PNG assets; development history and other project files are excluded.

Public repository: `Syntaxswine/animal-factory-tactics-pages`. The user explicitly approved the public push. Pages is live over HTTPS with entrypoints `/tactics/index.html` and `/tactics/editor.html`; a root landing page links both. GitHub Pages builds automatically from main at `/`. Deployment run34913718858 completed successfully. Browser verification confirmed rendered game sprites, editor validation, and a named24×24 block save surviving reload on the hosted origin.

Subsequent releases: run source checks, rebuild the distribution, review its diff, commit and push both the source branch and distribution branch.

Editor validation:109 automated tests pass; hostile review4/5. Browser tests saved a24×24 workshop, reopened it after reload, placed it in sector2,2 of a240×240 map, saved/reloaded the full map, and verified named-save updates. Import tests cover bounds, three-level geometry, invalid values, edge aliases, atomic placement and undo. The hostile review identified and resolved save/workspace races and schema normalization gaps.
