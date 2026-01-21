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
- [ ] Phase 2: Design and create confirmation modal system
  - [x] Determine if existing modal can handle nested modals - NO, needs implementation
  - [x] Design confirmation modal component
  - [x] Plan state management approach
  - [ ] Create ConfirmationModal component
  - [ ] Update types for new pending actions
- [ ] Phase 3: Implementation - Replace system dialogs
  - [ ] Replace gameStore Hammer ability confirmation (line 1839)
  - [ ] Replace gameStore Ministry of Truth confirmation (line 1933)
  - [ ] Replace InformOnPlayerModal confirmation (nested)
  - [ ] Replace VoucherRequestModal confirmation (nested)
  - [ ] Update PendingActionHandler for new modal types
- [ ] Phase 4: Testing and verification
  - [ ] Update tests that mock window.confirm
  - [ ] Run full test suite
  - [ ] Manual testing of all 4 flows
  - [ ] Verify no regressions
  - [ ] Commit work regularly

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
**Currently in Phase 2** - Creating ConfirmationModal component and updating types
