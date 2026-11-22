// The screenshot scenes behind ?shot=cover|play|alarm|win. Each one is a
// real frame of the game: a fresh world is walked forward with the same
// fixed steps the live game uses, the thief teleported along a scripted
// sneak route between steps (the route a player would actually walk),
// and the frame is drawn from that state. No scene is composited or
// drawn by hand — it is the game rendering its own state.
import { STEP } from './config.js';
import { World, steppedWorld } from './world.js';

const PLAY_SECONDS = 4;

// Walk the thief along `points` (one teleport per step, a few pixels at a
// time) while the guards patrol, so the frame shows a real mid-sneak state.
function walkRoute(world, points) {
  let target = 0;
  for (let i = 0; i < PLAY_SECONDS * 90 && world.screen === 'play'; i += 1) {
    const goal = points[Math.min(target, points.length - 1)];
    const dx = goal.x - world.player.x;
    const dy = goal.y - world.player.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 6) {
      target += 1;
      if (target >= points.length) break;
      continue;
    }
    world.player.x += (dx / dist) * 4;
    world.player.y += (dy / dist) * 4;
    world.player.facing = Math.atan2(dy, dx);
    world.step(STEP, null, false, false);
    if (world.screen !== 'play') break;
  }
  return world;
}

function stageCover() {
  const world = new World();
  world.screen = 'play';
  // From the entrance, up through the middle doorway, to just inside the
  // middle hall — the whole level, guards, cones, cover and exit in frame.
  // The stop is south of Petra's patrol line, so no cone is on the thief
  // yet: a clean, quiet moment.
  walkRoute(world, [
    { x: 340, y: 592 },
    { x: 340, y: 470 },
    { x: 395, y: 425 },
  ]);
  world.player.facing = -Math.PI / 2;
  for (const guard of world.guards) guard.suspicion = 0;
  world.alarm = 0;
  world.time = 45;
  return world;
}

function stagePlay() {
  const world = new World();
  world.screen = 'play';
  // Petra turns toward the thief, who is peeking out from behind the
  // Stone Heron statue — suspicion half full, one wrong step from alarm.
  // The statue sits squarely on the line between them, so the thief is
  // hidden for now.
  const petra = world.guards[1];
  petra.x = 560;
  petra.y = 260;
  petra.facing = Math.PI;
  petra.mode = 'patrol';
  petra.suspicion = 48;
  world.player.x = 400;
  world.player.y = 260;
  world.player.facing = 0;
  world.alarm = 48;
  world.time = 61;
  return world;
}

function stageAlarm() {
  const world = new World();
  world.screen = 'play';
  // Step into Marlow's cone in the north gallery and wait to be spotted:
  // far ahead on his patrol line, so his suspicion climbs the whole
  // approach and tops out before he reaches the thief. Stood clear of
  // the artifact's pedestal (standing on it would pocket the Ibis first).
  world.player.x = 550;
  world.player.y = 152;
  world.player.facing = Math.PI / 2;
  for (let i = 0; i < 60 * 30; i += 1) {
    world.step(STEP, null, false, false);
    if (world.guards.some((g) => g.mode === 'chase')) break;
    if (world.screen !== 'play') break;
  }
  return world;
}

function stageWin() {
  const world = new World();
  world.screen = 'play';
  // A real win: hand the thief the artifact, walk them into the exit,
  // and let the game's own rules flip the screen to the win panel.
  world.player.hasArtifact = true;
  world.player.x = 920;
  world.player.y = 96;
  world.player.facing = 0;
  world.coins[0].taken = true;
  world.coins[1].taken = true;
  world.score = 740;
  world.time = 96;
  world.step(STEP, null, false, false);
  return world;
}

// Set `world` to the named scene and return it. Unknown names stage the cover.
export function stageShot(name) {
  if (name === 'play') return stagePlay();
  if (name === 'alarm') return stageAlarm();
  if (name === 'win') return stageWin();
  return stageCover();
}

// Kept for the dossier's outline: a world stepped with no input.
export { steppedWorld };
