// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { StateCreator } from 'zustand'
import type { GameStatistics, PlayerStatistics } from '../../types/game'

// State interface
export interface StatisticsSliceState {
  gameStatistics: GameStatistics
}

// Actions interface
export interface StatisticsSliceActions {
  updatePlayerStat: (playerId: string, statKey: keyof PlayerStatistics, increment: number) => void
  calculateFinalStats: () => void
  initializePlayerStats: (playerId: string) => void
  resetStatistics: () => void
  incrementTotalDenouncements: () => void
  incrementTotalTribunals: () => void
  incrementTotalGulagSentences: () => void
  updateStateTreasuryPeak: (currentTreasury: number) => void
}

// Combined slice type
export type StatisticsSlice = StatisticsSliceState & StatisticsSliceActions

// Helper to create initial player statistics
function createPlayerStats(): PlayerStatistics {
  return {
    turnsPlayed: 0,
    denouncementsMade: 0,
    denouncementsReceived: 0,
    tribunalsWon: 0,
    tribunalsLost: 0,
    totalGulagTurns: 0,
    gulagEscapes: 0,
    moneyEarned: 0,
    moneySpent: 0,
    propertiesOwned: 0,
    maxWealth: 0,
    testsPassed: 0,
    testsFailed: 0
  }
}

// Initial state
const initialStatisticsState: StatisticsSliceState = {
  gameStatistics: {
    gameStartTime: new Date(),
    totalTurns: 0,
    playerStats: {},
    totalDenouncements: 0,
    totalTribunals: 0,
    totalGulagSentences: 0,
    stateTreasuryPeak: 0
  }
}

// Slice creator
export const createStatisticsSlice: StateCreator<
  StatisticsSlice,
  [],
  [],
  StatisticsSlice
> = (set, get) => ({
  ...initialStatisticsState,

  updatePlayerStat: (playerId, statKey, increment) => {
    set((state) => {
      // Ensure player stats exist
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (!state.gameStatistics.playerStats[playerId]) {
        return {
          gameStatistics: {
            ...state.gameStatistics,
            playerStats: {
              ...state.gameStatistics.playerStats,
              [playerId]: createPlayerStats()
            }
          }
        }
      }

      // Update the specific stat
      return {
        gameStatistics: {
          ...state.gameStatistics,
          playerStats: {
            ...state.gameStatistics.playerStats,
            [playerId]: {
              ...state.gameStatistics.playerStats[playerId],
              [statKey]: state.gameStatistics.playerStats[playerId][statKey] + increment
            }
          }
        }
      }
    })
  },

  calculateFinalStats: () => {
    set((state) => ({
      gameStatistics: {
        ...state.gameStatistics,
        gameEndTime: new Date(),
        totalTurns: get().gameStatistics.totalTurns
      }
    }))
  },

  initializePlayerStats: (playerId) => {
    set((state) => ({
      gameStatistics: {
        ...state.gameStatistics,
        playerStats: {
          ...state.gameStatistics.playerStats,
          [playerId]: createPlayerStats()
        }
      }
    }))
  },

  resetStatistics: () => {
    set({
      gameStatistics: {
        gameStartTime: new Date(),
        totalTurns: 0,
        playerStats: {},
        totalDenouncements: 0,
        totalTribunals: 0,
        totalGulagSentences: 0,
        stateTreasuryPeak: 0
      }
    })
  },

  incrementTotalDenouncements: () => {
    set((state) => ({
      gameStatistics: {
        ...state.gameStatistics,
        totalDenouncements: state.gameStatistics.totalDenouncements + 1
      }
    }))
  },

  incrementTotalTribunals: () => {
    set((state) => ({
      gameStatistics: {
        ...state.gameStatistics,
        totalTribunals: state.gameStatistics.totalTribunals + 1
      }
    }))
  },

  incrementTotalGulagSentences: () => {
    set((state) => ({
      gameStatistics: {
        ...state.gameStatistics,
        totalGulagSentences: state.gameStatistics.totalGulagSentences + 1
      }
    }))
  },

  updateStateTreasuryPeak: (currentTreasury) => {
    set((state) => ({
      gameStatistics: {
        ...state.gameStatistics,
        stateTreasuryPeak: Math.max(state.gameStatistics.stateTreasuryPeak, currentTreasury)
      }
    }))
  }
})
