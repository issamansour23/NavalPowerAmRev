# Revolutionary Naval War

React + TypeScript + Vite educational website. Milestone 2A implements a provisional core gameplay demo, not a researched historical scenario.

## Local development and checks

Use Node.js 24 (also used by CI):

```sh
npm ci
npm run dev
npm test
npm run build
npm run lint
```

`npm run preview` serves the production build at `/NavalPowerAmRev/`. Local development uses `/`.

## Demo rules

- American player → British AI → operations → next round.
- Three orders per side per round. Each ship may move once and attack once. End Turn discards unused orders.
- Orthogonal BFS movement avoids land and all active vessels. Sunk vessels free their tiles.
- Deterministic direct damage, no counterattack. Attack range uses Manhattan distance and deliberately ignores intervening land/ships.
- Win by holding the mock beacon I6 through British command at operations resolution. Lose if all American vessels sink or the 12-round deadline expires. Eliminating the British fleet alone is not victory.
- All unit values are explicitly provisional GDD fixtures. The demonstration uses one American ship of the line and one frigate against two British frigates; this is a playtest allocation, not a historical claim.
- Restart requires confirmation. Navigation preserves the in-memory session; refresh resets it.

## Code organization

`src/game/` contains independent types, configuration, mock scenario, pathfinding, legal action validation, pure transitions, and deterministic AI. React components only present state and dispatch commands. Tests use Node's built-in TypeScript support and test runner, without additional dependencies. CI runs the engine tests before building.

`src/data/` keeps historical placeholders and an empty typed source registry. No historical research or citations have been populated. Original CSS and SVG visuals are provisional.

## Scope and limitations

Milestone 2A only. No privateering/capture mechanics, convoys, French intervention, blockades, port effects, campaign progression, fog of war, or save/resume. AI uses stable deterministic priorities; there is no random wandering. Balance and strategy require owner playtesting.

The GitHub Pages production base and workflow remain configured. Nothing is committed, pushed, or deployed by local development commands.
