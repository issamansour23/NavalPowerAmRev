import type { Action, Command, GameState, Scenario } from './types.ts';
import { demo } from './scenarios.ts';
import { ORDERS, stats } from './config.ts';
import { same } from './board.ts';
import { isLegal } from './rules.ts';
import { isAlive, isCombatant, sideOf } from './units.ts';
export function createGame(scenario: Scenario = demo): GameState {
  const game: GameState = {
    scenario: structuredClone(scenario), units: structuredClone(scenario.units), round: 1, phase: 'american',
    orders: ORDERS, result: null, portControl: scenario.portAdvantage ? 'neutral' : 'inactive',
    frenchInterventionUsedThisTurn: false, portAdvantageUsedThisTurn: false,
    log: [],
  };
  return updatePortControl(game);
}
function record(state: GameState, message: string): GameState { return { ...state, log: [...state.log, message] }; }
function updatePortControl(state: GameState): GameState {
  const port = state.scenario.portAdvantage;
  if (!port) return { ...state, portControl: 'inactive' };
  const controller = state.units.find(u => u.status === 'active' && u.hp > 0 && isCombatant(u) && same(u.position, port));
  return { ...state, portControl: controller ? sideOf(controller.owner) : 'neutral' };
}
function checkElimination(state: GameState): GameState {
  if (state.units.some(u => sideOf(u.owner) === 'american' && isAlive(u) && isCombatant(u))) {
    if (state.scenario.victoryRule === 'combat-and-hull' && !state.units.some(u => u.owner === 'british' && isAlive(u) && isCombatant(u))) {
      return record({ ...state, result: 'victory', phase: 'finished', orders: 0 }, 'Victory: all British warships have been sunk.');
    }
    return state;
  }
  return record({ ...state, result: 'defeat', phase: 'finished', orders: 0 }, 'Defeat: no Revolutionary Alliance combat vessels remain.');
}
export function applyAction(state: GameState, action: Action): GameState {
  if (!isLegal(state, action)) return state;
  let next = structuredClone(state);
  const unit = next.units.find(u => u.id === action.unitId)!;
  if (action.type === 'move') {
    unit.position = [...action.to]; unit.movedThisRound = true;
    next = record(next, `${unit.name} moved to ${'ABCDEFGHIJKL'[action.to[0]]}${action.to[1] + 1}.`);
  } else if (action.type === 'reposition') {
    unit.position = [...action.to]; unit.privateerRepositioned = true;
    next = record(next, `${unit.name} used its once-per-engagement reposition to move to ${'ABCDEFGHIJKL'[action.to[0]]}${action.to[1] + 1}.`);
  } else if (action.type === 'attack' || action.type === 'french-intervention') {
    const target = next.units.find(u => u.id === action.targetId)!;
    const damage = stats[unit.class].damage;
    target.hp = Math.max(0, target.hp - damage);
    if (action.type === 'attack') unit.attackedThisRound = true;
    else next.frenchInterventionUsedThisTurn = true;
    if (target.hp === 0) target.status = 'sunk';
    const source = action.type === 'attack' ? 'attacked' : 'used French Intervention against';
    next = record(next, `${unit.name} ${source} ${target.name}: ${damage} damage, ${target.hp}/${target.maxHp} HP.${target.status === 'sunk' ? ' Vessel sunk; tile freed.' : ''}`);
  } else {
    const targets = action.targetIds.map(id => next.units.find(u => u.id === id)!);
    const damage = stats[unit.class].damage;
    for (const target of targets) {
      target.hp = Math.max(0, target.hp - damage);
      if (target.hp === 0) target.status = 'sunk';
    }
    unit.attackedThisRound = true;
    next.portAdvantageUsedThisTurn = true;
    next = record(next, `${unit.name} used Port Advantage against ${targets.map(target => target.name).join(' and ')} for ${damage} damage each.`);
  }
  if (action.type !== 'french-intervention') next.orders--;
  next = updatePortControl(next);
  return checkElimination(next);
}
export function gameReducer(state: GameState, command: Command): GameState {
  if (command.type === 'restart') return createGame(state.scenario);
  if (state.result) return state;
  if (command.type === 'move' || command.type === 'reposition' || command.type === 'attack' || command.type === 'french-intervention' || command.type === 'port-advantage') return applyAction(state, command);
  if (command.type === 'end-phase') {
    if (command.side !== state.phase) return state;
    if (state.phase === 'american') return record({ ...state, phase: 'british', orders: ORDERS }, 'Alliance command ended. British AI receives three orders.');
    if (state.phase === 'british') return record({ ...state, phase: 'operations', orders: 0 }, 'British command ended. Resolving the engagement objective.');
    return state;
  }
  if (state.phase !== 'operations') return state;
  const checked = checkElimination(state);
  if (checked.result) return checked;
  if (!state.scenario.victoryRule && state.units.some(u => u.owner === 'american' && u.status === 'active' && same(u.position, state.scenario.objective))) {
    return record({ ...state, result: 'victory', phase: 'finished' }, 'Victory: an American vessel held the demo beacon through British command.');
  }
  if (state.round >= state.scenario.roundLimit && state.scenario.victoryRule === 'combat-and-hull') {
    const hull = (side: 'american' | 'british') => state.units.filter(u => sideOf(u.owner) === side && isAlive(u) && isCombatant(u)).reduce((sum, u) => sum + u.hp, 0);
    const alliance = hull('american'), british = hull('british');
    const result = alliance > british ? 'victory' : alliance < british ? 'defeat' : 'draw';
    return record({ ...state, result, phase: 'finished', orders: 0 }, `Turn limit reached. Remaining combat hull: Alliance ${alliance}, British ${british}. ${result === 'draw' ? 'Draw' : result === 'victory' ? 'Alliance victory' : 'British victory'}.`);
  }
  if (state.round >= state.scenario.roundLimit) return record({ ...state, result: 'defeat', phase: 'finished' }, 'Defeat: the provisional round limit expired.');
  const next = updatePortControl({
    ...state,
    round: state.round + 1,
    phase: 'american',
    orders: ORDERS,
    frenchInterventionUsedThisTurn: false,
    portAdvantageUsedThisTurn: false,
    units: state.units.map(u => ({ ...u, movedThisRound: false, attackedThisRound: false })),
  });
  return record(next, `${state.scenario.victoryRule ? 'Turn' : 'Round'} ${state.round + 1}: Alliance command begins.`);
}
