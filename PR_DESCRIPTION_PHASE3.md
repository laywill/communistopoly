# Phase 3: Extract Property and Movement Slices

## Summary

Continues the Zustand store refactoring by extracting `propertySlice` and `movementSlice` from the monolithic `gameStore.ts`. This phase focuses on property management and player movement systems, two core game mechanics with complex cross-slice dependencies.

This is Phase 3 of the ongoing refactoring effort to decompose the ~2960-line gameStore.ts into well-organized, maintainable slices. See #64 for the overall plan.

## Changes

### New Files

- **`src/store/slices/propertySlice.ts`** (193 lines)
  - State: `properties: Property[]`
  - Actions: `initializeProperties`, `setPropertyCustodian`, `updateCollectivizationLevel`, `purchaseProperty`, `mortgageProperty`, `unmortgageProperty`, `transferProperty`
  - Handles all property ownership, transactions, and collectivization
  - Includes Tank piece ability integration (blocks purchases when player owns 3+ properties)

- **`src/store/slices/movementSlice.ts`** (350 lines)
  - No dedicated state (operates on player state)
  - Actions: `movePlayer`, `resolveCurrentSpace`, `finishMoving`, `endTurn`, `handleStoyPassing`, `handleStoyPilfer`
  - Handles player movement, lap counting, space resolution, and STOY (Start space) mechanics
  - Integrates with multiple slices for complete game flow

### Modified Files

- **`src/store/gameStore.ts`**: Integrated both slices, removed ~450 lines of code (now 2090 lines, down from 2540 in Phase 2)
- **`src/store/types/storeTypes.ts`**: Added `PropertySlice` and `MovementSlice` type definitions

## Quality Metrics

### Tests
- ✅ **983/983 tests passing** (70 more tests than Phase 2 baseline)
- ✅ All existing test files work without modification
- ✅ Duration: ~18 seconds

### Linting
- ✅ **Zero ESLint errors**
- ✅ Zero warnings

### Coverage
- ✅ **96.44% overall coverage** (exceeds 85% requirement)
  - propertySlice: 100% statements, 82.35% branches
  - movementSlice: 85.12% statements, 78.37% branches
- Branch coverage in movementSlice is lower due to many legitimate conditional paths for different space types (properties, cards, tax, corners, etc.)

### TypeScript
- ✅ Full `StateCreator` typing with no `any` types
- ✅ Strict mode compliant
- ✅ Proper interface segregation (State, Actions, Slice)

## Technical Details

### Pattern Compliance

Both slices follow the established pattern from Phases 1-2:

```typescript
export const createPropertySlice: StateCreator<
  GameStore,      // Full store access via get()
  [],
  [],
  PropertySlice   // This slice's interface
> = (set, get) => ({
  // State and actions
});
```

### Cross-Slice Dependencies

**propertySlice** depends on:
- `playerSlice` - Updates player rubles and properties array
- `treasurySlice` - Adds purchase prices to state treasury
- `logSlice` - Logs property transactions
- `uiSlice` - Sets pending actions when Tank ability blocks purchase

**movementSlice** depends on (most complex slice yet):
- `playerSlice` - Updates player position and state
- `logSlice` - Logs movement events
- `treasurySlice` - Handles STOY travel tax
- `diceSlice` - Increments round number
- `uiSlice` - Sets pending actions and turn phases
- `gameStore` - Calls `sendToGulag()` (not yet extracted)

All cross-slice calls use the proper `get()` pattern for type-safe access.

## Progress Update

**Slices Extracted** (8 of 20):
- ✅ Phase 1: uiSlice, logSlice, statisticsSlice
- ✅ Phase 2: diceSlice, treasurySlice, playerSlice
- ✅ **Phase 3: propertySlice, movementSlice** ← This PR

**gameStore.ts Size Reduction**:
- Original: 2960 lines
- After Phase 3: 2090 lines
- **Total reduction: 870 lines (29.4%)**

**Next Phase**: Gulag and Related Systems (gulagSlice, voucherSlice, confessionSlice)

## Breaking Changes

None. All existing tests pass without modification. The public API remains unchanged.

## Checklist

- [x] All tests passing (983/983)
- [x] Zero lint errors
- [x] Coverage above 85% (96.44%)
- [x] Full TypeScript typing
- [x] Copyright headers on new files
- [x] Follows established slice pattern
- [x] No test file modifications required
- [x] Cross-slice dependencies use `get()` pattern
- [x] Code committed to feature branch

## Related Issues

Part of #64 - Refactor gameStore.ts into Zustand slices and services

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)
