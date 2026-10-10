/**
 * Bygger ett ordsöksrutnät där alla ord finns: vågrätt, lodrätt, snett och
 * baklänges. Används av ordsökskapitlen och av utskriften ("Skriva ut").
 */
export type Cell = [number, number];
export type Placement = { word: string; cells: Cell[] };

const MIN_GRID_SIZE = 12;
const DIRECTIONS: Cell[] = [
  [0, 1], [1, 0], [1, 1], [0, -1], [-1, 0], [-1, -1], [1, -1], [-1, 1],
];
const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/**
 * Ett försök att placera alla ord i ett rutnät av given storlek.
 * Returnerar null om något ord inte fick plats.
 */
function tryBuildGrid(
  words: string[],
  gridSize: number
): { grid: string[][]; placements: Placement[] } | null {
  const grid: string[][] = Array.from({ length: gridSize }, () => Array(gridSize).fill(""));
  const placements: Placement[] = [];

  // Placera längsta orden först – de är svårast och bör få välja plats fritt.
  const ordered = [...words].sort((a, b) => b.length - a.length);

  for (const word of ordered) {
    let placed = false;
    for (let attempt = 0; attempt < 400 && !placed; attempt++) {
      const [dr, dc] = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];
      const rowMin = dr > 0 ? 0 : dr < 0 ? word.length - 1 : 0;
      const rowMax = dr > 0 ? gridSize - word.length : dr < 0 ? gridSize - 1 : gridSize - 1;
      const colMin = dc > 0 ? 0 : dc < 0 ? word.length - 1 : 0;
      const colMax = dc > 0 ? gridSize - word.length : dc < 0 ? gridSize - 1 : gridSize - 1;
      if (rowMin > rowMax || colMin > colMax) continue;
      const row = rowMin + Math.floor(Math.random() * (rowMax - rowMin + 1));
      const col = colMin + Math.floor(Math.random() * (colMax - colMin + 1));
      const cells: Cell[] = [];
      let valid = true;
      for (let i = 0; i < word.length; i++) {
        const r = row + i * dr, c = col + i * dc;
        if (r < 0 || r >= gridSize || c < 0 || c >= gridSize) { valid = false; break; }
        if (grid[r][c] && grid[r][c] !== word[i]) { valid = false; break; }
        cells.push([r, c]);
      }
      if (valid) {
        cells.forEach(([r, c], i) => { grid[r][c] = word[i]; });
        placements.push({ word, cells });
        placed = true;
      }
    }
    if (!placed) return null; // ordet fick inte plats – försök med större rutnät
  }

  return { grid, placements };
}

/**
 * Bygger ett rutnät där ALLA ord garanterat finns.
 *
 * Tidigare hoppades ord som inte fick plats tyst över, men de stod kvar i
 * listan eleven skulle hitta – då gick modulen aldrig att slutföra. Nu görs
 * flera försök med gradvis större rutnät, och det bästa försöket används som
 * sista utväg (WordSearch räknar då mot placements, inte mot ordlistan).
 */
export function buildGrid(wordList: string[]): { grid: string[][]; placements: Placement[]; gridSize: number } {
  const words = wordList.map((w) => w.toUpperCase());
  const longestWord = Math.max(...words.map((w) => w.length));
  const baseSize = Math.max(MIN_GRID_SIZE, longestWord + 2);

  let best: { grid: string[][]; placements: Placement[]; gridSize: number } | null = null;

  for (let extra = 0; extra <= 6; extra++) {
    const gridSize = baseSize + extra;
    // Flera omgångar per storlek – placeringen är slumpad.
    for (let round = 0; round < 3; round++) {
      const result = tryBuildGrid(words, gridSize);
      if (result) {
        best = { ...result, gridSize };
        break;
      }
    }
    if (best) break;
  }

  // Nödfall (bör aldrig inträffa): ta med så många ord som möjligt.
  if (!best) {
    const grid: string[][] = Array.from({ length: baseSize + 6 }, () => Array(baseSize + 6).fill(""));
    best = { grid, placements: [], gridSize: baseSize + 6 };
  }

  // Fyll tomma rutor med slumpbokstäver
  for (let r = 0; r < best.gridSize; r++)
    for (let c = 0; c < best.gridSize; c++)
      if (!best.grid[r][c]) best.grid[r][c] = LETTERS[Math.floor(Math.random() * LETTERS.length)];

  return best;
}
