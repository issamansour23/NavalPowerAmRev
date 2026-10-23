import type { GameState, Position } from './types.ts';
export const key = (p: Position) => `${p[0]},${p[1]}`;
export const same = (a: Position, b: Position) => key(a) === key(b);
export const distance = (a: Position, b: Position) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
export function reachable(state: GameState, from: Position, range: number): Position[] {
  const navigable = new Set(state.scenario.tiles.filter(t => t.isNavigable && t.type !== 'land').map(t => key(t.position)));
  const occupied = new Set(state.units.filter(u => u.status === 'active').map(u => key(u.position)));
  const seen = new Set([key(from)]);
  const queue: { p: Position; steps: number }[] = [{ p: from, steps: 0 }];
  const result: Position[] = [];
  for (let index = 0; index < queue.length; index++) {
    const { p, steps } = queue[index];
    if (steps >= range) continue;
    const neighbors: Position[] = [[p[0], p[1] - 1], [p[0] + 1, p[1]], [p[0], p[1] + 1], [p[0] - 1, p[1]]];
    for (const next of neighbors) {
      const id = key(next);
      if (seen.has(id) || !navigable.has(id) || occupied.has(id)) continue;
      seen.add(id); result.push(next); queue.push({ p: next, steps: steps + 1 });
    }
  }
  return result;
}
