import test from 'node:test';
import assert from 'node:assert/strict';
import { createCampaign, campaignReducer } from '../src/campaign/reducer.ts';
import { engagements } from '../src/campaign/scenarios.ts';
import { scoring } from '../src/campaign/config.ts';
import { getLegalActions } from '../src/game/rules.ts';
import { applyAction, createGame, gameReducer } from '../src/game/reducer.ts';
import { chooseBritishAction } from '../src/game/ai.ts';
import { isAlive, isCombatant, sideOf } from '../src/game/units.ts';
import { same } from '../src/game/board.ts';
import type { CampaignState } from '../src/campaign/types.ts';
import type { GameState } from '../src/game/types.ts';

function nextTurn(state: CampaignState): CampaignState {
  let next = campaignReducer(state, { type: 'end-turn', revision: state.revision });
  for (let i = 0; i < 4 && next.game.phase === 'british'; i++) next = campaignReducer(next, { type: 'ai-step', revision: next.revision });
  if (next.game.phase === 'operations') next = campaignReducer(next, { type: 'resolve', revision: next.revision });
  return next;
}
function finishByPassing(state: CampaignState): CampaignState {
  let next = state;
  for (let i = 0; i < next.game.scenario.roundLimit && next.status === 'playing'; i++) next = nextTurn(next);
  assert.notEqual(next.status, 'playing');
  return next;
}
function immediateWin(state: CampaignState): CampaignState {
  const next = structuredClone(state);
  next.game.phase = 'operations';
  for (const u of next.game.units) if (u.owner === 'british' && isCombatant(u)) { u.hp = 0; u.status = 'sunk'; }
  return campaignReducer(next, { type: 'resolve', revision: next.revision });
}
function closeCombat(): GameState {
  const game = createGame(engagements[1].scenario);
  const french = game.units.find(u => u.owner === 'french')!;
  french.position = [6, 4];
  const british = game.units.find(u => u.owner === 'british')!;
  british.position = [8, 4];
  return game;
}

test('three rounds follow the approved historical sequence and use the specified fleets', () => {
  assert.deepEqual(engagements.map(e => e.number), [1, 2, 3]);
  assert.deepEqual(engagements.map(e => e.title), ['Battle of Block Island', 'Newport Naval Campaign', 'Battle of the Chesapeake']);
  assert.deepEqual(engagements.map(e => e.date), ['April 1776', 'August 1778', 'September 5, 1781']);
  assert.deepEqual(engagements.map(e => e.location), ['Waters near Block Island, Rhode Island', 'Narragansett Bay and Newport, Rhode Island', 'Entrance to Chesapeake Bay, Virginia']);
  assert.equal(engagements[2].alternativeName, 'Battle of the Virginia Capes');
  assert.match(engagements[1].historicalIntroduction, /fictionalized.*not a decisive historical/i);
  assert.match(engagements[0].historicalIntroduction, /Esek Hopkins.*HMS Glasgow/i);
  assert.match(engagements[2].historicalIntroduction, /September 5, 1781.*de Grasse.*Thomas Graves/i);
  assert.deepEqual(engagements.map(e => e.fleet), [
    { americanNavy: 3, privateers: 2, french: 0, britishWarships: 4, merchants: 0 },
    { americanNavy: 2, privateers: 1, french: 2, britishWarships: 5, merchants: 0 },
    { americanNavy: 2, privateers: 1, french: 3, britishWarships: 5, merchants: 0 },
  ]);
  for (const definition of engagements) {
    const { units, tiles } = definition.scenario;
    assert.equal(units.filter(u => u.owner === 'american' && u.class === 'frigate').length, definition.fleet.americanNavy);
    assert.equal(units.filter(u => u.class === 'privateer').length, definition.fleet.privateers);
    assert.equal(units.filter(u => u.owner === 'french').length, definition.fleet.french);
    assert.equal(units.filter(u => u.owner === 'british' && isCombatant(u)).length, definition.fleet.britishWarships);
    assert.equal(units.filter(u => u.class === 'merchantman').length, definition.fleet.merchants);
    assert.equal(units.some(u => u.class === 'merchantman' || u.class === 'transport'), false);
    assert.equal(tiles.length, 144);
    assert.equal(new Set(units.map(u => u.position.join())).size, units.length);
    assert.ok(units.every(u => tiles.some(t => t.isNavigable && same(t.position, u.position))));
  }
});

test('French Intervention grants one free French attack per Alliance turn', () => {
  let game = closeCombat();
  const french = game.units.find(unit => unit.owner === 'french')!;
  const enemy = game.units.find(unit => unit.owner === 'british')!;
  const action = getLegalActions(game).find(candidate => candidate.type === 'french-intervention' && candidate.unitId === french.id && candidate.targetId === enemy.id)!;
  assert.ok(action);
  game = applyAction(game, action);
  assert.equal(game.orders, 3);
  assert.equal(game.units.find(unit => unit.id === enemy.id)!.hp, 2);
  assert.equal(game.frenchInterventionUsedThisTurn, true);
  assert.equal(game.units.find(unit => unit.id === french.id)!.attackedThisRound, false);
  assert.ok(!getLegalActions(game).some(candidate => candidate.type === 'french-intervention'));

  game = gameReducer(game, { type: 'end-phase', side: 'american' });
  game = gameReducer(game, { type: 'end-phase', side: 'british' });
  game = gameReducer(game, { type: 'resolve' });
  assert.equal(game.frenchInterventionUsedThisTurn, false);
});

test('French units absent in Round 1, allied and controllable in Rounds 2 and 3', () => {
  assert.ok(!engagements[0].scenario.units.some(u => u.owner === 'french'));
  for (const definition of engagements.slice(1)) {
    const game = createGame(definition.scenario);
    for (const u of game.units.filter(u => u.owner === 'french')) {
      assert.equal(sideOf(u.owner), 'american');
      const move = getLegalActions(game).find(a => a.unitId === u.id && a.type === 'move')!;
      const next = applyAction(game, move);
      assert.notEqual(next, game); assert.equal(next.orders, 2);
    }
  }
});

test('French attacks use shared orders, direct damage and no friendly fire', () => {
  let game = closeCombat();
  const french = game.units.find(u => u.owner === 'french')!;
  const enemy = game.units.find(u => u.owner === 'british')!;
  const action = getLegalActions(game).find(a => a.type === 'attack' && a.unitId === french.id && a.targetId === enemy.id)!;
  assert.ok(action); game = applyAction(game, action);
  assert.equal(game.orders, 2); assert.equal(game.units.find(u => u.id === enemy.id)!.hp, 2);
  const friendly = game.units.find(u => u.owner === 'american')!;
  assert.equal(applyAction(game, { type: 'attack', unitId: french.id, targetId: friendly.id }), game);
});

test('French survivors prevent premature Alliance defeat', () => {
  const game = closeCombat(); game.phase = 'operations';
  for (const unit of game.units) if (unit.owner === 'american') { unit.hp = 0; unit.status = 'sunk'; }
  const next = gameReducer(game, { type: 'resolve' });
  assert.equal(next.result, null); assert.equal(next.phase, 'american');
});

test('British AI targets French opponents but never friendly units or merchants', () => {
  let game = closeCombat(); game.phase = 'british';
  const french = game.units.find(u => u.owner === 'french')!;
  let used = 0;
  for (let i = 0; i < 4; i++) {
    const action = chooseBritishAction(game); if (!action) break;
    const attacker = game.units.find(u => u.id === action.unitId)!;
    assert.equal(attacker.owner, 'british'); assert.ok(isCombatant(attacker));
    if (action.type === 'attack') {
      const target = game.units.find(u => u.id === action.targetId)!;
      assert.notEqual(target.owner, 'british'); assert.ok(isCombatant(target));
      if (used === 0) assert.equal(target.id, french.id);
    }
    game = applyAction(game, action); used++;
  }
  assert.ok(used > 0 && used <= 3);
});

test('privateers can use their two-square reposition once per engagement', () => {
  let game = createGame(engagements[0].scenario);
  const privateer = game.units.find(unit => unit.class === 'privateer')!;
  const reposition = getLegalActions(game).find(action => action.type === 'reposition' && action.unitId === privateer.id)!;
  assert.ok(reposition);
  game = applyAction(game, reposition);
  const usedPrivateer = game.units.find(unit => unit.id === privateer.id)!;
  assert.equal(usedPrivateer.privateerRepositioned, true);
  assert.equal(usedPrivateer.movedThisRound, false);
  assert.equal(game.orders, 2);
  assert.ok(!getLegalActions(game).some(action => action.type === 'reposition' && action.unitId === privateer.id));
  game = gameReducer(game, { type: 'end-phase', side: 'american' });
  game = gameReducer(game, { type: 'end-phase', side: 'british' });
  game = gameReducer(game, { type: 'resolve' });
  assert.ok(!getLegalActions(game).some(action => action.type === 'reposition' && action.unitId === privateer.id));
  const restarted = gameReducer(game, { type: 'restart' });
  assert.equal(restarted.units.find(unit => unit.id === privateer.id)!.privateerRepositioned, false);
});

test('campaign orders enforce ownership, once-per-ship rules, collision and three-order budget', () => {
  let state = createCampaign();
  const first = state.game.units[0]; const enemy = state.game.units.find(u => u.owner === 'british')!;
  assert.equal(campaignReducer(state, { type: 'order', action: { type: 'move', unitId: first.id, to: enemy.position }, revision: state.revision }), state);
  assert.equal(campaignReducer(state, { type: 'order', action: { type: 'move', unitId: enemy.id, to: [7, 2] }, revision: state.revision }), state);
  for (let i = 0; i < 3; i++) {
    const action = getLegalActions(state.game).find(a => a.type === 'move')!;
    const before = state;
    state = campaignReducer(state, { type: 'order', action, revision: state.revision });
    assert.notEqual(state, before);
    assert.equal(campaignReducer(state, { type: 'order', action, revision: state.revision }), state);
  }
  assert.equal(state.game.orders, 0); assert.equal(getLegalActions(state.game).length, 0);
});

test('all three engagements terminate and transition without changing previous results', () => {
  let state = createCampaign();
  for (let index = 0; index < 3; index++) {
    state = finishByPassing(state);
    assert.ok(state.game.result); assert.equal(state.results.length, index + 1);
    assert.ok(state.game.round <= state.game.scenario.roundLimit);
    if (index < 2) {
      const previous = structuredClone(state.results);
      state = campaignReducer(state, { type: 'continue', revision: state.revision });
      assert.equal(state.engagementIndex, index + 1); assert.equal(state.game.scenario.id, engagements[index + 1].scenario.id);
      assert.deepEqual(state.results, previous); assert.equal(state.game.round, 1); assert.equal(state.game.orders, 3);
    }
  }
  assert.equal(state.status, 'complete');
  assert.equal(campaignReducer(state, { type: 'continue', revision: state.revision }), state);
});

test('victory scoring persists across engagements with a single Chesapeake bonus', () => {
  let state = createCampaign();
  for (let i = 0; i < 3; i++) {
    state = immediateWin(state);
    const expected = engagements[i].fleet.britishWarships + scoring.engagementWin + (i === 2 ? scoring.chesapeakeWinBonus : 0);
    assert.equal(state.currentScore, expected); assert.equal(state.results[i].score, expected);
    if (i < 2) state = campaignReducer(state, { type: 'continue', revision: state.revision });
  }
  assert.equal(state.score, 36); assert.equal(state.status, 'complete');
  assert.equal(state.results[0].bonus, 0); assert.equal(state.results[1].bonus, 0); assert.equal(state.results[2].bonus, 7);
});

test('a British warship earns one sink point once; invalid and duplicate actions cannot rescore', () => {
  let state = createCampaign();
  const player = state.game.units[0], target = state.game.units.find(u => u.owner === 'british' && isCombatant(u))!;
  player.position = [6, 2]; target.position = [8, 2]; target.hp = 1;
  const action = { type: 'attack' as const, unitId: player.id, targetId: target.id };
  const before = structuredClone(state);
  state = campaignReducer(state, { type: 'order', action, revision: state.revision });
  assert.equal(state.currentScore, 1); assert.equal(state.score, 1); assert.deepEqual(state.creditedSinks, [target.id]);
  assert.equal(campaignReducer(state, { type: 'order', action, revision: state.revision }), state);
  state = nextTurn(state); assert.equal(state.score, 1);
  assert.equal(before.game.units.find(u => u.id === target.id)!.status, 'active');
});

test('result settlement is idempotent and only British warship sinks award sink points', () => {
  let state = createCampaign();
  const american = state.game.units.find(u => u.owner === 'american')!;
  american.hp = 0; american.status = 'sunk';
  state = nextTurn(state); assert.equal(state.score, 0);
  state = immediateWin(state);
  const score = state.score;
  for (const type of ['resolve', 'end-turn', 'ai-step'] as const) assert.equal(campaignReducer(state, { type, revision: state.revision }), state);
  assert.equal(state.score, score); assert.equal(state.results.length, 1);
});

test('Restart Engagement removes only its own live points and completed result', () => {
  let state = immediateWin(createCampaign());
  const previous = structuredClone(state.results);
  state = campaignReducer(state, { type: 'continue', revision: state.revision });
  state = immediateWin(state); assert.equal(state.results.length, 2);
  state = campaignReducer(state, { type: 'restart-engagement' });
  assert.equal(state.engagementIndex, 1); assert.deepEqual(state.results, previous); assert.equal(state.score, previous[0].score);
  assert.equal(state.currentScore, 0); assert.deepEqual(state.creditedSinks, []);
  assert.equal(state.game.scenario.id, engagements[1].scenario.id); assert.equal(state.game.round, 1);
  assert.ok(state.game.units.every(u => isAlive(u) && u.hp === u.maxHp && !u.movedThisRound && !u.attackedThisRound));
});

test('Restart Campaign clears every result, score and port field; revisions invalidate old timers', () => {
  let state = immediateWin(createCampaign());
  state = campaignReducer(state, { type: 'continue', revision: state.revision });
  state = campaignReducer(state, { type: 'end-turn', revision: state.revision });
  const stale = { type: 'ai-step' as const, revision: state.revision };
  state = campaignReducer(state, { type: 'restart-campaign' });
  assert.equal(state.engagementIndex, 0); assert.equal(state.score, 0); assert.deepEqual(state.results, []);
  assert.equal(state.game.portControl, 'inactive'); assert.equal(state.game.phase, 'american');
  assert.equal(campaignReducer(state, stale), state);
});

test('Port Advantage is a once-per-turn two-target attack unlocked by Allied control of G7', () => {
  assert.ok(!engagements[0].scenario.portAdvantage); assert.ok(!engagements[1].scenario.portAdvantage);
  assert.deepEqual(engagements[2].scenario.portAdvantage, [6, 6]);
  const scenario = structuredClone(engagements[2].scenario);
  const controller = scenario.units.find(unit => unit.owner === 'american')!;
  const attacker = scenario.units.find(unit => unit.owner === 'american' && unit.id !== controller.id)!;
  const [first, second] = scenario.units.filter(unit => unit.owner === 'british').slice(0, 2);
  controller.position = [...scenario.portAdvantage!];
  attacker.position = [5, 4];
  first.position = [7, 4];
  second.position = [5, 6];
  let game = createGame(scenario);
  assert.equal(game.portControl, 'american');
  const action = getLegalActions(game).find(candidate => candidate.type === 'port-advantage' && candidate.unitId === attacker.id && candidate.targetIds.includes(first.id) && candidate.targetIds.includes(second.id))!;
  assert.ok(action);
  game = applyAction(game, action);
  assert.equal(game.orders, 2);
  assert.equal(game.portAdvantageUsedThisTurn, true);
  assert.equal(game.units.find(unit => unit.id === attacker.id)!.attackedThisRound, true);
  assert.equal(game.units.find(unit => unit.id === first.id)!.hp, first.maxHp - 2);
  assert.equal(game.units.find(unit => unit.id === second.id)!.hp, second.maxHp - 2);
  assert.ok(!getLegalActions(game).some(candidate => candidate.type === 'port-advantage'));

  const unheld = createGame(engagements[2].scenario);
  assert.equal(unheld.portControl, 'neutral');
  assert.ok(!getLegalActions(unheld).some(candidate => candidate.type === 'port-advantage'));
  assert.equal(gameReducer(unheld, { type: 'port-advantage', unitId: attacker.id, targetIds: [first.id, second.id] }), unheld);

  game = gameReducer(game, { type: 'end-phase', side: 'american' });
  game = gameReducer(game, { type: 'end-phase', side: 'british' });
  game = gameReducer(game, { type: 'resolve' });
  assert.equal(game.portAdvantageUsedThisTurn, false);
  assert.equal(game.portControl, 'american');
});

test('moving an Allied combat ship onto G7 immediately establishes Port Advantage control', () => {
  const scenario = structuredClone(engagements[2].scenario);
  const controller = scenario.units.find(unit => unit.owner === 'american')!;
  controller.position = [5, 6];
  const game = createGame(scenario);
  assert.equal(game.portControl, 'neutral');
  const move = getLegalActions(game).find(action => action.type === 'move' && action.unitId === controller.id && same(action.to, [6, 6]))!;
  assert.ok(move);
  assert.equal(applyAction(game, move).portControl, 'american');
});

test('timeout victory, defeat and draw are deterministic and exclude merchants', () => {
  for (const expected of ['victory', 'defeat', 'draw'] as const) {
    const game = createGame(engagements[0].scenario); game.round = game.scenario.roundLimit; game.phase = 'operations';
    // R1 starts with equal total combat hull. Alter exactly one point for decisive outcomes.
    if (expected === 'victory') game.units.find(u => u.owner === 'british' && isCombatant(u))!.hp--;
    if (expected === 'defeat') game.units[0].hp--;
    for (const u of game.units.filter(u => !isCombatant(u))) u.hp = 999;
    assert.equal(gameReducer(game, { type: 'resolve' }).result, expected);
  }
});

test('three engagement fleets contain no merchant or transport vessels', () => {
  const text = JSON.stringify({ engagements, scoring }).toLowerCase();
  assert.ok(!text.includes('blockade'));
  for (const definition of engagements) {
    assert.ok(!definition.scenario.units.some(unit => unit.class === 'merchantman' || unit.class === 'transport'));
    assert.ok(getLegalActions(createGame(definition.scenario)).every(action => ['move', 'reposition', 'attack', 'french-intervention', 'port-advantage'].includes(action.type)));
  }
});

test('duplicate transition and end-turn commands cannot skip scenarios or AI phases', () => {
  const before = createCampaign(); const command = { type: 'end-turn' as const, revision: before.revision };
  let state = campaignReducer(before, command); assert.equal(campaignReducer(state, command), state);
  state = immediateWin(createCampaign()); const next = { type: 'continue' as const, revision: state.revision };
  state = campaignReducer(state, next); assert.equal(campaignReducer(state, next), state); assert.equal(state.engagementIndex, 1);
});

test('Restart Engagement also rolls back unbanked sink points during play', () => {
  let state = createCampaign();
  const attacker = state.game.units[0], target = state.game.units.find(u => u.owner === 'british' && isCombatant(u))!;
  attacker.position = [6, 2]; target.position = [8, 2]; target.hp = 1;
  state = campaignReducer(state, { type: 'order', action: { type: 'attack', unitId: attacker.id, targetId: target.id }, revision: state.revision });
  assert.equal(state.score, 1); assert.equal(state.status, 'playing');
  state = campaignReducer(state, { type: 'restart-engagement' });
  assert.equal(state.score, 0); assert.equal(state.currentScore, 0); assert.deepEqual(state.results, []); assert.deepEqual(state.creditedSinks, []);
});

test('normal legal player orders and British responses complete the whole campaign', () => {
  let state = createCampaign();
  let playerOrders = 0;
  for (let guard = 0; guard < 400 && state.status !== 'complete'; guard++) {
    if (state.status === 'engagement-results') {
      state = campaignReducer(state, { type: 'continue', revision: state.revision });
      continue;
    }
    if (state.game.phase === 'british') state = campaignReducer(state, { type: 'ai-step', revision: state.revision });
    else if (state.game.phase === 'operations') state = campaignReducer(state, { type: 'resolve', revision: state.revision });
    else {
      const actions = getLegalActions(state.game);
      const attack = actions.find(a => a.type === 'attack');
      const enemies = state.game.units.filter(u => u.owner === 'british' && isAlive(u) && isCombatant(u));
      const moves = actions.filter(a => a.type === 'move');
      const distanceToEnemy = (p: [number, number]) => Math.min(...enemies.map(u => Math.abs(u.position[0] - p[0]) + Math.abs(u.position[1] - p[1])));
      moves.sort((a, b) => distanceToEnemy(a.to) - distanceToEnemy(b.to));
      const action = attack ?? moves[0];
      if (action) { state = campaignReducer(state, { type: 'order', action, revision: state.revision }); playerOrders++; }
      else state = campaignReducer(state, { type: 'end-turn', revision: state.revision });
    }
  }
  assert.equal(state.status, 'complete'); assert.equal(state.results.length, 3); assert.ok(playerOrders > 0);
  assert.equal(state.score, state.results.reduce((sum, r) => sum + r.score, 0));
});
