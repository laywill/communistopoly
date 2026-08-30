# Communistopoly - Claude Code Instructions

## Project Overview
A satirical Monopoly variant implemented in React + TypeScript with Zustand for state management.

## Current Focus: Code-Review Remediation
The Zustand store refactor is **complete** (issue #64, closed 2026-01-19; the final slice work landed
in PR #117 on 2026-03-01). `src/store/gameStore.ts` is now a 123-line composition root that holds no
business logic and simply composes the 20 slices in `src/store/slices/`.

Current work is **code-review remediation**: the follow-up fixes identified by the codebase review.
Phases 1 and 2 are merged (PR #124 — critical bugs C1-C3; PR #135 — quick wins H3, H5, H7).
Phases 3-7 remain outstanding, covering architectural fixes, component decomposition, medium- and
low-priority polish, and CI complexity gates.

### Key Documents
Remediation work is tracked in **GitHub Issues** on `laywill/communistopoly`, not in local files:

- Milestone: **Code Review Remediation**
  (<https://github.com/laywill/communistopoly/milestone/1>)
- Track labels: `track:store` (slices and helpers), `track:components` (components and hooks),
  `track:infra` (CI, tooling, docs). Items also carry `remediation` and a `priority:*` label
- The `epic` label marks tracking issues that hold the task list for a whole track

Checked-in documentation that is authoritative:

- `README.md` - project overview, stack and status
- `Designs/zustand_refactoring.md` - store architecture rationale (slice work now complete)
- `Designs/communistopoly-technical-spec.md` - architecture and implementation guide
- `Designs/communistopoly-design.md` - visual design specifications
- `docs/` - player-facing rules, how-to-play guide and property reference

> **Note:** `*plan.md` and `*report.md` are **local scratch files that Git ignores** (see
> `.gitignore`). They may exist in a working copy but are never committed, and must not be treated
> as the source of truth. GitHub Issues are the source of truth.

### Quality Gates
- **Zero lint errors**: `npm run lint`
- **All tests pass**: `npm test -- --run`
- **Coverage thresholds**: 85% for lines, functions, branches and statements, enforced by
  `vitest.config.ts` and checked with `npm run test:coverage -- --run`. Actual coverage on `main`
  sits comfortably above that — the most recent CI run reported 97.68% statements and
  92.22% branches.

### Coding Standards
- Full `StateCreator` typing for all Zustand slices
- Strict TypeScript (no `any`, no `@ts-ignore`)
- Copyright header on all source files
- Follow existing code patterns
- Commit code regularly to bank progress

## Commands
```bash
npm run lint          # ESLint check
npm test -- --run     # Run all tests
npm run test:coverage -- --run  # Coverage report
npm run build         # Production build
```

Do not chain commands after a `cd` command as it forces the user to have to approve each command.
Instead run the `cd` as a separate command.

## File Structure
```
src/
├── components/       # UI components (board, game, modals, player, property, screens, stalin)
├── data/             # Static game data (board spaces, cards, pieces)
├── hooks/            # Shared React hooks
├── store/
│   ├── gameStore.ts  # Composition root - assembles the slices, no business logic
│   ├── constants.ts  # Store-level constants
│   ├── slices/       # 20 domain slices (player, property, gulag, tribunal, ...)
│   ├── helpers/      # Pure helper functions
│   └── types/        # Store-related types
├── types/
│   └── game.ts       # Game type definitions
├── utils/            # Generic utilities
└── tests/
    ├── components/   # Component tests
    ├── data/         # Game data tests
    ├── helpers/      # Store helper tests
    ├── hooks/        # Hook tests
    ├── integration/  # Cross-slice integration tests
    ├── utils/        # Utility tests
    └── store/        # Store slice tests
        ├── core/     # Initialization, movement, turn flow
        ├── economy/  # Debt, property, trading
        ├── social/   # Gulag, tribunal, voting
        └── content/  # Cards, abilities
```

## Locale

Use British english where possible.
