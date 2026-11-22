// Keyboard + mouse input for Museum at Night. Movement keys are read as a
// held set so the world can combine them each step; single presses (throw
// a coin, restart, mute) are consumed once by the game loop.
const MOVE_KEYS = {
  ArrowUp: [0, -1],
  KeyW: [0, -1],
  ArrowDown: [0, 1],
  KeyS: [0, 1],
  ArrowLeft: [-1, 0],
  KeyA: [-1, 0],
  ArrowRight: [1, 0],
  KeyD: [1, 0],
};

export class Input {
  constructor() {
    this.held = new Set();
    this.pressed = new Set();
    this.mouse = { x: 0, y: 0, clicked: false };
    this._onKeyDown = (event) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) {
        event.preventDefault();
      }
      if (!event.repeat) this.pressed.add(event.code);
      this.held.add(event.code);
    };
    this._onKeyUp = (event) => this.held.delete(event.code);
    this._onMouse = (event) => {
      const rect = event.target.getBoundingClientRect();
      this.mouse.x = event.clientX - rect.left;
      this.mouse.y = event.clientY - rect.top;
      this.mouse.clicked = true;
    };
    this._onBlur = () => this.held.clear();
  }

  attach(canvas) {
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
    window.addEventListener('blur', this._onBlur);
    canvas.addEventListener('mousedown', this._onMouse);
  }

  // Normalised movement direction from the held keys, or null when idle.
  moveDirection() {
    let x = 0;
    let y = 0;
    for (const code of this.held) {
      const dir = MOVE_KEYS[code];
      if (dir) {
        x += dir[0];
        y += dir[1];
      }
    }
    if (x === 0 && y === 0) return null;
    const length = Math.hypot(x, y);
    return { x: x / length, y: y / length };
  }

  get running() {
    return this.held.has('ShiftLeft') || this.held.has('ShiftRight');
  }

  wasPressed(code) {
    return this.pressed.has(code);
  }

  takeClick() {
    const clicked = this.mouse.clicked;
    this.mouse.clicked = false;
    return clicked;
  }

  endFrame() {
    this.pressed.clear();
    this.mouse.clicked = false;
  }
}
