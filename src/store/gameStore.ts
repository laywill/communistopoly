// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { calculateTotalWealth } from './helpers/wealthCalculation'
import { initializePlayerStats } from './helpers/playerStats'
import { createUiSlice } from './slices/uiSlice'
import { createLogSlice } from './slices/logSlice'
import { createStatisticsSlice } from './slices/statisticsSlice'
import { createDiceSlice } from './slices/diceSlice'
import { createTreasurySlice } from './slices/treasurySlice'
import { createPlayerSlice } from './slices/playerSlice'
import { createPropertySlice } from './slices/propertySlice'
import { createMovementSlice } from './slices/movementSlice'
import { createGulagSlice } from './slices/gulagSlice'
import { createVoucherSlice } from './slices/voucherSlice'
import { createConfessionSlice } from './slices/confessionSlice'
import { createTradeSlice } from './slices/tradeSlice'
import { createDebtAndEliminationSlice } from './slices/debtAndEliminationSlice'
import { createTribunalSlice } from './slices/tribunalSlice'
import { createSpecialDecreesSlice } from './slices/specialDecreesSlice'
import { createCardSlice } from './slices/cardSlice'
import { createPieceAbilitiesSlice } from './slices/pieceAbilitiesSlice'
import { createPropertyAbilitiesSlice } from './slices/propertyAbilitiesSlice'
import { createGameEndSlice } from './slices/gameEndSlice'
import { createGamePhaseSlice } from './slices/gamePhaseSlice'
import { combinedInitialState } from './initialState'
import type { GameStore, GameActions } from './types/storeTypes'

// Re-export helper functions for testing
export { calculateTotalWealth, initializePlayerStats }

// Re-export GameActions for backward compatibility
export type { GameActions }

export const useGameStore = create<GameStore>()(
  persist(
    (set, get, api) => ({
      ...combinedInitialState,
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
      }),
      onRehydrateStorage: () => {
        return (state) => {
          // Recover from stuck intermediate turn phases after page refresh
          state?.recoverStuckTurnPhase()
        }
      }
    }
  )
)
