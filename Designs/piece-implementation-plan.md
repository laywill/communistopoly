# Piece Abilities Implementation Plan

## Overview
This document tracks the implementation of 5 piece-specific abilities for Communistopoly. Each ability is documented in code (see stubs in `src/store/gameStore.ts`). This plan provides a high-level roadmap for implementation across multiple sessions.

## Current Status
- **Total Tests:** 9 skipped tests across 5 abilities
- **Current:** 152 passing / 21 skipped
- **Target:** 161 passing / 12 skipped (when all piece abilities complete)

---

## Abilities to Implement

### 1. ⚡ **Hammer - Stoy Bonus** (1 test)
**Complexity:** Medium
**Estimated Time:** 30-45 minutes
**Status:** ⏳ **NOT STARTED**

**What:** Hammer receives +50₽ bonus when passing Stoy (offsetting the 200₽ tax)

**Implementation:**
- **Location:** `src/store/gameStore.ts:246` (movePlayer compatibility stub)
- **Service Already Has Logic:** `src/services/StoyService.ts:30-42` ✅
- **Missing:** Integration between movePlayer and StoyService

**Steps:**
1. Detect when player passes position 0 in movePlayer
2. Call `StoyService.handlePassingStoy(playerId)` when passing
3. Update tankRequisitionUsedThisLap reset at same time (lap tracking)

**Test:** `src/tests/store/pieceAbilities.test.ts:34`

**Dependencies:** None

---

### 2. 🌾 **Sickle - Harvest Ability** (1 test)
**Complexity:** Medium
**Estimated Time:** 45-60 minutes
**Status:** ⏳ **NOT STARTED**

**What:** Sickle can steal one property worth < 150₽ (once per game)

**Implementation:**
- **Location:** `src/store/gameStore.ts:353` (sickleHarvest stub)
- **TODO Comments:** Lines 354-369

**Steps:**
1. Validate sickle piece && !hasUsedSickleHarvest
2. Validate property exists, has custodian, baseCost < 150₽
3. Validate no collectivization on property
4. Transfer property via setCustodian
5. Mark used, add log

**Test:** `src/tests/store/pieceAbilities.test.ts:163`

**Dependencies:** PropertySlice (setCustodian), BOARD_SPACES data

---

### 3. 🚜 **Tank - Requisition Ability** (4 tests)
**Complexity:** High
**Estimated Time:** 60-90 minutes
**Status:** ⏳ **NOT STARTED** (partial stub exists)

**What:** Tank can requisition 50₽ from any player (once per lap around board)

**Implementation:**
- **Location:** `src/store/gameStore.ts:421` (tankRequisition stub)
- **TODO Comments:** Lines 422-440

**Steps:**
1. Validate tank piece && !tankRequisitionUsedThisLap
2. Calculate amount: min(50₽, target.rubles) (handle partial)
3. Transfer money
4. Update tankRequisitionUsedThisLap = true
5. **Lap Reset Logic** (critical):
   - In movePlayer, detect position wrap (oldPos + spaces >= 40)
   - Reset tankRequisitionUsedThisLap to false
   - Increment lapsCompleted

**Tests:**
- `pieceAbilities.test.ts:301` - Basic requisition
- `pieceAbilities.test.ts:325` - Partial payment (target has < 50₽)
- `pieceAbilities.test.ts:354` - Once per lap limit
- `pieceAbilities.test.ts:380` - Reset after lap completion

**Dependencies:** Lap tracking in movePlayer (shares with Hammer)

---

### 4. 🎭 **Iron Curtain - Disappear Property** (2 tests)
**Complexity:** Low-Medium
**Estimated Time:** 30-45 minutes
**Status:** ⏳ **NOT STARTED**

**What:** Iron Curtain can return one property to State ownership (once per game)

**Implementation:**
- **Location:** `src/store/gameStore.ts:305` (ironCurtainDisappear stub)
- **TODO Comments:** Lines 306-319

**Steps:**
1. Validate ironCurtain piece && !hasUsedIronCurtainDisappear
2. Validate property exists and has custodian
3. Transfer to State: setCustodian(propertyId, null)
4. Mark used, add log

**Tests:**
- `pieceAbilities.test.ts:569` - Basic disappear
- `pieceAbilities.test.ts:807` - Can target any player's property

**Dependencies:** PropertySlice (setCustodian)

---

### 5. 🗿 **Lenin Statue - Inspiring Speech** (1 test)
**Complexity:** Medium
**Estimated Time:** 30-45 minutes
**Status:** ⏳ **NOT STARTED**

**What:** Lenin gives speech and receives 100₽ from each applauding player (once per game)

**Implementation:**
- **Location:** `src/store/gameStore.ts:323` (leninSpeech stub)
- **TODO Comments:** Lines 324-339

**Steps:**
1. Validate leninStatue piece && !hasUsedLeninSpeech
2. For each applauder in array:
   - Validate applauder has >= 100₽
   - Transfer 100₽ from applauder to Lenin
3. Mark used, add log with total amount

**Test:** `src/tests/store/pieceAbilities.test.ts:715`

**Dependencies:** Player money management, UI for applause selection

---

## Implementation Order Recommendation

### **Session 1: Simple Property/Money Transfers** (90-120 mins)
1. ✅ Iron Curtain Disappear (easy property transfer)
2. ✅ Lenin Speech (simple money transfer)
3. ✅ Sickle Harvest (moderate property transfer)

**Outcome:** 3 tests passing, 158 passing / 18 skipped

---

### **Session 2: Movement Integration** (90-120 mins)
4. ✅ Hammer Stoy Bonus (movement + StoyService integration)
5. ✅ Tank Requisition (movement lap tracking + money transfer)

**Outcome:** 5 tests passing, 161 passing / 16 skipped

---

## Testing Strategy

### Before Each Ability
1. Read the specific test to understand expectations
2. Check existing stubs for partial implementation
3. Verify dependencies are available

### After Each Ability
1. Remove `.skip()` from test(s)
2. Run `npm test -- --run` to verify passing
3. Run `npm run lint` to verify code quality
4. Commit with clear message documenting what was implemented

### Debugging
- If test fails, check:
  - Validation logic (piece type, used flags)
  - State mutations (are slice methods being called?)
  - Data access (BOARD_SPACES, property state)
  - Edge cases (partial payments, missing data)

---

## Code Locations Quick Reference

| Ability | Stub Location | Service | Test Line |
|---------|--------------|---------|-----------|
| Hammer Stoy | gameStore.ts:246 | StoyService:30-42 | test:34 |
| Sickle Harvest | gameStore.ts:353 | - | test:163 |
| Tank Requisition | gameStore.ts:421 | - | test:301,325,354,380 |
| Iron Curtain | gameStore.ts:305 | - | test:569,807 |
| Lenin Speech | gameStore.ts:323 | - | test:715 |

---

## Success Criteria

### Per Ability
- ✅ Test(s) passing
- ✅ ESLint clean
- ✅ Validation logic complete
- ✅ Log entries added
- ✅ "Used" flag set correctly

### Final State
- ✅ All 9 piece ability tests passing
- ✅ 161 passing / 12 skipped (gulag tests remain)
- ✅ No new ESLint errors
- ✅ Each ability committed separately

---

## Notes

### Architecture Compliance
- All implementations should be in compatibility stubs (gameStore.ts)
- Services should handle complex orchestration (StoyService example)
- Slices remain pure (state mutations only)
- Tests validate end-to-end behavior

### Future Work
After piece abilities are complete:
- Consider refactoring abilities into PieceAbilityService
- Add UI modals for player interactions (Lenin applause, etc.)
- Implement remaining gulag escape mechanisms (Option 3)
