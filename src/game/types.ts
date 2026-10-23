export type Faction = 'american' | 'british' | 'french';
export type Side = 'american' | 'british';
export type Position = [number, number];
export type UnitClass = 'ship_of_line' | 'frigate' | 'privateer' | 'merchantman' | 'transport';
export interface Tile { id: string; position: Position; type: 'sea' | 'land' | 'port' | 'route'; isNavigable: boolean; owner?: Faction }
export interface Unit {
  id: string; name: string; owner: Faction; class: UnitClass; position: Position;
  hp: number; maxHp: number; movedThisRound: boolean; attackedThisRound: boolean;
  status: 'active' | 'sunk'; mission: string; cargo?: number;
}
export type Action = { type: 'move'; unitId: string; to: Position } | { type: 'attack'; unitId: string; targetId: string };
export interface Scenario { id: string; prototype: true; tiles: Tile[]; units: Unit[]; objective: Position; roundLimit: number }
export interface GameState {
  scenario: Scenario; units: Unit[]; round: number; phase: Side | 'operations' | 'finished';
  orders: number; result: 'victory' | 'defeat' | null; log: string[];
}
export type Command = Action | { type: 'end-phase'; side: Side } | { type: 'resolve' } | { type: 'restart' };
