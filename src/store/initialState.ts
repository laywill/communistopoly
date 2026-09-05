// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import type { GameState } from '../types/game'
import type { GamePhaseSliceState } from './slices/gamePhaseSlice'
import { initialPlayerState } from './slices/playerSlice'
import { initialPropertyState } from './slices/propertySlice'
import { initialTreasuryState } from './slices/treasurySlice'
import { initialDiceState } from './slices/diceSlice'
import { initialUiState } from './slices/uiSlice'
import { initialLogState } from './slices/logSlice'
import { initialVoucherState } from './slices/voucherSlice'
import { initialConfessionState } from './slices/confessionSlice'
import { initialTradeState } from './slices/tradeSlice'
import { initialTribunalState } from './slices/tribunalSlice'
import { initialSpecialDecreesState } from './slices/specialDecreesSlice'
import { initialCardState } from './slices/cardSlice'
import { initialGameEndState } from './slices/gameEndSlice'
import { initialStatisticsState } from './slices/statisticsSlice'

// Initial state for the game-phase slice. Defined here rather than in
// gamePhaseSlice.ts (which re-exports it for backward compatibility) so that
// this module can build `combinedInitialState` below without importing a
// value back from gamePhaseSlice.ts — gamePhaseSlice.ts imports
// `combinedInitialState` from this file, so the reverse import would create a
// module cycle. Only the `GamePhaseSliceState` *type* is imported from
// gamePhaseSlice.ts, which is erased at compile time and carries no runtime
// dependency.
export const initialGamePhaseState: GamePhaseSliceState = {
  gamePhase: 'welcome'
}

// Combined initial state for the whole store, composed from every slice's own
// initial state. Defined once here (rather than separately in gameStore.ts
// and gamePhaseSlice.ts) so that adding a new slice only requires one update,
// and the `GameState` annotation makes omitting a slice a compile-time error.
//
// This module is a leaf: gameStore.ts and gamePhaseSlice.ts both import from
// it, but it imports no runtime values from either of them, keeping the
// dependency direction one-way.
export const combinedInitialState: GameState = {
  ...initialGamePhaseState,
  ...initialPlayerState,
  ...initialPropertyState,
  ...initialTreasuryState,
  ...initialDiceState,
  ...initialUiState,
  ...initialLogState,
  ...initialVoucherState,
  ...initialConfessionState,
  ...initialTradeState,
  ...initialTribunalState,
  ...initialSpecialDecreesState,
  ...initialCardState,
  ...initialGameEndState,
  ...initialStatisticsState
}
