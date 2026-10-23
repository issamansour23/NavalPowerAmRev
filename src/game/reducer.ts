import type { Action, Command, GameState, Scenario } from './types.ts';
import { demo } from './scenarios.ts';
import { ORDERS, stats } from './config.ts';
import { same } from './board.ts';
import { isLegal } from './rules.ts';
export function createGame(scenario: Scenario = demo): GameState {
  return { scenario: structuredClone(scenario), units: structuredClone(scenario.units), round: 1, phase: 'american', orders: ORDERS, result: null, log: ['Prototype demo started. All statistics are provisional.'] };
}
function record(state: GameState, message: string): GameState { return { ...state, log: [...state.log, message] }; }
function checkElimination(state: GameState): GameState {
  if (state.units.some(u => u.owner === 'american' && u.status === 'active')) return state;
  return record({ ...state, result: 'defeat', phase: 'finished', orders: 0 }, 'Defeat: no American vessels remain.');
}
export function applyAction(state: GameState, action: Action): GameState {
  if (!isLegal(state, action)) return state;
  let next = structuredClone(state);
  const unit = next.units.find(u => u.id === action.unitId)!;
  if (action.type === 'move') {
    unit.position = [...action.to]; unit.movedThisRound = true;
    next = record(next, `${unit.name} moved to ${'ABCDEFGHIJKL'[action.to[0]]}${action.to[1] + 1}.`);
  } else {
    const target = next.units.find(u => u.id === action.targetId)!;
    const damage = stats[unit.class].damage;
    target.hp = Math.max(0, target.hp - damage); unit.attackedThisRound = true;
    if (target.hp === 0) target.status = 'sunk';
    next = record(next, `${unit.name} attacked ${target.name}: ${damage} damage, ${target.hp}/${target.maxHp} HP.${target.status === 'sunk' ? ' Vessel sunk; tile freed.' : ''}`);
  }
  next.orders--;
  return checkElimination(next);
}
export function gameReducer(state: GameState, command: Command): GameState {
  if (command.type === 'restart') return createGame(state.scenario);
  if (state.result) return state;
  if (command.type === 'move' || command.type === 'attack') return applyAction(state, command);
  if (command.type === 'end-phase') {
    if (command.side !== state.phase) return state;
    if (state.phase === 'american') return record({ ...state, phase: 'british', orders: ORDERS }, 'American command ended. British AI receives three orders.');
    if (state.phase === 'british') return record({ ...state, phase: 'operations', orders: 0 }, 'British command ended. Resolving demo objective.');
    return state;
  }
  if (state.phase !== 'operations') return state;
  const checked = checkElimination(state);
  if (checked.result) return checked;
  if (state.units.some(u => u.owner === 'american' && u.status === 'active' && same(u.position, state.scenario.objective))) {
    return record({ ...state, result: 'victory', phase: 'finished' }, 'Victory: an American vessel held the demo beacon through British command.');
  }
  if (state.round >= state.scenario.roundLimit) return record({ ...state, result: 'defeat', phase: 'finished' }, 'Defeat: the provisional round limit expired.');
  return record({ ...state, round: state.round + 1, phase: 'american', orders: ORDERS, units: state.units.map(u => ({ ...u, movedThisRound: false, attackedThisRound: false })) }, `Round ${state.round + 1}: American command begins.`);
}
