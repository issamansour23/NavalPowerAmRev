export type Side = 'american' | 'british';
export type Position = readonly [number, number];
export type ShipClass = 'ship_of_line' | 'frigate' | 'small_warship';
export type Orientation = 'horizontal' | 'vertical';
export interface PlacedShip { class: ShipClass; cells: Position[] }
export interface Shot { position: Position; outcome: 'hit' | 'miss' | 'sunk' }
/** Shots belong to the board that received them. */
export interface FleetBoard { ships: PlacedShip[]; shots: Shot[] }
export interface GameState {
  matchId: number;
  seed: number;
  phase: 'placement' | 'american' | 'british' | 'finished';
  orientation: Orientation;
  boards: Record<Side, FleetBoard>;
  turnNumber: number;
  winner: Side | null;
  log: string[];
}
export type Command =
  | { type: 'place'; position: Position }
  | { type: 'rotate' }
  | { type: 'randomize' }
  | { type: 'clear-placement' }
  | { type: 'start' }
  | { type: 'attack'; position: Position }
  | { type: 'computer'; matchId: number; turnNumber: number }
  | { type: 'new-game'; seed: number };
/** Rendering receives this projection, never the hidden opponent fleet. */
export interface CellView { position: Position; ship?: ShipClass; shot?: 'hit' | 'miss'; sunk: boolean }
