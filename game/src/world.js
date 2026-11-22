// Museum at Night — the world: player movement, guard patrols, vision
// cones, suspicion, chase and escape. Everything here is pure game rules;
// drawing lives in render.js.
import {
  ARTIFACT,
  BLOCKERS,
  COINS,
  COVER,
  EXIT,
  GUARD,
  GUARDS,
  PLAYER,
  SHADOWS,
  SPAWN,
  STEP,
  THIEF,
  pointInRect,
  segmentBlocked,
} from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_CAUGHT = 'caught';
export const SCREEN_WIN = 'win';

export const EVENT_NONE = 0;
export const EVENT_NOTICED = 1;
export const EVENT_ALARM = 2;
export const EVENT_CAUGHT = 4;
export const EVENT_WIN = 8;
export const EVENT_COIN = 16;
export const EVENT_ARTIFACT = 32;
export const EVENT_TOSS = 64;
export const EVENT_GAVE_UP = 128;

function makeGuard(def, index) {
  const start = def.waypoints[0];
  return {
    index,
    name: def.name,
    x: start.x,
    y: start.y,
    // Facing angle in radians; starts looking down the patrol route.
    facing: Math.atan2(
      def.waypoints[1].y - start.y,
      def.waypoints[1].x - start.x,
    ),
    waypoint: 1,
    pauseLeft: 0,
    // patrol | investigate | chase
    mode: 'patrol',
    suspicion: 0,
    // Where a chasing or investigating guard is heading.
    targetX: start.x,
    targetY: start.y,
    lookAroundLeft: 0,
    // Seconds since this guard last saw the thief (chase only).
    unseenFor: 0,
    // Remember whether suspicion crossed 60, so the "noticed" sound fires once.
    noticed: false,
    // Footstep timer for the audible walk.
    stepTimer: 0,
    // Seconds this guard has been trying to move without getting anywhere;
    // past the limit the guard gives up on the current leg (a patrol that
    // wedged itself against cover recovers instead of standing still).
    stuckFor: 0,
  };
}

export class World {
  constructor() {
    this.reset();
  }

  reset() {
    this.player = {
      x: SPAWN.x,
      y: SPAWN.y,
      facing: -Math.PI / 2,
      moving: false,
      running: false,
      stepTimer: 0,
      hasArtifact: false,
      coinsLeft: THIEF.coins,
      thrown: null,
    };
    this.guards = GUARDS.map((def, i) => makeGuard(def, i));
    this.coins = COINS.map((c) => ({ ...c }));
    this.screen = SCREEN_TITLE;
    this.time = 0;
    this.score = 0;
    this.toss = null;
    this.alarm = 0; // Highest suspicion across guards, 0..100.
    this.message = '';
    this.messageLeft = 0;
  }

  start() {
    this.reset();
    this.screen = SCREEN_PLAY;
  }

  // One fixed step of the game. `move` is a normalised {x,y} or null,
  // `running` is Shift, and the booleans are one-frame actions.
  step(dt, move, running, throwCoin) {
    if (this.screen !== SCREEN_PLAY) return EVENT_NONE;
    this.time += dt;
    let events = EVENT_NONE;
    const player = this.player;

    if (move) {
      const speed = running ? PLAYER.runSpeed : PLAYER.walkSpeed;
      player.facing = Math.atan2(move.y, move.x);
      player.moving = true;
      player.running = running;
      this._movePlayer(move.x * speed * dt, move.y * speed * dt);
      player.stepTimer -= dt;
      if (player.stepTimer <= 0) {
        player.stepTimer = running ? 0.28 : 0.42;
        events |= this._footstepEvent();
      }
    } else {
      player.moving = false;
      player.running = false;
    }

    if (throwCoin && player.coinsLeft > 0 && !this.toss) {
      player.coinsLeft -= 1;
      const tx = player.x + Math.cos(player.facing) * THIEF.throwRange;
      const ty = player.y + Math.sin(player.facing) * THIEF.throwRange;
      this.toss = { x: tx, y: ty, left: 2.6, landed: true };
      events |= EVENT_TOSS;
      // The clink draws the nearest guard to the landing spot.
      let nearest = null;
      let nearestDist = Infinity;
      for (const guard of this.guards) {
        const d = Math.hypot(guard.x - tx, guard.y - ty);
        if (d < nearestDist) {
          nearestDist = d;
          nearest = guard;
        }
      }
      if (nearest && nearestDist < 320 && nearest.mode !== 'chase') {
        nearest.mode = 'investigate';
        nearest.targetX = tx;
        nearest.targetY = ty;
        nearest.lookAroundLeft = 2.2;
      }
    }

    if (this.toss) {
      this.toss.left -= dt;
      if (this.toss.left <= 0) this.toss = null;
    }

    // Pick up coins and the artifact by walking over them.
    for (const coin of this.coins) {
      if (!coin.taken && Math.hypot(player.x - coin.x, player.y - coin.y) < 26) {
        coin.taken = true;
        this.score += 100;
        events |= EVENT_COIN;
      }
    }
    if (
      !player.hasArtifact &&
      Math.hypot(player.x - ARTIFACT.x, player.y - ARTIFACT.y) < 42
    ) {
      player.hasArtifact = true;
      this.score += 500;
      events |= EVENT_ARTIFACT;
      this._say('The Golden Ibis is yours — now reach the green EXIT door!');
    }

    // Reach the exit carrying the artifact: win.
    if (player.hasArtifact && pointInRect(player.x, player.y, EXIT)) {
      this.screen = SCREEN_WIN;
      this.score += Math.max(0, 600 - Math.floor(this.time) * 2);
      return events | EVENT_WIN;
    }

    for (const guard of this.guards) {
      const before = guard.suspicion;
      events |= this._stepGuard(guard, dt);
      if (before < 60 && guard.suspicion >= 60 && !guard.noticed) {
        guard.noticed = true;
        events |= EVENT_NOTICED;
      }
      if (guard.suspicion < 60) guard.noticed = false;
      if (guard.mode === 'chase' && Math.hypot(guard.x - player.x, guard.y - player.y) < GUARD.catchDistance) {
        this.screen = SCREEN_CAUGHT;
        return events | EVENT_CAUGHT;
      }
    }

    this.alarm = Math.max(0, ...this.guards.map((g) => g.suspicion));
    if (this.messageLeft > 0) this.messageLeft -= dt;
    return events;
  }

  // The footstep event carries no data; main.js plays it louder when a
  // guard is near (guard footsteps) — the player's own steps are quieter.
  _footstepEvent() {
    return EVENT_NONE;
  }

  _say(text) {
    this.message = text;
    this.messageLeft = 4;
  }

  // Move the thief, sliding along walls and cover instead of sticking.
  _movePlayer(dx, dy) {
    const p = this.player;
    if (!this._hitsBlocker(p.x + dx, p.y, PLAYER.radius)) p.x += dx;
    if (!this._hitsBlocker(p.x, p.y + dy, PLAYER.radius)) p.y += dy;
  }

  _hitsBlocker(x, y, radius) {
    for (const rect of BLOCKERS) {
      const nearestX = Math.max(rect.x, Math.min(x, rect.x + rect.w));
      const nearestY = Math.max(rect.y, Math.min(y, rect.y + rect.h));
      if (Math.hypot(x - nearestX, y - nearestY) < radius) return true;
    }
    return false;
  }

  // Does this guard see the thief right now? Range, cone angle and a
  // clear line of sight all have to agree.
  guardSees(guard) {
    const p = this.player;
    const dx = p.x - guard.x;
    const dy = p.y - guard.y;
    const dist = Math.hypot(dx, dy);
    if (dist > GUARD.viewRange) return { seen: false, dist };
    let angle = Math.atan2(dy, dx) - guard.facing;
    while (angle > Math.PI) angle -= Math.PI * 2;
    while (angle < -Math.PI) angle += Math.PI * 2;
    if (Math.abs(angle) > GUARD.viewHalfAngle) return { seen: false, dist };
    if (segmentBlocked(guard.x, guard.y, p.x, p.y)) return { seen: false, dist };
    return { seen: true, dist };
  }

  _playerInShadow() {
    const p = this.player;
    return SHADOWS.some((s) => pointInRect(p.x, p.y, s));
  }

  _stepGuard(guard, dt) {
    const p = this.player;
    let events = EVENT_NONE;
    const sight = this.guardSees(guard);

    // --- Suspicion: rises while seen, falls while hidden. ---
    if (sight.seen) {
      const closeness = 1 - sight.dist / GUARD.viewRange;
      let rate = GUARD.spotRate * (0.35 + 0.65 * closeness);
      if (p.running) rate *= PLAYER.runSpotMultiplier;
      if (this._playerInShadow()) rate *= 0.5;
      guard.suspicion = Math.min(100, guard.suspicion + rate * dt);
      guard.unseenFor = 0;
    } else {
      guard.suspicion = Math.max(0, guard.suspicion - GUARD.decayRate * dt);
      if (guard.mode === 'chase') guard.unseenFor += dt;
    }

    // Full suspicion trips the chase.
    if (guard.suspicion >= 100 && guard.mode !== 'chase') {
      guard.mode = 'chase';
      guard.unseenFor = 0;
      events |= EVENT_ALARM;
      this._say(`${guard.name} spotted you! Break line of sight to escape!`);
    }

    // A chasing guard that loses the thief for long enough gives up:
    // suspicion drops, the guard walks back to the patrol route.
    if (guard.mode === 'chase' && guard.unseenFor >= GUARD.giveUpSeconds) {
      guard.mode = 'patrol';
      guard.suspicion = 35;
      guard.unseenFor = 0;
      events |= EVENT_GAVE_UP;
      this._say(`${guard.name} lost you in the dark. Stay quiet.`);
    }

    // --- Movement for the guard's current mode. ---
    let speed = 0;
    let targetX = guard.x;
    let targetY = guard.y;
    if (guard.mode === 'patrol') {
      const def = GUARDS[guard.index];
      const waypoint = def.waypoints[guard.waypoint];
      if (guard.pauseLeft > 0) {
        guard.pauseLeft -= dt;
        // Scan the room while waiting at a corner.
        guard.facing += dt * 0.9;
      } else {
        targetX = waypoint.x;
        targetY = waypoint.y;
        speed = GUARD.patrolSpeed;
        const dist = Math.hypot(targetX - guard.x, targetY - guard.y);
        if (dist < 6) {
          guard.waypoint = (guard.waypoint + 1) % def.waypoints.length;
          guard.pauseLeft = def.pause;
        }
      }
    } else if (guard.mode === 'investigate') {
      targetX = guard.targetX;
      targetY = guard.targetY;
      const dist = Math.hypot(targetX - guard.x, targetY - guard.y);
      if (dist < 8) {
        guard.lookAroundLeft -= dt;
        guard.facing += dt * 1.4;
        if (guard.lookAroundLeft <= 0) guard.mode = 'patrol';
      } else {
        speed = GUARD.investigateSpeed;
      }
    } else {
      // Chase: head straight for the thief while seen, else for the last
      // place the thief was spotted.
      if (sight.seen) {
        guard.targetX = p.x;
        guard.targetY = p.y;
      }
      targetX = guard.targetX;
      targetY = guard.targetY;
      speed = GUARD.chaseSpeed;
    }

    if (speed > 0) {
      const dx = targetX - guard.x;
      const dy = targetY - guard.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 0.5) {
        const step = Math.min(dist, speed * dt);
        // Slide along walls and cover one axis at a time, like the thief,
        // so a guard rounds a corner instead of stopping against it.
        const nx = guard.x + (dx / dist) * step;
        const ny = guard.y + (dy / dist) * step;
        const beforeX = guard.x;
        const beforeY = guard.y;
        if (!this._hitsBlocker(nx, guard.y, GUARD.radius)) guard.x = nx;
        if (!this._hitsBlocker(guard.x, ny, GUARD.radius)) guard.y = ny;
        const moved = Math.hypot(guard.x - beforeX, guard.y - beforeY);
        if (moved < step * 0.2) {
          guard.stuckFor += dt;
        } else {
          guard.stuckFor = 0;
        }
        // Wedged for over half a second: drop the current leg. A patrol
        // skips to its next waypoint; a chase or investigation is abandoned
        // and the guard walks back to the patrol route.
        if (guard.stuckFor > 0.6) {
          guard.stuckFor = 0;
          if (guard.mode === 'patrol') {
            guard.waypoint = (guard.waypoint + 1) % GUARDS[guard.index].waypoints.length;
          } else {
            guard.mode = 'patrol';
            guard.suspicion = Math.max(0, guard.suspicion - 30);
          }
        }
        guard.facing = Math.atan2(dy, dx);
        guard.stepTimer -= dt;
        if (guard.stepTimer <= 0) {
          guard.stepTimer = 0.5;
          // Footsteps are audible: main.js plays them louder when the
          // nearest guard is close, so sound tells where a guard is.
        }
      }
    }
    return events;
  }

  // How close the nearest guard is, for the footstep volume.
  nearestGuardDistance() {
    let best = Infinity;
    for (const guard of this.guards) {
      best = Math.min(best, Math.hypot(guard.x - this.player.x, guard.y - this.player.y));
    }
    return best;
  }

  get coinsTaken() {
    return this.coins.filter((c) => c.taken).length;
  }

  get coinsTotal() {
    return this.coins.length;
  }
}

// A fresh world with a fixed number of steps already played, for the
// screenshot scenes in shots.js.
export function steppedWorld(steps, moveFn) {
  const world = new World();
  world.screen = SCREEN_PLAY;
  for (let i = 0; i < steps; i += 1) {
    const move = moveFn ? moveFn(world, i) : null;
    world.step(STEP, move, false, false);
    if (world.screen !== SCREEN_PLAY) break;
  }
  return world;
}
