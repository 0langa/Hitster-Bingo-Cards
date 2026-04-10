/**
 * Hitster Bingo – app.js
 * Vanilla ES6+, no build tools, no dependencies beyond what the HTML loads.
 */

'use strict';

// ─── Data Model ──────────────────────────────────────────────────────────────

/**
 * Category definition: { id, label, bg, text, description }
 * - id:          unique key within a mode (used for constraint logic)
 * - label:       short name shown on bingo cells
 * - bg / text:   Tailwind color classes
 * - description: one-line rule explanation shown in mode-selection UI
 */

/** @type {Record<string, { name: string, categories: Array<{id:string,label:string,bg:string,text:string,description:string}> }>} */
const GAME_MODES = {
  anfaenger: {
    name: 'Anfänger',
    categories: [
      {
        id: 'solo_group',
        label: 'Solokünstler/Gruppe',
        bg: 'bg-green-500',
        text: 'text-white',
        description: 'Solokünstler oder Gruppe/Band?',
      },
      {
        id: 'year4',
        label: 'Jahr ± 4',
        bg: 'bg-yellow-400',
        text: 'text-black',
        description: 'Erscheinungsjahr ± 4 Jahre erraten',
      },
      {
        id: 'year2',
        label: 'Jahr ± 2',
        bg: 'bg-blue-500',
        text: 'text-white',
        description: 'Erscheinungsjahr ± 2 Jahre erraten',
      },
      {
        id: 'before_after',
        label: 'Vor/Nach 2000',
        bg: 'bg-pink-500',
        text: 'text-white',
        description: 'Vor oder nach dem Jahr 2000?',
      },
      {
        id: 'decade',
        label: 'Jahrzehnt',
        bg: 'bg-purple-500',
        text: 'text-white',
        description: 'Das richtige Jahrzehnt nennen',
      },
    ],
  },
  profi: {
    name: 'Profi',
    categories: [
      {
        id: 'song_title',
        label: 'Songtitel',
        bg: 'bg-green-500',
        text: 'text-white',
        description: 'Den genauen Songtitel erraten',
      },
      {
        id: 'artist_name',
        label: 'Künstler/Bandname',
        bg: 'bg-yellow-400',
        text: 'text-black',
        description: 'Den Künstler oder die Band benennen',
      },
      {
        id: 'year3',
        label: 'Jahr ± 3',
        bg: 'bg-blue-500',
        text: 'text-white',
        description: 'Erscheinungsjahr ± 3 Jahre erraten',
      },
      {
        id: 'exact_year',
        label: 'Genaues Jahr',
        bg: 'bg-pink-500',
        text: 'text-white',
        description: 'Das exakte Erscheinungsjahr nennen',
      },
      {
        id: 'decade',
        label: 'Jahrzehnt',
        bg: 'bg-purple-500',
        text: 'text-white',
        description: 'Das richtige Jahrzehnt nennen',
      },
    ],
  },
};

/** Returns the 25 tile definitions (5 per category) for a given mode. */
function buildTilesForMode(modeId) {
  const mode = GAME_MODES[modeId];
  if (!mode) throw new Error(`Unknown game mode: ${modeId}`);
  return mode.categories.flatMap((cat) =>
    Array.from({ length: 5 }, () => ({ ...cat }))
  );
}

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

/** @type {{ mode: string, tiles: Array<{id:string,label:string,bg:string,text:string}>, checked: boolean[], values: string[], scratchpad: string, wonLines: string[] } | null} */
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

function generateConstrainedTiles(modeId) {
  const modeTiles = buildTilesForMode(modeId);
  const categories = GAME_MODES[modeId].categories;
  const tiles = Array(TILE_COUNT).fill(null);
  const remaining = modeTiles.reduce((counts, tile) => {
    counts[tile.id] = (counts[tile.id] || 0) + 1;
    return counts;
  }, {});

  if (!placeTile(tiles, remaining, categories, 0)) {
    throw new Error('Unable to generate a valid bingo board.');
  }

  return tiles;
}

function placeTile(tiles, remaining, categories, step) {
  if (step === PLACEMENT_ORDER.length) return true;

  const index = PLACEMENT_ORDER[step];
  const candidates = shuffle(
    categories.filter(
      (category) =>
        remaining[category.id] > 0 &&
        canPlaceCategory(tiles, index, category.id)
    )
  ).sort((a, b) => remaining[b.id] - remaining[a.id]);

  for (const category of candidates) {
    tiles[index] = { ...category };
    remaining[category.id]--;

    if (placeTile(tiles, remaining, categories, step + 1)) {
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
      // Basic validation (includes mode field)
      if (
        typeof parsed.mode === 'string' &&
        GAME_MODES[parsed.mode] &&
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

function generateBoard(modeId) {
  state = {
    mode: modeId,
    tiles: generateConstrainedTiles(modeId),
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

// ─── Mode Selection Modal ─────────────────────────────────────────────────────

/** Tailwind bg class → raw hex for the category dot in the modal. */
const BG_TO_HEX = {
  'bg-green-500':  '#22c55e',
  'bg-yellow-400': '#facc15',
  'bg-blue-500':   '#3b82f6',
  'bg-pink-500':   '#ec4899',
  'bg-purple-500': '#a855f7',
};

/**
 * Renders mode cards into the modal and shows it.
 * @param {boolean} isFirstGame – true when no saved state exists (skip confirmation)
 */
function showModeModal(isFirstGame) {
  const overlay = document.getElementById('mode-modal');
  const container = document.getElementById('mode-cards');
  container.innerHTML = '';

  for (const [modeId, mode] of Object.entries(GAME_MODES)) {
    const card = document.createElement('div');

    // Subtle gradient background per mode
    const gradientClass = modeId === 'anfaenger'
      ? 'bg-gradient-to-br from-gray-700 to-gray-800'
      : 'bg-gradient-to-br from-indigo-900 to-gray-800';

    card.className = `mode-card ${gradientClass}`;

    // Title
    const title = document.createElement('div');
    title.className = 'mode-title text-white';
    title.textContent = mode.name;
    card.appendChild(title);

    // Category list
    const list = document.createElement('div');
    list.className = 'mode-categories';

    mode.categories.forEach((cat) => {
      const chip = document.createElement('div');
      chip.className = 'mode-cat-chip text-gray-300';

      const dot = document.createElement('span');
      dot.className = 'mode-cat-dot';
      dot.style.backgroundColor = BG_TO_HEX[cat.bg] || '#888';

      const text = document.createElement('span');
      text.textContent = `${cat.label} – ${cat.description}`;

      chip.appendChild(dot);
      chip.appendChild(text);
      list.appendChild(chip);
    });

    card.appendChild(list);

    // Click → start game with this mode
    card.addEventListener('click', () => {
      hideModeModal();
      startNewGame(modeId);
    });

    container.appendChild(card);
  }

  overlay.classList.remove('hidden');
}

function hideModeModal() {
  document.getElementById('mode-modal').classList.add('hidden');
}

function startNewGame(modeId) {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (_) {
    // ignore
  }
  generateBoard(modeId);
}

// ─── Reset ────────────────────────────────────────────────────────────────────

function resetGame() {
  if (state) {
    const confirmed = window.confirm(
      'Neues Spiel starten? Der aktuelle Spielstand geht verloren.'
    );
    if (!confirmed) return;
  }
  showModeModal(false);
}

// ─── Bootstrap ───────────────────────────────────────────────────────────────

function autoResizePad(el) {
  el.style.height = 'auto';
  el.style.height = el.scrollHeight + 'px';
}

document.addEventListener('DOMContentLoaded', () => {
  // Wire up the "Neues Spiel" button
  document.getElementById('new-game-btn').addEventListener('click', resetGame);

  // Close modal when clicking on the overlay backdrop (not the modal itself)
  document.getElementById('mode-modal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget && state) {
      hideModeModal();
    }
  });

  // Wire up the scratchpad
  const pad = document.getElementById('scratchpad');
  pad.addEventListener('input', (e) => {
    state.scratchpad = e.target.value;
    autoResizePad(e.target);
    saveState();
  });

  // Wire up the "Eingabe Löschen" button
  document.getElementById('clear-scratchpad-btn').addEventListener('click', () => {
    pad.value = '';
    state.scratchpad = '';
    autoResizePad(pad);
    saveState();
    pad.focus();
  });

  // Load saved state or show mode selection for first game
  const saved = loadState();
  if (saved) {
    state = saved;
    renderBoard();
  } else {
    showModeModal(true);
  }
});
