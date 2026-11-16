export type Faction = 'american' | 'british' | 'french';
/** American command represents the whole player-controlled Revolutionary Alliance. */
export type Side = 'american' | 'british';
export type Position = [number, number];
export type UnitClass = 'ship_of_line' | 'frigate' | 'privateer' | 'merchantman' | 'transport';
export interface Tile { id: string; position: Position; type: 'sea' | 'land' | 'port' | 'route'; isNavigable: boolean; owner?: Faction }
export interface Unit {
  id: string; name: string; owner: Faction; class: UnitClass; position: Position;
  hp: number; maxHp: number; movedThisRound: boolean; attackedThisRound: boolean;
  privateerRepositioned: boolean;
  status: 'active' | 'sunk'; mission: string; cargo?: number;
}
export type Action =
  | { type: 'move'; unitId: string; to: Position }
  | { type: 'reposition'; unitId: string; to: Position }
  | { type: 'attack'; unitId: string; targetId: string }
  | { type: 'french-intervention'; unitId: string; targetId: string }
  | { type: 'port-advantage'; unitId: string; targetIds: [string, string] };
export interface Scenario {
  id: string; prototype: true; tiles: Tile[]; units: Unit[]; objective: Position; roundLimit: number;
  victoryRule?: 'combat-and-hull';
  portAdvantage?: Position;
}
export type EngagementOutcome = 'victory' | 'defeat' | 'draw';
export interface GameState {
  scenario: Scenario; units: Unit[]; round: number; phase: Side | 'operations' | 'finished';
  orders: number; result: EngagementOutcome | null; log: string[];
  /** Side holding the strategic square, neutral if unoccupied, or inactive outside Round 3. */
  portControl: 'inactive' | 'neutral' | Side | 'contested';
  frenchInterventionUsedThisTurn: boolean;
  portAdvantageUsedThisTurn: boolean;
}
export type Command = Action | { type: 'end-phase'; side: Side } | { type: 'resolve' } | { type: 'restart' };
