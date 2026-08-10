import { COLS, ROWS, CELL_SIZE, GEM_RENDER_COLORS, GEM_SHAPES, CLEAR_FLASH_MS } from "./constants.js";
import { Phase, ScreenState } from "./state.js";
import * as storage from "./storage.js";

const BOARD_LINE_COLOR = "rgba(255, 255, 255, 0.05)";

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function lerpColor(hexA, hexB, t) {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  const r = Math.round(a[0] + (b[0] - a[0]) * t);
  const g = Math.round(a[1] + (b[1] - a[1]) * t);
  const bl = Math.round(a[2] + (b[2] - a[2]) * t);
  return `rgb(${r}, ${g}, ${bl})`;
}

// Builds a regular-polygon path (triangle/hexagon/octagon/etc.) centered at
// (cx, cy), starting at `rotation` radians.
function polygonPath(ctx, cx, cy, radius, sides, rotation) {
  ctx.beginPath();
  for (let i = 0; i < sides; i++) {
    const angle = rotation + (i * 2 * Math.PI) / sides;
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

// Point at top, rounds into a wide bottom — two mirrored bezier curves.
function teardropPath(ctx, cx, cy, r) {
  ctx.beginPath();
  ctx.moveTo(cx, cy - r);
  ctx.bezierCurveTo(cx + r * 1.3, cy - r * 0.2, cx + r * 0.9, cy + r, cx, cy + r);
  ctx.bezierCurveTo(cx - r * 0.9, cy + r, cx - r * 1.3, cy - r * 0.2, cx, cy - r);
  ctx.closePath();
}

// Builds the current path for a given shape name. Every gem's shape is
// looked up via GEM_SHAPES so each color reads as visually distinct, not
// just differently colored.
function shapePath(ctx, shape, cx, cy, radius) {
  switch (shape) {
    case "oval":
      ctx.beginPath();
      ctx.ellipse(cx, cy, radius * 0.75, radius, 0, 0, Math.PI * 2);
      break;
    case "teardrop":
      teardropPath(ctx, cx, cy, radius);
      break;
    case "hexagon":
      polygonPath(ctx, cx, cy, radius, 6, -Math.PI / 2);
      break;
    case "triangle":
      polygonPath(ctx, cx, cy, radius, 3, -Math.PI / 2);
      break;
    case "octagon":
      polygonPath(ctx, cx, cy, radius, 8, -Math.PI / 8);
      break;
    case "rectangle": {
      const w = radius * 1.6;
      const h = radius * 1.1;
      ctx.beginPath();
      ctx.rect(cx - w / 2, cy - h / 2, w, h);
      break;
    }
    case "square": {
      const s = radius * 1.3;
      ctx.beginPath();
      ctx.rect(cx - s / 2, cy - s / 2, s, s);
      break;
    }
    default: // "circle" fallback
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  }
}

export class Renderer {
  constructor(game) {
    this.game = game;

    this.canvas = document.getElementById("game-canvas");
    this.ctx = this.canvas.getContext("2d");
    this.canvas.width = COLS * CELL_SIZE;
    this.canvas.height = ROWS * CELL_SIZE;

    this.nextCanvas = document.getElementById("next-canvas");
    this.nextCtx = this.nextCanvas.getContext("2d");
    this.nextCanvas.width = CELL_SIZE;
    this.nextCanvas.height = CELL_SIZE * 3;

    this.dom = {
      score: document.getElementById("score"),
      lives: document.getElementById("lives"),
      level: document.getElementById("level"),
      chainIndicator: document.getElementById("chain-indicator"),
      chain: document.getElementById("chain"),
      overlayTitle: document.getElementById("overlay-title"),
      overlayPause: document.getElementById("overlay-pause"),
      overlayGameOver: document.getElementById("overlay-gameover"),
      overlayBoardClear: document.getElementById("overlay-boardclear"),
      finalScore: document.getElementById("final-score"),
      livesRemaining: document.getElementById("lives-remaining"),
      playerName: document.getElementById("player-name"),
      leaderboardTitle: document.getElementById("high-scores-title"),
      leaderboardGameOver: document.getElementById("high-scores-gameover"),
    };

    this.dom.playerName.value = storage.getPlayerName();
    this.dom.playerName.addEventListener("input", () => {
      storage.setPlayerName(this.dom.playerName.value);
    });

    this.refreshLeaderboards();
  }

  // Repopulates both leaderboard lists from localStorage. Called once at
  // startup and again whenever a new score is recorded (see main.js's
  // game.onGameOver wiring).
  refreshLeaderboards() {
    const scores = storage.getHighScores();
    for (const list of [this.dom.leaderboardTitle, this.dom.leaderboardGameOver]) {
      list.innerHTML = "";
      if (scores.length === 0) {
        const li = document.createElement("li");
        li.className = "empty";
        li.textContent = "No scores yet";
        list.appendChild(li);
        continue;
      }
      for (const entry of scores) {
        const li = document.createElement("li");
        const name = document.createElement("span");
        name.className = "entry-name";
        name.textContent = entry.name;
        const score = document.createElement("span");
        score.className = "entry-score";
        score.textContent = entry.score;
        li.append(name, score);
        list.appendChild(li);
      }
    }
  }

  render() {
    this._renderBoard();
    this._renderNext();
    this._updateHud();
    this._updateOverlays();
  }

  _renderBoard() {
    const ctx = this.ctx;
    const { game } = this;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.strokeStyle = BOARD_LINE_COLOR;
    ctx.lineWidth = 1;
    for (let r = 0; r <= ROWS; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * CELL_SIZE);
      ctx.lineTo(COLS * CELL_SIZE, r * CELL_SIZE);
      ctx.stroke();
    }
    for (let c = 0; c <= COLS; c++) {
      ctx.beginPath();
      ctx.moveTo(c * CELL_SIZE, 0);
      ctx.lineTo(c * CELL_SIZE, ROWS * CELL_SIZE);
      ctx.stroke();
    }

    const flashing = game.phase === Phase.CLEARING ? game.flashingCells : null;
    const flashFrac = flashing ? Math.min(game.clearFlashTimer / CLEAR_FLASH_MS, 1) : 0;

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const color = game.board.getCell(c, r);
        if (!color) continue;
        const isFlashing = flashing && flashing.has(`${c},${r}`);
        this._drawGem(ctx, c, r, color, isFlashing ? flashFrac : null);
      }
    }

    if (game.phase === Phase.FALLING) {
      for (const cell of game.piece.cells()) {
        if (cell.row < 0) continue;
        this._drawGem(ctx, cell.col, cell.row, cell.color, null);
      }
    }
  }

  _renderNext() {
    const ctx = this.nextCtx;
    ctx.clearRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);
    const gems = this.game.pieceGenerator.next.gems;
    for (let i = 0; i < gems.length; i++) {
      this._drawGem(ctx, 0, i, gems[i], null);
    }
  }

  _drawGem(ctx, col, row, color, flashFrac) {
    const x = col * CELL_SIZE;
    const y = row * CELL_SIZE;
    const cx = x + CELL_SIZE / 2;
    const cy = y + CELL_SIZE / 2;
    const radius = CELL_SIZE / 2 - 3;
    const palette = GEM_RENDER_COLORS[color];

    let lightColor = palette.light;
    let baseColor = palette.base;
    if (flashFrac !== null) {
      const pulse = 0.5 + 0.5 * Math.sin(flashFrac * Math.PI * 6);
      lightColor = lerpColor(palette.light, "#ffffff", pulse * 0.7);
      baseColor = lerpColor(palette.base, "#ffffff", pulse * 0.7);
    }

    const isWildcard = color === "BLANK";
    const shape = GEM_SHAPES[color] ?? "circle";

    shapePath(ctx, shape, cx, cy, radius);

    if (isWildcard) {
      // Flat, muted fill (no glossy gradient) so it reads as "not a real
      // gem" at a glance.
      ctx.fillStyle = baseColor;
    } else {
      const gradient = ctx.createRadialGradient(
        cx - radius * 0.3,
        cy - radius * 0.3,
        radius * 0.1,
        cx,
        cy,
        radius
      );
      gradient.addColorStop(0, lightColor);
      gradient.addColorStop(1, baseColor);
      ctx.fillStyle = gradient;
    }
    ctx.fill();

    ctx.lineWidth = 2;
    ctx.strokeStyle = palette.dark;
    if (isWildcard) ctx.setLineDash([4, 3]);
    ctx.stroke();
    if (isWildcard) ctx.setLineDash([]);

    if (color === "ONYX") {
      ctx.beginPath();
      ctx.arc(cx - radius * 0.35, cy - radius * 0.35, radius * 0.18, 0, Math.PI * 2);
      ctx.fillStyle = palette.light;
      ctx.globalAlpha = 0.9;
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  _updateHud() {
    const { game, dom } = this;
    dom.score.textContent = game.score;
    dom.lives.textContent = game.lives;
    dom.level.textContent = game.level;

    if (game.phase === Phase.CLEARING && game.chainCount > 1) {
      dom.chainIndicator.style.display = "";
      dom.chain.textContent = `x${game.chainCount}`;
    } else {
      dom.chainIndicator.style.display = "none";
    }
  }

  _updateOverlays() {
    const { game, dom } = this;

    dom.overlayTitle.classList.toggle("hidden", game.screenState !== ScreenState.TITLE);
    dom.overlayPause.classList.toggle("hidden", game.screenState !== ScreenState.PAUSED);

    const gameOver = game.screenState === ScreenState.GAME_OVER;
    dom.overlayGameOver.classList.toggle("hidden", !gameOver);
    if (gameOver) dom.finalScore.textContent = game.score;

    const boardClear = game.screenState === ScreenState.PLAYING && game.phase === Phase.BOARD_CLEAR;
    dom.overlayBoardClear.classList.toggle("hidden", !boardClear);
    if (boardClear) dom.livesRemaining.textContent = Math.max(game.lives, 0);
  }
}
