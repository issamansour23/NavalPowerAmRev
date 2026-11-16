import type { Action, GameState } from './types.ts';
import { stats } from './config.ts';
import { distance, reachable, same } from './board.ts';
import { sideOf, isCombatant } from './units.ts';
export function getLegalActions(state: GameState): Action[] {
  if (state.result || (state.phase !== 'american' && state.phase !== 'british')) return [];
  const actions: Action[] = [];
  for (const unit of state.units) {
    if (unit.status !== 'active' || unit.hp <= 0 || sideOf(unit.owner) !== state.phase) continue;
    const spec = stats[unit.class];
    if (state.orders > 0 && !unit.movedThisRound) actions.push(...reachable(state, unit.position, spec.move).map(to => ({ type: 'move' as const, unitId: unit.id, to })));
    if (state.orders > 0 && unit.owner === 'american' && unit.class === 'privateer' && !unit.privateerRepositioned) {
      actions.push(...reachable(state, unit.position, 2).map(to => ({ type: 'reposition' as const, unitId: unit.id, to })));
    }
    if (state.orders > 0 && !unit.attackedThisRound && spec.damage > 0) {
      for (const target of state.units) {
        const hostile = sideOf(unit.owner) !== sideOf(target.owner) && isCombatant(target);
        // PROTOTYPE: Manhattan range ignores intervening terrain and vessels; no LOS.
        if (target.status === 'active' && target.hp > 0 && hostile && distance(unit.position, target.position) <= spec.range) actions.push({ type: 'attack', unitId: unit.id, targetId: target.id });
      }
    }
  }
  if (state.phase === 'american' && !state.frenchInterventionUsedThisTurn) {
    for (const ship of state.units.filter(u => u.owner === 'french' && u.status === 'active' && u.hp > 0 && isCombatant(u))) {
      for (const target of state.units) {
        if (target.owner === 'british' && target.status === 'active' && target.hp > 0 && isCombatant(target) && distance(ship.position, target.position) <= stats[ship.class].range) {
          actions.push({ type: 'french-intervention', unitId: ship.id, targetId: target.id });
        }
      }
    }
  }
  if (state.phase === 'american' && state.orders > 0 && state.scenario.portAdvantage && state.portControl === 'american' && !state.portAdvantageUsedThisTurn) {
    for (const ship of state.units.filter(u => sideOf(u.owner) === 'american' && u.status === 'active' && u.hp > 0 && !u.attackedThisRound && stats[u.class].damage > 0)) {
      const targets = state.units.filter(u => u.owner === 'british' && u.status === 'active' && u.hp > 0 && isCombatant(u) && distance(ship.position, u.position) <= stats[ship.class].range);
      for (let first = 0; first < targets.length; first++) {
        for (let second = first + 1; second < targets.length; second++) {
          actions.push({ type: 'port-advantage', unitId: ship.id, targetIds: [targets[first].id, targets[second].id] });
        }
      }
    }
  }
  return actions;
}
export function isLegal(state: GameState, action: Action): boolean {
  return getLegalActions(state).some(candidate => {
    if (candidate.type !== action.type || candidate.unitId !== action.unitId) return false;
    if (candidate.type === 'move' && action.type === 'move' || candidate.type === 'reposition' && action.type === 'reposition') return same(candidate.to, action.to);
    if (candidate.type === 'attack' && action.type === 'attack' || candidate.type === 'french-intervention' && action.type === 'french-intervention') return candidate.targetId === action.targetId;
    return candidate.type === 'port-advantage' && action.type === 'port-advantage' &&
      candidate.targetIds[0] === action.targetIds[0] && candidate.targetIds[1] === action.targetIds[1];
  });
}
