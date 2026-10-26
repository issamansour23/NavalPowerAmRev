import test from 'node:test';
import assert from 'node:assert/strict';
import { SHIPS, SIZE } from '../src/battleship/config.ts';
import { canPlace, inBounds, key, randomFleet, same, shipCells, validFleet } from '../src/battleship/placement.ts';
import { createGame, gameReducer, isSunk, remaining } from '../src/battleship/engine.ts';
import { chooseAttack } from '../src/battleship/ai.ts';
import { boardView } from '../src/battleship/view.ts';
import type { GameState, Position, Shot } from '../src/battleship/types.ts';

function started(seed = 42) {
  return gameReducer(gameReducer(createGame(seed), { type: 'randomize' }), { type: 'start' });
}
function computer(state: GameState) {
  return gameReducer(state, { type: 'computer', matchId: state.matchId, turnNumber: state.turnNumber });
}
function allPositions(): Position[] {
  return Array.from({ length: SIZE * SIZE }, (_, i) => [i % SIZE, Math.floor(i / SIZE)] as Position);
}

test('Phase 1 configuration has one balanced 4/3/2 fleet per side', () => {
  const state = started();
  assert.equal(state.phase, 'american');
  assert.deepEqual(SHIPS.map(s => s.length), [4, 3, 2]);
  for (const board of Object.values(state.boards)) {
    assert.ok(validFleet(board.ships)); assert.equal(board.ships.length, 3);
    assert.equal(board.ships.flatMap(s => s.cells).length, 9);
  }
});

test('manual placement supports both orientations and rejects overlap and overflow', () => {
  let state = createGame(7);
  state = gameReducer(state, { type: 'place', position: [6, 0] });
  assert.deepEqual(state.boards.american.ships[0].cells, [[6, 0], [7, 0], [8, 0], [9, 0]]);
  const before = state;
  assert.equal(gameReducer(state, { type: 'place', position: [8, 0] }), before);
  assert.equal(gameReducer(state, { type: 'place', position: [9, 1] }), before);
  state = gameReducer(state, { type: 'rotate' });
  state = gameReducer(state, { type: 'place', position: [2, 7] });
  assert.deepEqual(state.boards.american.ships[1].cells, [[2, 7], [2, 8], [2, 9]]);
  state = gameReducer(state, { type: 'place', position: [4, 8] });
  assert.ok(validFleet(state.boards.american.ships));
});

test('placement bounds reject negative, fractional, NaN and infinite coordinates', () => {
  for (const p of [[-1, 0], [10, 1], [0, 10], [0.5, 1], [NaN, 0], [Infinity, 0]] as Position[]) {
    assert.equal(inBounds(p), false);
    assert.equal(canPlace([], 'frigate', p, 'horizontal'), false);
    const state = createGame(1); assert.equal(gameReducer(state, { type: 'place', position: p }), state);
  }
});

test('fleets reject duplicate classes, nonstraight cells and overlapping placement', () => {
  const fleet = randomFleet(12).ships;
  assert.ok(!canPlace(fleet, 'frigate', [0, 0], 'horizontal'));
  assert.ok(!validFleet([fleet[0], fleet[0], fleet[2]]));
  const bent = structuredClone(fleet); bent[1].cells[1] = [9, 9]; assert.ok(!validFleet(bent));
  const overlap = structuredClone(fleet); overlap[2].cells = fleet[0].cells.slice(0, 2); assert.ok(!validFleet(overlap));
});

test('random placement produces legal fleets across 300 reproducible seeds', () => {
  let horizontal = false, vertical = false;
  for (let seed = 0; seed < 300; seed++) {
    const fleet = randomFleet(seed);
    assert.ok(validFleet(fleet.ships), `seed ${seed}`);
    assert.equal(new Set(fleet.ships.flatMap(s => s.cells.map(key))).size, 9);
    for (const ship of fleet.ships) {
      horizontal ||= ship.cells[0][1] === ship.cells[1][1];
      vertical ||= ship.cells[0][0] === ship.cells[1][0];
    }
  }
  assert.ok(horizontal && vertical);
  assert.deepEqual(randomFleet(123), randomFleet(123));
  assert.notDeepEqual(randomFleet(123).ships, randomFleet(124).ships);
});

test('incomplete fleet cannot start; start only works once; placement locks during combat', () => {
  let state = createGame(42);
  assert.equal(gameReducer(state, { type: 'start' }), state);
  state = gameReducer(state, { type: 'place', position: [0, 0] });
  assert.equal(gameReducer(state, { type: 'start' }), state);
  state = gameReducer(state, { type: 'randomize' });
  state = gameReducer(state, { type: 'start' });
  for (const command of [{ type: 'start' }, { type: 'randomize' }, { type: 'rotate' }, { type: 'clear-placement' }, { type: 'place', position: [1, 1] }] as const) assert.equal(gameReducer(state, command), state);
});

test('clear placement preserves British fleet and randomize can run repeatedly', () => {
  let state = gameReducer(createGame(5), { type: 'randomize' });
  const enemy = structuredClone(state.boards.british);
  state = gameReducer(state, { type: 'randomize' }); assert.ok(validFleet(state.boards.american.ships));
  state = gameReducer(state, { type: 'clear-placement' });
  assert.equal(state.boards.american.ships.length, 0); assert.deepEqual(state.boards.british, enemy);
});

test('attacks alternate even after a hit, and AI makes exactly one attack', () => {
  let state = started();
  const target = state.boards.british.ships[0].cells[0];
  state = gameReducer(state, { type: 'attack', position: target });
  assert.equal(state.boards.british.shots[0].outcome, 'hit');
  assert.equal(state.phase, 'british');
  assert.equal(gameReducer(state, { type: 'attack', position: [0, 0] }), state);
  state = computer(state);
  assert.equal(state.boards.american.shots.length, 1); assert.equal(state.phase, 'american');
  assert.equal(computer(state), state);
});

test('miss detection and repeated/outside attacks leave turn and history unchanged', () => {
  let state = started();
  for (const position of [[-1, 0], [10, 1], [1, 1.5], [NaN, 1]] as Position[]) assert.equal(gameReducer(state, { type: 'attack', position }), state);
  const occupied = state.boards.british.ships.flatMap(s => s.cells);
  const miss = allPositions().find(p => !occupied.some(c => same(c, p)))!;
  state = gameReducer(state, { type: 'attack', position: miss });
  assert.equal(state.boards.british.shots[0].outcome, 'miss');
  state = computer(state);
  assert.equal(gameReducer(state, { type: 'attack', position: miss }), state);
});

test('a ship sinks only when every occupied square is hit, with a named event', () => {
  let state = started(); const ship = state.boards.british.ships.find(s => s.class === 'frigate')!;
  for (let i = 0; i < ship.cells.length; i++) {
    state = gameReducer(state, { type: 'attack', position: ship.cells[i] });
    assert.equal(isSunk(ship, state.boards.british), i === ship.cells.length - 1);
    if (i < ship.cells.length - 1) state = computer(state);
  }
  assert.equal(remaining(state.boards.british), 2);
  assert.equal(state.boards.british.shots.at(-1)!.outcome, 'sunk');
  assert.match(state.log.at(-1)!, /British Frigate Sunk/);
});

test('British ship positions never enter unrevealed cell projections', () => {
  let state = started();
  assert.equal(boardView(state, 'british').filter(c => c.ship).length, 0);
  assert.equal(boardView(state, 'american').filter(c => c.ship).length, 9);
  const target = state.boards.british.ships[0].cells[0];
  state = gameReducer(state, { type: 'attack', position: target });
  assert.equal(boardView(state, 'british').filter(c => c.ship).length, 1);
  assert.ok(boardView(state, 'british').find(c => same(c.position, target))!.shot === 'hit');
});

test('AI exhausts all 100 squares without repeating and uses only public shots', () => {
  const shots: Shot[] = []; let seed = 123;
  for (let i = 0; i < 100; i++) {
    const choice = chooseAttack(shots, seed)!;
    assert.ok(inBounds(choice.position)); assert.ok(!shots.some(s => same(s.position, choice.position)));
    shots.push({ position: choice.position, outcome: 'miss' }); seed = choice.seed;
  }
  assert.equal(chooseAttack(shots, seed), null);
  assert.equal(new Set(shots.map(s => key(s.position))).size, 100);
  const history: Shot[] = [{ position: [1, 1], outcome: 'hit' }];
  assert.deepEqual(chooseAttack(history, 17), chooseAttack(history, 17));
});

test('stale AI commands are rejected across turns and new games', () => {
  let state = gameReducer(started(), { type: 'attack', position: [0, 0] });
  const command = { type: 'computer' as const, matchId: state.matchId, turnNumber: state.turnNumber };
  state = gameReducer(state, command); assert.equal(gameReducer(state, command), state);
  const nextTarget = allPositions().find(p => !state.boards.british.shots.some(s => same(s.position, p)))!;
  state = gameReducer(state, { type: 'attack', position: nextTarget });
  assert.equal(gameReducer(state, command), state);
  let fresh = started(66); fresh = gameReducer(fresh, { type: 'attack', position: [0, 0] });
  assert.equal(gameReducer(fresh, command), fresh);
});

test('complete player victory loop reveals fleets and stops every further attack', () => {
  let state = started(42);
  const targets = state.boards.british.ships.flatMap(s => s.cells);
  for (const position of targets) {
    state = gameReducer(state, { type: 'attack', position });
    if (!state.winner) state = computer(state);
  }
  assert.equal(state.winner, 'american'); assert.equal(state.phase, 'finished');
  assert.equal(remaining(state.boards.british), 0);
  assert.equal(boardView(state, 'british').filter(c => c.ship).length, 9);
  assert.equal(gameReducer(state, { type: 'attack', position: [0, 0] }), state);
  assert.equal(computer(state), state);
});

test('complete British victory loop reveals surviving British fleet and stops AI', () => {
  let state = started(10);
  const reserved = state.boards.british.ships[0].cells[0];
  for (const position of allPositions().filter(p => !same(p, reserved))) {
    state = gameReducer(state, { type: 'attack', position });
    state = computer(state); if (state.winner) break;
  }
  assert.equal(state.winner, 'british'); assert.equal(state.phase, 'finished');
  assert.equal(remaining(state.boards.american), 0);
  assert.equal(boardView(state, 'british').filter(c => c.ship).length, 9);
  assert.equal(computer(state), state);
});

test('New Game resets placement, orientation, turns, winner, shots and history', () => {
  let state = started(); state = computer(gameReducer(state, { type: 'attack', position: [0, 0] }));
  const reset = gameReducer(state, { type: 'new-game', seed: 101 });
  assert.deepEqual(reset, createGame(101)); assert.equal(reset.phase, 'placement');
  assert.equal(reset.orientation, 'horizontal'); assert.equal(reset.turnNumber, 1);
  assert.equal(reset.boards.american.ships.length, 0); assert.equal(reset.boards.british.shots.length, 0);
  assert.notDeepEqual(reset.boards.british.ships, state.boards.british.ships);
});

test('pure transitions preserve input state and make replays reproducible', () => {
  const state = started(); const snapshot = structuredClone(state);
  const command = { type: 'attack' as const, position: [1, 1] as Position };
  const next = gameReducer(state, command);
  assert.notEqual(next, state); assert.deepEqual(state, snapshot);
  assert.deepEqual(computer(next), computer(gameReducer(snapshot, command)));
});

test('ship cell generation exactly matches horizontal and vertical lengths', () => {
  assert.deepEqual(shipCells('small_warship', [8, 9], 'horizontal'), [[8, 9], [9, 9]]);
  assert.deepEqual(shipCells('ship_of_line', [0, 0], 'vertical'), [[0, 0], [0, 1], [0, 2], [0, 3]]);
});
