import { LOGIC_STEP_MS } from "./constants.js";
import { Game } from "./game.js";
import { InputHandler } from "./input.js";
import { Renderer } from "./renderer.js";

const game = new Game();
const input = new InputHandler(game);
const renderer = new Renderer(game);

// Expose a debug API when ?debug=1 is present, so board/piece state can be
// forced from the console (or an automated test) for deterministic checks
// of the matching/cascade/lives logic without waiting on RNG.
if (new URLSearchParams(window.location.search).get("debug") === "1") {
  window.__game = game;
}

let lastTime = performance.now();
let accumulator = 0;

function loop(timestamp) {
  const delta = timestamp - lastTime;
  lastTime = timestamp;
  accumulator += Math.min(delta, 250); // clamp to avoid spiral after tab-switch

  while (accumulator >= LOGIC_STEP_MS) {
    input.update(LOGIC_STEP_MS);
    game.update(LOGIC_STEP_MS);
    accumulator -= LOGIC_STEP_MS;
  }

  renderer.render();
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
