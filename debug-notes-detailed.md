# Detailed Test Failure Analysis

## Test-by-Test Breakdown

### Test #1 & #2: Great Purge Flow Tests (NEEDS INVESTIGATION)
**File**: `gameStore.greatPurge.test.ts` (lines 188, 323)
**Player Setup**: Player1=sickle, Player2=redStar, Player3=tank, Player4=hammer

**Test #1 - Tie Vote Scenario**:
- voteInGreatPurge(players[0].id, players[2].id) → P3 (tank) gets vote
- voteInGreatPurge(players[1].id, players[2].id) → P3 (tank) gets vote
- voteInGreatPurge(players[2].id, players[3].id) → P4 (hammer) gets vote
- voteInGreatPurge(players[3].id, players[3].id) → P4 (hammer) gets vote
- **Expected**: Both P3 (tank) and P4 (hammer) sent to Gulag
- **Actual**: Neither sent successfully

**Hypothesis**:
- Tank has first-time immunity → gets redirected to railway
- Need to check if stalinDecree bypasses hammer protection (it should)

**User Note**: Tests may have never worked correctly - they test store logic without modal interaction

---

### Test #3: Stalin Immunity (🔴 CRITICAL BUG FOUND)
**File**: `gameStore.fiveYearPlan.test.ts` (line 363)
**Player Setup**: Player1=sickle (500₽), Player2=redStar (300₽), Stalin (50₽)

**Expected Flow**:
1. Stalin is poorest but filtered out (!p.isStalin)
2. Player2 (redStar, 300₽) becomes next poorest
3. Player2 sent to Gulag

**Actual**: Player2.inGulag === false after sendToGulag call

**ROOT CAUSE IDENTIFIED**:
RedStar piece has special execution rule at `gameStore.ts:871-878`:
```typescript
if (player.piece === 'redStar' && newRank === 'proletariat') {
  get().eliminatePlayer(playerId, 'redStarDemotion')
}
```

**The Bug Flow**:
1. Player2 is redStar, starts at partyMember rank (line 327)
2. sendToGulag() is called
3. sendToGulag() calls demotePlayer() (line 838)
4. partyMember → demoted to proletariat
5. RedStar at proletariat → **IMMEDIATE EXECUTION**
6. Player eliminated instead of sent to Gulag!
7. Test checks inGulag → false ❌

**Fix Required**:
Modify demotePlayer to NOT execute redStar if they're being sent to Gulag:
```typescript
if (player.piece === 'redStar' && newRank === 'proletariat') {
  // Only execute if NOT currently being sent to Gulag
  if (!player.inGulag) {
    get().eliminatePlayer(playerId, 'redStarDemotion')
  }
}
```

OR set inGulag flag BEFORE calling demotePlayer.

---

### Test #4: Gulag Swap (TEST IMPLEMENTATION ISSUE)
**File**: `gameStore.gulag.test.ts` (line 1199)

**User Confirmed**:
- Logic is correct in actual game
- Real game flow: inform modal → system message → click OK → swap occurs
- Test tries to call functions directly and expect immediate swap

**Action**: Test needs rewrite to match actual game flow OR verify it properly simulates the full denouncement → tribunal → verdict → swap flow

---

### Test #5: Eliminated Player Immunity (🔴 TANK IMMUNITY)
**File**: `gameStore.fiveYearPlan.test.ts` (line 381)
**Player Setup**: All 4 players, Player4=hammer (100₽ poorest)

**Flow**:
1. eliminatePlayer(players[3]) → hammer eliminated
2. resolveFiveYearPlan() called
3. Next poorest should be players[2]=tank (200₽)
4. **Expected**: Tank sent to Gulag
5. **Actual**: Tank NOT in Gulag

**Issue**: Tank first-time immunity (gameStore.ts:795-827)
- Tank gets redirected to nearest railway station
- hasUsedTankGulagImmunity flag set to true
- Player NOT placed in Gulag
- Loop checking `if (updatedPlayer.inGulag)` fails
- No one successfully sent

---

### Test #6: Player Already in Gulag (🔴 SAME TANK ISSUE)
**File**: `gameStore.fiveYearPlan.test.ts` (line 400)

**Flow**:
1. sendToGulag(players[3], 'stalinDecree') → hammer sent to Gulag
2. resolveFiveYearPlan() called
3. Poorest (hammer) already in Gulag, filtered out
4. Next poorest is players[2]=tank (200₽)
5. **Expected**: Tank sent to Gulag
6. **Actual**: Tank NOT in Gulag

**Same Issue**: Tank immunity triggers, redirects to railway instead of Gulag

---

## Root Causes Summary

### 🔴 Issue #1: RedStar Execution on Demotion (Test #3)
**Location**: `gameStore.ts:871-878` in demotePlayer()

RedStar players starting as partyMember get **executed** instead of sent to Gulag because:
- sendToGulag calls demotePlayer
- partyMember → proletariat demotion
- RedStar at proletariat → immediate execution
- Player eliminated, never reaches Gulag

**Fix**: Check if player is being sent to Gulag before executing:
```typescript
if (player.piece === 'redStar' && newRank === 'proletariat' && !player.inGulag) {
  get().eliminatePlayer(playerId, 'redStarDemotion')
}
```

### 🔴 Issue #2: Tank Immunity Not Counted as Success (Tests #5, #6)
**Location**: `gameStore.ts:795-827` in sendToGulag()

Tank's first-time immunity redirects player to railway instead of Gulag:
- Player NOT placed in Gulag
- Loop in resolveFiveYearPlan checks `if (updatedPlayer.inGulag)`
- Check fails, loop continues
- No more eligible players, no one sent

**Fix Options**:
1. **Count redirect as success** - tank WAS punished (demoted + relocated)
2. **Check immunity consumption** - if immunity was used, count as handled
3. **Call sendToGulag again** - second call should work (immunity consumed)
4. **Change test pieces** - use non-immune pieces in tests

**Recommended Fix**: Check immunity consumption as alternate success:
```typescript
const wasInGulag = player.inGulag
const hadImmunity = player.piece === 'tank' && !player.hasUsedTankGulagImmunity

get().sendToGulag(player.id, 'stalinDecree')

const updated = get().players.find(p => p.id === player.id)
// Success if: sent to Gulag OR tank immunity was consumed
if ((updated.inGulag && !wasInGulag) ||
    (hadImmunity && updated.hasUsedTankGulagImmunity)) {
  sentToGulag = true
  break
}
```

### 🟡 Issue #3: Great Purge Batch Sending (Tests #1, #2)
**Location**: `gameStore.ts:2666-2697` in resolveGreatPurge()

Multiple players sent in single resolution:
- Calls sendToGulag for each target
- Doesn't check if they actually end up in Gulag
- Tank + hammer combination may cause issues

**Fix**: Apply same loop logic as Five Year Plan (verify each player was successfully handled)

---

## Detailed Code Locations

### sendToGulag() - Line 777-851
Handles all Gulag sentences with piece ability checks:
- Hammer immunity: blocks 'denouncementGuilty', 'threeDoubles' (line 784)
- Tank immunity: first-time redirect to railway (line 795)
- Calls demotePlayer (line 838) - **triggers redStar execution**

### demotePlayer() - Line 853-880
Handles rank demotion:
- RedStar execution check at line 871-878
- **BUG**: Executes before Gulag assignment can complete

### resolveFiveYearPlan() - Line 2747-2801
Current implementation (modified):
- Filters eligible players (line 2769)
- Loops through trying sendToGulag (line 2774)
- Checks if player.inGulag (line 2781) - **doesn't account for tank immunity**

### resolveGreatPurge() - Line 2666-2697
Current implementation:
- Counts votes, finds max (line 2671-2680)
- Sends all tied players to Gulag (line 2683-2688)
- **Doesn't verify they actually arrived in Gulag**

---

## Next Session Implementation Plan

### Step 1: Fix RedStar Execution Bug (CRITICAL)
**File**: `src/store/gameStore.ts` line 871

**Current Code**:
```typescript
if (player.piece === 'redStar' && newRank === 'proletariat') {
  get().addLogEntry({
    type: 'system',
    message: `${player.name}'s Red Star has fallen to Proletariat - IMMEDIATE EXECUTION!`,
    playerId
  })
  get().eliminatePlayer(playerId, 'redStarDemotion')
}
```

**Fixed Code**:
```typescript
if (player.piece === 'redStar' && newRank === 'proletariat') {
  // Only execute if not being sent to Gulag
  // Check inGulag flag OR add a parameter to demotePlayer to indicate source
  if (!player.inGulag) {
    get().addLogEntry({
      type: 'system',
      message: `${player.name}'s Red Star has fallen to Proletariat - IMMEDIATE EXECUTION!`,
      playerId
    })
    get().eliminatePlayer(playerId, 'redStarDemotion')
  } else {
    // RedStar demoted while in Gulag - they stay in Gulag at lower rank
    get().addLogEntry({
      type: 'system',
      message: `${player.name}'s Red Star has fallen to Proletariat while in the Gulag.`,
      playerId
    })
  }
}
```

### Step 2: Fix Tank Immunity Handling
**File**: `src/store/gameStore.ts` line 2773-2788

**Modified resolveFiveYearPlan loop**:
```typescript
let sentToGulag = false
for (const player of eligiblePlayers) {
  const wasInGulag = player.inGulag
  const hadTankImmunity = player.piece === 'tank' && !player.hasUsedTankGulagImmunity

  get().sendToGulag(player.id, 'stalinDecree')

  const currentState = get()
  const updatedPlayer = currentState.players.find(p => p.id === player.id)

  // Success conditions:
  // 1. Player now in Gulag (normal case)
  // 2. Tank immunity was consumed (player was punished via redirect)
  // 3. Player was eliminated (e.g., redStar execution)
  if (updatedPlayer) {
    const nowInGulag = updatedPlayer.inGulag && !wasInGulag
    const immunityConsumed = hadTankImmunity && updatedPlayer.hasUsedTankGulagImmunity
    const wasEliminated = updatedPlayer.isEliminated

    if (nowInGulag || immunityConsumed || wasEliminated) {
      get().addLogEntry({
        type: 'system',
        message: `Five-Year Plan FAILED! ${player.name} (poorest player) has been punished.`
      })
      sentToGulag = true
      break
    }
  }
}
```

### Step 3: Apply Same Fix to resolveGreatPurge
**File**: `src/store/gameStore.ts` line 2682-2688

Wrap the sendToGulag calls in verification logic similar to Five Year Plan.

### Step 4: Run Tests
```bash
npm test -- src/tests/store/social/gameStore.fiveYearPlan.test.ts
npm test -- src/tests/store/social/gameStore.greatPurge.test.ts
```

### Step 5: Update Rules Document
**File**: `docs/communistopoly-rules.md`

Add clarifications:
- Five Year Plan failure when poorest already in Gulag
- Piece ability interactions with Stalin Decrees
- Great Purge tie-breaking behavior
- RedStar demotion while in Gulag behavior

---

## Test Execution Order

1. Fix redStar execution bug → Run Test #3
2. Fix tank immunity handling → Run Tests #5, #6
3. Apply to Great Purge → Run Tests #1, #2
4. Review Test #4 separately (may need test rewrite)

## Key Files

- `src/store/gameStore.ts` - Main state management
- `src/tests/store/social/gameStore.fiveYearPlan.test.ts` - Five Year Plan tests
- `src/tests/store/social/gameStore.greatPurge.test.ts` - Great Purge tests
- `src/tests/store/social/gameStore.gulag.test.ts` - Gulag system tests
- `docs/communistopoly-rules.md` - Game rules documentation
