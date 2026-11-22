// Museum at Night — entry point: the fixed-step loop, screens, sound
// cues, and the ?shot= scenes used for screenshots. The game runs at a
// fixed 60 steps a second so a play session is deterministic.
import { Sound } from './audio.js';
import { VIEW, STEP } from './config.js';
import { Input } from './input.js';
import { Renderer } from './render.js';
import { stageShot } from './shots.js';
import {
  EVENT_ALARM,
  EVENT_ARTIFACT,
  EVENT_CAUGHT,
  EVENT_COIN,
  EVENT_GAVE_UP,
  EVENT_NOTICED,
  EVENT_TOSS,
  EVENT_WIN,
  SCREEN_CAUGHT,
  SCREEN_PLAY,
  SCREEN_TITLE,
  SCREEN_WIN,
  World,
} from './world.js';

const canvas = document.getElementById('game');
canvas.width = VIEW.width;
canvas.height = VIEW.height;

const input = new Input();
input.attach(canvas);
const sound = new Sound();
const renderer = new Renderer(canvas);
const world = new World();

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
let shotWorld = null;
if (shotName) {
  shotWorld = stageShot(shotName);
  renderer.draw(shotWorld);
} else {
  renderer.draw(world);
}

// Footstep timers: the player's own soft steps, and the guards' steps,
// which grow louder as the nearest guard closes in — sound that tells
// the thief where a guard is.
let playerStepIn = 0;
let guardStepIn = 0;

function playEvents(events) {
  if (events & EVENT_NOTICED) sound.noticed();
  if (events & EVENT_ALARM) sound.alarm();
  if (events & EVENT_CAUGHT) sound.caught();
  if (events & EVENT_WIN) sound.win();
  if (events & EVENT_COIN) sound.coinPickup();
  if (events & EVENT_ARTIFACT) sound.artifactPickup();
  if (events & EVENT_TOSS) sound.coinToss();
  if (events & EVENT_GAVE_UP) sound.noticed();
}

function frame() {
  if (shotWorld) {
    renderer.draw(shotWorld);
    requestAnimationFrame(frame);
    return;
  }

  const clicked = input.takeClick();
  const enter = input.wasPressed('Enter') || input.wasPressed('Space');
  if (input.wasPressed('KeyM')) sound.toggleMute();
  if (input.wasPressed('KeyR') && world.screen !== SCREEN_TITLE) {
    sound.ensure();
    world.start();
  }

  if (world.screen === SCREEN_TITLE) {
    if (enter || clicked) {
      sound.ensure();
      world.start();
    }
  } else if (world.screen === SCREEN_PLAY) {
    sound.ensure();
    if (input.wasPressed('KeyE')) {
      // Throwing is handled inside the step through the throw flag.
    }
    const events = world.step(
      STEP,
      input.moveDirection(),
      input.running,
      input.wasPressed('KeyE'),
    );
    playEvents(events);
    if (world.player.moving) {
      playerStepIn -= STEP;
      if (playerStepIn <= 0) {
        playerStepIn = world.player.running ? 0.28 : 0.42;
        sound.footstep(0.35);
      }
    }
    guardStepIn -= STEP;
    if (guardStepIn <= 0) {
      guardStepIn = 0.5;
      const nearest = world.nearestGuardDistance();
      if (nearest < 260) sound.footstep(Math.max(0, 1 - nearest / 260));
    }
  } else if (world.screen === SCREEN_CAUGHT || world.screen === SCREEN_WIN) {
    if (enter || clicked) {
      sound.ensure();
      world.start();
    }
  }

  renderer.draw(world);
  input.endFrame();
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
