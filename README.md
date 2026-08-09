# Grandma's Jewelbox

A browser clone of [Jewelbox](https://en.wikipedia.org/wiki/Jewelbox_(video_game))
(1992, Rodney & Brenda Jacks), itself a clone of Sega's *Columns*.

A vertical triplet of gems falls down a well. Move it left/right and cycle
the gem order to line up 3 or more of the same color — horizontally,
vertically, or diagonally — to clear them. Cleared gems let the stack above
fall and chain into new matches for bonus score. You start with 3 lives; if
the well fills up you lose one (and the board is wiped), and you earn extra
lives at score milestones. Game over at 0 lives.

## Play

No build step or dependencies — just open `index.html` in a browser, or
serve the folder with any static file server:

```sh
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Controls

- `←` / `→` — move
- `↑` / `Space` — cycle the piece's gem order
- `↓` (hold) — soft drop
- `P` / `Escape` — pause
- `Enter` — start / restart

## Project layout

- `index.html`, `css/style.css` — page shell, canvas, HUD, overlays
- `js/constants.js` — board size, colors, timing, and scoring tables
- `js/board.js`, `js/piece.js` — board grid and falling-piece logic
- `js/match.js` — match scanning and clearing (4-direction run detection)
- `js/scoring.js` — score/chain-multiplier/extra-life calculations
- `js/game.js` — the game state machine (spawning → falling → locking →
  matching → clearing → settling, plus lives/board-clear handling)
- `js/input.js`, `js/renderer.js`, `js/main.js` — keyboard input, canvas
  rendering, and the main loop
