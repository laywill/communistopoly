# Communistopoly - Claude Code Instructions

## Project Overview
A satirical Monopoly variant implemented in React + TypeScript with Zustand for state management.

## Current Focus: Store Refactoring
We are decomposing the monolithic `gameStore.ts` (~2960 lines) into organized slices.

### Key Documents
- `task_plan.md` - Phase checklist and progress tracking
- `notes.md` - Dependency analysis and slice boundaries
- `Designs\zustand_refactoring.md` - Technical brief and patterns
- `.claude/agents/slice-extraction.md` - Slice extraction instructions

### Quality Gates
- **Zero lint errors**: `npm run lint`
- **All tests pass**: `npm test -- --run` (913 tests)
- **Coverage >85%**: `npm run test:coverage -- --run` (currently 94.52%)

### Coding Standards
- Full `StateCreator` typing for all Zustand slices
- Strict TypeScript (no `any`, no `@ts-ignore`)
- Copyright header on all source files
- Follow existing code patterns
- Commit code regularly to bank progress

## Slice Extraction Workflow

When extracting a slice:
1. Read `.claude/agents/slice-extraction.md` for the full process
2. Use the `StateCreator` pattern with full typing
3. Run lint and tests after every change
4. Update `task_plan.md` checkboxes when complete

## Commands
```bash
npm run lint          # ESLint check
npm test -- --run     # Run all tests
npm run test:coverage -- --run  # Coverage report
npm run build         # Production build
```

## File Structure
```
src/
├── store/
│   ├── gameStore.ts     # Main store (being decomposed)
│   ├── slices/          # Extracted slices go here
│   ├── helpers/         # Pure helper functions
│   └── types/           # Store-related types
├── types/
│   └── game.ts          # Game type definitions
└── tests/
    └── store/           # Well-organized test files
        ├── core/        # Initialization, movement, turn flow
        ├── economy/     # Debt, property, trading
        ├── social/      # Gulag, tribunal, voting
        └── content/     # Cards, abilities
```

## Locale

Use British english where possible.

## Self Improvement

If you make a mistake or the User has to correct you on something: update your CLAUDE.md so you don't make that mistake again.
