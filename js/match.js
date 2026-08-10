// Pure match-scan/clear algorithm. Operates only on board.grid — no
// knowledge of the falling piece, since matching only happens after a
// piece has locked into the board.

import { WILDCARD } from "./constants.js";

const DIRECTIONS = [
  [1, 0], // horizontal
  [0, 1], // vertical
  [1, 1], // diagonal \
  [1, -1], // diagonal /
];

// Enumerates every full line along a direction vector exactly once, each
// starting from a cell whose predecessor (one step back along the vector)
// is out of bounds — i.e. the true start of that line.
function getLines(board, dc, dr) {
  const lines = [];
  for (let r = 0; r < board.rows; r++) {
    for (let c = 0; c < board.cols; c++) {
      const prevC = c - dc;
      const prevR = r - dr;
      if (board.isValidCell(prevC, prevR)) continue; // not a line start

      const line = [];
      let cc = c;
      let rr = r;
      while (board.isValidCell(cc, rr)) {
        line.push({ col: cc, row: rr });
        cc += dc;
        rr += dr;
      }
      lines.push(line);
    }
  }
  return lines;
}

// Walks one line, grouping consecutive cells into runs where a cell
// continues the current run if it's the WILDCARD gem, the run's color is
// still undetermined (every cell so far has been WILDCARD), or it matches
// the run's determined color. Runs of length >= 3 are marked into toClear.
// With no wildcards on the board this produces the same result as a plain
// same-color run scan.
function scanLine(board, line, toClear) {
  let run = [];
  let runColor = null;

  const flush = () => {
    if (run.length >= 3) {
      for (const cell of run) toClear.add(`${cell.col},${cell.row}`);
    }
    run = [];
    runColor = null;
  };

  for (const { col, row } of line) {
    const color = board.getCell(col, row);
    if (color === null) {
      flush();
      continue;
    }

    const isWildcard = color === WILDCARD;
    const compatible = run.length === 0 || isWildcard || runColor === null || color === runColor;

    if (!compatible) flush();
    run.push({ col, row });
    if (runColor === null && !isWildcard) runColor = color;
  }
  flush();
}

// Scans all 4 directions for runs of 3+ compatible gems (same color, or
// bridged by the wildcard gem). Overlapping runs (e.g. a T/+ intersection)
// naturally dedupe via the Set.
//
// Returns a Set of "col,row" keys for every cell that should be cleared.
export function findMatches(board) {
  const toClear = new Set();

  for (const [dc, dr] of DIRECTIONS) {
    for (const line of getLines(board, dc, dr)) {
      scanLine(board, line, toClear);
    }
  }

  return toClear;
}

export function cellKeyToCoords(key) {
  const [col, row] = key.split(",").map(Number);
  return { col, row };
}

// Nulls out every cell in `toClear` and returns the list of gem colors that
// were cleared (for scoring), in no particular order.
export function clearMatches(board, toClear) {
  const colors = [];
  for (const key of toClear) {
    const { col, row } = cellKeyToCoords(key);
    colors.push(board.grid[row][col]);
    board.grid[row][col] = null;
  }
  return colors;
}
