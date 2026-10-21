import type { HistoricalContent } from './sources';

export type Faction = 'american' | 'british' | 'french';
export interface Ship {
    id: string;
    name: string;
    faction: Faction;
    mock: true;
    class: string | null;
    movement: number | null;
    strength: number | null;
    abilities: string[];
    description: HistoricalContent;
    sourceIds: string[];
    position: [number, number];
}
export const factions = { american: 'American', british: 'British', french: 'French' };
export const shipPlaceholders = {
    specifications: '[Ship specifications pending research]',
    mechanics: '[Pending design approval]',
    abilities: '[Abilities pending design approval]',
};

// Arbitrary positions and identifiers exercise selection only. No historical statistics.
export const fleet: Ship[] = ([
    ['mock-am-01', 'Mock American vessel 01', 'american', [3, 3]],
    ['mock-am-02', 'Mock American vessel 02', 'american', [5, 6]],
    ['mock-gb-01', 'Mock British vessel 01', 'british', [8, 3]],
    ['mock-gb-02', 'Mock British vessel 02', 'british', [9, 7]],
    ['mock-fr-01', 'Mock French vessel 01', 'french', [6, 9]],
    ['mock-fr-02', 'Mock French vessel 02', 'french', [8, 10]],
] satisfies [string, string, Faction, [number, number]][]).map(([id, name, faction, position]) => ({
    id, name, faction, position, mock: true, class: null, movement: null, strength: null, abilities: [], sourceIds: [],
    description: { id: `${id}-description`, title: 'Ship description', text: '[Ship description pending research]', sourceIds: [], status: 'placeholder' },
}));

export interface Port {
    id: string;
    name: string;
    x: number;
    y: number;
    sourceIds: string[];
    description: string;
}
export const ports: Port[] = [[2, 1], [2, 3], [1, 5], [2, 8], [1, 11]].map(([x, y], index) => ({
    id: `mock-port-${index + 1}`, name: `Mock port ${index + 1}`, x, y, sourceIds: [], description: '[Port description pending research]',
}));
