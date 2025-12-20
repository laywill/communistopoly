# Milestone 5: Gulag System - Remaining Work

## Priority 1: Critical Functionality

### 1. Turn System Integration
**File:** `src/store/gameStore.ts` - `endTurn()` function

**Current Issue:** Gulag players are skipped in turn rotation but `handleGulagTurn()` is never called.

**Required Changes:**
```typescript
// In endTurn(), before finding next player:
const currentPlayer = players[currentPlayerIndex];
if (currentPlayer.inGulag && !currentPlayer.isEliminated) {
  handleGulagTurn(currentPlayer.id);
  // Don't advance turn - let Gulag modal handle it
  return;
}
```

**Alternative:** Add Gulag check in turn start logic.

### 2. Round Increment Trigger
**File:** `src/store/gameStore.ts`

**Current Issue:** `incrementRound()` exists but is never called.

**Required:** Determine when a "round" completes:
- Option A: After all non-Gulag players have taken 1 turn
- Option B: After Stalin's position in rotation (once per cycle)
- Option C: Manual "End Round" button for Stalin

**Recommended:** Option A - track turns per round, increment when all have gone.

### 3. InformOnPlayerModal
**File:** `src/components/modals/InformOnPlayerModal.tsx` (new)

**Dependencies:** Milestone 6 Tribunal System

**Functionality:**
- Select target player (not in Gulag, not eliminated, not Stalin)
- Enter accusation text
- Trigger mini-tribunal:
  - Accused defends (30 sec)
  - Stalin judges: Guilty/Innocent
  - Guilty: Swap places (informer escapes, accused to Gulag)
  - Innocent: +2 turns to informer's sentence

**Integration:** Add to `PendingActionHandler` for `inform-on-player` action.

### 4. LiquidationModal
**File:** `src/components/modals/LiquidationModal.tsx` (new)

**Triggered When:** Player can't pay debt and has assets.

**Functionality:**
- List all owned properties + improvements
- Show improvement values (50₽ for level, 100₽ for palace)
- Show mortgage values (50% of baseCost)
- Allow selling improvements first, then mortgaging
- Track remaining debt amount
- Close when debt paid or no assets left
- If insufficient: Create debt or send to Gulag

**Integration:**
- Add to `PendingActionHandler` for `liquidation-required`
- Call from `payQuota()`, `purchaseProperty()`, etc. when insufficient funds

## Priority 2: UI/UX Enhancements

### 5. Player Dashboard Gulag Visuals
**File:** `src/components/player/PlayerDashboard.tsx`

**Updates for Gulag Players:**
```tsx
{player.inGulag && (
  <div className={styles.gulagStatus}>
    <div className={styles.chainOverlay}>⛓️</div>
    <div className={styles.gulagBadge}>IN GULAG</div>
    <div className={styles.sentenceInfo}>Day {player.gulagTurns + 1}</div>
    {/* Desaturate entire player card */}
  </div>
)}
```

**Styling:**
- Grey/desaturated filter on entire card
- Chain emoji or bars overlay
- Red "IN GULAG" badge
- Turn counter visible
- Escape options on their turn

### 6. Gulag Visual on Board
**File:** `src/components/board/CornerSpace.tsx` (Gulag space updates)

**Current:** Basic corner space.

**Needed:**
- Barbed wire decorations
- Separate areas for "visiting" vs. inmates
- Stack multiple inmates if present
- Guard tower imagery
- "THE GULAG" header in Cyrillic + English

### 7. Eliminated/Ghost Visual
**File:** `src/components/player/PlayerDashboard.tsx`

**Updates for Eliminated Players:**
```tsx
{player.isEliminated && (
  <div className={styles.ghostStatus}>
    <div className={styles.ghostOverlay}>👻</div>
    <div className={styles.ghostBadge}>GHOST OF THE REVOLUTION</div>
    {/* Faded/ghostly styling */}
  </div>
)}
```

**Styling:**
- Extreme desaturation (near grayscale)
- 50% opacity
- Ghost emoji
- No interactive elements
- "GHOST OF THE REVOLUTION" status

## Priority 3: Stalin Interface

### 8. Stalin's Gulag Panel
**File:** `src/components/stalin/StalinGulagPanel.tsx` (new)

**Location:** Part of Stalin's control panel (Milestone 6)

**Sections:**

#### A. Gulag Population
```tsx
<h3>GULAG INMATES</h3>
{gulagInmates.map(inmate => (
  <InmateCard>
    <span>{inmate.name}</span>
    <span>Day {inmate.gulagTurns + 1}</span>
    <span>Reason: {getGulagReasonText(...)}</span>
    {/* Stats: rank, rubles, properties */}
  </InmateCard>
))}
```

#### B. Pending Bribes
```tsx
<h3>PENDING BRIBES</h3>
{pendingBribes.map(bribe => (
  <BribeCard>
    <span>{player.name} offers ₽{bribe.amount}</span>
    <span>Reason: {bribe.reason}</span>
    <Button onClick={() => respondToBribe(bribe.id, true)}>
      ACCEPT
    </Button>
    <Button onClick={() => respondToBribe(bribe.id, false)}>
      REJECT & CONFISCATE
    </Button>
  </BribeCard>
))}
```

#### C. Send to Gulag
```tsx
<h3>SEND TO GULAG</h3>
<PlayerSelect onChange={setTargetPlayer} />
<TextInput
  placeholder="Justification (required)"
  value={justification}
  onChange={setJustification}
/>
<Button
  onClick={() => sendToGulag(targetPlayer, 'stalinDecree', justification)}
  disabled={!justification}
>
  SEND TO GULAG
</Button>
```

**Styling:** Steel blue background, gold accents, intimidating layout.

## Priority 4: Edge Cases & Polish

### 9. Voucher Edge Cases
- [ ] Prevent voucher from vouching for multiple prisoners
- [ ] Show active voucher warning in player dashboard
- [ ] Clear voucher if voucher themselves go to Gulag
- [ ] Handle voucher going to Gulag due to consequence

### 10. Debt Edge Cases
- [ ] Prevent new debts if player already has debt
- [ ] Allow partial payment of debt
- [ ] Handle debt when player is eliminated
- [ ] Show debt warning in player dashboard

### 11. Elimination Edge Cases
- [ ] Check win condition after each elimination
- [ ] Handle case where all players eliminated (Stalin wins)
- [ ] Prevent eliminated players from being selected for actions
- [ ] Show eliminated players in separate section

### 12. Gulag + Piece Abilities
- [ ] Hammer: Cannot be sent to Gulag by players (only Stalin/spaces) - ✅ Already implemented
- [ ] Tank: Immune to first Gulag (go to nearest railway instead) - Need to implement
- [ ] Red Star: If fall to Proletariat while in Gulag, immediate elimination - Need to check

## Testing Checklist

### Unit Tests Needed
- [ ] `getRequiredDoublesForEscape()` for all turn counts
- [ ] `shouldTriggerVoucherConsequence()` for all reasons
- [ ] Voucher expiration logic
- [ ] Debt creation and checking
- [ ] Elimination conditions

### Integration Tests Needed
- [ ] Full Gulag escape flow (all 5 methods)
- [ ] Voucher consequence trigger
- [ ] Debt → Gulag flow
- [ ] 10-turn elimination
- [ ] Bribe accept/reject flow

### Manual Testing Scenarios
1. Send player to Gulag → Roll for escape → Success/fail
2. Send player to Gulag → Pay ₽500 → Check rank demotion
3. Send player to Gulag → Request voucher → Accept → Commit offense within 3 rounds → Voucher goes to Gulag
4. Player can't pay quota → Create debt → Wait 1 round → Gulag
5. Player in Gulag 10 turns → Elimination → Ghost state
6. Bribe Stalin → Accept → Release
7. Bribe Stalin → Reject → Money confiscated

## Documentation Needed
- [ ] Update README with Gulag system overview
- [ ] Add JSDoc comments to all new functions
- [ ] Document GulagReason usage
- [ ] Document round increment strategy

## Performance Considerations
- [ ] Optimize voucher expiration check (runs every round)
- [ ] Optimize debt status check (runs every round)
- [ ] Consider indexing Gulag inmates for quick access
- [ ] Consider caching required doubles calculation

## Accessibility
- [ ] Keyboard navigation in modals
- [ ] Screen reader labels for Gulag status
- [ ] Color-blind friendly status indicators (not just color)
- [ ] Focus management in modal flows
