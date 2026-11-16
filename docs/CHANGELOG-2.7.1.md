# Fuckass Funzone 2.7.1 — Settled wafers and a clearer Gabu

## Fixed: Wobbly Wafers pieces sliding off screen after a topple

After the tower fell, the first few wafers landed normally, but the rest slid sideways across the others while still tilted and disappeared off the edge of the screen. Two things caused it: the topple threw wafers so hard that most landed near the edge, and a wafer that landed on another fallen wafer kept sliding at a fixed speed, still tilted, along the whole row. Falling wafers now tip a little in the air, are thrown more gently, and lie flat side by side on the saucer or table, the way the missed tiers in Cake Tower fall. They never stack on each other, so none can float, build a column, or slide away. Across 600 simulated topples (16,257 wafers), every wafer settled flat on screen within 2.7 seconds.

## Changed: turned layers in Wobbly Wafers

In a real tower every other layer is turned, so a wafer above a gap rests on the long wafer running across underneath it. The side view drew every layer as three short ends, which hid that support and made wafers above a gap look like they were floating. Turned layers are now drawn as one long wafer across the tower, with three dots that show which of its wafers are left; a pulled one turns hollow, and a wafer pulled from a turned layer slides out toward you. Tapping the left, middle or right third still picks the same wafer as before, and the rules are unchanged.

## Fixed: Cake Tower wobble warning sounded like a crash

Since 2.7.0 a wobbly cake never loses tiers on its own; wobble only makes it harder to aim. The wobble warning still used the crash buzz and Gabu's panicked face, which suggested something had gone wrong. It now plays a light tick, and Gabu is smug about it instead. The crash buzz plays only when a tier misses and costs a heart.

## Fixed: Gabu's line covering things you need to see

In five of the new games the bottom of the board is in play, and Gabu's line covered it: your back rank in Catmate Chess, the launcher and next bubble in Bubble Bloom, the bottom burrows in Boop-a-Bun, the steady-hand meter in Wobbly Wafers, and the last row of capsules in Gacha Match. In those games his line now sits over the title bar, the same way Plinko already moves it. In all eight new games the bubble uses a slightly smaller face and text, so it stays clear of the board on the narrow 292 px cabinet too, including the cake stand in Cake Tower. Kitty's original games keep their existing bubble.

**No changes** to any game's rules, scoring, difficulty, ticket milestones, Gabu's lines, or saves. Existing saves load as they are.

## Files and safety

- `src/wafer.js`: gentler topple and flat landing for fallen wafers.
- `src/wafer-render.js`: turned layers drawn as one long wafer with dots, and the pull animation for them.
- `src/frontend.js`: the light wobble cue for Cake Tower and one sentence about turned layers in the Wobbly Wafers help tab.
- `src/reactions.js`: Gabu's face for the Cake Tower wobble warning.
- `src/style.css`: Gabu's line placement and size in the new games.
- `tests/wafer.test.mjs`: fallen wafers lie flat on screen across 60 random topples.
- `spindle.json`, `package.json`, `scripts/build.mjs`, `docs/TESTING.md`: version and checklist items 45 to 47.
- `dist/frontend.js`: rebuilt.

Original versions of every edited source, config, doc and test are retained at `docs/backups-pre-2.7.1/`. The update manifest lists changed files and their checksums.

## Verification

- `node scripts/build.mjs` builds successfully.
- `node --test tests/*.test.mjs`: **183/183 passed**.
- Gabu's bubble was measured in each new game at 382 px and 292 px cabinet widths, and every new game was put through a random-input stress run (700 taps, keys, drags, pauses, blurs and restarts per game, with reloads) with no page errors and valid saves.
- No storage migration: same `fuckass_funzone:v1:<extensionInstallationId>` namespace.
