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
        parsed.tiles.length === 25 &&
        Array.isArray(parsed.checked) &&
        parsed.checked.length === 25 &&
        Array.isArray(parsed.values) &&
        parsed.values.length === 25
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
    tiles: shuffle(TILES),
    checked: Array(25).fill(false),
    values: Array(25).fill(''),
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
  const lines = [];

  // Rows
  for (let r = 0; r < 5; r++) {
    const row = [0, 1, 2, 3, 4].map((col) => r * 5 + col);
    if (row.every((i) => c[i])) lines.push(row);
  }

  // Columns
  for (let col = 0; col < 5; col++) {
    const column = [0, 1, 2, 3, 4].map((r) => r * 5 + col);
    if (column.every((i) => c[i])) lines.push(column);
  }

  // Diagonals
  const diag1 = [0, 6, 12, 18, 24];
  const diag2 = [4, 8, 12, 16, 20];
  if (diag1.every((i) => c[i])) lines.push(diag1);
  if (diag2.every((i) => c[i])) lines.push(diag2);

  return lines;
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
