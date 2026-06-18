import { useCallback, useEffect, useState } from 'react';
import {
  CELL_SIZE,
  createLayoutObject,
  getObjectAt,
  GRID_COLS,
  GRID_ROWS,
  parseLayoutData,
  serializeLayoutData,
} from '../../utils/layoutData';

const CATEGORY_LABEL = {
  FIRE: '소방',
  MEDICAL: '의료',
  CHEMICAL: '화학',
  GENERAL: '일반',
};

function categoryLabel(category) {
  return CATEGORY_LABEL[category] || category || '장비';
}

export default function LabLayoutCanvas({
  equipList,
  backgroundImageUrl,
  layoutData,
  onChange,
  readOnly = false,
}) {
  const [layout, setLayout] = useState(() => parseLayoutData(layoutData));
  const [selectedEquip, setSelectedEquip] = useState(null);

  useEffect(() => {
    setLayout(parseLayoutData(layoutData));
  }, [layoutData]);

  const emitChange = useCallback(
    (next) => {
      setLayout(next);
      onChange?.(serializeLayoutData(next));
    },
    [onChange],
  );

  const namedEquips = equipList
    .map((eq, index) => ({ ...eq, equipIndex: index }))
    .filter((eq) => eq.equipName?.trim());

  const handleCellClick = (col, row) => {
    if (readOnly) return;
    const existing = getObjectAt(layout.objects, col, row);
    if (existing) {
      emitChange({
        ...layout,
        objects: layout.objects.filter((obj) => obj.id !== existing.id),
      });
      return;
    }
    if (!selectedEquip) return;
    const obj = createLayoutObject(selectedEquip, selectedEquip.equipIndex, col, row);
    emitChange({ ...layout, objects: [...layout.objects, obj] });
  };

  const clearAll = () => emitChange({ ...layout, objects: [] });

  const gridCols = layout.gridCols ?? GRID_COLS;
  const gridRows = layout.gridRows ?? GRID_ROWS;
  const cellSize = layout.cellSize ?? CELL_SIZE;

  return (
    <div className={`layout-canvas-wrap${readOnly ? ' read-only' : ''}`}>
      {!readOnly && (
        <aside className="layout-palette">
          <h4>장비 목록</h4>
          <p className="muted-text layout-palette-hint">장비를 선택한 뒤 격자 칸을 클릭하세요.</p>
          {namedEquips.length === 0 && (
            <p className="muted-text">2단계에서 장비명을 입력하세요.</p>
          )}
          {namedEquips.map((equip) => (
            <button
              key={equip.equipIndex}
              type="button"
              className={`layout-palette-item${selectedEquip?.equipIndex === equip.equipIndex ? ' selected' : ''}`}
              onClick={() => setSelectedEquip(
                selectedEquip?.equipIndex === equip.equipIndex ? null : equip,
              )}
            >
              <span className="layout-palette-icon">{categoryLabel(equip.category).charAt(0)}</span>
              <span>
                <strong>{equip.equipName}</strong>
                <small>{categoryLabel(equip.category)} · {equip.quantity}개</small>
              </span>
            </button>
          ))}
        </aside>
      )}

      <div className="layout-canvas-panel">
        {!readOnly && (
          <div className="layout-canvas-toolbar">
            <span className="muted-text">
              배치된 장비 {layout.objects.length}개 · 격자 {gridCols}×{gridRows}
            </span>
            <button type="button" className="btn btn-sm btn-outline" onClick={clearAll} disabled={!layout.objects.length}>
              전체 삭제
            </button>
          </div>
        )}

        <div
          className="layout-canvas layout-canvas-grid-mode"
          style={{ width: gridCols * cellSize, height: gridRows * cellSize }}
        >
          {backgroundImageUrl && (
            <img src={backgroundImageUrl} alt="연구실 내부 도면" className="layout-canvas-bg" draggable={false} />
          )}

          <div
            className="layout-grid-layer"
            style={{
              gridTemplateColumns: `repeat(${gridCols}, ${cellSize}px)`,
              gridTemplateRows: `repeat(${gridRows}, ${cellSize}px)`,
            }}
          >
            {Array.from({ length: gridRows }, (_, row) =>
              Array.from({ length: gridCols }, (_, col) => {
                const obj = getObjectAt(layout.objects, col, row);
                const canPlace = !readOnly && selectedEquip && !obj;
                return (
                  <button
                    key={`${col}-${row}`}
                    type="button"
                    className={[
                      'layout-grid-cell',
                      obj ? 'occupied' : '',
                      canPlace ? 'placeable' : '',
                    ].filter(Boolean).join(' ')}
                    onClick={() => handleCellClick(col, row)}
                    disabled={readOnly && !obj}
                    title={obj ? `${obj.equipName} (클릭하여 제거)` : canPlace ? '클릭하여 배치' : ''}
                  >
                    {obj && (
                      <>
                        <span className="layout-marker-icon">{categoryLabel(obj.category).charAt(0)}</span>
                        <span className="layout-marker-label">{obj.equipName}</span>
                      </>
                    )}
                  </button>
                );
              }))}
          </div>
        </div>

        {!readOnly && (
          <p className="muted-text layout-canvas-note">
            {backgroundImageUrl
              ? '4단계에서 등록한 내부 도면 위에 격자로 배치합니다.'
              : '내부 도면 없이 격자만 표시됩니다. 4단계에서 도면을 등록할 수 있습니다.'}
            {' '}배치된 칸을 다시 클릭하면 제거됩니다.
          </p>
        )}
      </div>
    </div>
  );
}
