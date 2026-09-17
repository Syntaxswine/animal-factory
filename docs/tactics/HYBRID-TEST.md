# Hybrid 2D / 3D test

Open `tactics/hybrid-test.html`. This isolated experiment does not change the main game's rendering or combat.

Ground tiles measure 1 x 1 world units; walls are 2 high and 0.16 thick. The orthographic camera starts at 45 degrees azimuth and about 35.26 degrees elevation, preserving the existing 2:1 diamond projection. Drag to orbit and scroll to zoom. Sprite height starts at 1.65 and can be adjusted; standing, kneeling and prone artwork is reused. Camera-facing cards keep their ground anchor and compensate for elevation to match the specified vertical height. Their painted perspective and lighting remain fixed, so unrestricted rotation is a demonstration rather than finished art direction.

The brick material samples the existing wall image's front parallelogram through UV coordinates. No new raster artwork is generated. Texture stretching across long faces and narrow lintels remains visible; a production version should use purpose-made repeating surface textures and consistent UV density.

The visible building boxes also define shot collision. Door and window holes are gaps between those boxes. The same segment/AABB test handles the closed door, roof and a simplified character box; nearest hits win. Shot presets compare doorway, window, solid wall and sill. Ray height is independently adjustable and is not an exact muzzle attachment. There is no penetration, gravity, animation, navigation or connection to the main game's combat rules yet.

Three.js 0.180.0 is vendored under `dist/tactics/vendor/`, including its MIT license. The demo loads all scripts and artwork locally without a CDN dependency. Rendering follows the [Three.js orthographic camera documentation](https://threejs.org/docs/pages/OrthographicCamera.html); texture loading follows [TextureLoader](https://threejs.org/docs/pages/TextureLoader.html).

Run `node --test tests/hybrid-geometry.test.mjs` for opening, solid, roof, parallel-ray and nearest-hit checks. `npm run build:tactics-pages` packages the demo with the existing assets.
