import { GEM_COLORS, GEM_WEIGHTS, SPAWN_COL } from "./constants.js";

// Top row (of the 3-gem stack) a piece spawns at. Negative rows are above
// the visible board; the bottom gem starts at row 0 so it's visible
// immediately, while the top two gems fall in from off-screen.
const SPAWN_TOP_ROW = -2;

const WEIGHTED_TABLE = (() => {
  const table = [];
  for (const color of GEM_COLORS) {
    const weight = GEM_WEIGHTS[color] ?? 1;
    for (let i = 0; i < weight; i++) table.push(color);
  }
  return table;
})();

function rollGem() {
  return WEIGHTED_TABLE[Math.floor(Math.random() * WEIGHTED_TABLE.length)];
}

export class Piece {
  constructor(col, row, gems) {
    this.col = col;
    this.row = row; // row of the TOP gem; mid = row+1, bottom = row+2
    this.gems = gems; // [top, mid, bottom]
  }

  static spawn(col = SPAWN_COL) {
    return new Piece(col, SPAWN_TOP_ROW, [rollGem(), rollGem(), rollGem()]);
  }

  clone() {
    return new Piece(this.col, this.row, [...this.gems]);
  }

  // Cycles gem order so the bottom gem becomes the top gem (and everything
  // else shifts down one slot). This is the piece's only "rotation" since
  // it's always a 1-wide vertical stack.
  cycle() {
    const [top, mid, bottom] = this.gems;
    this.gems = [bottom, top, mid];
  }

  // Returns the 3 board cells this piece currently occupies, top to bottom.
  cells() {
    return [
      { col: this.col, row: this.row, color: this.gems[0] },
      { col: this.col, row: this.row + 1, color: this.gems[1] },
      { col: this.col, row: this.row + 2, color: this.gems[2] },
    ];
  }
}

// Holds the current falling piece and the next piece (for the preview
// panel), and produces new pieces on demand.
export class PieceGenerator {
  constructor() {
    this.current = Piece.spawn();
    this.next = Piece.spawn();
  }

  // Promotes `next` to `current` (repositioning it to the spawn column/row),
  // rolls a fresh `next`, and returns the new current piece.
  advance(col = SPAWN_COL) {
    this.current = new Piece(col, SPAWN_TOP_ROW, this.next.gems);
    this.next = Piece.spawn();
    return this.current;
  }
}
