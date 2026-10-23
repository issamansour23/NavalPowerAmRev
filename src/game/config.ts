import type { UnitClass } from './types.ts';
// PROTOTYPE playtest fixtures from the owner's GDD. Never historical specifications.
export const prototype = true;
export const ORDERS = 3;
export const stats: Record<UnitClass, { move: number; damage: number; hp: number; range: number }> = {
  ship_of_line: { move: 2, damage: 4, hp: 6, range: 2 },
  frigate: { move: 3, damage: 2, hp: 4, range: 2 },
  privateer: { move: 4, damage: 1, hp: 2, range: 1 },
  merchantman: { move: 2, damage: 0, hp: 2, range: 0 },
  transport: { move: 2, damage: 0, hp: 3, range: 0 },
};
