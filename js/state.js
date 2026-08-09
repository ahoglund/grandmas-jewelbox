// Top-level screen state: gates which DOM overlay is visible and whether
// gameplay input is accepted.
export const ScreenState = Object.freeze({
  TITLE: "TITLE",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  GAME_OVER: "GAME_OVER",
});

// Round phase: what is happening right now inside an active round.
// Kept separate from ScreenState so pause/title/game-over (cross-cutting
// concerns) don't combinatorially multiply with in-round sub-phases.
export const Phase = Object.freeze({
  SPAWNING: "SPAWNING",
  FALLING: "FALLING",
  LOCKING: "LOCKING",
  MATCHING: "MATCHING",
  CLEARING: "CLEARING",
  SETTLING: "SETTLING",
  BOARD_CLEAR: "BOARD_CLEAR",
});
