# Character turnaround references

Seven new four-view sheets for the remaining Animal Factory Tactics roster, matching the bright, high-contrast painted finish of the approved horse and goat.

Browse locally at `http://127.0.0.1:4389/tactics/character-model-references.html`. The gallery includes the existing horse and goat sheets, each original sprite, and PNG download links.

| Character | Selected sheet | Generation prompt |
| --- | --- | --- |
| Donkey | [PNG](../../dist/assets/characters/model-references/donkey-turnaround-v2.png) | [Prompt](character-reference-prompts/donkey.txt) |
| Sheep | [PNG](../../dist/assets/characters/model-references/sheep-turnaround-v1.png) | [Prompt](character-reference-prompts/sheep.txt) |
| Cow | [PNG](../../dist/assets/characters/model-references/cow-turnaround-v1.png) | [Prompt](character-reference-prompts/cow.txt) |
| Hen | [PNG](../../dist/assets/characters/model-references/hen-turnaround-v2.png) | [Prompt](character-reference-prompts/hen.txt) |
| Pig Foreman | [PNG](../../dist/assets/characters/model-references/pig-foreman-turnaround-v2.png) | [Prompt](character-reference-prompts/pig-foreman.txt) |
| Pig Director | [PNG](../../dist/assets/characters/model-references/pig-director-turnaround-v2.png) | [Prompt](character-reference-prompts/pig-director.txt) |
| Skunk | [PNG](../../dist/assets/characters/model-references/skunk-turnaround-v1.png) | [Prompt](character-reference-prompts/skunk.txt) |

## Use and provenance

Created with the **built-in ImageGen tool**, using the original idle sprite for species, costume and palette, and the goat sheet for layout and painted style. Each sheet uses front, right-facing profile, back, and left-facing profile views on grey. All selected PNGs are 1774 × 887 pixels.

These seven images are concept/modeling references, not textures registered to existing meshes. Back construction and hidden markings are proposed interpretations where the original sprite does not show them. Each animal is individually framed, so the sheets do not define relative species heights or alter prototype dimensions. Some profiles have illustrative perspective; establish precise orthographic proportions in the grey model. Future character work should use the accepted roughly 30k authoring → 10k game-mesh workflow, with a fresh mesh-registered paint pass.

Existing horse and goat painted-model assets remain their own baselines. This task adds no new 3D characters or gameplay replacement.

## Hostile review

All seven selected sheets reached **9/10 for usable concept/modeling reference**. Review checked species and outfit fidelity, cross-view anatomy and markings, uncropped framing, and graphic finish.

- Sheep, cow and skunk passed their first versions.
- Donkey v2 removes the incorrectly repeated knee patch from the right-facing profile. The single patch stays on the anatomical left knee.
- Hen v2 aligns the rear tail with the raised fan in both profiles.
- Foreman v2 adds the missing tail in the right-facing profile.
- Director v2 removes an extra ear-like crown shape in the front view.

The four localized edit prompts are stored beside the generation prompts with the `-correction.txt` suffix. Only selected images are delivered in the gallery. This review is not approval of finished geometry, rigging, UV registration or animation.

## Validation

The gallery is checked at desktop and phone widths for image loading, working full-size/download links, and horizontal overflow. The Pages distribution build includes the gallery and selected PNGs. Delivery is on `sprite-migration`; the separate published 3D project is unchanged.
