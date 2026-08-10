// Pure localStorage I/O: player name, high-score leaderboard, and an
// in-progress game snapshot for resume-on-refresh. No DOM/game knowledge —
// callers (main.js, renderer.js) own wiring this into the game/UI.

const KEYS = {
  name: "jewelbox.playerName",
  scores: "jewelbox.highScores",
  snapshot: "jewelbox.savedGame",
};

const MAX_SCORES = 10;

export function getPlayerName() {
  try {
    return localStorage.getItem(KEYS.name) ?? "";
  } catch {
    return "";
  }
}

export function setPlayerName(name) {
  try {
    localStorage.setItem(KEYS.name, name);
  } catch {
    // localStorage unavailable (private mode, quota, etc.) — non-fatal.
  }
}

export function getHighScores() {
  try {
    const raw = localStorage.getItem(KEYS.scores);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

// Records a finished game's score, keeping the top MAX_SCORES entries
// sorted descending. Returns the updated list.
export function addHighScore(name, score) {
  const list = getHighScores();
  list.push({ name: name || "Anonymous", score, date: new Date().toISOString() });
  list.sort((a, b) => b.score - a.score);
  const trimmed = list.slice(0, MAX_SCORES);
  try {
    localStorage.setItem(KEYS.scores, JSON.stringify(trimmed));
  } catch {
    // ignore write failures
  }
  return trimmed;
}

export function saveGameSnapshot(snapshot) {
  try {
    localStorage.setItem(KEYS.snapshot, JSON.stringify(snapshot));
  } catch {
    // ignore write failures
  }
}

export function loadGameSnapshot() {
  try {
    const raw = localStorage.getItem(KEYS.snapshot);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearGameSnapshot() {
  try {
    localStorage.removeItem(KEYS.snapshot);
  } catch {
    // ignore
  }
}
