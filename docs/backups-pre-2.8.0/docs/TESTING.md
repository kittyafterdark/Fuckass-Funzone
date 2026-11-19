# Acceptance checklist (staging)

1. Spindle Import Local sees `bird_brain` with manifest name/version and only `ui_panels` requested.
2. Enabling mounts a drawer tab and float widget; float starts hidden. Open each game from drawer and from chat input action.
3. Press start and test mouse taps, Space while canvas focused, hold/release in jetpack mode, and touch on mobile.
4. Switch bird → Gabi → bird. Lives, score, pipes, coins and animation state reset coherently.
5. Send a real generation; it should auto-open once. Try duplicates/stop/end and finish with gameplay ongoing: game keeps moving, ready indicator appears.
6. Change `Open on generation` to off; next generation should not open automatically. Restore to on.
7. Enable `Auto-hide when idle`; finish a generation on the lobby screen or game-over screen: closes. Finish while actively playing: **does not close**.
8. Blur the window or switch tabs while playing: should pause without a giant physics step on resume.
9. Resize/drag on desktop and check mobile viewport; minimize and reopen with preserved paused game.
10. Toggle sound off/on, test invalid/corrupt browser local storage, unload/re-enable repeatedly, ensure no duplicated generation handlers or dangling arcade windows.

Code-only harness: `node --test tests/*.test.mjs` (18 automated tests). The included `demo.html` is a standalone fake-host mock, **not** proof that a live Spindle install works.

## v1.1.0 visual regression pass

11. Open `assets/cover/sprite-preview.png`: no duplicate bird wings, cut-off faces, stray adjacent jet flames, additional hearts, or detached cloud pieces.
12. Bird still cycles through all six flight frames. As of v2.6.3 Gabi only cycles calm frames 0–2 during idle flight; hold thrust to see 3–5. Check that hair and thrusters remain whole in every expression.
13. Confirm Gabi HUD shows exactly **three distinct single hearts** rather than fragments of a single connected graphic.
14. Review `assets/sprites/manifest.json` for per-sprite explicit source selections. Run `python scripts/build_assets.py` and `node scripts/build.mjs` to check source reconstruction; then `node --test tests/*.test.mjs` (18 automated tests).
15. On upgrade, verify that high scores and settings were retained and the new bundled assets are loaded after unloading/re-enabling the extension.


## v1.2.0 rooftop-and-record regression

16. Gabi mode: run with a prior best above zero. The **specific building** whose pass earns the old best must display the cat flag on the roof of its *lower* skyscraper. It is a visual marker, not an extra collision surface.
17. Once that building is passed, the score should match the old best. Survive one additional building to get the **NEW BEST!** image during active play, and confirm the high score updates in the drawer/HUD. If you then crash, the celebration should still appear in the game-over overlay.
18. If the score grows by several more points in that run, the original flagged building must **not** move or be re-tagged. On retry/new run, the new saved best becomes the marker's target.
19. Gabi's hazards should be purple neon apartment skyscrapers with window patterns and rooflines, not the green Bird pipes; Bird mode must retain its original pipes.
20. Hold thrust to see *actual PNG flames*, no ellipses or smoke dots. Release to stop the extra flame trail. Coin total must be stark white and legible.
21. Run long enough to feel the progressive speed. It should accelerate smoothly but remain bounded to 1.72x the starting speed for that mode/difficulty. Higher speeds must not create gaps in obstacle spawning.
22. Verify local storage, focus behavior, touch gameplay, and generation-state interactions again after upgrade. There was no additional inference-side permission.

Unit/mocked renderer tests (`tests/rendering.test.mjs`) verify flame selection, building-window rendering, milestone flag drawing, coin HUD ink, and NEW BEST/game-over art. These are not a substitute for testing the extension in live Lumiverse.


## v2.6.2 first-frame HUD & flight difficulty QA

23. From Funzone OS, choose **Fuckass Bird** while coming from another game (especially Simon or Duck). Start a round without touching the ground; **SCORE** and **BEST** must be left-aligned inside their HUD pills on the first frame. Repeat after visiting another mini-game and after restarting.
24. In both Bird and Jetpack settings, verify **Chill / Normal / Medium (former Chaos) / Hard** appear and stay synchronized. Change modes during a running round: the current flight is not interrupted and the next retry uses the updated selection.
25. On **Medium**, verify the former 1.28× Chaos physics is unchanged. On **Hard**, hazards are significantly faster/tighter/closer; Bird stays one-hit, and Jetpack Gabi loses on a single collision with one lit heart. The tallest obstacle jumps should still be traversable rather than random unavoidable death.
26. Check an older save with flight `settings.difficulty = "chaos"`. It loads as **Medium**, preserving the old physics, existing bests, shop, and wallet. Duck Hunt's separate Chaos duck-speed preference must remain unchanged.

The code-only checks now include canvas-state bleed simulation, compatibility migration, Hard collision and obstacle scaling, and the real bundled frontend inside a mock Spindle host. Live Lumiverse QA still matters for actual layout pixels.

## v2.6.3 Gabi animation checks

27. Launch Jetpack Gabi without touching thrust. Watch for several seconds: only flight sprites 0–2 should cycle; the open-mouthed 3–5 expressions must never appear during idle cruising.
28. Tap very quickly: expression 3 appears briefly even if the press/release occurs between animation frames. Hold for ~0.15s: expression 4; hold for ~0.35s: expression 5. Release: the last expression lingers ~0.16s before returning to the calm loop.
29. Try both mouse/touch and Space/Up. Also verify reduced-motion mode keeps calm frame 0 while still showing the thrust cue. Pause/resume, die, restart, and switch to Bird; no stale held expressions should leak. Bird retains its unchanged six-frame cycling.

Automated engine and mocked canvas regression tests confirm the frame selection, tap-duration progression, sub-frame taps, release decay, and resets. The self-contained `dist/frontend.js` is rebuilt and exercised in the Spindle host mock. Actual device feel still needs live visual QA.

## Tetris, Solitaire, and Froggy

Run `npm run check` after source changes. The bundler accepts LF or CRLF source checkouts and preserves embedded SVG bytes. The three new rule suites cover collisions, rotations, legal card moves, log support, victory/life transitions, pause, malformed saves, and restore. Mock-host tests exercise the production bundle and existing game compatibility.

30. Launch all twelve games from Funzone OS; check the three new icons, help tabs, personal bests, and scrollable launcher at 292 px and 382 px cabinet widths. Use `demo-classics-qa.html` for local mock-host inspection.
31. Tetris: move against both walls, rotate near the floor, soft/hard drop, hold once per piece, clear rows, and play to top-out. Test arrows/WASD, X/Z, C, Space, and every touch button. Pause, blur, reload, and switch games with a piece in flight; the board, preview, hold, and score must survive.
32. Solitaire: draw through the stock, recycle the waste, move alternating-color runs, reveal face-down cards, move Aces to foundations, return a foundation card to the tableau, and undo. Try every action with taps and with arrows/Enter, D, F, Z/U. Win and undo the last move by mouse and keyboard. Reload keeps the board and clears session undo history. Repeating a foundation move after undo must not re-award ticket milestones.
33. Froggy: use touch pad and arrows/WASD, cross each road, ride logs in both directions, drift off a bank, miss a log, reach an occupied home, and lose the final life. Fill five unique homes and verify the next level resets homes and increases lane speed. Pause/blur freezes traffic, logs, and the frog; reload resumes paused without losing the run.
34. With each new game active, trigger generation start/end/stop and verify that readiness does not interrupt play. Type arrows and Space in the chat input and verify they do not control the arcade. Minimize, reopen, unload/re-enable, and confirm that the old scores, tickets, cosmetics, saved puzzles, and installation identifier remain intact.

The preview and automated mock do not establish a successful live Lumiverse install. Complete these checks in Lumiverse on desktop and a touch device before treating the contribution as release-ready.

## v2.7.0 Catmate Chess, Berry Drop, Tic Tac Treats, Cake Tower, Bubble Bloom, Boop-a-Bun, Wobbly Wafers, and Gacha Match

Run `npm run check` after source changes. The eight new rule suites cover chess perft counts, checkmate, stalemate, undo, Gabu's search at each level, four-in-a-row and tic-tac-toe lines and blocks, cake landing, misses and the pendulum swing, bubble popping, falling, row pushes and level clears, bunny scoring and escapes, wafer stacking rules and toppling, capsule pairing and memory lapses, pace effects, pause, malformed saves, and restore. `tests/sweets-integration.test.mjs` drives the production bundle in the mock host, including Gabu's reaction faces, the Sound toggle, and touch presses on the phone launcher.

35. Launch all twenty games from Funzone OS; check the eight new icons, help tabs, difficulty or pace selects, and personal bests. On a phone, and at 292 px and 382 px cabinet widths, scroll the launcher to the bottom: The Prize Counter and the Continue button must be reachable on screen. Swiping the launcher list on a touch screen must scroll it without dragging the whole cabinet; dragging by the header still moves it. In Boop-a-Bun, Tic Tac Treats, Wobbly Wafers and Gacha Match, the keyboard cursor appears only after an arrow key and hides again on the next tap. Use `demo-classics-qa.html?game=chess` (or `berry`, `tictac`, `cake`, `bubble`, `boop`, `wafer`, `memory`) for local mock-host inspection.
36. Catmate Chess: move by tap and by arrows/Enter, castle both ways, capture en passant, promote a pawn, give and escape check, and undo with Z and the Undo button, including after a finished game. Gabu should answer within about a second on every level. Pause while Gabu is thinking; it must not move until you resume.
37. Berry Drop and Tic Tac Treats: play with taps, arrows plus Space, and number keys. Win a round, lose a round, and draw a round. A win or draw adds to the streak and the next tap deals a new board with the other side starting; a loss ends the streak. Hard Tic Tac Treats should never lose.
38. Cake Tower: land perfect tiers, sloppy tiers, and complete misses. A tier whose middle misses the tier below tips gently and falls off the bottom of the screen, never flipping over; each miss costs a heart, and caught tiers never fall on their own however much the cake wobbles. The ribbon swings on a pendulum arc and bows behind its motion, and the hanging tier must stay clear of the scoreboard at both ends of the swing. With a Gabu line showing, the stand and the bottom tiers must stay visible above it. The sky should climb from morning to a starry night as the cake gets taller. Compare Chill and Chaos swing speed.
39. Bubble Bloom: aim by hover, drag, and arrows; bank a shot off each wall; pop a cluster that drops hanging bubbles; let a row push in; clear a board; and let the bubbles cross the dashed line. C swaps the next bubble. The aim dots must stay still, with no flicker or marching.
40. Boop-a-Bun: boop bunnies by tap, number keys, and arrows plus Space. A golden bunny pays 50, a robot costs 20 and the streak, and empty burrows count as whiffs. The 45-second clock stops while paused and the round ends with TIME'S UP. The keyboard cursor ring sits under the burrow, never over a bunny.
41. Wobbly Wafers: pick a wafer by tap and by arrows plus Space, switch to another wafer, cancel with Escape, and pull with the meter in the green and in the red. The top two layers must refuse a pull; pulling the support out from under a lone edge topples everything above that layer toward the empty side, while the layers below stay standing. Fallen wafers land on the saucer or table, never in the air. Let Gabu topple it to extend the streak, and topple it yourself to end the run.
42. Gacha Match: play Cozy, Classic, and Busy trays by tap and keyboard. Each tray starts with every capsule open for its memorize countdown (3, 3.5, 4 seconds) with the clock stopped, then the lids close; a tap ends it early. Found pairs fade back and the capsules you have open this turn glow pink, so the ones still in play are obvious late in a tray. A miss stays visible briefly and a third tap turns it back down. Missing a pair you had already opened should earn Gabu's memory-lapse roast. Finish a tray and confirm the win screen.
43. With Gabu commentary on, confirm the new games use Gabu's existing faces: hype when Gabu beats you and for a NEW BEST, panic when Gabu loses or when you die in a solo game, smug for ordinary progress, dizzy for draws. Ordinary moves must not trigger a line every time. With Sound off, the new games must be silent; with Sound on, they use the same synth as the rest of the arcade. Reduced motion should still show every gameplay cue.
44. For each new game, pause, blur the window, switch games, reload, and re-enable the extension. Each board resumes paused with its score intact, Bubble Bloom keeps a shot that was in flight in the launcher, and Boop-a-Bun resumes with its clock and an empty garden. Typing arrows, digits, or Space in the chat input must not control the arcade.

As before, the preview and automated mock do not establish a successful live Lumiverse install. Complete these checks in Lumiverse on desktop and a touch device before treating the contribution as release-ready.


## Gambit replayability expansion

Run `npm run check` for the combined twenty-one-game bundle. `node scripts/gambit-balance.mjs --seeds 6` runs a deterministic legal-play smoke test across all four starting decks; `--all-packs` includes Craft and Playing Card purchases. Its JSON includes the strongest run's reproducible action trace. The greedy policy favors growth and does not estimate player win rates.

For visual/manual checks, serve `demo-gambit-qa.html`. Check the playable run plus isolated shop, normal pack, Mega pack, Craft, Playing Card, and victory examples at 382 px and 292 px cabinet widths. Inspect all five Mega options, claim one, reload, and claim a different option. With five Jokers, replace or decline an incoming Joker and continue the second paid choice. Inspect Glass risk before committing a card change. Open Run Info, card-effect help, and every Joker Collection page/filter. Check long score reports and scientific notation without covering controls.

Live Lumiverse acceptance remains pending. Verify an existing version-one hand, score screen, paid pack, and finished win before starting a fresh run. Classic runs should retain their original six-round rules and paid options; fresh runs should offer four starting decks and the expanded campaign. Test resource and selection bosses, minimize/reopen, generation start/end/stop, blur, unload/re-enable, sound off, touch input, and other game saves/records. Finish Ante 8 and verify both Bank the Win and Continue Endless. Player feedback is still needed for difficulty, build diversity, economy, and individual Joker usefulness.
