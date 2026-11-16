/** Active game rules; fleet values remain simplified playtest settings. */
export interface ActiveSystem {
    id: string;
    title: string;
    description: string;
}
export const activeSystems: ActiveSystem[] = [
    { id: 'american-privateering', title: 'American privateering', description: 'American privateers may each reposition once per engagement by up to two legal squares.' },
    { id: 'french-intervention', title: 'French intervention', description: 'From Round 2, one French warship may make a bonus attack each Alliance turn without spending an order.' },
    { id: 'ports', title: 'Port Advantage', description: 'In Round 3, Allied control of G7 enables one two-target attack each Alliance turn.' },
];
export const campaignObjective = 'Win more engagements than are lost; each round also uses its existing combat and hull rules.';
