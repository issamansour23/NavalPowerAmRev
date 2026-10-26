import type { ShipClass } from './types.ts';
export const SIZE = 10;
/** Gameplay abstractions supplied by the owner, not historical measurements. */
export const SHIPS: { class: ShipClass; label: string; length: number; role: string }[] = [
  { class: 'ship_of_line', label: 'Ship of the Line', length: 4, role: 'Conventional warship' },
  { class: 'frigate', label: 'Frigate', length: 3, role: 'Versatile warship' },
  { class: 'small_warship', label: 'Small Warship', length: 2, role: 'Small vessel' },
];
export const shipDefinition = (shipClass: ShipClass) => SHIPS.find(ship => ship.class === shipClass)!;
