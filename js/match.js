// Pure match-scan/clear algorithm. Operates only on board.grid — no
// knowledge of the falling piece, since matching only happens after a
// piece has locked into the board.

const DIRECTIONS = [
  [1, 0], // horizontal
  [0, 1], // vertical
  [1, 1], // diagonal \
  [1, -1], // diagonal /
];

// Scans all 4 directions for runs of 3+ same-colored gems. Each run is
// counted exactly once per direction: a cell only starts a run scan if its
// predecessor (one step back along the direction vector) is not the same
// color, so runs are found starting from their true start cell. Overlapping
// runs (e.g. a T/+ intersection) naturally dedupe via the Set.
//
// Returns a Set of "col,row" keys for every cell that should be cleared.
export function findMatches(board) {
  const { grid } = board;
  const toClear = new Set();

  for (const [dc, dr] of DIRECTIONS) {
    for (let r = 0; r < board.rows; r++) {
      for (let c = 0; c < board.cols; c++) {
        const color = grid[r][c];
        if (color === null) continue;

        const prevC = c - dc;
        const prevR = r - dr;
        if (board.isValidCell(prevC, prevR) && grid[prevR][prevC] === color) {
          continue; // not a run start in this direction
        }

        let length = 1;
        while (true) {
          const nc = c + dc * length;
          const nr = r + dr * length;
          if (!board.isValidCell(nc, nr) || grid[nr][nc] !== color) break;
          length++;
        }

        if (length >= 3) {
          for (let i = 0; i < length; i++) {
            toClear.add(`${c + dc * i},${r + dr * i}`);
          }
        }
      }
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
