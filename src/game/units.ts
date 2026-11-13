import type { Faction, Side, Unit } from './types.ts';
import { stats } from './config.ts';
export const sideOf = (owner: Faction): Side => owner === 'british' ? 'british' : 'american';
export const isCombatant = (unit: Unit) => stats[unit.class].damage > 0;
export const isAlive = (unit: Unit) => unit.status === 'active' && unit.hp > 0;
export function classification(unit: Unit): string {
  if (unit.class === 'merchantman') return 'British Merchant';
  if (unit.class === 'privateer') return 'American Privateer';
  if (unit.owner === 'french') return 'French Ally';
  return unit.owner === 'british' ? 'British Warship' : 'American Navy';
}
