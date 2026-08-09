import {
  SPAWN_COL,
  FALL_SPEEDS,
  SOFT_DROP_INTERVAL_MS,
  GEMS_PER_LEVEL,
  STARTING_LIVES,
  MILESTONE_STEP,
  CLEAR_FLASH_MS,
  BOARD_CLEAR_PAUSE_MS,
} from "./constants.js";
import { Board } from "./board.js";
import { PieceGenerator } from "./piece.js";
import { findMatches, clearMatches } from "./match.js";
import { calculateStepScore, checkMilestones } from "./scoring.js";
import { ScreenState, Phase } from "./state.js";

export class Game {
  constructor() {
    this.board = new Board();
    this.screenState = ScreenState.TITLE;
    this.phase = Phase.SPAWNING;
    this._resetRoundState();
  }

  _resetRoundState() {
    this.board.clear();
    this.pieceGenerator = new PieceGenerator();
    this.piece = this.pieceGenerator.current;

    this.score = 0;
    this.lives = STARTING_LIVES;
    this.level = 1;
    this.gemsCleared = 0;

    this.fallIntervalMs = FALL_SPEEDS[0];
    this.fallTimerMs = 0;
    this.softDropActive = false;

    this.chainCount = 0;
    this.flashingCells = null;
    this.clearFlashTimer = 0;
    this.boardClearTimer = 0;

    this.nextLifeMilestone = MILESTONE_STEP;
  }

  // --- top-level flow -----------------------------------------------

  start() {
    this._resetRoundState();
    this.screenState = ScreenState.PLAYING;
    this.phase = Phase.SPAWNING;
  }

  handleStartOrRestart() {
    if (this.screenState === ScreenState.TITLE || this.screenState === ScreenState.GAME_OVER) {
      this.start();
    }
  }

  togglePause() {
    if (this.screenState === ScreenState.PLAYING) {
      this.screenState = ScreenState.PAUSED;
    } else if (this.screenState === ScreenState.PAUSED) {
      this.screenState = ScreenState.PLAYING;
    }
  }

  // --- player input ---------------------------------------------------

  moveLeft() {
    if (!this._acceptsPieceInput()) return;
    if (this._canPlace(this.piece.col - 1, this.piece.row)) this.piece.col -= 1;
  }

  moveRight() {
    if (!this._acceptsPieceInput()) return;
    if (this._canPlace(this.piece.col + 1, this.piece.row)) this.piece.col += 1;
  }

  cyclePiece() {
    if (!this._acceptsPieceInput()) return;
    this.piece.cycle();
  }

  setSoftDrop(active) {
    this.softDropActive = active;
  }

  _acceptsPieceInput() {
    return this.screenState === ScreenState.PLAYING && this.phase === Phase.FALLING;
  }

  _canPlace(col, row) {
    if (col < 0 || col >= this.board.cols) return false;
    for (let i = 0; i < 3; i++) {
      const r = row + i;
      if (r < 0) continue; // above the board, always unobstructed
      if (!this.board.isValidCell(col, r)) return false;
      if (!this.board.isEmpty(col, r)) return false;
    }
    return true;
  }

  // --- main update ------------------------------------------------------

  update(dt) {
    if (this.screenState !== ScreenState.PLAYING) return;

    switch (this.phase) {
      case Phase.SPAWNING:
        this._handleSpawning();
        break;
      case Phase.FALLING:
        this._handleFalling(dt);
        break;
      case Phase.LOCKING:
        this._handleLocking();
        break;
      case Phase.MATCHING:
        this._handleMatching();
        break;
      case Phase.CLEARING:
        this._handleClearing(dt);
        break;
      case Phase.SETTLING:
        this._handleSettling();
        break;
      case Phase.BOARD_CLEAR:
        this._handleBoardClear(dt);
        break;
    }
  }

  _handleSpawning() {
    if (this.board.isColumnBlocked(SPAWN_COL)) {
      this._enterBoardClear();
      return;
    }
    this.piece = this.pieceGenerator.advance(SPAWN_COL);
    this.fallTimerMs = 0;
    this.chainCount = 0;
    this.phase = Phase.FALLING;
  }

  _handleFalling(dt) {
    this.fallTimerMs += dt;
    const interval = this.softDropActive ? SOFT_DROP_INTERVAL_MS : this.fallIntervalMs;
    if (this.fallTimerMs < interval) return;
    this.fallTimerMs -= interval;

    if (this._canPlace(this.piece.col, this.piece.row + 1)) {
      this.piece.row += 1;
    } else {
      this.phase = Phase.LOCKING;
    }
  }

  _handleLocking() {
    for (const cell of this.piece.cells()) {
      if (cell.row >= 0) this.board.setCell(cell.col, cell.row, cell.color);
    }
    this.phase = Phase.MATCHING;
  }

  _handleMatching() {
    const toClear = findMatches(this.board);
    if (toClear.size === 0) {
      this.chainCount = 0;
      this.phase = Phase.SPAWNING;
      return;
    }
    this.chainCount += 1;
    this.flashingCells = toClear;
    this.clearFlashTimer = 0;
    this.phase = Phase.CLEARING;
  }

  _handleClearing(dt) {
    this.clearFlashTimer += dt;
    if (this.clearFlashTimer < CLEAR_FLASH_MS) return;

    const colors = clearMatches(this.board, this.flashingCells);
    this.flashingCells = null;

    const stepScore = calculateStepScore(colors, this.chainCount);
    this.score += stepScore;
    this.gemsCleared += colors.length;
    this._updateLevel();
    this._applyMilestones();

    this.phase = Phase.SETTLING;
  }

  _handleSettling() {
    this.board.settleGravity();
    this.phase = Phase.MATCHING; // loop back to catch cascades
  }

  _enterBoardClear() {
    this.lives -= 1;
    this.phase = Phase.BOARD_CLEAR;
    this.boardClearTimer = 0;
  }

  _handleBoardClear(dt) {
    this.boardClearTimer += dt;
    if (this.boardClearTimer < BOARD_CLEAR_PAUSE_MS) return;

    this.board.clear();
    if (this.lives <= 0) {
      this.screenState = ScreenState.GAME_OVER;
    } else {
      this.phase = Phase.SPAWNING;
    }
  }

  _updateLevel() {
    this.level = 1 + Math.floor(this.gemsCleared / GEMS_PER_LEVEL);
    const idx = Math.min(this.level - 1, FALL_SPEEDS.length - 1);
    this.fallIntervalMs = FALL_SPEEDS[idx];
  }

  _applyMilestones() {
    const { livesGained, nextMilestone } = checkMilestones(this.score, this.nextLifeMilestone);
    if (livesGained > 0) this.lives += livesGained;
    this.nextLifeMilestone = nextMilestone;
  }

  // --- debug hooks (only wired to `window` behind ?debug=1, see main.js) --

  debugSetBoard(gridArray) {
    this.board.grid = gridArray.map((row) => [...row]);
  }

  debugForceNextGems(gems) {
    this.pieceGenerator.next.gems = [...gems];
  }

  debugForceCurrentGems(gems) {
    this.piece.gems = [...gems];
  }
}
