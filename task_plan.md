# Task Plan: Fix Integration Tests and Implement Error Handling

## Goal
Fix all integration test issues (eslint errors and failing tests) and implement comprehensive error handling throughout the application with proper logging and user feedback.

## Phases

### Phase 1: Fix ESLint Errors in Integration Tests
- [x] 1.1: Fix non-null assertions in integrationHelpers.ts (5 errors)
- [x] 1.2: Fix non-null assertions in gulagFlow.test.ts (31 errors)
- [x] 1.3: Fix unused variables in gulagFlow.test.ts (1 error)
- [ ] 1.4: Fix unsafe type operations in gulagFlow.test.ts (13 errors)
- [ ] 1.5: Fix non-null assertions in propertyFlow.test.ts (19 errors)
- [ ] 1.6: Fix unused variables in propertyFlow.test.ts (3 errors)
- [ ] 1.7: Fix non-null assertions in tribunalFlow.test.ts (14 errors)
- [ ] 1.8: Fix unused variables in tribunalFlow.test.ts (4 errors)
- [ ] 1.9: Fix unsafe type operations in tribunalFlow.test.ts (6 errors)
- [ ] 1.10: Fix non-null assertions in turnCycle.test.ts (8 errors)
- [ ] 1.11: Fix unused variables in turnCycle.test.ts (2 errors)

**Total: 106 eslint errors to fix**

### Phase 2: Fix Failing Integration Tests
- [ ] 2.1: Fix Gulag flow API mismatches (6/12 failing)
  - [ ] Fix voucher system return types
  - [ ] Fix bribe system API
  - [ ] Verify elimination logic
- [ ] 2.2: Fix Tribunal flow API mismatches (5/14 failing)
  - [ ] Fix getWitnessRequirement to return number instead of object
  - [ ] Implement statistics tracking for tribunals
- [ ] 2.3: Fix Property flow API mismatches (3/10 failing)
  - [ ] Fix quota collection integration
  - [ ] Verify collectivization effects
  - [ ] Test railway fee calculations

**Total: 23 failing tests to fix**

### Phase 3: Implement Error Handling in Game Store
- [ ] 3.1: Design error handling strategy
  - [ ] Define error types and categories
  - [ ] Create error utility functions
  - [ ] Design error logging interface
- [ ] 3.2: Add error handling to critical game store methods
  - [ ] Player management methods
  - [ ] Property transaction methods
  - [ ] Gulag system methods
  - [ ] Tribunal system methods
  - [ ] Turn management methods
- [ ] 3.3: Implement error logging
  - [ ] Add console logging for development
  - [ ] Prepare hooks for error reporting service
  - [ ] Add error state to game store
- [ ] 3.4: Add user feedback for failed operations
  - [ ] Toast notifications for errors
  - [ ] Error recovery suggestions
  - [ ] Graceful degradation

### Phase 4: Enhance ErrorBoundary Component
- [ ] 4.1: Add error reporting service integration
  - [ ] Define error reporting interface
  - [ ] Add configuration for error reporting
  - [ ] Implement error batching/throttling
- [ ] 4.2: Capture async errors
  - [ ] Add global promise rejection handler
  - [ ] Integrate with React error boundaries
  - [ ] Handle async component errors
- [ ] 4.3: Improve error UI
  - [ ] Better error messages
  - [ ] Recovery actions
  - [ ] Debug information (dev mode only)
- [ ] 4.4: Add error boundary tests
  - [ ] Test error catching
  - [ ] Test error reporting
  - [ ] Test recovery mechanisms

### Phase 5: Documentation and Testing
- [ ] 5.1: Document error handling patterns
  - [ ] Error handling guide for developers
  - [ ] Error recovery workflows
  - [ ] Testing error scenarios
- [ ] 5.2: Add error handling tests
  - [ ] Unit tests for error utilities
  - [ ] Integration tests for error flows
  - [ ] Error boundary tests
- [ ] 5.3: Update technical documentation
  - [ ] Error handling architecture
  - [ ] Error reporting configuration
  - [ ] Monitoring and debugging guide

## Key Questions

1. What error reporting service should we integrate with? (Sentry, LogRocket, custom?)
2. Should we implement retry logic for failed operations?
3. How should we handle errors in background operations?
4. What level of error detail should be shown to users vs developers?
5. Should we implement an error queue for offline scenarios?

## Decisions Made

- **ESLint fixes**: Will use proper type guards instead of non-null assertions
- **Test fixes**: Will address API mismatches by updating test expectations to match actual implementation
- **Error strategy**: Will implement tiered error handling (silent recovery, user notification, critical failures)

## Errors Encountered

_Will be logged as we progress through phases_

## Reference Files

### Integration Tests
- `src/tests/integration/turnCycle.test.ts` - 11 errors (all passing)
- `src/tests/integration/gulagFlow.test.ts` - 45 errors (6/12 passing)
- `src/tests/integration/tribunalFlow.test.ts` - 24 errors (9/14 passing)
- `src/tests/integration/propertyFlow.test.ts` - 22 errors (7/10 passing)
- `src/tests/helpers/integrationHelpers.ts` - 5 errors

### Core Application Files
- `src/store/gameStore.ts` - Main game state management
- `src/components/ErrorBoundary.tsx` - React error boundary
- `src/types/game.ts` - Type definitions
- `eslint-results.log` - Complete error list

## Status

**Currently in Phase 1.1** - Ready to start fixing eslint errors in integrationHelpers.ts

## Notes

### ESLint Error Categories

1. **Non-null assertions (70 errors)**: Using `!` operator - need type guards
2. **Unused variables (10 errors)**: Variables declared but not used - remove or use
3. **Unsafe operations (26 errors)**: Type safety issues with error types and any types
4. **Unnecessary conditionals (5 errors)**: Always truthy/falsy conditions

### Test Failure Categories

1. **API Mismatches**: Methods return different types than expected
2. **Missing Features**: Statistics tracking not implemented
3. **Integration Issues**: Systems not properly integrated

### Error Handling Concerns

1. **Silent failures**: Functions return early without feedback
2. **No logging**: Failed operations not recorded
3. **No user feedback**: Users unaware when actions fail
4. **Missing error reporting**: No integration with monitoring services
5. **Async errors not caught**: Promise rejections not handled
