import { createGame, gameReducer } from '../game/reducer.ts';
import { chooseBritishAction } from '../game/ai.ts';
import { isCombatant } from '../game/units.ts';
import { engagements } from './scenarios.ts';
import { scoring } from './config.ts';
import type { CampaignCommand, CampaignState, EngagementResult } from './types.ts';

export function createCampaign(revision = 0): CampaignState {
  return { engagementIndex: 0, game: createGame(engagements[0].scenario), results: [], score: 0, currentScore: 0, creditedSinks: [], status: 'playing', revision };
}
/** Settle each unique sink and result exactly once, as part of the same pure state transaction. */
function settle(state: CampaignState): CampaignState {
  const newSinks = state.game.units.filter(u => u.owner === 'british' && isCombatant(u) && u.status === 'sunk' && !state.creditedSinks.includes(u.id)).map(u => u.id);
  const delta = newSinks.length * scoring.britishWarshipSunk;
  let next = { ...state, score: state.score + delta, currentScore: state.currentScore + delta, creditedSinks: [...state.creditedSinks, ...newSinks] };
  if (!state.game.result || state.status !== 'playing') return next;
  const definition = engagements[state.engagementIndex];
  const winPoints = state.game.result === 'victory' ? scoring.engagementWin : 0;
  const bonus = state.game.result === 'victory' && definition.number === 3 ? scoring.chesapeakeWinBonus : 0;
  next = { ...next, score: next.score + winPoints + bonus, currentScore: next.currentScore + winPoints + bonus };
  const result: EngagementResult = {
    number: definition.number, location: definition.location, outcome: state.game.result, turns: state.game.round,
    sunkWarships: [...next.creditedSinks], sinkPoints: next.creditedSinks.length * scoring.britishWarshipSunk,
    winPoints, bonus, score: next.currentScore, reason: state.game.log.at(-1) ?? '',
  };
  return { ...next, results: [...next.results, result], status: definition.number === 3 ? 'complete' : 'engagement-results' };
}
export function campaignReducer(state: CampaignState, command: CampaignCommand): CampaignState {
  if (command.type === 'restart-campaign') return createCampaign(state.revision + 1);
  if (command.type === 'restart-engagement') {
    const results = state.results.filter(r => r.number < engagements[state.engagementIndex].number);
    return { ...state, game: createGame(engagements[state.engagementIndex].scenario), results, score: results.reduce((total, r) => total + r.score, 0), currentScore: 0, creditedSinks: [], status: 'playing', revision: state.revision + 1 };
  }
  if (command.revision !== state.revision) return state;
  if (command.type === 'continue') {
    if (state.status !== 'engagement-results' || state.engagementIndex >= engagements.length - 1) return state;
    const engagementIndex = state.engagementIndex + 1;
    return { ...state, engagementIndex, game: createGame(engagements[engagementIndex].scenario), currentScore: 0, creditedSinks: [], status: 'playing', revision: state.revision + 1 };
  }
  if (state.status !== 'playing') return state;
  let game = state.game;
  if (command.type === 'order' && game.phase === 'american') game = gameReducer(game, command.action);
  if (command.type === 'end-turn' && game.phase === 'american') game = gameReducer(game, { type: 'end-phase', side: 'american' });
  if (command.type === 'ai-step' && game.phase === 'british') game = gameReducer(game, chooseBritishAction(game) ?? { type: 'end-phase', side: 'british' });
  if (command.type === 'resolve' && game.phase === 'operations') game = gameReducer(game, { type: 'resolve' });
  if (game === state.game) return state;
  return settle({ ...state, game, revision: state.revision + 1 });
}
