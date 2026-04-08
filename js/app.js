/**
 * Hitster Bingo – app.js
 * Vanilla ES6+, no build tools, no dependencies beyond what the HTML loads.
 */

'use strict';

// ─── Data Model ──────────────────────────────────────────────────────────────

const CATEGORIES = [
  {
    id: 'artist',
    label: 'Künstler / Band',
    bg: 'bg-green-500',
    text: 'text-white',
  },
  {
    id: 'year4',
    label: 'Jahr ± 4',
    bg: 'bg-yellow-400',
    text: 'text-black',
  },
  {
    id: 'year2',
    label: 'Jahr ± 2',
    bg: 'bg-blue-500',
    text: 'text-white',
  },
  {
    id: 'before_after',
    label: 'Vor/Nach 2000',
    bg: 'bg-pink-500',
    text: 'text-white',
  },
  {
    id: 'decade',
    label: 'Jahrzehnt',
    bg: 'bg-purple-500',
    text: 'text-white',
  },
];

// 5 tiles per category = 25 total
const TILES = CATEGORIES.flatMap((cat) =>
  Array.from({ length: 5 }, () => ({ ...cat }))
);

const STORAGE_KEY = 'hitsterGameState';
const BOARD_SIZE = 5;
const TILE_COUNT = BOARD_SIZE * BOARD_SIZE;
const MAX_CATEGORY_PER_LINE = 2;
const WINNING_LINES = buildWinningLineIndices();
const LINES_BY_INDEX = Array.from({ length: TILE_COUNT }, () => []);
const ADJACENT_INDICES = Array.from({ length: TILE_COUNT }, (_, index) => {
  const row = Math.floor(index / BOARD_SIZE);
  const col = index % BOARD_SIZE;
  const neighbors = [];

  if (row > 0) neighbors.push(index - BOARD_SIZE);
  if (row < BOARD_SIZE - 1) neighbors.push(index + BOARD_SIZE);
  if (col > 0) neighbors.push(index - 1);
  if (col < BOARD_SIZE - 1) neighbors.push(index + 1);

  return neighbors;
});

WINNING_LINES.forEach((line) => {
  line.forEach((index) => {
    LINES_BY_INDEX[index].push(line);
  });
});

const PLACEMENT_ORDER = Array.from({ length: TILE_COUNT }, (_, index) => index).sort(
  (a, b) =>
    LINES_BY_INDEX[b].length - LINES_BY_INDEX[a].length ||
    ADJACENT_INDICES[b].length - ADJACENT_INDICES[a].length
);

// ─── State ───────────────────────────────────────────────────────────────────

/** @type {{ tiles: Array<{id: string, label: string, bg: string, text: string}>, checked: boolean[], values: string[], scratchpad: string }} */
let state = null;

// ─── Fisher-Yates Shuffle ────────────────────────────────────────────────────

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  return arr;
}

function buildWinningLineIndices() {
  const lines = [];

  for (let row = 0; row < BOARD_SIZE; row++) {
    lines.push(
      Array.from({ length: BOARD_SIZE }, (_, col) => row * BOARD_SIZE + col)
    );
  }

  for (let col = 0; col < BOARD_SIZE; col++) {
    lines.push(
      Array.from({ length: BOARD_SIZE }, (_, row) => row * BOARD_SIZE + col)
    );
  }

  lines.push(
    Array.from({ length: BOARD_SIZE }, (_, i) => i * (BOARD_SIZE + 1))
  );
  lines.push(
    Array.from({ length: BOARD_SIZE }, (_, i) => (i + 1) * (BOARD_SIZE - 1))
  );

  return lines;
}

function generateConstrainedTiles() {
  const tiles = Array(TILE_COUNT).fill(null);
  const remaining = TILES.reduce((counts, tile) => {
    counts[tile.id] = (counts[tile.id] || 0) + 1;
    return counts;
  }, {});

  if (!placeTile(tiles, remaining, 0)) {
    throw new Error('Unable to generate a valid bingo board.');
  }

  return tiles;
}

function placeTile(tiles, remaining, step) {
  if (step === PLACEMENT_ORDER.length) return true;

  const index = PLACEMENT_ORDER[step];
  const candidates = shuffle(
    CATEGORIES.filter(
      (category) =>
        remaining[category.id] > 0 &&
        canPlaceCategory(tiles, index, category.id)
    )
  ).sort((a, b) => remaining[b.id] - remaining[a.id]);

  for (const category of candidates) {
    tiles[index] = { ...category };
    remaining[category.id]--;

    if (placeTile(tiles, remaining, step + 1)) {
      return true;
    }

    remaining[category.id]++;
    tiles[index] = null;
  }

  return false;
}

function canPlaceCategory(tiles, index, categoryId) {
  if (
    ADJACENT_INDICES[index].some(
      (neighborIndex) => tiles[neighborIndex]?.id === categoryId
    )
  ) {
    return false;
  }

  return LINES_BY_INDEX[index].every(
    (line) =>
      line.filter((lineIndex) => tiles[lineIndex]?.id === categoryId).length <
      MAX_CATEGORY_PER_LINE
  );
}

// ─── Persistence ─────────────────────────────────────────────────────────────

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (_) {
    // quota exceeded or private-browsing restriction – silently ignore
  }
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Basic validation
      if (
        Array.isArray(parsed.tiles) &&
        parsed.tiles.length === TILE_COUNT &&
        Array.isArray(parsed.checked) &&
        parsed.checked.length === TILE_COUNT &&
        Array.isArray(parsed.values) &&
        parsed.values.length === TILE_COUNT
      ) {
        if (!Array.isArray(parsed.wonLines)) parsed.wonLines = [];
        return parsed;
      }
    }
  } catch (_) {
    // corrupted data – start fresh
  }
  return null;
}

// ─── Board Generation ─────────────────────────────────────────────────────────

function generateBoard() {
  state = {
    tiles: generateConstrainedTiles(),
    checked: Array(TILE_COUNT).fill(false),
    values: Array(TILE_COUNT).fill(''),
    scratchpad: '',
    wonLines: [],
  };
  saveState();
  renderBoard();
}

// ─── Rendering ───────────────────────────────────────────────────────────────

function renderBoard() {
  const grid = document.getElementById('bingo-grid');
  grid.innerHTML = '';

  state.tiles.forEach((tile, index) => {
    const cell = document.createElement('div');
    cell.className = [
      'bingo-cell',
      tile.bg,
      tile.text,
      state.checked[index] ? 'is-checked' : '',
    ]
      .filter(Boolean)
      .join(' ');
    cell.dataset.index = index;

    // Category label
    const label = document.createElement('span');
    label.className = 'cell-label';
    label.textContent = tile.label;

    cell.appendChild(label);

    // Cell click → toggle checked state
    cell.addEventListener('click', () => toggleCell(index));

    grid.appendChild(cell);
  });

  // Restore scratchpad
  const pad = document.getElementById('scratchpad');
  pad.value = state.scratchpad;
  autoResizePad(pad);
}

// ─── Cell Toggle ─────────────────────────────────────────────────────────────

function toggleCell(index) {
  state.checked[index] = !state.checked[index];
  saveState();

  const cell = document.querySelector(`.bingo-cell[data-index="${index}"]`);
  if (cell) {
    cell.classList.toggle('is-checked', state.checked[index]);
  }

  checkBingo();
}

// ─── Bingo Detection ─────────────────────────────────────────────────────────

/** Returns an array of winning line indices (or empty if none). */
function getWinningLines() {
  const c = state.checked;
  return WINNING_LINES.filter((line) => line.every((i) => c[i]));
}

function checkBingo() {
  const winLines = getWinningLines();
  if (winLines.length === 0) return;

  const newLines = winLines.filter((line) => !state.wonLines.includes(line.join(',')));
  if (newLines.length === 0) return;

  newLines.forEach((line) => state.wonLines.push(line.join(',')));
  saveState();
  launchConfetti();
}

// ─── Win Animation ───────────────────────────────────────────────────────────

function launchConfetti() {
  if (typeof confetti !== 'function') return;

  const duration = 3000;
  const end = Date.now() + duration;

  (function frame() {
    confetti({
      particleCount: 6,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: ['#f9a8d4', '#c084fc', '#818cf8', '#38bdf8', '#fde047'],
    });
    confetti({
      particleCount: 6,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: ['#f9a8d4', '#c084fc', '#818cf8', '#38bdf8', '#fde047'],
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  })();
}

// ─── Reset ────────────────────────────────────────────────────────────────────

function resetGame() {
  const confirmed = window.confirm(
    'Neues Spiel starten? Der aktuelle Spielstand geht verloren.'
  );
  if (!confirmed) return;

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (_) {
    // ignore
  }

  generateBoard();
}

// ─── Bootstrap ───────────────────────────────────────────────────────────────

function autoResizePad(el) {
  el.style.height = 'auto';
  el.style.height = el.scrollHeight + 'px';
}

document.addEventListener('DOMContentLoaded', () => {
  // Wire up the "Neues Spiel" button
  document.getElementById('new-game-btn').addEventListener('click', resetGame);

  // Wire up the scratchpad
  const pad = document.getElementById('scratchpad');
  pad.addEventListener('input', (e) => {
    state.scratchpad = e.target.value;
    autoResizePad(e.target);
    saveState();
  });

  // Load or generate the board
  const saved = loadState();
  if (saved) {
    state = saved;
    renderBoard();
  } else {
    generateBoard();
  }
});
