import type { Action, EngagementOutcome, GameState, Scenario } from '../game/types.ts';
export interface FleetConfiguration { americanNavy: number; privateers: number; french: number; britishWarships: number; merchants: number }
export interface EngagementDefinition {
  number: 1 | 2 | 3;
  location: string;
  theme: string;
  objectiveText: string;
  portBattle: boolean;
  fleet: FleetConfiguration;
  scenario: Scenario;
}
export interface EngagementResult {
  number: number; location: string; outcome: EngagementOutcome; turns: number;
  sunkWarships: string[]; sinkPoints: number; winPoints: number; bonus: number; score: number; reason: string;
}
export interface CampaignState {
  engagementIndex: number;
  game: GameState;
  results: EngagementResult[];
  score: number;
  currentScore: number;
  creditedSinks: string[];
  status: 'playing' | 'engagement-results' | 'complete';
  revision: number;
}
/** Every gameplay command carries the UI revision to reject double submissions and stale AI callbacks. */
export type CampaignCommand =
  | { type: 'order'; action: Action; revision: number }
  | { type: 'end-turn'; revision: number }
  | { type: 'ai-step'; revision: number }
  | { type: 'resolve'; revision: number }
  | { type: 'continue'; revision: number }
  | { type: 'restart-engagement' }
  | { type: 'restart-campaign' };
