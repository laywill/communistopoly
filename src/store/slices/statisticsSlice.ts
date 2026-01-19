// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { StateCreator } from 'zustand'
import type { GameStore } from '../types/storeTypes'
import type { GameStatistics, PlayerStatistics } from '../../types/game'

// Slice state interface
export interface StatisticsSliceState {
  gameStatistics: GameStatistics
}

// Slice actions interface
export interface StatisticsSliceActions {
  updatePlayerStat: (playerId: string, statKey: keyof PlayerStatistics, increment: number) => void
  calculateFinalStats: () => void
}

// Combined slice type
export type StatisticsSlice = StatisticsSliceState & StatisticsSliceActions

// Initial state for this slice
export const initialStatisticsState: StatisticsSliceState = {
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

// Slice creator with full typing
export const createStatisticsSlice: StateCreator<
  GameStore,
  [],
  [],
  StatisticsSlice
> = (set) => ({
  ...initialStatisticsState,

  updatePlayerStat: (playerId, statKey, increment) => {
    set((state) => ({
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
    }))
  },

  calculateFinalStats: () => {
    set((state) => ({
      gameStatistics: {
        ...state.gameStatistics,
        gameEndTime: new Date(),
        totalTurns: state.roundNumber
      }
    }))
  }
})
