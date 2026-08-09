import { COLS, ROWS } from "./constants.js";

// Board owns only locked gems. The falling piece is tracked separately
// (see piece.js) and merged in via setCell() only once it locks.
export class Board {
  constructor(cols = COLS, rows = ROWS) {
    this.cols = cols;
    this.rows = rows;
    this.grid = Board.emptyGrid(cols, rows);
  }

  static emptyGrid(cols, rows) {
    const grid = new Array(rows);
    for (let r = 0; r < rows; r++) {
      grid[r] = new Array(cols).fill(null);
    }
    return grid;
  }

  clear() {
    this.grid = Board.emptyGrid(this.cols, this.rows);
  }

  isValidCell(col, row) {
    return col >= 0 && col < this.cols && row >= 0 && row < this.rows;
  }

  getCell(col, row) {
    if (!this.isValidCell(col, row)) return undefined;
    return this.grid[row][col];
  }

  setCell(col, row, color) {
    this.grid[row][col] = color;
  }

  isEmpty(col, row) {
    return this.isValidCell(col, row) && this.grid[row][col] === null;
  }

  // A column is "blocked" for spawning if its topmost cell is occupied.
  isColumnBlocked(col) {
    return this.grid[0][col] !== null;
  }

  // Compacts each column independently: non-null cells fall to the bottom,
  // empty space accumulates at the top. No new gems are introduced.
  settleGravity() {
    for (let c = 0; c < this.cols; c++) {
      const values = [];
      for (let r = 0; r < this.rows; r++) {
        const v = this.grid[r][c];
        if (v !== null) values.push(v);
      }
      const emptyCount = this.rows - values.length;
      for (let r = 0; r < this.rows; r++) {
        this.grid[r][c] = r < emptyCount ? null : values[r - emptyCount];
      }
    }
  }
}
