# Revolution at Sea

React + TypeScript + Vite game for Issa Mansour's HIST 238 final project. Milestone 2B adds three sequential engagements using the existing three-order movement engine. Fleet sizes, ship values, maps, objectives, turn limits, and points are testing rules, not historical findings.

## Run and check

Use Node.js 24:

```sh
npm ci
npm run dev
npm test
npm run build
npm run lint
npm run preview
```

Development uses `/`. Production preview uses `/NavalPowerAmRev/`.

## Campaign

1. **1776: Battle of Block Island** — April 1776, waters near Block Island, Rhode Island. Continental Navy ships and American privateers face the British Royal Navy; no French ships appear.
2. **1778: Newport Naval Campaign** — August 1778, Narragansett Bay and Newport, Rhode Island. French allies join the player. This game round is explicitly a fictionalized engagement inspired by the campaign, not a decisive historical French-British fleet battle.
3. **1781: Battle of the Chesapeake** — September 5, 1781, entrance to Chesapeake Bay, Virginia; also known as the Battle of the Virginia Capes. Allied control of G7 enables Port Advantage, representing the strategic importance of controlling the bay.

Each round presents its own historical introduction before combat. These are simplified game engagements inspired by the historical events, not reconstructions. Each engagement starts with a fresh fleet. Campaign points and prior results carry forward; ships and damage do not.

Select a vessel, choose an available action, then select a highlighted tile or target. The whole Revolutionary Alliance shares three orders per turn. Each ship can move once and attack once, using one order each. American privateers may also reposition once per engagement by up to two legal orthogonal tiles for one order. Movement follows orthogonal paths around land and occupied tiles. Sunk vessels free their squares. Direct damage is deterministic; attack range uses Manhattan distance and ignores intervening terrain and ships. French ships are controlled by the player in the same way as American ships.

Starting in Round 2, French Intervention allows one French warship to make a bonus attack each Alliance turn without spending an order. In Round 3, if an Allied combat ship occupies G7, Port Advantage allows one eligible Allied ship to attack two different British ships in its range for one order, using that ship's normal attack for the turn.

End Turn discards unused orders and lets British AI use its own three orders through the same validation functions. The AI only commands British combat ships and only attacks opposing combat ships.

Testing objectives: eliminate the opposing combat fleet, or have more remaining combat hull at the turn limit. Equal hull is a draw. Limits are configurable at 10/12/14 turns. Wins, losses, and draws all allow progression to the next engagement.

Testing score: +5 for a win, +1 per distinct British warship sunk, and +7 extra for winning Round 3. Results settle once. Restart Engagement rolls back only its current points and result; earlier results remain. Restart Campaign clears everything. Restarts require confirmation. Final results show performance across all three engagements.

## Code

- `src/game/`: reused movement/pathfinding engine, types, provisional stats, combat rules, pure transitions, and deterministic British AI. American/French ownership maps to one Alliance command side. The original single-demo scenario remains for regression tests only.
- `src/campaign/`: typed campaign state, exactly three historically labeled scenario definitions, testing fleet configurations, scoring/turn limits, and a pure campaign reducer. Revision checks reject stale timers and double submissions. Current-engagement points are separate from prior results so retries do not inflate scores.
- `src/components/CampaignBoard.tsx` and `src/screens/Battlefield.tsx`: active chart and campaign interface, inspection, roster, results, confirmation controls, and activity log.
- `src/data/`: historical background, source schema, and instructions.
- `tests/campaign.test.ts`: campaign fleets, ownership, combat, abilities, ending conditions, transitions, scoring, and retries.
- `src/battleship/`, `src/components/GameBoard.tsx`, and `tests/battleship.test.ts`: preserved earlier single-engagement game and tests. Not imported by the active screen; Battleship targeting/placement rules conflict with this milestone's requested three-order movement system.

Navigation keeps the current session in memory. Refresh resets the campaign. No save/resume, backend, accounts, or online opponent. The interface uses original CSS/SVG graphics. Mobile charts scroll horizontally inside their frames.

## Historical material

Historical Background retains the existing sourced essays and now includes French intervention context alongside each round's historical introduction. The Newport game round is explicitly fictionalized rather than presented as a decisive historical battle. Fleet values and special abilities are gameplay abstractions, not historical measurements or evidence.

## GitHub Pages

Existing Git configuration and Pages workflow are preserved. Production base is `/NavalPowerAmRev/`; development base is `/`. CI runs lint, all tests, and build before deploying `dist`. `dist` and `node_modules` stay ignored.

Only after owner approval: commit reviewed changes and push to `main` to trigger the existing Pages workflow. No force push or repository-setting changes are needed. Local checks do not publish anything.
