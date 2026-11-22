// Museum at Night — level layout and tuning constants.
// The museum is one floor seen from above: a north gallery holding the
// Golden Ibis, a middle hall full of statues and display cases, an east
// wing, and the entrance hall where the thief slips in. Every rectangle
// here is both a wall the thief bumps into and cover that blocks a
// guard's line of sight, so the same list drives movement and vision.
export const VIEW = { width: 960, height: 640 };
export const STEP = 1 / 60;

export const PLAYER = {
  radius: 13,
  walkSpeed: 135,
  runSpeed: 215,
  // A running thief is loud: guards spot a runner much faster.
  runSpotMultiplier: 1.6,
};

export const GUARD = {
  radius: 14,
  patrolSpeed: 58,
  chaseSpeed: 118,
  investigateSpeed: 85,
  viewRange: 185,
  // Half-angle of the vision cone, in radians.
  viewHalfAngle: 0.62,
  // Suspicion (0..100) gained per second when the thief is seen at point
  // blank range; it falls off with distance and with darkness.
  spotRate: 62,
  decayRate: 26,
  // Seconds a chasing guard must lose sight of the thief before giving up.
  giveUpSeconds: 2.5,
  // A guard that gets this close to a fully-seen thief catches them.
  catchDistance: 24,
};

export const THIEF = { coins: 3, throwRange: 130 };

// Walls: outer shell plus the room dividers. Gaps are the doorways.
export const WALLS = [
  { x: 0, y: 0, w: 960, h: 16 },
  { x: 0, y: 624, w: 960, h: 16 },
  { x: 0, y: 0, w: 16, h: 640 },
  // East wall, with a doorway gap (y 60..132) where the green EXIT door is.
  { x: 944, y: 0, w: 16, h: 60 },
  { x: 944, y: 132, w: 16, h: 508 },
  // North gallery floor: doorway in the middle (x 400..520).
  { x: 16, y: 214, w: 384, h: 14 },
  { x: 520, y: 214, w: 424, h: 14 },
  // Entrance hall ceiling: doorway in the middle (x 280..400).
  { x: 16, y: 440, w: 264, h: 14 },
  { x: 400, y: 440, w: 544, h: 14 },
  // East wing divider: doorway at y 300..380.
  { x: 640, y: 228, w: 14, h: 72 },
  { x: 640, y: 380, w: 14, h: 60 },
];

// Cover: statues (round plinths), display cases and benches. Guards and
// the thief cannot walk through them and cannot see through them.
// Placement rule: every guard patrol leg keeps at least 16 px clear of
// every blocker, so a patrol can never wedge itself against cover.
export const COVER = [
  // North gallery statues flanking the artifact, clear of Marlow's loop.
  { x: 230, y: 40, w: 44, h: 44, kind: 'statue', label: 'Marble Owl' },
  { x: 700, y: 40, w: 44, h: 44, kind: 'statue', label: 'Bronze Fox' },
  // The artifact's own pedestal: solid, and the thief grabs the Ibis
  // from its edge (pickup radius reaches just past the stone).
  { x: 460, y: 96, w: 40, h: 40, kind: 'pedestal', label: 'Pedestal' },
  // Middle hall statues, set along the top of the hall so Petra's loop
  // through the middle band stays clear.
  { x: 250, y: 240, w: 46, h: 46, kind: 'statue', label: 'Stone Heron' },
  { x: 452, y: 240, w: 46, h: 46, kind: 'statue', label: 'Stone Heron' },
  // East wing statue.
  { x: 700, y: 300, w: 46, h: 46, kind: 'statue', label: 'Marble Owl' },
  // Display cases in the middle hall and entrance hall.
  { x: 130, y: 258, w: 96, h: 26, kind: 'case', label: 'Jewels' },
  { x: 560, y: 258, w: 96, h: 26, kind: 'case', label: 'Masks' },
  { x: 830, y: 560, w: 96, h: 26, kind: 'case', label: 'Coins' },
  { x: 620, y: 560, w: 96, h: 26, kind: 'case', label: 'Vases' },
  // Benches in the entrance hall.
  { x: 620, y: 520, w: 104, h: 24, kind: 'bench', label: 'Bench' },
  { x: 760, y: 560, w: 104, h: 24, kind: 'bench', label: 'Bench' },
  // Potted palms.
  { x: 40, y: 470, w: 34, h: 34, kind: 'plant', label: 'Palm' },
  { x: 886, y: 470, w: 34, h: 34, kind: 'plant', label: 'Palm' },
];

// The artifact sits on its own pedestal in the north gallery.
export const ARTIFACT = { x: 480, y: 116, radius: 16, name: 'Golden Ibis' };
// The green exit door in the east wall of the north gallery, reached
// through the doorway gap. Only opens (counts) once the thief carries
// the artifact.
export const EXIT = { x: 896, y: 60, w: 48, h: 72, label: 'EXIT' };
// Where the thief slips in.
export const SPAWN = { x: 72, y: 592 };

// Dark corners where a thief is harder to spot (detection runs at half rate).
export const SHADOWS = [
  { x: 16, y: 454, w: 150, h: 170 },
  { x: 794, y: 454, w: 150, h: 170 },
  { x: 660, y: 228, w: 120, h: 60 },
];

// Optional gold coins to pocket on the way (score, not required to win).
export const COINS = [
  { x: 110, y: 300, taken: false },
  { x: 880, y: 260, taken: false },
  { x: 800, y: 600, taken: false },
];

// Four guards, each walking a loop they repeat so a patient thief can
// learn the timing. `pause` is how long they linger and look around at
// each corner before moving on.
export const GUARDS = [
  {
    name: 'Marlow',
    waypoints: [
      { x: 300, y: 152 },
      { x: 660, y: 152 },
      { x: 660, y: 190 },
      { x: 300, y: 190 },
    ],
    pause: 1.1,
  },
  {
    name: 'Petra',
    waypoints: [
      { x: 100, y: 310 },
      { x: 580, y: 310 },
      { x: 580, y: 380 },
      { x: 100, y: 380 },
    ],
    pause: 0.9,
  },
  {
    name: 'Dario',
    waypoints: [
      { x: 770, y: 250 },
      { x: 900, y: 250 },
      { x: 900, y: 410 },
      { x: 770, y: 410 },
    ],
    pause: 1.3,
  },
  {
    name: 'Sofia',
    waypoints: [
      { x: 150, y: 486 },
      { x: 580, y: 486 },
      { x: 580, y: 576 },
      { x: 150, y: 576 },
    ],
    pause: 1.0,
  },
];

export const BLOCKERS = [...WALLS, ...COVER];

export function pointInRect(px, py, rect) {
  return px >= rect.x && px <= rect.x + rect.w && py >= rect.y && py <= rect.y + rect.h;
}

// True when the segment from (x1,y1) to (x2,y2) touches any blocking rect.
export function segmentBlocked(x1, y1, x2, y2) {
  for (const rect of BLOCKERS) {
    if (segmentHitsRect(x1, y1, x2, y2, rect)) return true;
  }
  return false;
}

function segmentHitsRect(x1, y1, x2, y2, rect) {
  if (pointInRect(x1, y1, rect) || pointInRect(x2, y2, rect)) return true;
  const edges = [
    [rect.x, rect.y, rect.x + rect.w, rect.y],
    [rect.x + rect.w, rect.y, rect.x + rect.w, rect.y + rect.h],
    [rect.x + rect.w, rect.y + rect.h, rect.x, rect.y + rect.h],
    [rect.x, rect.y + rect.h, rect.x, rect.y],
  ];
  for (const [ax, ay, bx, by] of edges) {
    if (segmentsCross(x1, y1, x2, y2, ax, ay, bx, by)) return true;
  }
  return false;
}

function segmentsCross(x1, y1, x2, y2, x3, y3, x4, y4) {
  const d1 = direction(x3, y3, x4, y4, x1, y1);
  const d2 = direction(x3, y3, x4, y4, x2, y2);
  const d3 = direction(x1, y1, x2, y2, x3, y3);
  const d4 = direction(x1, y1, x2, y2, x4, y4);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}

function direction(x1, y1, x2, y2, x3, y3) {
  return (x3 - x1) * (y2 - y1) - (y3 - y1) * (x2 - x1);
}
