<!-- Copyright © 2025 William Lay -->
<!-- Licensed under the PolyForm Noncommercial License 1.0.0 -->

# Communistopoly Technical Specification

## A Primer on the Digital Implementation

---

## 1. Purpose & Scope

This document orients an engineer or agent who needs to deep-dive the stack and architecture of the
shipped game. It describes *what exists and where*, and points at the source rather than restating
it — so it does not go stale the way a copied snippet does.

**What this document is not:**

- Not a rulebook. Game rules and mechanics live in `docs/communistopoly-rules.md`.
- Not a visual design spec. Colours, typography, layout mockups and component styling live in
  `Designs/communistopoly-design.md`.
- Not a progress tracker. The game is complete and playable — see `README.md` for current status,
  and GitHub Issues on `laywill/communistopoly` for in-flight work (§12).

---

## 2. Technology Stack

| Layer     | Choice                                                  |
|-----------|---------------------------------------------------------|
| Framework | React, TypeScript                                       |
| Bundler   | Vite                                                   |
| Styling   | CSS Modules, plus plain CSS for a handful of components |
| State     | Zustand, with the `persist` middleware                 |
| Fonts     | Google Fonts (Oswald, Roboto Condensed, Roboto Mono)    |
| Testing   | Vitest + React Testing Library, on jsdom                |

Exact versions live in `package.json` — restating them here is how the previous version of this
document went stale.

There is no backend and no audio; all state is client-side, held in memory and persisted to
`localStorage`.

---

## 3. Repository Layout

```text
communistopoly/
├── .devcontainer/
│   └── devcontainer.json      # Node 22 image, forwards 5173, `npm install` on create
├── docs/                      # Player-facing rules and reference (see §1)
├── Designs/                   # This document, the design spec, and related briefs
├── src/
│   ├── main.tsx
│   ├── App.tsx                 # Screen-flow switch — see §4
│   ├── App.css / index.css     # Global styles and design tokens (index.css)
│   ├── components/
│   │   ├── board/               # Board, spaces, board center
│   │   ├── game/                 # In-game UI
│   │   ├── modals/               # RulesModal, TribunalModal, etc.
│   │   ├── player/                # Player dashboards/cards
│   │   ├── property/              # Property cards and controls
│   │   ├── screens/               # WelcomeScreen, SetupScreen, GameScreen, GameEndScreen
│   │   ├── stalin/                # StalinPanel
│   │   └── ErrorBoundary.tsx
│   ├── data/                    # Static game data — board spaces, cards, pieces (§6)
│   ├── hooks/                    # Shared React hooks
│   ├── store/                    # Zustand store — composition root, slices, helpers (§5)
│   ├── types/
│   │   └── game.ts                # Canonical type definitions (§7)
│   ├── utils/                    # Generic utilities
│   └── tests/                    # Vitest suites (§10)
├── eslint.config.js
├── vitest.config.ts
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## 4. Application Shell & Screen Flow

`src/App.tsx` renders one of four top-level screens based on a single piece of store state,
`gamePhase: 'welcome' | 'setup' | 'playing' | 'ended'`:

| Phase     | Component                                  |
|-----------|--------------------------------------------|
| `welcome` | `src/components/screens/WelcomeScreen.tsx` |
| `setup`   | `src/components/screens/SetupScreen.tsx`   |
| `playing` | `src/components/screens/GameScreen.tsx`    |
| `ended`   | `src/components/screens/GameEndScreen.tsx` |

`RulesModal` and `TribunalModal` (`src/components/modals/`) are rendered at the app root, outside
the phase switch — `RulesModal` on local `showRules` state, `TribunalModal` whenever the store's
`activeTribunal` is non-null.

---

## 5. State Architecture — The Zustand Store

### Composition root

`src/store/gameStore.ts` contains no business logic. It imports every slice creator and its
`initial*State` object, concatenates the initial states into one `initialState`, and wraps the
combined slice creators in `persist(...)`.

### The slice pattern

Every domain lives in its own file under `src/store/slices/`, following one consistent shape. Taken
verbatim-in-shape from `src/store/slices/diceSlice.ts`:

```typescript
export interface DiceSliceState {
  turnPhase: TurnPhase
  dice: [number, number]
  // ...
}

export interface DiceSliceActions {
  rollDice: () => void
  finishRolling: () => void
  // ...
}

export type DiceSlice = DiceSliceState & DiceSliceActions

export const initialDiceState: DiceSliceState = {
  turnPhase: 'pre-roll',
  dice: [1, 1],
  // ...
}

export const createDiceSlice: StateCreator<
  GameStore,
  [],
  [],
  DiceSlice
> = (set, get) => ({
  ...initialDiceState,
  rollDice: () => { /* ... */ },
  // ...
})
```

`GameStore` (the first type parameter) is the intersection of *all* slice types — see
`src/store/types/storeTypes.ts`. Typing each `StateCreator` against the full `GameStore` rather than
its own slice is what lets a slice call another slice's actions via `get()` (see below) with full
type safety.

### Slice inventory

All 20 slices in `src/store/slices/`:

| Slice                     | Responsibility                                        |
|---------------------------|-------------------------------------------------------|
| `cardSlice`               | Party Directive / Communist Test deck state and draws |
| `confessionSlice`         | Rehabilitation confessions                            |
| `debtAndEliminationSlice` | Debt tracking, bankruptcy, player elimination         |
| `diceSlice`               | Dice rolling, doubles tracking, round counter         |
| `gameEndSlice`            | Win/end-condition detection, end-game vote            |
| `gamePhaseSlice`          | The `gamePhase` transitions driving §4                |
| `gulagSlice`              | Sending to / escaping the Gulag                       |
| `logSlice`                | The game log                                          |
| `movementSlice`           | Player movement around the board, passing STOY        |
| `pieceAbilitiesSlice`     | Per-piece special abilities                           |
| `playerSlice`             | Player CRUD, rank changes                             |
| `propertyAbilitiesSlice`  | Property-group special abilities                      |
| `propertySlice`           | Custodianship, quotas, collectivization               |
| `specialDecreesSlice`     | Great Purge, Five-Year Plan, Hero of the Soviet Union |
| `statisticsSlice`         | Per-player and per-game statistics                    |
| `tradeSlice`              | Player-to-player trade offers                         |
| `treasurySlice`           | State treasury balance                                |
| `tribunalSlice`           | Denouncements and tribunal flow                       |
| `uiSlice`                 | Transient UI state                                    |
| `voucherSlice`            | Gulag vouching agreements                             |

### Cross-slice calls

Slices call each other's actions through `get()`, typed as the whole `GameStore` — e.g.
`diceSlice.finishRolling` calls `get().sendToGulag(...)` and `get().movePlayer(...)`, both defined
in other slices. This is why every `StateCreator` is typed against `GameStore` rather than its own
slice type.

`GameActions` (in `storeTypes.ts`) still exists as an exported type, but is now an empty
backwards-compatibility marker — every action has migrated into its owning slice's `*SliceActions`
interface.

### Persistence

The store persists under the localStorage key `communistopoly-save`. `partialize` is an explicit
allowlist of state fields (not "everything") — see `gameStore.ts:82-114` for the full list.
`onRehydrateStorage` calls `recoverStuckTurnPhase()` on load, to recover from a turn phase (e.g.
`'rolling'`, `'moving'`) that was mid-transition when the page was last closed.

> **Known trap** ([#121](https://github.com/laywill/communistopoly/issues/121)): any state field
> that is a JS `Set` serializes to `{}` through `JSON.stringify`/`persist`'s default storage, silently
> losing its contents on reload. Fields in `partialize` are plain arrays/records for this reason —
> check any new persisted field isn't a `Set` before adding it to the allowlist.

### Helpers and constants

`src/store/helpers/` holds pure functions factored out of slices (elimination logic, gulag
calculations, player-stat initialization, wealth calculation) — these are unit-tested independently
of the store. `src/store/constants.ts` holds store-level constants such as
`THREE_DOUBLES_THRESHOLD`.

---

## 6. Game Data

`src/data/` holds the game's static content as plain TypeScript objects/arrays — no JSON, no
runtime parsing:

- `spaces.ts` — `BOARD_SPACES: BoardSpace[]`, the 40 board spaces, plus lookup helpers
  (`getSpaceById`, `getSpacesByType`, `getSpacesByGroup`).
- `properties.ts` — `PROPERTY_GROUPS: Record<PropertyGroup, PropertyGroupInfo>`, the 10 property
  groups, plus collectivization-level helpers.
- `pieces.ts` / `pieceAbilities.ts` — the 8 player pieces and their abilities/restrictions.
- `partyDirectiveCards.ts`, `communistTestQuestions.ts` — the two card decks.
- `constants.ts` — data-layer constants.

`BOARD_SPACES` and `PROPERTY_GROUPS` are the authority for the board layout and property groupings;
this document does not restate the 40 spaces or 10 groups.

---

## 7. Types

`src/types/game.ts` (438 lines) is the canonical source for every domain type — `Player`,
`Property`, `GameState`, and the rest. Read it directly rather than trusting a copy here.

One naming convention is worth calling out explicitly, because getting it wrong is a genuine trap
for anyone porting logic from the design brief or an old draft:

- Multi-word union members are **camelCase**, not kebab-case: `PartyRank` is
  `'proletariat' | 'partyMember' | 'commissar' | 'innerCircle'`, and pieces are `'redStar'`,
  `'breadLoaf'`, `'ironCurtain'`, `'vodkaBottle'`, `'statueOfLenin'`.
- The space *type* is `'railway'` (`SpaceType`), but the property *group* it belongs to is
  `'railroad'` (`PropertyGroup`) — the two are spelled differently on purpose, for the corresponding
  space and its group.

---

## 8. Board Rendering

The board is a nested-flex-ring layout, not a CSS grid — components live in
`src/components/board/` (`Board.tsx`, `BoardSpace.tsx`, per-type space components, `BoardCenter.tsx`,
`PlayerPiece.tsx`). The rotation technique that turns side spaces to face inward, the sizing custom
properties, and the responsive breakpoints are documented in
`Designs/communistopoly-design.md` §"Board Layout Technique (as implemented)" — this document does
not duplicate it.

---

## 9. Styling Approach

Most components use CSS Modules (`*.module.css`, scoped class names, imported as `styles` objects);
a handful of top-level components (screens, `App.css`, `PlayerPiece.css`, `StalinPanel.css`) use
plain `.css` files instead. Design tokens — colour, spacing and border custom properties — are
defined once in `src/index.css:4-47` and consumed everywhere via `var(--token-name)`. Fonts are
loaded from Google Fonts in `index.html:11-13` and referenced through the `--font-*` tokens.

For the palette, type scale, and full token reference, see `Designs/communistopoly-design.md`.

---

## 10. Testing

Vitest + React Testing Library, running on jsdom (`vitest.config.ts`), with global setup in
`src/tests/setup.ts`. Tests are organized by concern under `src/tests/`:

```text
src/tests/
├── components/    # Component tests
├── data/          # Game data tests
├── helpers/       # Store helper tests
├── hooks/         # Hook tests
├── integration/   # Cross-slice integration tests
├── utils/         # Utility tests
└── store/         # Store slice tests
    ├── core/      # Initialization, movement, turn flow
    ├── economy/   # Debt, property, trading
    ├── social/    # Gulag, tribunal, voting
    └── content/   # Cards, abilities
```

Coverage thresholds (lines, functions, branches, statements) are enforced at 85% in
`vitest.config.ts:18-23`.

```bash
npm run lint                     # ESLint, --max-warnings 0
npm test -- --run                # Run all tests
npm run test:coverage -- --run   # Coverage report, enforces the thresholds above
npm run build                    # tsc + Vite production build
```

---

## 11. Tooling & CI

- **ESLint**: flat config (`eslint.config.js`), TypeScript-ESLint + React + React Hooks plugins,
  run with `--max-warnings 0`.
- **Stylelint**: `.stylelintrc.json`, extends `stylelint-config-standard`.
- **cspell**: `.cspell.json`, spell-checks source and docs (includes a Russian dictionary for the
  game's Cyrillic strings).
- **MegaLinter**: aggregates the above plus markdownlint and lychee (link checking) over the repo,
  including `Designs/` and `docs/`.
- **GitHub Actions** (`.github/workflows/`): `build.yml`, `eslint.yml`, `mega-linter.yml`,
  `vitest.yml`.
- **DevContainer** (`.devcontainer/devcontainer.json`): `mcr.microsoft.com/devcontainers/typescript-node:22`
  image, forwards port 5173, runs `npm install` on create.

There is no Docker/nginx deployment setup in this repository — the app builds to static assets
(`npm run build`) and is served however the deploying party chooses.

---

## 12. Where Work Is Tracked

Outstanding work is tracked in **GitHub Issues** on `laywill/communistopoly`, not in this document:

- Issues carry a `track:*` label (`track:store`, `track:components`, `track:infra`) and a
  `priority:*` label; tracking issues for a whole track carry `epic`.
- Remediation follow-ups carry the `remediation` label and roll up under the **Code Review
  Remediation** milestone.

This document is a technical primer, not a progress tracker — it is not kept in sync with issue
status, and should not be read as one.

---

**Glory to the Motherland. Glory to the Code.**
