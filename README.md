# Revolution at Sea

Single-player Battleship-style React + TypeScript + Vite game for Issa Mansour's HIST 238 final project. Phase 1 uses simplified gameplay rules, not researched ship measurements or a historical battle scenario.

## Run locally

Use Node.js 24 (the same version as CI):

```sh
npm ci
npm run dev
```

Open the URL Vite prints. Verify with:

```sh
npm test
npm run build
npm run lint
npm run preview
```

Production preview uses `/NavalPowerAmRev/`. Development uses `/`.

## Play

1. Place one American Ship of the Line (4 squares), Frigate (3), and Small Warship (2). Select each starting square; Orientation switches horizontal/vertical. Ships may touch but cannot overlap or extend outside the 10×10 board.
2. Randomize Fleet places all three automatically. Clear Placement resets manual placement. Start Game unlocks only for a complete valid fleet.
3. Attack one unexplored square in British Waters. A cross means hit; a dot means miss. British positions stay hidden until hit or until the game ends. Each side attacks once per turn, including after hits.
4. Hit all squares of a ship to sink it. Sink the entire British fleet to win; lose if your fleet sinks first.
5. New Game resets the whole match. Navigation preserves the in-memory game; page refresh resets it.

Mouse, touch, Tab, Enter/Space, and arrow keys are supported. Small screens stack the boards; each chart scrolls independently where needed.

## Architecture

- `src/battleship/`: active pure engine, placement validation, seeded random fleet generation, configuration, state types, AI, visibility projection, and gameplay styles.
- `src/components/GameBoard.tsx`: reusable 10×10 chart; receives visible cells only.
- `src/screens/Battlefield.tsx`: state rendering, placement controls, turn feedback, event log, and timed AI dispatch. The reducer validates every action, including stale AI callbacks.
- `src/data/`: instructions, gameplay disclosure, historical placeholders, and empty source registry. Source material is not fetched automatically.
- `tests/battleship.test.ts`: Phase 1 placement, AI, visibility, complete victory/defeat, and reset tests.
- `src/game/` and `tests/engine.test.ts`: preserved prior movement demo and its regression tests. Not imported by the active game because the new Phase 1 requirements replace its movement, order budget, and beacon objective.

British AI chooses randomly among untried coordinates. Its selection function accepts public shot history and a seed, never ship positions. Randomness is seeded for reproducible tests; runtime matches receive Web Crypto seeds.

## Scope

Phase 1 only. No privateering, blockades, French intervention, resource rewards, ship movement, campaign objectives, save/resume, accounts, backend, or in-site comments. Historical text, specifications, and citations remain placeholders. The original CSS/SVG art is provisional. Browser-local state cannot provide server-enforced secrecy against developer tools; concealed positions are excluded from rendered cell attributes and accessibility labels.

For Phase 2, add a separately tested historical-ability module after owner playtesting and source review. Keep ability adjudication separate from core placement/attack rules.

## GitHub Pages

The existing repository remote and workflow are preserved. Production builds use `/NavalPowerAmRev/`; no server, secrets, or new dependencies are needed. `node_modules` and `dist` remain ignored.

When publication is explicitly approved, review local changes, commit them, and push to `main`. The existing `.github/workflows/deploy.yml` installs dependencies, runs lint/tests/build, and deploys `dist` using official Pages actions. In the GitHub repository, Pages publishing source must be GitHub Actions. Do not force-push or replace remote history.

Public URL: https://issamansour23.github.io/NavalPowerAmRev/
