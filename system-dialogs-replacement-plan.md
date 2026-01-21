# Task Plan: Replace System Dialogs with Styled Modals

## Goal
Replace all `window.confirm` and other system dialog usage in game flow with proper styled modals that match the game's visual design, while preserving all existing functionality.

## Phases
- [x] Phase 1: Research and discovery
  - [x] Search for all `window.confirm` usage
  - [x] Search for other system dialog methods (`alert`, `prompt`)
  - [x] Review existing modal system
  - [x] Review design guidelines
  - [x] Document all occurrences and their contexts
- [x] Phase 2: Design and create confirmation modal system
  - [x] Determine if existing modal can handle nested modals - NO, needs implementation
  - [x] Design confirmation modal component
  - [x] Plan state management approach
  - [x] Create ConfirmationModal component
  - [x] Update types for new pending actions
- [x] Phase 3: Implementation - Replace system dialogs
  - [x] Replace gameStore Hammer ability confirmation (line 1839)
  - [x] Replace gameStore Ministry of Truth confirmation (line 1933)
  - [x] Replace InformOnPlayerModal confirmation (nested)
  - [x] Replace VoucherRequestModal confirmation (nested)
  - [x] Update PendingActionHandler for new modal types
- [x] Phase 4: Testing and verification
  - [x] Update tests that mock window.confirm
  - [x] Run full test suite - 983 tests passing
  - [x] Verify no regressions - zero lint errors
  - [x] Commit work regularly - 3 commits created

## Key Questions
1. How many `window.confirm` usages exist in game flow? **4 total**
2. Does the existing modal system support nested modals? **NO - needs z-index management**
3. What's the visual style for confirmation modals? **Stalin judgement style with red header**
4. Are there other system dialogs beyond `confirm`? **NO - only window.confirm found**

## Decisions Made
- Will preserve system dialogs for errors and dev features ✓
- Focus only on game flow dialogs ✓
- Create reusable ConfirmationModal component
- Use pending actions for gameStore confirmations (Stalin-facing)
- Use local modal state for nested confirmations (player-facing)
- Implement z-index stacking for nested modals

## Errors Encountered
None yet.

## Status
**COMPLETED** - All system dialogs replaced with styled modals
