import type { Faction, Position, Scenario, Unit, UnitClass } from '../game/types.ts';
import { stats } from '../game/config.ts';
import type { EngagementDefinition, FleetConfiguration } from './types.ts';
import { portAdvantageSquare, turnLimits } from './config.ts';

// Scenario locations/themes come from the owner's prompt. Layouts and force sizes are testing fixtures.
function makeUnit(id: string, name: string, owner: Faction, unitClass: UnitClass, position: Position): Unit {
  return { id, name, owner, class: unitClass, position, hp: stats[unitClass].hp, maxHp: stats[unitClass].hp, movedThisRound: false, attackedThisRound: false, status: 'active', mission: unitClass === 'merchantman' ? 'Merchant fixture — interception not implemented' : 'Testing engagement' };
}
function makeScenario(number: number, fleet: FleetConfiguration): Scenario {
  const units: Unit[] = [];
  const alliedPositions: Position[] = [[3, 2], [3, 4], [3, 6], [3, 8], [2, 3], [2, 7]];
  const add = (count: number, prefix: string, owner: Faction, unitClass: UnitClass) => {
    for (let i = 0; i < count; i++) units.push(makeUnit(`e${number}-${owner}-${unitClass}-${i}`, `${prefix} ${String.fromCharCode(65 + i)}`, owner, unitClass, alliedPositions[units.length]));
  };
  add(fleet.americanNavy, 'American Frigate', 'american', 'frigate');
  add(fleet.privateers, 'Privateer', 'american', 'privateer');
  add(fleet.french, 'French Warship', 'french', 'frigate');
  for (let i = 0; i < fleet.britishWarships; i++) units.push(makeUnit(`e${number}-british-warship-${i}`, `British Warship ${String.fromCharCode(65 + i)}`, 'british', 'frigate', [8, 2 + i * 2]));
  for (let i = 0; i < fleet.merchants; i++) units.push(makeUnit(`e${number}-merchant-${i}`, `British Merchant ${String.fromCharCode(65 + i)}`, 'british', 'merchantman', [10, 3 + i * 4]));
  return {
    id: `campaign-${number}`, prototype: true, victoryRule: 'combat-and-hull', objective: [6, 6], roundLimit: turnLimits[number - 1],
    ...(number === 3 ? { portAdvantage: [...portAdvantageSquare] as Position } : {}),
    tiles: Array.from({ length: 144 }, (_, i) => {
      const x = i % 12, y = Math.floor(i / 12);
      const land = x === 0 || (x === 1 && (y < 2 || y > 9));
      return { id: `${x},${y}`, position: [x, y], type: land ? 'land' : 'sea', isNavigable: !land };
    }),
    units,
  };
}
const definitions: Omit<EngagementDefinition, 'scenario'>[] = [
  { number: 1, location: 'Massachusetts Coast', theme: 'Privateering and British Commerce', objectiveText: 'Sink the four British warships. Merchant interception is reserved for a later version.', portBattle: false, fleet: { americanNavy: 3, privateers: 2, french: 0, britishWarships: 4, merchants: 2 } },
  { number: 2, location: 'Newport, Rhode Island', theme: 'French Naval Intervention', objectiveText: 'Command the combined Alliance fleet against five British warships.', portBattle: false, fleet: { americanNavy: 2, privateers: 1, french: 2, britishWarships: 5, merchants: 0 } },
  { number: 3, location: 'Chesapeake Bay', theme: 'Decisive Naval Engagement and Yorktown', objectiveText: 'Win the final engagement against five British warships. The port marker grants no advantage yet.', portBattle: true, fleet: { americanNavy: 2, privateers: 1, french: 3, britishWarships: 5, merchants: 0 } },
];
export const engagements: readonly EngagementDefinition[] = definitions.map(d => ({ ...d, scenario: makeScenario(d.number, d.fleet) }));
