import { DAS_DELAY_MS, DAS_REPEAT_MS } from "./constants.js";

const BOUND_CODES = new Set([
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "Space",
  "KeyP",
  "Escape",
  "Enter",
]);

// Handles keyboard input, including DAS (delayed auto-shift) repeat for
// held left/right movement, driven by the same fixed-timestep update() the
// game loop uses (rather than relying on native OS key-repeat timing).
export class InputHandler {
  constructor(game) {
    this.game = game;
    this.leftHeld = false;
    this.rightHeld = false;
    this.activeDir = null; // 'left' | 'right' | null
    this.dasTimer = 0;
    this.dasActive = false;

    window.addEventListener("keydown", (e) => this._onKeyDown(e));
    window.addEventListener("keyup", (e) => this._onKeyUp(e));
  }

  _onKeyDown(e) {
    if (e.target instanceof HTMLInputElement) return; // let text fields behave normally
    if (!BOUND_CODES.has(e.code)) return;
    e.preventDefault();
    if (e.repeat) return; // we drive repeat ourselves via DAS in update()

    switch (e.code) {
      case "ArrowLeft":
        this.leftHeld = true;
        this._setActiveDir("left");
        this.game.moveLeft();
        break;
      case "ArrowRight":
        this.rightHeld = true;
        this._setActiveDir("right");
        this.game.moveRight();
        break;
      case "ArrowDown":
        this.game.setSoftDrop(true);
        break;
      case "ArrowUp":
      case "Space":
        this.game.cyclePiece();
        break;
      case "KeyP":
      case "Escape":
        this.game.togglePause();
        break;
      case "Enter":
        this.game.handleStartOrRestart();
        break;
    }
  }

  _onKeyUp(e) {
    switch (e.code) {
      case "ArrowLeft":
        this.leftHeld = false;
        if (this.activeDir === "left") {
          this._setActiveDir(this.rightHeld ? "right" : null);
        }
        break;
      case "ArrowRight":
        this.rightHeld = false;
        if (this.activeDir === "right") {
          this._setActiveDir(this.leftHeld ? "left" : null);
        }
        break;
      case "ArrowDown":
        this.game.setSoftDrop(false);
        break;
    }
  }

  _setActiveDir(dir) {
    this.activeDir = dir;
    this.dasTimer = 0;
    this.dasActive = false;
  }

  // Called every fixed logic tick from the main loop to drive DAS repeat.
  update(dt) {
    if (!this.activeDir) return;
    this.dasTimer += dt;

    if (!this.dasActive) {
      if (this.dasTimer >= DAS_DELAY_MS) {
        this.dasActive = true;
        this.dasTimer = 0;
        this._moveActiveDir();
      }
    } else if (this.dasTimer >= DAS_REPEAT_MS) {
      this.dasTimer -= DAS_REPEAT_MS;
      this._moveActiveDir();
    }
  }

  _moveActiveDir() {
    if (this.activeDir === "left") this.game.moveLeft();
    else if (this.activeDir === "right") this.game.moveRight();
  }
}
