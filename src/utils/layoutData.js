export const GRID_COLS = 20;
export const GRID_ROWS = 12;
export const CELL_SIZE = 40;
export const CANVAS_WIDTH = GRID_COLS * CELL_SIZE;
export const CANVAS_HEIGHT = GRID_ROWS * CELL_SIZE;

export function createEmptyLayout() {
  return {
    version: 2,
    gridCols: GRID_COLS,
    gridRows: GRID_ROWS,
    cellSize: CELL_SIZE,
    canvasWidth: CANVAS_WIDTH,
    canvasHeight: CANVAS_HEIGHT,
    objects: [],
  };
}

function migrateObject(obj, layout) {
  const cellSize = layout.cellSize ?? CELL_SIZE;
  if (typeof obj.col === 'number' && typeof obj.row === 'number') {
    return {
      ...obj,
      col: obj.col,
      row: obj.row,
      x: obj.col * cellSize,
      y: obj.row * cellSize,
      width: cellSize,
      height: cellSize,
    };
  }
  const col = Math.min(GRID_COLS - 1, Math.max(0, Math.floor((obj.x ?? 0) / cellSize)));
  const row = Math.min(GRID_ROWS - 1, Math.max(0, Math.floor((obj.y ?? 0) / cellSize)));
  return {
    ...obj,
    col,
    row,
    x: col * cellSize,
    y: row * cellSize,
    width: cellSize,
    height: cellSize,
  };
}

export function parseLayoutData(raw) {
  if (!raw || !String(raw).trim()) return createEmptyLayout();
  try {
    const parsed = JSON.parse(raw);
    const layout = {
      version: parsed.version ?? 2,
      gridCols: parsed.gridCols ?? GRID_COLS,
      gridRows: parsed.gridRows ?? GRID_ROWS,
      cellSize: parsed.cellSize ?? CELL_SIZE,
      canvasWidth: parsed.canvasWidth ?? CANVAS_WIDTH,
      canvasHeight: parsed.canvasHeight ?? CANVAS_HEIGHT,
      objects: Array.isArray(parsed.objects) ? parsed.objects : [],
    };
    layout.objects = layout.objects.map((obj) => migrateObject(obj, layout));
    return layout;
  } catch {
    return createEmptyLayout();
  }
}

export function serializeLayoutData(layout) {
  const cellSize = layout.cellSize ?? CELL_SIZE;
  return JSON.stringify({
    version: 2,
    gridCols: layout.gridCols ?? GRID_COLS,
    gridRows: layout.gridRows ?? GRID_ROWS,
    cellSize,
    canvasWidth: layout.canvasWidth ?? CANVAS_WIDTH,
    canvasHeight: layout.canvasHeight ?? CANVAS_HEIGHT,
    objects: (layout.objects ?? []).map((obj) => ({
      id: obj.id,
      equipIndex: obj.equipIndex,
      equipName: obj.equipName,
      category: obj.category,
      col: obj.col,
      row: obj.row,
      x: obj.col * cellSize,
      y: obj.row * cellSize,
      width: cellSize,
      height: cellSize,
    })),
  });
}

export function createLayoutObject(equip, equipIndex, col, row) {
  return {
    id: `eq-${equipIndex}-${col}-${row}-${Date.now()}`,
    equipIndex,
    equipName: equip.equipName,
    category: equip.category || 'GENERAL',
    col,
    row,
    x: col * CELL_SIZE,
    y: row * CELL_SIZE,
    width: CELL_SIZE,
    height: CELL_SIZE,
  };
}

export function getObjectAt(objects, col, row) {
  return objects.find((obj) => obj.col === col && obj.row === row) ?? null;
}

export function resolveUploadUrl(filePath) {
  if (!filePath) return null;
  if (filePath.startsWith('http://') || filePath.startsWith('https://') || filePath.startsWith('blob:')) {
    return filePath;
  }
  const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
  if (filePath.startsWith('/')) {
    return `${base}${filePath}`;
  }
  return `${base}/${filePath.replace(/^\//, '')}`;
}

export const LAYOUT_MARKER_SIZE = CELL_SIZE;
