# Notes: System Dialog Replacement Research

## Occurrences Found

### window.confirm (4 occurrences in game flow)

1. **src/store/gameStore.ts:1839** - Hammer ability (send to Gulag for "labour needs")
   - Context: Stalin approval required when player uses Hammer piece ability
   - Message: "STALIN'S APPROVAL REQUIRED\n\n{custodian.name} wants to send {target.name} to the Gulag for 'labour needs'.\n\nDo you approve?"

2. **src/store/gameStore.ts:1933** - Ministry of Truth ability (rewrite rule)
   - Context: Stalin veto power when player wants to rewrite a rule
   - Message: "STALIN'S VETO POWER\n\n{custodian.name} wants to rewrite a rule:\n\n'{newRule}'\n\nDo you approve this rule change?"

3. **src/components/modals/InformOnPlayerModal.tsx:64** - Inform on player (Gulag action)
   - Context: Stalin's judgement when prisoner informs on another player
   - Message: "STALIN'S JUDGEMENT\n\n{informer.name} accuses {target.name} of:\n'{accusation}'\n\nDoes Stalin find {target.name} GUILTY?"
   - **Already in modal** - this is a nested dialog within a modal

4. **src/components/modals/VoucherRequestModal.tsx:40** - Voucher request acceptance
   - Context: Another player deciding whether to vouch for prisoner's release
   - Message: "{voucherPlayer.name}, do you accept to vouch for {prisoner.name}'s release from the Gulag?\n\nWARNING: If {prisoner.name} commits ANY offence in the next 3 rounds, YOU will also go to the Gulag!"
   - **Already in modal** - this is a nested dialog within a modal

### window.alert
No occurrences found in game flow.

### window.prompt
No occurrences found in game flow.

## Existing Modal System

### Current Implementation
- Base modal styles in `src/components/modals/Modal.module.css`
- No reusable Modal component - each modal builds its own structure
- Standard pattern:
  ```jsx
  <div className={styles.modalOverlay}>
    <div className={styles.modal}>
      <div className={styles.header}>
        <h2>TITLE</h2>
      </div>
      <div className={styles.content}>
        {/* content */}
      </div>
    </div>
  </div>
  ```
- Button classes: `.primaryButton`, `.disabledButton`, `.dangerButton`, `.stalinButton`

### Nested Modal Support
- **Current state**: System does NOT support nested modals properly
- z-index of modalOverlay is fixed at 1000
- No mechanism to stack multiple modals
- **Need to implement**:
  - z-index management for stacked modals
  - Ability to have modal on top of modal
  - Proper overlay darkening for each layer

## Design Guidelines

### Visual Style (from communistopoly-design.md)

**Modal Structure:**
- Background overlay: `rgba(0, 0, 0, 0.75)`
- Modal border: `4px solid Soviet Red (#C41E3A)`, `2px gold inner (#D4A84B)`
- Header: Soviet Red background, white text
- Drop shadow: `0 10px 40px rgba(0, 0, 0, 0.5)`

**Confirmation Modal Style:**
Should follow Stalin's judgement style from Tribunal Modal design:
- Header with appropriate color (red for Stalin approval/judgement)
- Clear question/prompt
- Two clear action buttons (Approve/Deny, Accept/Decline, Guilty/Innocent)
- Use existing button styles

## Implementation Strategy

### Component Architecture

**Option 1: Create ConfirmationModal component**
- Reusable confirmation dialog
- Props: title, message, onConfirm, onCancel, confirmText, cancelText, variant (stalin/danger/primary)
- Handles its own state
- Can be nested within existing modals

**Option 2: Create generic nested modal system**
- Modal stack management in store
- z-index calculation based on stack depth
- More complex but more flexible

**Decision: Go with Option 1 first** - simpler, meets immediate needs

### State Management

**For gameStore.ts confirmations:**
- Create new pending action types: 'hammerApproval', 'ministryTruthApproval'
- Add confirmation data to pending action state
- Show ConfirmationModal based on pending action type

**For nested modal confirmations:**
- Add local state to parent modal to show/hide confirmation
- Overlay darkening handled by stacking modalOverlay divs
- z-index incremented for nested modals

### Files to Create/Modify

**Create:**
1. `src/components/modals/ConfirmationModal.tsx` - Reusable confirmation dialog
2. `src/components/modals/ConfirmationModal.module.css` (optional - can reuse Modal.module.css)

**Modify:**
1. `src/store/gameStore.ts` - Replace window.confirm calls with pending actions
2. `src/components/modals/InformOnPlayerModal.tsx` - Replace window.confirm with ConfirmationModal
3. `src/components/modals/VoucherRequestModal.tsx` - Replace window.confirm with ConfirmationModal
4. `src/components/modals/PendingActionHandler.tsx` - Add new confirmation modal types
5. `src/types/game.ts` - Add new pending action types

### Testing Strategy

1. Check existing tests that mock window.confirm (found in gameStore.propertyGroupAbilities.test.ts)
2. Update tests to work with new modal system
3. Add tests for ConfirmationModal component
4. Manual testing of each flow
