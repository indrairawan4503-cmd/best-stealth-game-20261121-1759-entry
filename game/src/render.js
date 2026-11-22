// Museum at Night — everything drawn on the canvas: the marble floor,
// the rooms and their lamps, statues and cases, the thief, the guards
// with their vision cones, the artifact, the exit, and every screen
// (title, HUD, caught, win). Colours are chosen so a guard and a cone
// read at a glance even when the screenshot is shrunk small.
import {
  ARTIFACT,
  BLOCKERS,
  COVER,
  EXIT,
  GUARD,
  SHADOWS,
  VIEW,
  WALLS,
} from './config.js';
import {
  SCREEN_CAUGHT,
  SCREEN_PLAY,
  SCREEN_TITLE,
  SCREEN_WIN,
} from './world.js';

const FLOOR_A = '#2e2a33';
const FLOOR_B = '#332f38';
const CARPET = '#5a2e3a';
const WALL = '#17141c';
const WALL_TOP = '#3a3340';
const CONE = 'rgba(255, 214, 90, 0.30)';
const CONE_EDGE = 'rgba(255, 214, 90, 0.55)';
const CONE_ALARM = 'rgba(255, 70, 60, 0.38)';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
  }

  draw(world) {
    const ctx = this.ctx;
    ctx.save();
    ctx.clearRect(0, 0, VIEW.width, VIEW.height);
    this._drawFloor(ctx);
    this._drawShadows(ctx);
    this._drawCarpet(ctx);
    this._drawCover(ctx);
    this._drawArtifact(ctx, world);
    this._drawExit(ctx, world);
    this._drawCoins(ctx, world);
    this._drawToss(ctx, world);
    for (const guard of world.guards) this._drawCone(ctx, guard, world);
    this._drawPlayer(ctx, world);
    for (const guard of world.guards) this._drawGuard(ctx, guard);
    this._drawWalls(ctx);
    this._drawLamps(ctx);
    if (world.screen === SCREEN_PLAY) this._drawHud(ctx, world);
    if (world.screen === SCREEN_TITLE) this._drawTitle(ctx);
    if (world.screen === SCREEN_CAUGHT) this._drawCaught(ctx, world);
    if (world.screen === SCREEN_WIN) this._drawWin(ctx, world);
    ctx.restore();
  }

  _drawFloor(ctx) {
    const tile = 40;
    for (let y = 0; y < VIEW.height; y += tile) {
      for (let x = 0; x < VIEW.width; x += tile) {
        ctx.fillStyle = ((x + y) / tile) % 2 === 0 ? FLOOR_A : FLOOR_B;
        ctx.fillRect(x, y, tile, tile);
      }
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= VIEW.width; x += tile) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, VIEW.height);
      ctx.stroke();
    }
    for (let y = 0; y <= VIEW.height; y += tile) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(VIEW.width, y);
      ctx.stroke();
    }
  }

  _drawCarpet(ctx) {
    // A red runner down the middle hall, from the entrance to the gallery.
    ctx.fillStyle = CARPET;
    ctx.fillRect(420, 228, 120, 212);
    ctx.fillStyle = 'rgba(255, 210, 120, 0.25)';
    ctx.fillRect(420, 228, 6, 212);
    ctx.fillRect(534, 228, 6, 212);
  }

  _drawShadows(ctx) {
    for (const s of SHADOWS) {
      ctx.fillStyle = 'rgba(8, 10, 26, 0.45)';
      roundRect(ctx, s.x, s.y, s.w, s.h, 10);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(180, 200, 255, 0.75)';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('SHADOW — hard to spot here', SHADOWS[0].x + 8, SHADOWS[0].y + 16);
  }

  _drawCover(ctx) {
    for (const item of COVER) {
      const cx = item.x + item.w / 2;
      const cy = item.y + item.h / 2;
      if (item.kind === 'pedestal') {
        // The artifact pedestal is drawn with the Golden Ibis itself.
        continue;
      }
      if (item.kind === 'statue') {
        ctx.fillStyle = '#4a4238';
        roundRect(ctx, item.x - 3, item.y - 3, item.w + 6, item.h + 6, 6);
        ctx.fill();
        ctx.fillStyle = '#8f8678';
        ctx.beginPath();
        ctx.arc(cx, cy, item.w / 2 - 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#b8ae9c';
        ctx.beginPath();
        ctx.arc(cx - 4, cy - 4, item.w / 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#2c2620';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('STATUE', cx, item.y + item.h + 12);
      } else if (item.kind === 'case') {
        ctx.fillStyle = '#3d2f22';
        roundRect(ctx, item.x, item.y, item.w, item.h, 4);
        ctx.fill();
        ctx.fillStyle = 'rgba(150, 200, 255, 0.35)';
        roundRect(ctx, item.x + 4, item.y + 3, item.w - 8, item.h - 6, 3);
        ctx.fill();
        ctx.fillStyle = '#ffd76a';
        ctx.beginPath();
        ctx.arc(cx - 20, cy, 3, 0, Math.PI * 2);
        ctx.arc(cx + 20, cy, 3, 0, Math.PI * 2);
        ctx.fill();
      } else if (item.kind === 'bench') {
        ctx.fillStyle = '#5d3a28';
        roundRect(ctx, item.x, item.y, item.w, item.h, 6);
        ctx.fill();
        ctx.fillStyle = '#7d5238';
        ctx.fillRect(item.x + 8, item.y + 4, item.w - 16, 6);
      } else {
        // Potted palm: a pot and a spray of leaves.
        ctx.fillStyle = '#7a4a2c';
        ctx.beginPath();
        ctx.arc(cx, cy, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#3f7a3a';
        ctx.lineWidth = 4;
        for (let i = 0; i < 6; i += 1) {
          const a = (i / 6) * Math.PI * 2;
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx + Math.cos(a) * 17, cy + Math.sin(a) * 17);
          ctx.stroke();
        }
      }
    }
  }

  _drawArtifact(ctx, world) {
    if (world.player.hasArtifact) return;
    const pulse = 0.7 + 0.3 * Math.sin(world.time * 3);
    ctx.save();
    ctx.globalAlpha = 0.25 * pulse;
    ctx.fillStyle = '#ffd76a';
    ctx.beginPath();
    ctx.arc(ARTIFACT.x, ARTIFACT.y, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // The Golden Ibis on its pedestal.
    ctx.fillStyle = '#4a4238';
    roundRect(ctx, ARTIFACT.x - 20, ARTIFACT.y - 20, 40, 40, 5);
    ctx.fill();
    ctx.fillStyle = '#ffd76a';
    ctx.beginPath();
    ctx.moveTo(ARTIFACT.x, ARTIFACT.y - 12);
    ctx.lineTo(ARTIFACT.x + 8, ARTIFACT.y + 6);
    ctx.lineTo(ARTIFACT.x - 8, ARTIFACT.y + 6);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fff3c4';
    ctx.beginPath();
    ctx.arc(ARTIFACT.x, ARTIFACT.y - 14, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffe9a8';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('GOLDEN IBIS', ARTIFACT.x, ARTIFACT.y + 34);
  }

  _drawExit(ctx, world) {
    const open = world.player.hasArtifact;
    ctx.fillStyle = open ? '#1f9d4d' : '#2c6e44';
    roundRect(ctx, EXIT.x, EXIT.y, EXIT.w, EXIT.h, 4);
    ctx.fill();
    ctx.strokeStyle = open ? '#7dff9e' : '#4a9e66';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = '#eafff0';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('EXIT', EXIT.x + EXIT.w / 2, EXIT.y + 30);
    ctx.font = 'bold 10px sans-serif';
    ctx.fillText(open ? 'GO!' : 'LOCKED', EXIT.x + EXIT.w / 2, EXIT.y + 48);
    ctx.font = '9px sans-serif';
    ctx.fillText(open ? '' : 'needs Ibis', EXIT.x + EXIT.w / 2, EXIT.y + 62);
  }

  _drawCoins(ctx, world) {
    for (const coin of world.coins) {
      if (coin.taken) continue;
      ctx.fillStyle = '#ffd76a';
      ctx.beginPath();
      ctx.arc(coin.x, coin.y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#a87c1f';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('$', coin.x, coin.y + 3.5);
    }
  }

  _drawToss(ctx, world) {
    if (!world.toss) return;
    const blink = Math.floor(world.time * 8) % 2 === 0;
    if (!blink) return;
    ctx.strokeStyle = '#ffd76a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(world.toss.x, world.toss.y, 12, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#ffd76a';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('clink!', world.toss.x, world.toss.y - 16);
  }

  _drawCone(ctx, guard, world) {
    const alarm = guard.mode === 'chase' || guard.suspicion >= 60;
    const range = GUARD.viewRange;
    const half = GUARD.viewHalfAngle;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(guard.x, guard.y);
    ctx.arc(guard.x, guard.y, range, guard.facing - half, guard.facing + half);
    ctx.closePath();
    const gradient = ctx.createRadialGradient(
      guard.x, guard.y, 10, guard.x, guard.y, range,
    );
    gradient.addColorStop(0, alarm ? 'rgba(255, 70, 60, 0.45)' : 'rgba(255, 214, 90, 0.42)');
    gradient.addColorStop(1, alarm ? 'rgba(255, 70, 60, 0.05)' : 'rgba(255, 214, 90, 0.05)');
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.strokeStyle = alarm ? CONE_ALARM : CONE_EDGE;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  }

  _drawPlayer(ctx, world) {
    const p = world.player;
    // A soft shadow pool under the thief.
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(p.x, p.y + 10, 13, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    // Hooded thief: dark cloak, pale face, cap brim toward facing.
    ctx.fillStyle = '#1d2733';
    ctx.beginPath();
    ctx.arc(p.x, p.y, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#e8e4d8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 13, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#e8e4d8';
    ctx.beginPath();
    ctx.arc(p.x + Math.cos(p.facing) * 4, p.y + Math.sin(p.facing) * 4, 5, 0, Math.PI * 2);
    ctx.fill();
    if (p.hasArtifact) {
      ctx.fillStyle = '#ffd76a';
      ctx.beginPath();
      ctx.arc(p.x - 10, p.y + 8, 5, 0, Math.PI * 2);
      ctx.fill();
    }
    if (p.running) {
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('RUNNING — LOUD', p.x, p.y - 20);
    }
  }

  _drawGuard(ctx, guard) {
    // Uniformed guard: navy body, brass badge, cap, torch in hand.
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(guard.x, guard.y + 11, 14, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = guard.mode === 'chase' ? '#7a1f1a' : '#24365e';
    ctx.beginPath();
    ctx.arc(guard.x, guard.y, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffd76a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(guard.x, guard.y, 14, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#f2c9a0';
    ctx.beginPath();
    ctx.arc(guard.x + Math.cos(guard.facing) * 5, guard.y + Math.sin(guard.facing) * 5, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffd76a';
    ctx.beginPath();
    ctx.arc(guard.x - 8, guard.y + 8, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(guard.name, guard.x, guard.y - 20);
    if (guard.mode === 'chase') {
      ctx.fillStyle = '#ff5040';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText('!', guard.x, guard.y - 34);
    } else if (guard.suspicion >= 60) {
      ctx.fillStyle = '#ffb020';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('?', guard.x, guard.y - 34);
    } else if (guard.mode === 'investigate') {
      ctx.fillStyle = '#9fd0ff';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('…', guard.x, guard.y - 34);
    }
    // Suspicion arc over the guard's head.
    if (guard.suspicion > 2) {
      ctx.strokeStyle = 'rgba(0,0,0,0.6)';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(guard.x, guard.y, 19, -Math.PI / 2, Math.PI * 1.5);
      ctx.stroke();
      ctx.strokeStyle = guard.suspicion >= 60 ? '#ff5040' : '#ffb020';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(
        guard.x, guard.y, 19, -Math.PI / 2,
        -Math.PI / 2 + (guard.suspicion / 100) * Math.PI * 2,
      );
      ctx.stroke();
    }
  }

  _drawWalls(ctx) {
    for (const wall of WALLS) {
      ctx.fillStyle = WALL;
      ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
      ctx.fillStyle = WALL_TOP;
      if (wall.h < wall.w) ctx.fillRect(wall.x, wall.y, wall.w, 3);
      else ctx.fillRect(wall.x, wall.y, 3, wall.h);
    }
  }

  _drawLamps(ctx) {
    // Warm pools of light: standing in one is standing in the open.
    const lamps = [
      { x: 480, y: 116 },
      { x: 480, y: 330 },
      { x: 800, y: 330 },
      { x: 480, y: 540 },
    ];
    for (const lamp of lamps) {
      const g = ctx.createRadialGradient(lamp.x, lamp.y, 4, lamp.x, lamp.y, 90);
      g.addColorStop(0, 'rgba(255, 220, 130, 0.16)');
      g.addColorStop(1, 'rgba(255, 220, 130, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(lamp.x, lamp.y, 90, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  _drawHud(ctx, world) {
    ctx.fillStyle = 'rgba(10, 8, 14, 0.82)';
    ctx.fillRect(0, 0, VIEW.width, 34);
    ctx.fillStyle = '#e8e4d8';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('MUSEUM AT NIGHT', 12, 22);
    // Objective.
    ctx.font = '13px sans-serif';
    ctx.fillStyle = world.player.hasArtifact ? '#7dff9e' : '#ffd76a';
    const objective = world.player.hasArtifact
      ? 'Reach the green EXIT — unseen!'
      : 'Steal the Golden Ibis, then reach the EXIT';
    ctx.fillText(objective, 200, 22);
    // Coins.
    ctx.fillStyle = '#e8e4d8';
    ctx.fillText(`Coins ${world.coinsTaken}/${world.coinsTotal}  •  Toss (E): ${world.player.coinsLeft}`, 560, 22);
    // Timer.
    const minutes = Math.floor(world.time / 60);
    const seconds = Math.floor(world.time % 60);
    ctx.fillText(`${minutes}:${String(seconds).padStart(2, '0')}`, 830, 22);
    // Suspicion bar (the loudest guard).
    const barX = 200;
    const barY = 596;
    ctx.fillStyle = 'rgba(10, 8, 14, 0.82)';
    roundRect(ctx, barX - 6, barY - 6, 560 + 12, 30, 6);
    ctx.fill();
    ctx.fillStyle = '#e8e4d8';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('SPOTTED', barX + 8, barY + 15);
    const barW = 380;
    ctx.fillStyle = '#333';
    ctx.fillRect(barX + 80, barY, barW, 14);
    const alarm = world.alarm;
    ctx.fillStyle = alarm >= 60 ? '#ff5040' : alarm >= 30 ? '#ffb020' : '#7dff9e';
    ctx.fillRect(barX + 80, barY, (barW * alarm) / 100, 14);
    ctx.fillStyle = '#e8e4d8';
    ctx.font = '12px sans-serif';
    ctx.fillText(
      alarm >= 100 ? 'RUN!' : alarm >= 60 ? 'Almost seen — hide!' : alarm >= 30 ? 'A guard is suspicious…' : 'Unseen',
      barX + 470, barY + 13,
    );
    if (world.messageLeft > 0) {
      ctx.fillStyle = '#ffe9a8';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(world.message, VIEW.width / 2, 56);
    }
    ctx.fillStyle = 'rgba(232, 228, 216, 0.75)';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('WASD / arrows move • SHIFT run (loud) • E toss a coin • M mute • R restart', 12, 632);
  }

  _panel(ctx, title, lines, accent) {
    ctx.fillStyle = 'rgba(10, 8, 14, 0.88)';
    roundRect(ctx, 230, 150, 500, 340, 12);
    ctx.fill();
    ctx.strokeStyle = accent;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = accent;
    ctx.font = 'bold 34px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(title, VIEW.width / 2, 210);
    ctx.fillStyle = '#e8e4d8';
    ctx.font = '16px sans-serif';
    lines.forEach((line, i) => {
      ctx.fillText(line, VIEW.width / 2, 258 + i * 30);
    });
    ctx.fillStyle = '#ffe9a8';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText('Press ENTER or click to play again', VIEW.width / 2, 452);
  }

  _drawTitle(ctx) {
    ctx.fillStyle = 'rgba(8, 6, 12, 0.72)';
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    ctx.fillStyle = '#ffd76a';
    ctx.font = 'bold 54px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('MUSEUM AT NIGHT', VIEW.width / 2, 170);
    ctx.fillStyle = '#e8e4d8';
    ctx.font = '20px sans-serif';
    ctx.fillText('A thief. Four guards. One Golden Ibis.', VIEW.width / 2, 212);
    const lines = [
      'Sneak past the patrols — their yellow cones are what they can see.',
      'Hide behind statues and cases. Shadows slow a guard\'s suspicion.',
      'Running is loud and fast to spot. Toss a coin (E) to lure a guard away.',
      'Grab the Golden Ibis, then slip out the green EXIT door — unseen.',
      '',
      'WASD / arrows — move      SHIFT — run (loud)',
      'E — toss a coin      M — mute      R — restart',
    ];
    ctx.font = '16px sans-serif';
    lines.forEach((line, i) => ctx.fillText(line, VIEW.width / 2, 268 + i * 28));
    ctx.fillStyle = '#7dff9e';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('Press ENTER or click to begin', VIEW.width / 2, 500);
  }

  _drawCaught(ctx, world) {
    ctx.fillStyle = 'rgba(60, 8, 6, 0.55)';
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    this._panel(ctx, 'CAUGHT!', [
      'A guard laid hands on you under the gallery lights.',
      `You pocketed ${world.coinsTaken} coin${world.coinsTaken === 1 ? '' : 's'}${world.player.hasArtifact ? ' and the Golden Ibis' : ''} before the torch found you.`,
      `Time in the museum: ${Math.floor(world.time)}s.`,
      'Next time: watch the patrols, wait for the cone to turn,',
      'and break line of sight the moment suspicion climbs.',
    ], '#ff5040');
  }

  _drawWin(ctx, world) {
    ctx.fillStyle = 'rgba(6, 40, 16, 0.5)';
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    this._panel(ctx, 'CLEAN GETAWAY!', [
      'The Golden Ibis is yours and no guard ever laid a hand on you.',
      `Score: ${world.score}  •  Time: ${Math.floor(world.time)}s  •  Coins: ${world.coinsTaken}/${world.coinsTotal}`,
      'The museum never knew you were there.',
    ], '#7dff9e');
  }
}
