import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, applyAction, gameReducer } from '../src/game/reducer.ts';
import { getLegalActions } from '../src/game/rules.ts';
import { chooseBritishAction } from '../src/game/ai.ts';
import { reachable, same, distance } from '../src/game/board.ts';
import { stats } from '../src/game/config.ts';
import type { GameState, Position } from '../src/game/types.ts';

function fixture(): GameState {
  const s = createGame();
  s.scenario.tiles = s.scenario.tiles.map(t => ({ ...t, type: 'sea', isNavigable: true }));
  s.units = [s.units[0], s.units[2]];
  s.units[0].class = 'frigate'; s.units[0].hp = 4; s.units[0].maxHp = 4;
  s.units[0].position = [3, 3]; s.units[1].position = [5, 3];
  return s;
}
function resolveRound(state: GameState): GameState {
  let s = gameReducer(state, { type: 'end-phase', side: 'american' });
  for (let i = 0; i < 4 && s.phase === 'british'; i++) {
    const action = chooseBritishAction(s);
    s = gameReducer(s, action ?? { type: 'end-phase', side: 'british' });
  }
  if (s.phase === 'british') s = gameReducer(s, { type: 'end-phase', side: s.phase === 'british' ? 'british' : 'american' });
  return gameReducer(s, { type: 'resolve' });
}

test('12×12 scenario has unique navigable ship positions and provisional class values', () => {
  const s = createGame();
  assert.equal(s.scenario.tiles.length, 144);
  assert.equal(new Set(s.units.map(u => u.position.join())).size, s.units.length);
  assert.ok(s.units.every(u => s.scenario.tiles.some(t => t.isNavigable && same(t.position, u.position))));
  assert.deepEqual(stats.frigate, { move: 3, damage: 2, hp: 4, range: 2 });
});

test('BFS rejects land, occupied tiles, diagonal shortcuts, out-of-range and out-of-board moves', () => {
  const s = fixture();
  s.scenario.tiles = s.scenario.tiles.map(t => t.position[0] === 4 ? { ...t, type: 'land', isNavigable: false } : t);
  const destinations = reachable(s, [3, 3], 3);
  assert.ok(!destinations.some(p => p[0] >= 4));
  assert.ok(!destinations.some(p => same(p, [1, 1])));
  for (const to of [[4, 3], [5, 3], [-1, 3], [3, 7]] as Position[]) assert.equal(applyAction(s, { type: 'move', unitId: s.units[0].id, to }), s);
});

test('occupied chokepoints block passage for both friendly and hostile ships', () => {
  for (const owner of ['american', 'british'] as const) {
    const s = fixture();
    s.scenario.tiles = s.scenario.tiles.map(t => ({ ...t, isNavigable: t.position[1] === 3 }));
    s.units[1].owner = owner; s.units[1].position = [4, 3];
    assert.ok(!reachable(s, [3, 3], 3).some(p => p[0] > 3));
  }
});

test('BFS takes actual detours rather than Manhattan distance alone', () => {
  const s = fixture(); s.units[1].position = [11, 11];
  s.scenario.tiles.find(t => same(t.position, [4, 3]))!.isNavigable = false;
  assert.ok(!reachable(s, [3, 3], 3).some(p => same(p, [5, 3])));
  assert.ok(reachable(s, [3, 3], 4).some(p => same(p, [5, 3])));
});

test('enemy orders, allied attacks, self attacks and out-of-range attacks are rejected', () => {
  const s = fixture(); const [a, b] = s.units;
  assert.equal(applyAction(s, { type: 'move', unitId: b.id, to: [5, 4] }), s);
  assert.equal(applyAction(s, { type: 'attack', unitId: a.id, targetId: a.id }), s);
  b.owner = 'french';
  assert.equal(applyAction(s, { type: 'attack', unitId: a.id, targetId: b.id }), s);
  assert.equal(applyAction(s, { type: 'move', unitId: b.id, to: [5, 4] }), s);
  b.owner = 'british'; b.position = [10, 10];
  assert.equal(applyAction(s, { type: 'attack', unitId: a.id, targetId: b.id }), s);
});

test('move once AND attack once; repeated orders rejected; three-order budget enforced', () => {
  let s = fixture(); const [a, b] = s.units;
  s.units.push({ ...structuredClone(a), id: 'extra', position: [1, 1] });
  s = applyAction(s, { type: 'move', unitId: a.id, to: [4, 3] });
  assert.equal(applyAction(s, { type: 'move', unitId: a.id, to: [4, 4] }), s);
  s = applyAction(s, { type: 'attack', unitId: a.id, targetId: b.id });
  assert.equal(applyAction(s, { type: 'attack', unitId: a.id, targetId: b.id }), s);
  s = applyAction(s, { type: 'move', unitId: 'extra', to: [1, 2] });
  assert.equal(s.orders, 0); assert.equal(getLegalActions(s).length, 0);
});

test('unused orders discarded, flags reset once per new round, phases reject invalid resolution', () => {
  let s = fixture(); s = applyAction(s, { type: 'move', unitId: s.units[0].id, to: [2, 3] });
  assert.equal(gameReducer(s, { type: 'resolve' }), s);
  s = gameReducer(s, { type: 'end-phase', side: s.phase === 'british' ? 'british' : 'american' });
  assert.equal(s.orders, 3); assert.equal(s.phase, 'british'); assert.ok(s.units[0].movedThisRound);
  s = gameReducer(s, { type: 'end-phase', side: s.phase === 'british' ? 'british' : 'american' }); assert.equal(s.phase, 'operations');
  assert.equal(getLegalActions(s).length, 0); assert.ok(s.units[0].movedThisRound);
  s = gameReducer(s, { type: 'resolve' });
  assert.equal(s.phase, 'american'); assert.equal(s.round, 2); assert.equal(s.orders, 3);
  assert.ok(s.units.every(u => !u.movedThisRound && !u.attackedThisRound));
});

test('deterministic exact damage, HP floor, sinking, and tile vacancy', () => {
  let s = fixture(); const [a, b] = s.units; b.hp = 1;
  s = applyAction(s, { type: 'attack', unitId: a.id, targetId: b.id });
  assert.equal(s.units[1].hp, 0); assert.equal(s.units[1].status, 'sunk');
  assert.match(s.log.at(-1)!, /2 damage.*sunk/);
  assert.ok(reachable(s, a.position, 3).some(p => same(p, b.position)));
  assert.equal(s.units[0].hp, a.hp); assert.equal(s.result, null);
  assert.equal(applyAction(s, { type: 'attack', unitId: a.id, targetId: b.id }), s);
});

test('noncombatants cannot attack and sunk ships cannot receive orders', () => {
  const s = fixture(); s.units[0].class = 'merchantman';
  assert.ok(!getLegalActions(s).some(a => a.type === 'attack'));
  s.units[0].status = 'sunk'; s.units[0].hp = 0;
  assert.equal(getLegalActions(s).length, 0);
});

test('British AI deterministically issues only legal orders, at most three', () => {
  let s = gameReducer(createGame(), { type: 'end-phase', side: 'american' });
  const original = structuredClone(s); const history = [];
  for (let i = 0; i < 4; i++) {
    const action = chooseBritishAction(s); if (!action) break;
    assert.ok(getLegalActions(s).some(a => JSON.stringify(a) === JSON.stringify(action)));
    const next = applyAction(s, action); assert.notEqual(next, s); history.push(action); s = next;
  }
  assert.ok(history.length > 0 && history.length <= 3);
  let replay = original;
  for (const action of history) { assert.deepEqual(chooseBritishAction(replay), action); replay = applyAction(replay, action); }
  assert.deepEqual(s, replay);
});

test('AI prefers a sinking attack against a legal valuable target', () => {
  const s = fixture(); s.phase = 'british'; s.units[0].hp = 2;
  assert.deepEqual(chooseBritishAction(s), { type: 'attack', unitId: s.units[1].id, targetId: s.units[0].id });
});

test('complete command → AI → operations loop can win by holding the beacon', () => {
  let s = fixture(); s.units[0].position = [7, 5]; s.units[1].position = [11, 11];
  s = applyAction(s, { type: 'move', unitId: s.units[0].id, to: s.scenario.objective });
  s = resolveRound(s);
  assert.equal(s.result, 'victory'); assert.equal(s.phase, 'finished');
  assert.equal(getLegalActions(s).length, 0);
  assert.equal(gameReducer(s, { type: 'end-phase', side: s.phase === 'british' ? 'british' : 'american' }), s);
});

test('complete default demo loop reaches defeat when player passes; restart restores pristine scenario', () => {
  let s = createGame();
  for (let i = 0; i < 12 && !s.result; i++) s = resolveRound(s);
  assert.equal(s.result, 'defeat');
  const restart = gameReducer(s, { type: 'restart' });
  assert.deepEqual(restart, createGame());
  assert.notEqual(restart.units, s.units);
});

test('deadline is evaluated after objective; losing all Americans ends immediately', () => {
  let s = fixture(); s.round = 12; s.units[1].position = [11, 11];
  assert.equal(resolveRound(s).result, 'defeat');
  s.phase = 'operations'; s.units[0].position = [...s.scenario.objective];
  assert.equal(gameReducer(s, { type: 'resolve' }).result, 'victory');
  s = fixture(); s.phase = 'british'; s.units[0].hp = 1;
  s = applyAction(s, { type: 'attack', unitId: s.units[1].id, targetId: s.units[0].id });
  assert.equal(s.result, 'defeat'); assert.equal(s.units[0].hp, 0);
});

test('attack range deliberately ignores land as documented, without diagonal range inflation', () => {
  const s = fixture(); s.scenario.tiles.find(t => same(t.position, [4, 3]))!.type = 'land';
  assert.ok(getLegalActions(s).some(a => a.type === 'attack'));
  s.units[1].position = [5, 4]; assert.ok(!getLegalActions(s).some(a => a.type === 'attack'));
});

test('demo is winnable from default setup with ordinary legal player orders', () => {
  let s = createGame();
  const routes: Record<string, Position[]> = { A1: [[4, 2], [6, 2], [8, 5]], A2: [[6, 8], [8, 7], [8, 5]] };
  const progress: Record<string, number> = { A1: 0, A2: 0 };
  for (let round = 0; round < 12 && !s.result; round++) {
    for (let order = 0; order < 3; order++) {
      const actions = getLegalActions(s);
      const attack = actions.find(a => a.type === 'attack');
      const moves = actions.filter(a => a.type === 'move');
      for (const unit of s.units.filter(u => u.owner === 'american')) {
        if (same(unit.position, routes[unit.id][progress[unit.id]]) && progress[unit.id] < 2) progress[unit.id]++;
      }
      moves.sort((a, b) => distance(a.to, routes[a.unitId][progress[a.unitId]]) - distance(b.to, routes[b.unitId][progress[b.unitId]]));
      const action = attack ?? moves[0];
      if (!action) break;
      s = applyAction(s, action);
    }
    s = resolveRound(s);
  }
  assert.equal(s.result, 'victory', s.log.join('\n'));
});

test('stale/double end-turn submissions cannot skip the AI phase', () => {
  const s = gameReducer(createGame(), { type: 'end-phase', side: 'american' });
  assert.equal(gameReducer(s, { type: 'end-phase', side: 'american' }), s);
  const operations = gameReducer(s, { type: 'end-phase', side: 'british' });
  assert.equal(gameReducer(operations, { type: 'end-phase', side: 'british' }), operations);
});

test('engine transitions do not mutate their input state', () => {
  const s = fixture(); const snapshot = structuredClone(s);
  const next = applyAction(s, { type: 'attack', unitId: s.units[0].id, targetId: s.units[1].id });
  assert.notEqual(next, s); assert.deepEqual(s, snapshot);
});
