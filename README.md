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

1. Massachusetts Coast: 3 American Navy units, 2 privateers, 4 British warships, and 2 merchant fixtures. No French units.
2. Newport, Rhode Island: 2 American Navy units, 1 privateer, 2 French allies, and 5 British warships.
3. Chesapeake Bay: 2 American Navy units, 1 privateer, 3 French allies, and 5 British warships. Labeled Port Battle; G7 is an inactive Port Advantage Square.

Locations and themes were supplied by the owner. These are not reconstructions of particular engagements. Each engagement starts with a fresh fleet. Campaign points and prior results carry forward; ships and damage do not.

Select a vessel, choose Move or Attack, then select a highlighted tile or target. The whole Revolutionary Alliance shares three orders per turn. Each ship can move once and attack once, using one order each. Movement follows orthogonal paths around land and occupied tiles. Sunk vessels free their squares. Direct damage is deterministic; attack range uses Manhattan distance and ignores intervening terrain and ships. French ships are controlled by the player in the same way as American ships.

End Turn discards unused orders and lets British AI use its own three orders through the same validation functions. The AI only commands British combat ships and only attacks opposing combat ships. Merchants are selectable fixtures; they are not conventional targets, do not attack, and do not grant points. There is no commerce interception yet.

Testing objectives: eliminate the opposing combat fleet, or have more remaining combat hull at the turn limit. Equal hull is a draw. Limits are configurable at 10/12/14 turns. Wins, losses, and draws all allow progression to the next engagement.

Testing score: +5 for a win, +1 per distinct British warship sunk, and +7 extra for winning Round 3. Results settle once. Restart Engagement rolls back only its current points and result; earlier results remain. Restart Campaign clears everything. Restarts require confirmation. Final results show performance across all three engagements.

The Port Advantage Square gives no attack bonus, double attack, control reward, or victory effect. Port control stays inactive. No special abilities, interception, capture, resource rewards, or scripted events are implemented.

## Code

- `src/game/`: reused movement/pathfinding engine, types, provisional stats, combat rules, pure transitions, and deterministic British AI. American/French ownership maps to one Alliance command side. The original single-demo scenario remains for regression tests only.
- `src/campaign/`: typed campaign state, exactly three scenario definitions, testing fleet configurations, scoring/turn limits, future ability slots, and a pure campaign reducer. Revision checks reject stale timers and double submissions. Current-engagement points are separate from prior results so retries do not inflate scores.
- `src/components/CampaignBoard.tsx` and `src/screens/Battlefield.tsx`: active chart and campaign interface, inspection, roster, results, confirmation controls, and activity log.
- `src/data/`: historical placeholders, source schema, instructions, and inactive feature definitions. Historical files and citation registry remain unpopulated.
- `tests/campaign.test.ts`: campaign fleets, ownership, combat, ending conditions, transitions, scoring, retries, and inactive port checks.
- `src/battleship/`, `src/components/GameBoard.tsx`, and `tests/battleship.test.ts`: preserved earlier single-engagement game and tests. Not imported by the active screen; Battleship targeting/placement rules conflict with this milestone's requested three-order movement system.

Navigation keeps the current session in memory. Refresh resets the campaign. No save/resume, backend, accounts, or online opponent. The interface uses original CSS/SVG graphics. Mobile charts scroll horizontally inside their frames.

## Historical material

No research or citations were added for this milestone. Background text remains unfinished. Only owner-verified material from the approved bibliography may be integrated later. Gameplay values and scenario labels do not establish historical evidence.

## GitHub Pages

Existing Git configuration and Pages workflow are preserved. Production base is `/NavalPowerAmRev/`; development base is `/`. CI runs lint, all tests, and build before deploying `dist`. `dist` and `node_modules` stay ignored.

Only after owner approval: commit reviewed changes and push to `main` to trigger the existing Pages workflow. No force push or repository-setting changes are needed. Local checks do not publish anything.
