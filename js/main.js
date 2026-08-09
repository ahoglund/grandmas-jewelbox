import { LOGIC_STEP_MS } from "./constants.js";
import { Game } from "./game.js";
import { InputHandler } from "./input.js";
import { Renderer } from "./renderer.js";
import { ScreenState } from "./state.js";
import * as storage from "./storage.js";

const AUTOSAVE_INTERVAL_MS = 1000;

const game = new Game();

// Silently auto-resume an in-progress round if one was saved (e.g. the
// page was refreshed mid-game). A corrupt/incompatible snapshot (say,
// after a code update changes the shape of toSnapshot()'s output) just
// falls back to a normal title-screen start rather than crashing.
const snapshot = storage.loadGameSnapshot();
if (snapshot) {
  try {
    game.restoreFromSnapshot(snapshot);
  } catch {
    storage.clearGameSnapshot();
  }
}

const input = new InputHandler(game);
const renderer = new Renderer(game);

game.onGameOver = (score) => {
  storage.addHighScore(storage.getPlayerName(), score);
  storage.clearGameSnapshot();
  renderer.refreshLeaderboards();
};

// Expose a debug API when ?debug=1 is present, so board/piece state can be
// forced from the console (or an automated test) for deterministic checks
// of the matching/cascade/lives logic without waiting on RNG.
if (new URLSearchParams(window.location.search).get("debug") === "1") {
  window.__game = game;
}

// Persists the current round so a refresh can resume it, or clears any
// stale snapshot when there's nothing in progress to resume.
function persistCurrentState() {
  if (game.screenState === ScreenState.PLAYING || game.screenState === ScreenState.PAUSED) {
    storage.saveGameSnapshot(game.toSnapshot());
  } else {
    storage.clearGameSnapshot();
  }
}

// Periodic safety-net save (covers tab/process kills that skip unload
// events) plus immediate saves on unload/visibility-hidden, which reliably
// capture the exact state right before a refresh.
window.addEventListener("beforeunload", persistCurrentState);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) persistCurrentState();
});

let lastTime = performance.now();
let accumulator = 0;
let autosaveTimer = 0;

function loop(timestamp) {
  const delta = timestamp - lastTime;
  lastTime = timestamp;
  accumulator += Math.min(delta, 250); // clamp to avoid spiral after tab-switch

  while (accumulator >= LOGIC_STEP_MS) {
    input.update(LOGIC_STEP_MS);
    game.update(LOGIC_STEP_MS);
    accumulator -= LOGIC_STEP_MS;
  }

  autosaveTimer += delta;
  if (autosaveTimer >= AUTOSAVE_INTERVAL_MS) {
    autosaveTimer = 0;
    persistCurrentState();
  }

  renderer.render();
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
