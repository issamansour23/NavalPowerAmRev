import type { Faction, Position, Scenario, Unit, UnitClass } from '../game/types.ts';
import { stats } from '../game/config.ts';
import type { EngagementDefinition, FleetConfiguration } from './types.ts';
import { portAdvantageSquare, turnLimits } from './config.ts';

// Historical labels and introductions are owner-provided; layouts and force sizes are game fixtures.
function makeUnit(id: string, name: string, owner: Faction, unitClass: UnitClass, position: Position): Unit {
  return { id, name, owner, class: unitClass, position, hp: stats[unitClass].hp, maxHp: stats[unitClass].hp, movedThisRound: false, attackedThisRound: false, privateerRepositioned: false, status: 'active', mission: unitClass === 'merchantman' ? 'Merchant fixture — interception not implemented' : 'Testing engagement' };
}
function makeScenario(number: number, fleet: FleetConfiguration): Scenario {
  const units: Unit[] = [];
  const alliedPositions: Position[] = [[3, 2], [3, 4], [3, 6], [3, 8], [2, 3], [2, 7]];
  const add = (count: number, prefix: string, owner: Faction, unitClass: UnitClass) => {
    for (let i = 0; i < count; i++) units.push(makeUnit(`e${number}-${owner}-${unitClass}-${i}`, `${prefix} ${String.fromCharCode(65 + i)}`, owner, unitClass, alliedPositions[units.length]));
  };
  add(fleet.americanNavy, 'Continental Frigate', 'american', 'frigate');
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
  {
    number: 1,
    title: 'Battle of Block Island',
    date: 'April 1776',
    location: 'Waters near Block Island, Rhode Island',
    theme: 'Early American naval resistance against British naval superiority',
    historicalIntroduction: 'In April 1776, an American squadron led by Commodore Esek Hopkins encountered the British frigate HMS Glasgow near Block Island. Returning from the Bahamas, the Americans seriously damaged the British ship but were unable to capture it.',
    objectiveText: 'Use Continental Navy warships and American privateers to defeat the British Royal Navy. This opening engagement introduces the campaign’s ship-combat rules.',
    portBattle: false,
    fleet: { americanNavy: 3, privateers: 2, french: 0, britishWarships: 4, merchants: 0 },
  },
  {
    number: 2,
    title: 'Newport Naval Campaign',
    date: 'August 1778',
    location: 'Narragansett Bay and Newport, Rhode Island',
    theme: 'French intervention changes the balance of naval power',
    historicalIntroduction: 'In August 1778, a French force led by Admiral d’Estaing threatened the British position in Newport, Rhode Island. A British fleet commanded by Admiral Lord Howe approached, prompting the French to leave Narragansett Bay. The feuding fleets maneuvered against one another, but a major storm disrupted their engagement. Smaller encounters followed, with the French eventually withdrawing without securing Newport. This round is fictionalized by incorporating American ships as well, but is inspired by that campaign.',
    objectiveText: 'Command Continental Navy ships and privateers alongside French allies. French Intervention grants one additional French attack each Alliance turn.',
    portBattle: false,
    fictionalized: true,
    fleet: { americanNavy: 2, privateers: 1, french: 2, britishWarships: 5, merchants: 0 },
  },
  {
    number: 3,
    title: 'Battle of the Chesapeake',
    alternativeName: 'Battle of the Virginia Capes',
    date: 'September 5, 1781',
    location: 'Entrance to Chesapeake Bay, Virginia',
    theme: 'French naval superiority and strategic sea control influence the outcome at Yorktown',
    historicalIntroduction: 'On September 5, 1781, a French fleet led by Admiral de Grasse, anchored at the mouth of Chesapeake Bay, confronted a British squadron under the command of Admiral Thomas Graves. Neither fleet was able to secure a decisive victory, but the French retained strategic control of the bay, preventing the British from effectively reinforcing or evacuating General Cornwallis’s army at Yorktown and contributing directly to the American and French victory.',
    objectiveText: 'Control the strategic waters at the entrance to Chesapeake Bay. An Allied ship holding G7 enables Port Advantage: one two-target attack each Alliance turn. Win the engagement under the existing combat rules.',
    portBattle: true,
    fleet: { americanNavy: 2, privateers: 1, french: 3, britishWarships: 5, merchants: 0 },
  },
];
export const engagements: readonly EngagementDefinition[] = definitions.map(d => ({ ...d, scenario: makeScenario(d.number, d.fleet) }));
