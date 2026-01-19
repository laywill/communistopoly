# Slice Extraction Agent

You are a specialized agent for extracting Zustand slices from the monolithic `gameStore.ts`.

## Context

You are working on the Communistopoly project, refactoring a ~2960 line Zustand store into organized slices.

### Project Rules
- **Strict TypeScript**: Full `StateCreator` typing pattern required
- **Zero lint errors**: Must pass `npm run lint` after every change
- **All tests must pass**: Run `npm test -- --run` to verify
- **Coverage >85%**: Run `npm run test:coverage -- --run` to verify

### Key Files
- `src/store/gameStore.ts` - The monolithic store being decomposed
- `src/types/game.ts` - Type definitions
- `src/store/slices/` - Directory for extracted slices
- `task_plan.md` - Progress tracking (update checkboxes when complete)

## Slice Pattern Template

Use this exact pattern for every slice:

```typescript
// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { StateCreator } from 'zustand'
import type { GameStore } from '../gameStore'
// Add other imports as needed

// Slice state interface
export interface XxxSliceState {
  // State properties for this slice
  someProperty: SomeType
}

// Slice actions interface
export interface XxxSliceActions {
  // Action methods for this slice
  someAction: (param: ParamType) => void
}

// Combined slice type
export type XxxSlice = XxxSliceState & XxxSliceActions

// Initial state for this slice
export const initialXxxState: XxxSliceState = {
  someProperty: initialValue
}

// Slice creator with full typing
export const createXxxSlice: StateCreator<
  GameStore,  // Full store type for get() access
  [],         // Middleware tuple (empty)
  [],         // Middleware tuple (empty)
  XxxSlice    // This slice's return type
> = (set, get) => ({
  // Spread initial state
  ...initialXxxState,

  // Action implementations
  someAction: (param) => {
    // Access other slice state via get()
    const otherState = get().otherProperty

    // Access other slice actions via get()
    get().otherAction()

    // Update this slice's state
    set({ someProperty: newValue })
  }
})
```

## Extraction Process

When asked to extract a slice, follow these steps:

### Step 1: Analyze the Domain
1. Read the current `gameStore.ts` to find all state and actions for the domain
2. Identify dependencies on other slices (what `get()` calls are made?)
3. Check `notes.md` for the dependency analysis

### Step 2: Create the Slice File
1. Create `src/store/slices/{sliceName}Slice.ts`
2. Use the template above with full StateCreator typing
3. Copy state properties and actions from gameStore.ts
4. Ensure all imports are correct

### Step 3: Update the Store Types
1. If `src/store/types/storeTypes.ts` doesn't exist, create it
2. Add the slice's state and actions interfaces
3. Update the combined `GameStore` type

### Step 4: Update gameStore.ts
1. Import the new slice creator and initial state
2. Add the slice to the store creation: `...createXxxSlice(set, get)`
3. Remove the extracted code from the monolithic section
4. Keep the persist middleware configuration intact

### Step 5: Verify
Run these commands and ensure all pass:
```bash
npm run lint
npm test -- --run
```

### Step 6: Update Progress
1. Update `task_plan.md` - mark the extraction checkbox as complete
2. Note any issues in the "Errors Encountered" section

## Cross-Slice Dependencies

When a slice needs to call another slice's action:
```typescript
// In the action implementation:
someAction: () => {
  // Access via get() - this is type-safe because GameStore includes all slices
  get().otherSliceAction()
}
```

When a slice needs another slice's state:
```typescript
someAction: () => {
  const value = get().otherSliceProperty
}
```

## Common Gotchas

1. **Don't import slice functions into each other** - use get() for cross-slice access
2. **Keep helper functions separate** - put them in `src/store/helpers/`
3. **Maintain the persist config** - only the main gameStore.ts should have persistence
4. **Export initial state** - needed for the combined initial state
5. **Re-export from gameStore.ts** - tests import from there, not individual slices

## Verification Checklist

After extraction, verify:
- [ ] TypeScript compiles without errors
- [ ] ESLint passes with zero warnings
- [ ] All 913+ tests still pass
- [ ] Coverage remains >85%
- [ ] No circular imports
- [ ] Slice file is <300 lines
- [ ] task_plan.md updated

## Example: Extracting logSlice

Input: "Extract the log slice"

Actions:
1. Find in gameStore.ts:
   - State: `gameLog: LogEntry[]`
   - Action: `addLogEntry`

2. Create `src/store/slices/logSlice.ts`:
```typescript
// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { StateCreator } from 'zustand'
import type { GameStore } from '../gameStore'
import type { LogEntry } from '../../types/game'

export interface LogSliceState {
  gameLog: LogEntry[]
}

export interface LogSliceActions {
  addLogEntry: (entry: Omit<LogEntry, 'id' | 'timestamp'>) => void
}

export type LogSlice = LogSliceState & LogSliceActions

export const initialLogState: LogSliceState = {
  gameLog: []
}

export const createLogSlice: StateCreator<
  GameStore,
  [],
  [],
  LogSlice
> = (set) => ({
  ...initialLogState,

  addLogEntry: (entry) => {
    const newEntry: LogEntry = {
      ...entry,
      id: `log-${String(Date.now())}-${String(Math.random())}`,
      timestamp: new Date()
    }

    set((state) => ({
      gameLog: [...state.gameLog, newEntry].slice(-50)
    }))
  }
})
```

3. Update gameStore.ts to import and use the slice
4. Run verification commands
5. Update task_plan.md
