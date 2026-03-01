// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { GameState } from '../types/game'
import { calculateTotalWealth } from './helpers/wealthCalculation'
import { initializePlayerStats } from './helpers/playerStats'
import { createUiSlice, initialUiState } from './slices/uiSlice'
import { createLogSlice, initialLogState } from './slices/logSlice'
import { createStatisticsSlice, initialStatisticsState } from './slices/statisticsSlice'
import { createDiceSlice, initialDiceState } from './slices/diceSlice'
import { createTreasurySlice, initialTreasuryState } from './slices/treasurySlice'
import { createPlayerSlice, initialPlayerState } from './slices/playerSlice'
import { createPropertySlice, initialPropertyState } from './slices/propertySlice'
import { createMovementSlice } from './slices/movementSlice'
import { createGulagSlice } from './slices/gulagSlice'
import { createVoucherSlice, initialVoucherState } from './slices/voucherSlice'
import { createConfessionSlice, initialConfessionState } from './slices/confessionSlice'
import { createTradeSlice, initialTradeState } from './slices/tradeSlice'
import { createDebtAndEliminationSlice } from './slices/debtAndEliminationSlice'
import { createTribunalSlice, initialTribunalState } from './slices/tribunalSlice'
import { createSpecialDecreesSlice, initialSpecialDecreesState } from './slices/specialDecreesSlice'
import { createCardSlice, initialCardState } from './slices/cardSlice'
import { createPieceAbilitiesSlice } from './slices/pieceAbilitiesSlice'
import { createPropertyAbilitiesSlice } from './slices/propertyAbilitiesSlice'
import { createGameEndSlice, initialGameEndState } from './slices/gameEndSlice'
import { createGamePhaseSlice, initialGamePhaseState } from './slices/gamePhaseSlice'
import type { GameStore, GameActions } from './types/storeTypes'

// Re-export helper functions for testing
export { calculateTotalWealth, initializePlayerStats }

// Re-export GameActions for backward compatibility
export type { GameActions }

const initialState: GameState = {
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

export const useGameStore = create<GameStore>()(
  persist(
    (set, get, api) => ({
      ...initialState,
      ...createUiSlice(set, get, api),
      ...createLogSlice(set, get, api),
      ...createStatisticsSlice(set, get, api),
      ...createDiceSlice(set, get, api),
      ...createTreasurySlice(set, get, api),
      ...createPlayerSlice(set, get, api),
      ...createPropertySlice(set, get, api),
      ...createMovementSlice(set, get, api),
      ...createGulagSlice(set, get, api),
      ...createVoucherSlice(set, get, api),
      ...createConfessionSlice(set, get, api),
      ...createTradeSlice(set, get, api),
      ...createDebtAndEliminationSlice(set, get, api),
      ...createTribunalSlice(set, get, api),
      ...createSpecialDecreesSlice(set, get, api),
      ...createCardSlice(set, get, api),
      ...createPieceAbilitiesSlice(set, get, api),
      ...createPropertyAbilitiesSlice(set, get, api),
      ...createGameEndSlice(set, get, api),
      ...createGamePhaseSlice(set, get, api)
    }),
    {
      name: 'communistopoly-save',
      partialize: (state) => ({
        gamePhase: state.gamePhase,
        players: state.players,
        stalinPlayerId: state.stalinPlayerId,
        currentPlayerIndex: state.currentPlayerIndex,
        properties: state.properties,
        stateTreasury: state.stateTreasury,
        turnPhase: state.turnPhase,
        doublesCount: state.doublesCount,
        hasRolled: state.hasRolled,
        roundNumber: state.roundNumber,
        dice: state.dice,
        gameLog: state.gameLog,
        activeVouchers: state.activeVouchers,
        pendingBribes: state.pendingBribes,
        partyDirectiveDeck: state.partyDirectiveDeck,
        partyDirectiveDiscard: state.partyDirectiveDiscard,
        communistTestUsedQuestions: state.communistTestUsedQuestions,
        gameEndCondition: state.gameEndCondition,
        winnerId: state.winnerId,
        showEndScreen: state.showEndScreen,
        gameStatistics: state.gameStatistics,
        endVoteInProgress: state.endVoteInProgress,
        endVoteInitiator: state.endVoteInitiator,
        endVotes: state.endVotes,
        confessions: state.confessions,
        denouncementsThisRound: state.denouncementsThisRound,
        activeTribunal: state.activeTribunal,
        greatPurgeUsed: state.greatPurgeUsed,
        activeGreatPurge: state.activeGreatPurge,
        activeFiveYearPlan: state.activeFiveYearPlan,
        heroesOfSovietUnion: state.heroesOfSovietUnion
      })
    }
  )
)
