import { SIZE } from './config.ts';
import { isSunk } from './engine.ts';
import { same } from './placement.ts';
import type { CellView, GameState, Position, Side } from './types.ts';
/** Keep unrevealed British positions out of DOM attributes, labels, and classes. */
export function boardView(state: GameState, side: Side): CellView[] {
  const board = state.boards[side];
  return Array.from({ length: SIZE * SIZE }, (_, i) => {
    const position: Position = [i % SIZE, Math.floor(i / SIZE)];
    const shot = board.shots.find(s => same(s.position, position));
    const ship = board.ships.find(s => s.cells.some(cell => same(cell, position)));
    const visible = side === 'american' || !!state.winner || (shot && shot.outcome !== 'miss');
    return { position, ...(visible && ship ? { ship: ship.class } : {}), ...(shot ? { shot: shot.outcome === 'miss' ? 'miss' as const : 'hit' as const } : {}), sunk: !!ship && isSunk(ship, board) };
  });
}
