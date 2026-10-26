import { useRef } from 'react';
import { SIZE, shipDefinition } from '../battleship/config';
import { coordinate, same } from '../battleship/placement';
import type { CellView, Position, Side } from '../battleship/types';

export function GameBoard({ side, cells, enabled, placing, preview, previewValid, onChoose, onHover }: {
  side: Side;
  cells: CellView[];
  enabled: boolean;
  placing: boolean;
  preview: Position[];
  previewValid: boolean;
  onChoose: (position: Position) => void;
  onHover?: (position: Position | null) => void;
}) {
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  return <div className={`fleet-grid-frame ${side}`} role="region" aria-label={`${side === 'american' ? 'American Fleet' : 'British Waters'} chart`}>
    <div className="fleet-grid" onMouseLeave={() => onHover?.(null)}>
      <span />{'ABCDEFGHIJ'.split('').map(letter => <span key={letter} className="fleet-coordinate">{letter}</span>)}
      {Array.from({ length: SIZE }, (_, y) => <div className="fleet-row" key={y}>
        <span className="fleet-coordinate">{y + 1}</span>
        {cells.slice(y * SIZE, (y + 1) * SIZE).map((cell, x) => {
          const pending = preview.some(p => same(p, cell.position));
          const available = enabled && (placing || !cell.shot);
          const status = cell.sunk ? 'sunk ship' : cell.shot === 'hit' ? 'hit' : cell.shot === 'miss' ? 'miss' : cell.ship ? shipDefinition(cell.ship).label : side === 'british' ? 'unexplored water' : 'water';
          return <button key={x} ref={element => { buttons.current[y * SIZE + x] = element; }}
            className={`fleet-cell ${cell.ship ? 'friendly-or-revealed' : ''} ${cell.shot ?? ''} ${cell.sunk ? 'sunk' : ''} ${pending ? previewValid ? 'placement-preview' : 'placement-invalid' : ''}`}
            aria-label={`${coordinate(cell.position)}, ${status}${placing ? ', place ship here' : available ? ', attack here' : ''}`}
            disabled={!available} onClick={() => onChoose(cell.position)}
            onMouseEnter={() => onHover?.(cell.position)} onFocus={() => onHover?.(cell.position)}
            onKeyDown={event => {
              const delta = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[event.key];
              if (!delta) return;
              event.preventDefault();
              let nx = x + delta[0], ny = y + delta[1];
              while (nx >= 0 && nx < SIZE && ny >= 0 && ny < SIZE) {
                const next = buttons.current[ny * SIZE + nx];
                if (next && !next.disabled) { next.focus(); break; }
                nx += delta[0]; ny += delta[1];
              }
            }}>
            {cell.sunk || cell.shot === 'hit' ? <span aria-hidden="true">×</span> : cell.shot === 'miss' ? <span aria-hidden="true">•</span> : cell.ship ? <span className="ship-segment" aria-hidden="true" /> : null}
          </button>;
        })}
      </div>)}
    </div>
    <div className="fleet-chart-caption"><span>A–J / 1–10</span><span>{side === 'american' ? 'Your fleet positions' : 'Enemy positions concealed until hit or game over'}</span></div>
  </div>;
}
