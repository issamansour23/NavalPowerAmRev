# Phase 1 rules

This module is the active Battleship-style game. The original movement engine in `src/game/` remains isolated for reference and its existing regression tests; it is not imported by the active game. The old beacon objective, movement, three-order system, and damage ratings conflict with the newly requested rules, so they are not active.

- `types.ts`: single authoritative game state and commands.
- `config.ts`: owner-supplied 10×10 board and 4/3/2 gameplay lengths.
- `placement.ts`: legal manual placement and finite random fleet generation.
- `engine.ts`: pure placement, start, attack, sinking, victory, reset, and turn transitions.
- `ai.ts`: picks randomly from unused coordinates using public shot history only. No fleet positions enter this API.
- `random.ts`: seeded randomness for reproducible tests; fresh runtime seeds come from Web Crypto.
- `view.ts`: projects only visible cells for React. Hidden British positions never enter cell attributes, labels, or styling.

Later historical abilities should use separate modules and explicit commands. Do not add historical effect adjudication to the core `attack` function. No abilities, resource counters, campaign victory objectives, or historical claims are implemented here.
