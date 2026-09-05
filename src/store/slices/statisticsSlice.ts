// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { StateCreator } from 'zustand'
import type { GameStore } from '../types/storeTypes'
import type { GameStatistics, PlayerStatistics } from '../../types/game'

// Slice state interface
export interface StatisticsSliceState {
  gameStatistics: GameStatistics
}

/**
 * Keys of {@link GameStatistics} that represent simple, incrementable global
 * counters. Derived from `GameStatistics` (rather than hand-written) so a new
 * numeric counter is picked up automatically, but `stateTreasuryPeak` is
 * excluded deliberately — it is tracked via peak comparison, not increment.
 */
export type GlobalCounterKey = Exclude<
  { [K in keyof GameStatistics]-?: GameStatistics[K] extends number ? K : never }[keyof GameStatistics],
  'stateTreasuryPeak'
>

// Slice actions interface
export interface StatisticsSliceActions {
  updatePlayerStat: (playerId: string, statKey: keyof PlayerStatistics, increment: number) => void
  updateGlobalStat: (statKey: GlobalCounterKey, increment: number) => void
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
    set((state) => {
      // Stalin (and any player from a game whose statistics were never
      // initialised) has no playerStats entry — skip the update rather
      // than throwing on the undefined lookup.
      if (!(playerId in state.gameStatistics.playerStats)) return {}

      const existing = state.gameStatistics.playerStats[playerId]
      return {
        gameStatistics: {
          ...state.gameStatistics,
          playerStats: {
            ...state.gameStatistics.playerStats,
            [playerId]: {
              ...existing,
              [statKey]: existing[statKey] + increment
            }
          }
        }
      }
    })
  },

  updateGlobalStat: (statKey, increment) => {
    set((state) => ({
      gameStatistics: {
        ...state.gameStatistics,
        [statKey]: state.gameStatistics[statKey] + increment
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
