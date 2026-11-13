/** Provisional playtest values supplied by the owner. Not historical measurements. */
export const scoring = { engagementWin: 5, britishWarshipSunk: 1, chesapeakeWinBonus: 7 } as const;
export const turnLimits = [10, 12, 14] as const;
export const portAdvantageSquare: [number, number] = [6, 6];
/** Definition slots only. No abilities are implemented in Milestone 2B. */
export const futureAbilities = [
  { id: 'merchant-interception', label: 'Merchant interception', status: 'reserved-for-2c' },
  { id: 'french-support', label: 'French support', status: 'reserved-for-2c' },
] as const;
