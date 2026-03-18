# Phase 2: High Priority — Quick Wins (H3, H5, H7)

## Goal
Fix three high-priority quick-win issues: replace Date.now() IDs with crypto.randomUUID(), add input sanitisation/maxLength, and fix cross-slice state mutation in diceSlice.

## Items

- [x] **H3** — Replace `Date.now()` IDs with `crypto.randomUUID()` across 7 slices
  - Files: `confessionSlice.ts`, `debtAndEliminationSlice.ts`, `tradeSlice.ts`, `tribunalSlice.ts`, `voucherSlice.ts`, `uiSlice.ts`, `logSlice.ts`
  - GitHub Issue: #131
  - Also updated existing confession test that hardcoded Date.now() assertion

- [x] **H5** — Add `maxLength` and input sanitisation to user-provided text inputs
  - Files: `SetupScreen.tsx`, `ConfessionModal.tsx`, `StalinPanel.tsx`
  - GitHub Issue: #132
  - Added maxLength=20 to player names, maxLength=200 to justifications, min/max to number inputs
  - Added trim() on submit for names, confessions, and justifications

- [x] **H7** — Fix cross-slice mutation in `diceSlice.incrementRound`
  - Files: `diceSlice.ts`, `tribunalSlice.ts`
  - Added `clearDenouncements()` action to tribunal slice, called via `get()` in diceSlice
  - GitHub Issue: #133

## Quality Gate
- [x] All tests pass (`npm test -- --run`) — 1034/1034
- [x] Lint clean (`npm run lint`) — 0 errors
- [x] Build passes (`npm run build`) — TypeScript + Vite clean
- [ ] No regression in coverage

## Decisions Made
- H3: Also migrated `logSlice.ts` to `crypto.randomUUID()` for consistency (was using `Date.now() + Math.random()`)
- H5: Used maxLength=20 for player names, maxLength=200 for justifications, maxLength=500 for confessions (already existed)
- H5: Added min/max bounds to Five-Year Plan number inputs (target: 1-99999, duration: 1-60)
- H7: Added `clearDenouncements()` as a simple action on tribunalSlice that sets `denouncementsThisRound: []`

## Errors Encountered
- Existing confession test hardcoded `Date.now()` in assertion — updated to match UUID format
- Background agents failed to create GitHub issues (label constraint) — created manually

## Status
**Complete** — All three items fixed, tested, linted, and built. Ready for review and PR.
