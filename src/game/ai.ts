import type { Action, GameState } from './types.ts';
import { getLegalActions } from './rules.ts';
import { distance } from './board.ts';
import { stats } from './config.ts';
export function chooseBritishAction(state: GameState): Action | undefined {
  if (state.phase !== 'british') return undefined;
  const actions = getLegalActions(state);
  const attacks = actions.filter(a => a.type === 'attack');
  attacks.sort((a, b) => {
    const score = (action: typeof a) => {
      const target = state.units.find(u => u.id === action.targetId)!;
      const attacker = state.units.find(u => u.id === action.unitId)!;
      return (target.hp <= stats[attacker.class].damage ? 100 : 0) + stats[target.class].damage * 4 - target.hp;
    };
    return score(b) - score(a);
  });
  if (attacks[0]) return attacks[0];
  const enemies = state.units.filter(u => u.owner !== 'british' && u.status === 'active');
  const moves = actions.filter(a => a.type === 'move');
  const score = (p: [number, number]) => Math.min(distance(p, state.scenario.objective), ...enemies.map(e => distance(p, e.position)));
  // Stable action enumeration resolves ties. No random wandering or illegal shortcuts.
  return moves.filter(a => score(a.to) < score(state.units.find(u => u.id === a.unitId)!.position)).sort((a, b) => score(a.to) - score(b.to))[0];
}
