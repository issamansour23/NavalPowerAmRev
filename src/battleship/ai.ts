import { SIZE } from './config.ts';
import { key } from './placement.ts';
import { random } from './random.ts';
import type { Position, Shot } from './types.ts';
/** Only public shot history enters AI selection. No ships or hidden cells. */
export function chooseAttack(shots: readonly Shot[], seed: number): { position: Position; seed: number } | null {
  const attacked = new Set(shots.map(s => key(s.position)));
  const candidates: Position[] = [];
  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) if (!attacked.has(key([x, y]))) candidates.push([x, y]);
  if (!candidates.length) return null;
  const next = random(seed);
  return { position: candidates[Math.floor(next.value * candidates.length)], seed: next.seed };
}
