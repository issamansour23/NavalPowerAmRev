# Content integration

- `sources.ts`: reusable source metadata types and the empty `sources` registry. Add only user-provided, verified primary or secondary sources. Dates remain strings to accommodate uncertain or approximate source dates without inventing precision.
- `history.ts`: historical section slots, placeholders, verification status, and source IDs.
- `fleet.ts`: retained research placeholders, faction labels, and original mock content fixtures. Historical ship specifications remain unassigned. Active Milestone 2B fleets and scores live in `src/campaign/`; movement and combat values live in `src/game/config.ts`. The earlier Battleship module remains isolated for regression tests.
- `systems.ts`: future integration slots only. No rules, advantages, balance, or victory conditions are implemented.
- `instructions.ts`: instructions describing current interface functionality.
- `gameContent.ts`: gameplay abstraction disclosure, kept separate from historical evidence.

When research is supplied, add source records with stable IDs, link content through `sourceIds`, and replace the relevant placeholders. Mark historical text verified only after the user supplies verified content. Source verification does not itself authorize gameplay ratings or faction advantages; those require separate design approval.

All current positions and fleet identifiers are arbitrary UI fixtures. Faction colors distinguish selections and imply no automatic mechanical advantage. The campaign uses owner-specified testing fleet counts and provisional movement/combat values, not researched vessel specifications. Original CSS/SVG graphics are provisional and make no historical authenticity claim. The title and date-bearing subtitle were supplied by the user.
