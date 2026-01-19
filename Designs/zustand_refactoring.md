# Zustand Refactoring Technical Brief

## Problem Statement
Monolithic Zustand store (2000+ lines) needs organization. Goal: Break into manageable pieces without breaking functionality.

## Two Separate Refactors (Do NOT Mix)

### Refactor 1: SLICES (Organization)
**What:** Split one big store into multiple files by domain (players, UI, gulag, etc.)
**Why:** Easier to navigate, test, and maintain
**When:** Always beneficial, do this first

### Refactor 2: SERVICES (Business Logic Extraction)
**What:** Move complex logic OUT of Zustand into plain TypeScript classes/functions
**Why:** Separate state management from business rules
**When:** Only if store has complex logic (>20 line functions, API calls, complex workflows)

**CRITICAL:** Do slices first, stabilize, THEN consider services. Never both at once.

## Architecture Patterns

### Current (Monolith)
```typescript
// One 2000-line file
const useStore = create((set, get) => ({
  players: [], board: null, modalOpen: false, // ... 50 more properties
  addPlayer: () => {}, rollDice: () => {}, sendToGulag: () => { /* 100 lines */ }
}));
```

### Target (Slices)
```typescript
// Organized into domain files
const useStore = create((set, get) => ({
  ...createPlayerSlice(set, get),  // players, addPlayer, removePlayer
  ...createUISlice(set, get),      // modalOpen, selectedProperty
  ...createGulagSlice(set, get),   // gulagPrisoners, sendToGulag
}));
```

### Optional (Services - Only If Needed)
```typescript
// Slice: Simple state updates only
createGulagSlice = (set) => ({
  prisoners: [],
  addPrisoner: (id) => set(s => ({ prisoners: [...s.prisoners, id] }))
});

// Service: Complex business logic
class GulagService {
  sendToGulag(playerId) {
    // 100 lines of validation, calculations, rules
    useStore.getState().addPrisoner(playerId); // Calls simple store action
  }
}
```

## Data Flow Rules

### Slices Only (Phase 1)
```
Component → Store Action → State Update → Component Re-renders
```

### With Services (Phase 2, Optional)
```
Component → Service → Store Action → State Update → Component Re-renders
```

**NEVER:** Store → Service → Store (circular)

## Identifying Slice Boundaries

### Good Slice Candidates (Group Together)
- State properties that change together
- Actions that operate on related state
- Conceptually coherent domain (e.g., all player-related logic)

### Example Domain Analysis
```
Player Domain:
  State: players[], currentPlayerIndex
  Actions: addPlayer(), removePlayer(), nextPlayer()

UI Domain:
  State: modalOpen, selectedProperty, isLoading
  Actions: openModal(), closeModal(), selectProperty()

Gulag Domain:
  State: gulagPrisoners[], sentenceLengths{}
  Actions: sendToGulag(), releaseFromGulag()
```

### Anti-Pattern: Too Granular
```
❌ createPlayerListSlice()    // Just players array
❌ createCurrentPlayerSlice()  // Just currentPlayerIndex
✅ createPlayerSlice()         // Both together
```

### Anti-Pattern: Too Broad
```
❌ createGameSlice()  // Everything game-related (still 1000 lines)
✅ Separate into: player, board, turn, gulag slices
```

## What Goes Where

### Slice (Zustand State)
```typescript
✅ State properties: players: Player[]
✅ Simple setters: setPlayers: (p) => set({ players: p })
✅ Simple getters: getCurrentPlayer: () => get().players[get().currentPlayer]
❌ API calls: async fetchPlayers() => await fetch(...)
❌ Complex logic (>20 lines): startNewGame() { /* validation, setup, etc */ }
❌ Multi-step workflows: processFullTurn() { /* step 1, 2, 3... */ }
```

### Service (Plain TypeScript - Only If Needed)
```typescript
✅ API calls: async fetchPlayers(): Promise<Player[]>
✅ Complex calculations: calculateSentenceLength(player, crime): number
✅ Multi-step workflows: async startNewGame(names: string[])
✅ Business rule validation: validatePlayerAction(player, action): boolean
❌ Simple state updates: setPlayers() // Use store action
❌ Accessing state without logic: getPlayers() // Use store selector
```

## Anti-Patterns to Avoid

### 1. Circular Dependencies
```typescript
❌ BAD:
// playerSlice.ts
import { gulagService } from '../services/gulagService';
export const createPlayerSlice = (set) => ({
  removePlayer: () => gulagService.cleanup() // Slice → Service
});

// gulagService.ts
import { useStore } from '../stores';
class GulagService {
  cleanup() { useStore.getState().removePlayer() } // Service → Store → Slice
}

✅ GOOD: Services call store, store never calls services
```

### 2. Services Calling Services Directly
```typescript
❌ BAD:
class GameService {
  startGame() { playerService.addPlayers(); } // Direct service call
}

✅ GOOD - Option A: Services share via store state
class GameService {
  startGame() {
    useStore.getState().addPlayers(); // Both use store
  }
}

✅ GOOD - Option B: Dependency injection
class GameService {
  constructor(private playerService: PlayerService) {}
  startGame() { this.playerService.addPlayers(); }
}
```

### 3. Implicit Cross-Slice Dependencies
```typescript
❌ BAD:
export const createGameSlice = (set, get) => ({
  startTurn: () => {
    const user = get().user; // Assumes userSlice exists, not typed!
  }
});

✅ GOOD: Explicit type dependency
export const createGameSlice: StateCreator
  GameSlice & UserSlice // ✅ TypeScript ensures userSlice exists
> = (set, get) => ({
  startTurn: () => {
    const user = get().user; // ✅ Type-safe
  }
});
```

### 4. God Actions
```typescript
❌ BAD: One action touches many domains
endTurn: () => {
  set({ currentPlayer: get().currentPlayer + 1 });    // Player domain
  set({ diceRoll: null });                            // Dice domain
  set({ modalOpen: false });                          // UI domain
  set({ lastAction: 'endTurn' });                     // History domain
  // ... 50 more lines
}

✅ GOOD: Orchestrate from service or break into smaller actions
```

### 5. Business Logic in State Updates
```typescript
❌ BAD:
sendToGulag: (playerId) => {
  const player = get().players.find(p => p.id === playerId);
  if (player.rank === 'Proletariat') { /* complex rules */ }
  else if (player.rank === 'Commissar') { /* different rules */ }
  // ... 100 lines
  set(s => ({ prisoners: [...s.prisoners, playerId] }));
}

✅ GOOD - Phase 1 (Slices): Keep in slice but organized
✅ BETTER - Phase 2 (Services): Extract to gulagService.sendToGulag()
```

## Refactoring Strategy

### Phase 1: Extract Slices (Do This First)
1. **Analyze** domains (no code changes)
2. **Map** dependencies between domains
3. **Start** with domain with fewest dependencies
4. **Create** isolated slice file (not connected yet)
5. **Test** slice in isolation
6. **Connect** slice to main store
7. **Verify** all tests pass
8. **Repeat** for next domain

**One slice per PR. Deploy between slices.**

### Phase 2: Extract Services (Only If Needed)
Only proceed if slices have:
- Functions >20 lines
- API calls
- Complex business rules
- Multiple steps/workflows

**Criteria to skip services:** Store actions are mostly simple `set()` calls.

## Testing Strategy

### Before Refactoring
```typescript
// Write baseline tests for CURRENT behavior
test('sendToGulag removes player from active list', () => {
  const { result } = renderHook(() => useStore());
  act(() => result.current.addPlayer(player));
  act(() => result.current.sendToGulag(player.id));
  expect(result.current.players).not.toContain(player);
});
```

### After Each Slice
- All existing tests must still pass
- Same public API maintained
- No new tests required yet (behavior unchanged)

### After Extracting Services
```typescript
// Service can be tested in isolation
test('GulagService validates rank before sending', () => {
  const mockStore = { addPrisoner: jest.fn() };
  const service = new GulagService(mockStore);
  
  expect(() => service.sendToGulag(proletariatPlayer)).not.toThrow();
  expect(mockStore.addPrisoner).toHaveBeenCalled();
});
```

## Common Store Patterns to Recognize

### Pattern: Computed Values (Keep in Slice)
```typescript
✅ Good in slice:
getCurrentPlayer: () => {
  const state = get();
  return state.players[state.currentPlayerIndex];
}
```

### Pattern: Side Effects (Extract to Service)
```typescript
❌ In slice:
addPlayer: async (player) => {
  await fetch('/api/players', { method: 'POST', body: JSON.stringify(player) });
  set(s => ({ players: [...s.players, player] }));
}

✅ In service:
async addPlayer(player: Player) {
  await fetch('/api/players', { method: 'POST', body: JSON.stringify(player) });
  useStore.getState().addPlayerToState(player);
}
```

### Pattern: Cross-Domain Coordination (Service or Event Bus)
```typescript
// When action affects 3+ domains, consider service
endGame: () => {
  get().resetPlayers();    // Player domain
  get().clearBoard();      // Board domain
  get().closeAllModals();  // UI domain
  get().saveStats();       // Stats domain
}

// Better as service:
gameService.endGame() // Orchestrates all domains
```

## Decision Framework

### Should I Create a New Slice?
```
Does this group have:
- 3+ related state properties? YES → New slice
- 5+ related actions? YES → New slice
- Clear conceptual boundary? YES → New slice
- Would be <50 lines? NO → Combine with related slice
```

### Should I Extract a Service?
```
Does this action:
- Make API calls? YES → Service
- Have >20 lines of logic? MAYBE → Service
- Coordinate multiple slices? MAYBE → Service
- Just set state? NO → Keep in slice
```

### Order of Extraction (Easiest First)
1. **UI state** - no dependencies, simple
2. **Independent domains** - e.g., settings, preferences
3. **Core domains** - e.g., players, board
4. **Dependent domains** - e.g., gulag (needs player data)
5. **God slices** - the big ones that touch everything

## Success Criteria

### After Slices Refactor
- ✅ Store file <100 lines (just combines slices)
- ✅ Each slice file <300 lines
- ✅ All tests pass unchanged
- ✅ No new runtime errors
- ✅ Easier to find specific functionality

### After Services Refactor (If Done)
- ✅ Slice actions mostly <10 lines
- ✅ No API calls in store
- ✅ Business logic testable independently
- ✅ Store is pure state management

## Red Flags

Stop and reconsider if:
- ❌ PR is >200 lines changed
- ❌ Creating >6 slices from one store
- ❌ Tests start failing (rollback and smaller steps)
- ❌ Need to modify >3 files to add one feature
- ❌ Slices constantly access each other's state

## Final Recommendations

1. **Start with slices only** - defer services decision
2. **One domain per PR** - small, testable changes
3. **Test current behavior first** - establish baseline
4. **Extract simplest domain first** - build confidence
5. **Deploy between extractions** - catch issues early
6. **Consider services later** - only if complexity warrants it

**Most important:** Slices are about organization. Services are about separating concerns. Don't conflate them.