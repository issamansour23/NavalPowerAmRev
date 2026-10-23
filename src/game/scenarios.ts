import type { Position, Scenario, Unit, UnitClass } from './types.ts';
import { stats } from './config.ts';
function unit(id: string, owner: 'american' | 'british', position: Position, unitClass: UnitClass = 'frigate'): Unit {
  return { id, name: `Mock ${owner} vessel ${id}`, owner, class: unitClass, position, hp: stats[unitClass].hp, maxHp: stats[unitClass].hp, movedThisRound: false, attackedThisRound: false, status: 'active', mission: 'Prototype demonstration' };
}
export const demo: Scenario = {
  id: 'prototype-2a', prototype: true, objective: [8, 5], roundLimit: 12,
  tiles: Array.from({ length: 144 }, (_, i) => {
    const x = i % 12, y = Math.floor(i / 12);
    const land = x === 0 || (x === 5 && y >= 3 && y <= 7);
    const port = x === 2 && y === 9;
    return { id: `${x},${y}`, position: [x, y], type: land ? 'land' : port ? 'port' : 'sea', isNavigable: !land, ...(port ? { owner: 'american' as const } : {}) };
  }),
  units: [unit('A1', 'american', [2, 4], 'ship_of_line'), unit('A2', 'american', [3, 8]), unit('B1', 'british', [9, 4]), unit('B2', 'british', [9, 8])],
};
