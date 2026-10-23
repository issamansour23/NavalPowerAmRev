import type { Action, GameState } from './types.ts';
import { stats } from './config.ts';
import { distance, reachable, same } from './board.ts';
export function getLegalActions(state: GameState): Action[] {
  if (state.result || state.orders <= 0 || (state.phase !== 'american' && state.phase !== 'british')) return [];
  const actions: Action[] = [];
  for (const unit of state.units) {
    if (unit.status !== 'active' || unit.hp <= 0 || unit.owner !== state.phase) continue;
    const spec = stats[unit.class];
    if (!unit.movedThisRound) actions.push(...reachable(state, unit.position, spec.move).map(to => ({ type: 'move' as const, unitId: unit.id, to })));
    if (!unit.attackedThisRound && spec.damage > 0) {
      for (const target of state.units) {
        const hostile = (unit.owner === 'british') !== (target.owner === 'british');
        // PROTOTYPE: Manhattan range ignores intervening terrain and vessels; no LOS.
        if (target.status === 'active' && target.hp > 0 && hostile && distance(unit.position, target.position) <= spec.range) actions.push({ type: 'attack', unitId: unit.id, targetId: target.id });
      }
    }
  }
  return actions;
}
export function isLegal(state: GameState, action: Action): boolean {
  return getLegalActions(state).some(candidate => candidate.type === action.type && candidate.unitId === action.unitId && (candidate.type === 'move' && action.type === 'move' ? same(candidate.to, action.to) : candidate.type === 'attack' && action.type === 'attack' && candidate.targetId === action.targetId));
}
