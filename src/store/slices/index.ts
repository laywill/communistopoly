// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

// Re-export all slices
export { createCardSlice, initialCardState } from './cardSlice'
export type { CardSlice, CardSliceState, CardSliceActions } from './cardSlice'

export { createGulagSlice, initialGulagState } from './gulagSlice'
export type { GulagSlice, GulagSliceState, GulagSliceActions } from './gulagSlice'

export { createPropertySlice, initialPropertyState } from './propertySlice'
export type { PropertySlice, PropertySliceState, PropertySliceActions } from './propertySlice'

export { createTribunalSlice, initialTribunalState } from './tribunalSlice'
export type { TribunalSlice, TribunalSliceState, TribunalSliceActions, Tribunal, TribunalVerdict } from './tribunalSlice'

export { createPlayerSlice, initialPlayerState } from './playerSlice'
export type { PlayerSlice, PlayerSliceState, PlayerSliceActions } from './playerSlice'

export { createGameFlowSlice, initialGameFlowState } from './gameFlowSlice'
export type { GameFlowSlice, GameFlowSliceState, GameFlowSliceActions } from './gameFlowSlice'

export { createTurnPhaseSlice, initialTurnPhaseState } from './turnPhaseSlice'
export type { TurnPhaseSlice, TurnPhaseSliceState, TurnPhaseSliceActions } from './turnPhaseSlice'

export { createStalinSlice, initialStalinState } from './stalinSlice'
export type { StalinSlice, StalinSliceState, StalinSliceActions } from './stalinSlice'

export { createTradeSlice, initialTradeState } from './tradeSlice'
export type { TradeSlice, TradeSliceState, TradeSliceActions } from './tradeSlice'

// Combined slice type (all slices together)
import type { CardSlice } from './cardSlice'
import type { GulagSlice } from './gulagSlice'
import type { PropertySlice } from './propertySlice'
import type { TribunalSlice } from './tribunalSlice'
import type { PlayerSlice } from './playerSlice'
import type { GameFlowSlice } from './gameFlowSlice'
import type { TurnPhaseSlice } from './turnPhaseSlice'
import type { StalinSlice } from './stalinSlice'
import type { TradeSlice } from './tradeSlice'
export type AllSlices = CardSlice & GulagSlice & PropertySlice & TribunalSlice & PlayerSlice & GameFlowSlice & TurnPhaseSlice & StalinSlice & TradeSlice
