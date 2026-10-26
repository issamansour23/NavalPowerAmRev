import { SIZE, SHIPS, shipDefinition } from './config.ts';
import { random } from './random.ts';
import type { Orientation, PlacedShip, Position, ShipClass } from './types.ts';
export const key = (position: Position) => `${position[0]},${position[1]}`;
export const same = (a: Position, b: Position) => key(a) === key(b);
export const inBounds = (p: Position) => p.length === 2 && p.every(n => Number.isInteger(n) && n >= 0 && n < SIZE);
export const coordinate = (p: Position) => `${'ABCDEFGHIJ'[p[0]]}${p[1] + 1}`;
export function shipCells(shipClass: ShipClass, start: Position, orientation: Orientation): Position[] {
  return Array.from({ length: shipDefinition(shipClass).length }, (_, offset) => [start[0] + (orientation === 'horizontal' ? offset : 0), start[1] + (orientation === 'vertical' ? offset : 0)] as Position);
}
export function canPlace(ships: PlacedShip[], shipClass: ShipClass, start: Position, orientation: Orientation): boolean {
  if (!inBounds(start) || ships.some(s => s.class === shipClass)) return false;
  const occupied = new Set(ships.flatMap(s => s.cells.map(key)));
  return shipCells(shipClass, start, orientation).every(cell => inBounds(cell) && !occupied.has(key(cell)));
}
export function validFleet(ships: PlacedShip[]): boolean {
  if (ships.length !== SHIPS.length) return false;
  const accepted: PlacedShip[] = [];
  for (const definition of SHIPS) {
    const ship = ships.find(s => s.class === definition.class);
    if (!ship || ship.cells.length !== definition.length) return false;
    const start = ship.cells[0];
    const orientation = ship.cells[1][0] === start[0] ? 'vertical' : 'horizontal';
    if (!canPlace(accepted, ship.class, start, orientation)) return false;
    if (!shipCells(ship.class, start, orientation).every((cell, i) => same(cell, ship.cells[i]))) return false;
    accepted.push(ship);
  }
  return true;
}
export function randomFleet(seed: number): { ships: PlacedShip[]; seed: number } {
  const ships: PlacedShip[] = [];
  for (const definition of SHIPS) {
    const candidates: { start: Position; orientation: Orientation }[] = [];
    for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
      for (const orientation of ['horizontal', 'vertical'] as const) {
        if (canPlace(ships, definition.class, [x, y], orientation)) candidates.push({ start: [x, y], orientation });
      }
    }
    // With just nine occupied squares on a 100-square board this set cannot be empty.
    const next = random(seed); seed = next.seed;
    const chosen = candidates[Math.floor(next.value * candidates.length)];
    ships.push({ class: definition.class, cells: shipCells(definition.class, chosen.start, chosen.orientation) });
  }
  return { ships, seed };
}
