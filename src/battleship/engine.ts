import type { Command, FleetBoard, GameState, PlacedShip, Position, Side } from './types.ts';
import { SHIPS, shipDefinition } from './config.ts';
import { canPlace, coordinate, inBounds, randomFleet, same, shipCells, validFleet } from './placement.ts';
import { chooseAttack } from './ai.ts';

export function createGame(seed: number): GameState {
  const british = randomFleet(seed >>> 0);
  return { matchId: seed, seed: british.seed, phase: 'placement', orientation: 'horizontal', turnNumber: 1, winner: null,
    boards: { american: { ships: [], shots: [] }, british: { ships: british.ships, shots: [] } },
    log: ['Place your American fleet or use Randomize Fleet.'] };
}
export const nextShip = (state: GameState) => SHIPS.find(d => !state.boards.american.ships.some(s => s.class === d.class));
export const isSunk = (ship: PlacedShip, board: FleetBoard) => ship.cells.every(cell => board.shots.some(shot => shot.outcome !== 'miss' && same(shot.position, cell)));
export const remaining = (board: FleetBoard) => board.ships.filter(ship => !isSunk(ship, board)).length;
export function attack(state: GameState, side: Side, position: Position): GameState {
  if (state.phase !== side || state.winner || !inBounds(position)) return state;
  const target: Side = side === 'american' ? 'british' : 'american';
  const board = state.boards[target];
  if (board.shots.some(shot => same(shot.position, position))) return state;
  const ship = board.ships.find(s => s.cells.some(cell => same(cell, position)));
  const nextBoard: FleetBoard = { ...board, shots: [...board.shots, { position: [...position], outcome: ship ? 'hit' : 'miss' }] };
  const sunk = ship && isSunk(ship, nextBoard);
  if (sunk) nextBoard.shots[nextBoard.shots.length - 1].outcome = 'sunk';
  const won = remaining(nextBoard) === 0;
  const targetName = target === 'british' ? 'British' : 'American';
  const message = `${side === 'american' ? 'American' : 'British'} attack at ${coordinate(position)}: ${sunk ? `${targetName} ${shipDefinition(ship.class).label} Sunk` : ship ? 'Hit' : 'Miss'}.`;
  return { ...state, boards: { ...state.boards, [target]: nextBoard }, phase: won ? 'finished' : target, turnNumber: state.turnNumber + 1,
    winner: won ? side : null, log: [...state.log, message, ...(won ? [side === 'american' ? 'Victory. All British ships have been sunk.' : 'Defeat. All American ships have been sunk.'] : [])] };
}
export function gameReducer(state: GameState, command: Command): GameState {
  if (command.type === 'new-game') return createGame(command.seed);
  if (state.phase === 'placement') {
    if (command.type === 'rotate') return { ...state, orientation: state.orientation === 'horizontal' ? 'vertical' : 'horizontal' };
    if (command.type === 'clear-placement') return { ...state, boards: { ...state.boards, american: { ships: [], shots: [] } }, log: ['American placement cleared. Place your three ships.'] };
    if (command.type === 'randomize') {
      const fleet = randomFleet(state.seed);
      return { ...state, seed: fleet.seed, boards: { ...state.boards, american: { ships: fleet.ships, shots: [] } }, log: ['American fleet randomized. Ready to start.'] };
    }
    if (command.type === 'place') {
      const ship = nextShip(state);
      if (!ship || !canPlace(state.boards.american.ships, ship.class, command.position, state.orientation)) return state;
      return { ...state, boards: { ...state.boards, american: { ships: [...state.boards.american.ships, { class: ship.class, cells: shipCells(ship.class, command.position, state.orientation) }], shots: [] } }, log: [...state.log, `${ship.label} placed at ${coordinate(command.position)} (${state.orientation}).`] };
    }
    if (command.type === 'start' && validFleet(state.boards.american.ships) && validFleet(state.boards.british.ships)) return { ...state, phase: 'american', log: [...state.log, 'Battle begins. Select a square in British Waters.'] };
    return state;
  }
  if (command.type === 'attack') return attack(state, 'american', command.position);
  if (command.type === 'computer' && state.phase === 'british' && command.matchId === state.matchId && command.turnNumber === state.turnNumber) {
    const next = chooseAttack(state.boards.american.shots, state.seed);
    if (!next) return state;
    return attack({ ...state, seed: next.seed }, 'british', next.position);
  }
  return state;
}
