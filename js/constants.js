// Board dimensions (classic Columns well size)
export const COLS = 6;
export const ROWS = 13;

// Column a new piece spawns in (middle-ish)
export const SPAWN_COL = Math.floor(COLS / 2);

export const CELL_SIZE = 36;

// Gem colors. ONYX is the rare, high-value special gem. BLANK is a rare
// wildcard gem that completes a run of any other color (see match.js).
export const GEM_COLORS = ["RED", "BLUE", "GREEN", "YELLOW", "PURPLE", "ONYX", "BLANK"];

// The wildcard gem's identifier, referenced by match.js's joker-aware scan.
export const WILDCARD = "BLANK";

// Relative spawn weights per gem slot roll (higher = more common).
export const GEM_WEIGHTS = {
  RED: 10,
  BLUE: 10,
  GREEN: 10,
  YELLOW: 10,
  PURPLE: 10,
  ONYX: 2,
  BLANK: 1,
};

// Shape drawn per gem color (see renderer.js's shape-dispatching _drawGem).
export const GEM_SHAPES = {
  RED: "oval",
  BLUE: "teardrop",
  GREEN: "hexagon",
  YELLOW: "triangle",
  PURPLE: "rectangle",
  ONYX: "octagon",
  BLANK: "square",
};

// Base fill/stroke colors used by the renderer for each gem.
export const GEM_RENDER_COLORS = {
  RED: { base: "#d43a4a", light: "#ff9aa6", dark: "#7a1622" },
  BLUE: { base: "#3a6fd4", light: "#9ac4ff", dark: "#152a5c" },
  GREEN: { base: "#3fae5c", light: "#a4eab5", dark: "#154f27" },
  YELLOW: { base: "#d9791f", light: "#ffc98a", dark: "#5c3410" },
  PURPLE: { base: "#9a3ad4", light: "#d9a4ff", dark: "#3f1259" },
  ONYX: { base: "#1a1420", light: "#8f7bb8", dark: "#000000" },
  BLANK: { base: "#6b6478", light: "#a79fc0", dark: "#2a2537" },
};

// Point value per gem, awarded once per gem cleared (before chain multiplier).
export const GEM_VALUES = {
  RED: 10,
  BLUE: 10,
  GREEN: 10,
  YELLOW: 10,
  PURPLE: 10,
  ONYX: 50,
  BLANK: 10,
};

// Score multiplier applied per cascade/chain step, indexed by (chainCount - 1).
// Clamped at the last entry if a cascade runs longer than the table.
export const CHAIN_MULTIPLIERS = [1, 2, 3, 5, 8, 13, 21];

// Milestone step for awarding an extra life. Player gains a life every time
// cumulative score crosses a new multiple of this value.
export const MILESTONE_STEP = 10000;

// Starting lives, matching the original's 3-life system (unlike Tetris's 1).
export const STARTING_LIVES = 3;

// Fall speed table: milliseconds per row, indexed by level (0-based).
// Decreasing values = faster fall as level increases. Clamped at last entry.
export const FALL_SPEEDS = [
  800, 720, 650, 590, 530, 480, 430, 390, 350, 320,
  290, 260, 230, 210, 190, 170, 150,
];

// Soft drop uses this fixed fast interval instead of the level's speed.
export const SOFT_DROP_INTERVAL_MS = 45;

// Number of gems that must be cleared to advance one level.
export const GEMS_PER_LEVEL = 40;

// Fixed logic timestep for the game loop (ms). 60Hz.
export const LOGIC_STEP_MS = 1000 / 60;

// Delayed Auto Shift timing for held left/right movement (ms).
export const DAS_DELAY_MS = 170;
export const DAS_REPEAT_MS = 50;

// How long cleared cells stay in a "flashing" visual state before the
// grid cell is actually nulled and gravity settles (ms).
export const CLEAR_FLASH_MS = 180;

// How long the board-clear (life lost) pause lasts before respawning (ms).
export const BOARD_CLEAR_PAUSE_MS = 1200;
