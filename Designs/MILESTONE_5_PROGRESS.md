# Milestone 5: Gulag System - Progress Report

## Overview
**Status:** 75% Complete
**Date:** 2025-12-20

## ✅ Completed Work

### 1. Type System (`src/types/game.ts`)
- `GulagReason` type (9 entry conditions)
- `VoucherAgreement` interface
- `Debt` interface
- `BribeRequest` interface
- `GulagEscapeMethod` type
- Updated `Player` with voucher/debt fields
- Updated `GameState` with `activeVouchers`, `pendingBribes`, `roundNumber`
- Added pending action types: `gulag-escape-choice`, `voucher-request`, `inform-on-player`, `bribe-stalin`, `liquidation-required`

### 2. Game Store (`src/store/gameStore.ts`)

#### Helper Functions
- `getGulagReasonText()` - Human-readable reason text
- `getRequiredDoublesForEscape()` - Doubles needed by turn count
- `shouldTriggerVoucherConsequence()` - Voucher consequence logic

#### Gulag Management
- `sendToGulag(playerId, reason, justification?)` - Consolidated entry with GulagReason
- `handleGulagTurn(playerId)` - Increment counter, check elimination, show escape modal
- `checkFor10TurnElimination(playerId)` - Eliminate after 10 turns
- `attemptGulagEscape(playerId, method)` - Handle all 5 escape methods
- `demotePlayer(playerId)` - Rank demotion on Gulag entry

#### Voucher System
- `createVoucher(prisonerId, voucherId)` - Create 3-round voucher
- `checkVoucherConsequences(playerId, reason)` - Send voucher to Gulag if vouchee offends
- `expireVouchers()` - Clear expired vouchers

#### Bribe System
- `submitBribe(playerId, amount, reason)` - Submit to pending bribes
- `respondToBribe(bribeId, accepted)` - Stalin accepts/rejects (money always taken)

#### Debt System
- `createDebt(debtorId, creditorId, amount, reason)` - Create debt with 1-round deadline
- `checkDebtStatus()` - Send to Gulag if unpaid after 1 round

#### Elimination
- `eliminatePlayer(playerId, reason)` - Ghost of Revolution state, return properties to State
- `incrementRound()` - Round tracking with voucher/debt checks

#### State Updates
- Updated `initializePlayers()` with new player fields
- Updated `finishRolling()` to use `threeDoubles` reason
- Updated `finishMoving()` to use `enemyOfState` reason
- Updated `handleStoyPilfer()` to use `pilferingCaught` reason
- Updated persist config with new state fields

### 3. Modal Components

#### GulagEscapeModal (`src/components/modals/GulagEscapeModal.tsx`)
- Displays prisoner name, turn count, required doubles
- **Option 1:** Roll for Escape (dice animation, doubles check)
- **Option 2:** Pay ₽500 (disabled if insufficient funds)
- **Option 3:** Request Voucher (opens VoucherRequestModal)
- **Option 4:** Inform on Comrade (placeholder for tribunal)
- **Option 5:** Bribe Stalin (opens BribeStalinModal)
- Helper: `getRequiredDoublesText(turnsInGulag)`

#### VoucherRequestModal (`src/components/modals/VoucherRequestModal.tsx`)
- Lists eligible players (excludes Stalin, Gulag inmates, eliminated)
- Shows player stats (rank, rubles)
- Warning about voucher consequences
- Confirmation dialog for voucher acceptance
- Success/decline result screens
- Helper: `getRankDisplayName(rank)`

#### BribeStalinModal (`src/components/modals/BribeStalinModal.tsx`)
- Range slider (min ₽200, max = player rubles)
- Step: ₽50
- Shows current rubles and bribe amount
- Warning about rejection consequences
- Stalin-themed styling (steel blue + gold)
- Success confirmation screen
- Helper: `getReasonText(reason)`

#### Modal.module.css (`src/components/modals/Modal.module.css`)
- Shared modal overlay/animation
- `.primaryButton` - Soviet red gradient
- `.disabledButton` - Greyed out
- `.dangerButton` - Blood burgundy (for denounce/inform)
- `.stalinButton` - Steel blue + gold

#### PendingActionHandler (`src/components/modals/PendingActionHandler.tsx`)
- Added `gulag-escape-choice` case
- Added `voucher-request` case
- Added `bribe-stalin` case

### 4. Key Features Implemented

#### Gulag Entry Conditions (9 total)
1. ✅ Enemy of State (space 30)
2. ✅ Three Doubles (counter-revolutionary)
3. ✅ Denouncement Guilty (pending tribunal implementation)
4. ✅ Debt Default (1 round unpaid)
5. ✅ Pilfering Caught (STOY roll 1-3)
6. ✅ Stalin Decree (with justification)
7. ✅ Railway Capture (pending railway special power)
8. ✅ Camp Labour (pending Siberian camp special power)
9. ✅ Voucher Consequence (vouchee offence triggers)

#### Escape Methods (5 total)
1. ✅ Roll for Escape - Doubles requirement decreases each turn
   - Turn 1: Double 6s only
   - Turn 2: Double 5s or 6s
   - Turn 3: Double 4s, 5s, or 6s
   - Turn 4: Double 3s, 4s, 5s, or 6s
   - Turn 5+: Any doubles
2. ✅ Pay ₽500 - Immediate release + rank demotion
3. ✅ Request Voucher - 3-round protection window
4. ⏳ Inform on Another - Triggers tribunal (Milestone 6 dependency)
5. ✅ Bribe Stalin - Min ₽200, Stalin accepts/rejects

#### Voucher System
- ✅ 3-round active period
- ✅ Tracks prisonerId, voucherId, expiration
- ✅ Auto-expires after round limit
- ✅ Triggers consequence on Gulag-worthy offences
- ✅ Deactivates after consequence triggered

#### Debt System
- ✅ Created when player can't pay
- ✅ 1-round deadline (createdAtRound + 1)
- ✅ Sends to Gulag on default
- ✅ Cleared on Gulag entry

#### Elimination
- ✅ 10 consecutive Gulag turns = death
- ✅ "Ghost of the Revolution" status
- ✅ Properties returned to State
- ✅ Can still observe game
- ✅ Game ends when ≤1 non-Stalin player remains

## 🔧 Technical Details

### Turn Counter
- Increments on `handleGulagTurn()`
- Resets to 0 on escape/release
- Checked for elimination at 10

### Rank Demotion
- Triggered on Gulag entry
- Additional demotion on ₽500 payment
- Order: proletariat ← partyMember ← commissar ← innerCircle

### Round Tracking
- `roundNumber` in GameState (starts at 1)
- Incremented by `incrementRound()`
- Used for voucher expiration and debt deadlines
- Persisted in localStorage

### State Persistence
All new fields added to Zustand persist:
- `roundNumber`
- `activeVouchers`
- `pendingBribes`
- Player fields: `vouchingFor`, `vouchedByRound`, `debt`, `debtCreatedAtRound`

## 📊 Build Status
✅ TypeScript compilation successful
✅ Vite build successful (259.15 kB)
✅ No runtime errors
