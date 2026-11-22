[![make.fun](https://make.fun/badge/best-stealth-game-20261121-1759.svg)](https://make.fun/c/best-stealth-game-20261121-1759)
[![rank](https://make.fun/badge/best-stealth-game-20261121-1759/indrairawan4503-cmd/best-stealth-game-20261121-1759-entry/rank.svg)](https://make.fun/c/best-stealth-game-20261121-1759)
[![reward](https://make.fun/badge/best-stealth-game-20261121-1759/indrairawan4503-cmd/best-stealth-game-20261121-1759-entry/reward.svg)](https://make.fun/c/best-stealth-game-20261121-1759)

# Museum at Night

A top-down 2D stealth game for the [best stealth game bounty](https://make.fun/c/best-stealth-game-20261121-1759) on make.fun.

You are a thief who slips into a museum after dark. Four guards walk patrol
loops past statues, display cases and benches, sweeping the floor with
yellow vision cones. Learn their routes, wait for a cone to turn, hide
behind cover, and slip through the shadows. Steal the **Golden Ibis** from
the north gallery, then reach the green **EXIT** door — unseen.

## How to play

Open `game/index.html` in a desktop browser (or serve `game/` with
`node serve.ts` and open http://localhost:8080). No network needed.

- **WASD / arrow keys** — move
- **SHIFT** — run (faster, but loud: guards spot a runner much sooner)
- **E** — toss a coin to lure the nearest guard away and investigate the clink
- **M** — mute · **R** — restart · **ENTER / click** — start, play again

## The stealth rules

- A guard's **vision cone** is what they can see. Step into it and their
  suspicion climbs — faster up close, faster still if you run.
- **Cover** (statues, display cases, benches, palms) blocks sight completely:
  break line of sight and suspicion falls again.
- **Shadows** (the dark corners) slow suspicion to half speed.
- At full suspicion a guard gives chase and sounds the alarm. Lose them for
  a few seconds and they give up and go back to patrol — but if one touches
  you, you are **caught**.
- **Footsteps** tell you where a guard is: the nearer the patrol, the louder
  the steps. Your own steps are quiet unless you run.
- Optional gold coins add score; the Golden Ibis is worth 500 and the exit
  pays a time bonus.

## Files

- `game/index.html` + `game/src/` — the game (plain canvas 2D, no library):
  `config.js` (level + tuning), `world.js` (rules + guard AI),
  `render.js` (all drawing), `input.js`, `audio.js` (synthesised sound),
  `shots.js` (screenshot scenes), `main.js` (game loop).
- `main.ts` — copies `game/` and `screenshots/` to `/output` and writes
  `/output/dossier.json` (run with `MAKEFUN_OUTPUT_DIR=out node main.ts`).
- `screenshots/` — real renders of the game in a browser: the full level,
  a mid-sneak near a cone, a full-alarm chase, and the clean getaway.

Built with make.fun — referral code `8dxq9bq0`.
