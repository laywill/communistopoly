// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { StateCreator } from 'zustand'
import type { GameStore } from '../types/storeTypes'
import type { Player, PartyRank } from '../../types/game'
import { BREAD_LOAF_WEALTH_CAP } from '../constants'

// Slice state interface
export interface PlayerSliceState {
  players: Player[]
  stalinPlayerId: string | null
  currentPlayerIndex: number
}

// Slice actions interface
export interface PlayerSliceActions {
  updatePlayer: (playerId: string, updates: Partial<Player>) => void
  promotePlayer: (playerId: string) => void
  demotePlayer: (playerId: string) => void
  setCurrentPlayer: (index: number) => void
}

// Combined slice type
export type PlayerSlice = PlayerSliceState & PlayerSliceActions

// Initial state for this slice
export const initialPlayerState: PlayerSliceState = {
  players: [],
  stalinPlayerId: null,
  currentPlayerIndex: 0
}

// Slice creator with full typing
export const createPlayerSlice: StateCreator<
  GameStore,
  [],
  [],
  PlayerSlice
> = (set, get) => ({
  ...initialPlayerState,

  setCurrentPlayer: (index) => {
    set({ currentPlayerIndex: index })
  },

  updatePlayer: (playerId, updates) => {
    set((state) => {
      const player = state.players.find(p => p.id === playerId)

      // BREAD LOAF ABILITY: Enforce wealth cap
      if (player?.piece === 'breadLoaf' && updates.rubles !== undefined) {
        if (updates.rubles > BREAD_LOAF_WEALTH_CAP) {
          const excess = updates.rubles - BREAD_LOAF_WEALTH_CAP
          updates.rubles = BREAD_LOAF_WEALTH_CAP

          // Donate excess to State
          get().adjustTreasury(excess)
          get().addLogEntry({
            type: 'payment',
            message: `${player.name}'s Bread Loaf forces donation of ₽${String(excess)} to the State (max ${String(BREAD_LOAF_WEALTH_CAP)}₽)`,
            playerId
          })
        }
      }

      return {
        players: state.players.map((p) =>
          p.id === playerId ? { ...p, ...updates } : p
        )
      }
    })
  },

  promotePlayer: (playerId) => {
    const state = get()
    const player = state.players.find(p => p.id === playerId)
    if (player == null) return

    const rankOrder: PartyRank[] = ['proletariat', 'partyMember', 'commissar', 'innerCircle']
    const currentRankIndex = rankOrder.indexOf(player.rank)

    if (currentRankIndex < rankOrder.length - 1) {
      const newRank = rankOrder[currentRankIndex + 1]
      get().updatePlayer(playerId, { rank: newRank })
      get().addLogEntry({
        type: 'rank',
        message: `${player.name} promoted to ${newRank}!`,
        playerId
      })
    } else {
      get().addLogEntry({
        type: 'system',
        message: `${player.name} is already at the highest rank (Inner Circle)`,
        playerId
      })
    }
  },

  demotePlayer: (playerId) => {
    const state = get()
    const player = state.players.find((p) => p.id === playerId)
    if (player == null) return

    const rankOrder: PartyRank[] = ['proletariat', 'partyMember', 'commissar', 'innerCircle']
    const currentRankIndex = rankOrder.indexOf(player.rank)

    if (currentRankIndex > 0) {
      const newRank = rankOrder[currentRankIndex - 1]
      get().updatePlayer(playerId, { rank: newRank })
      get().addLogEntry({
        type: 'rank',
        message: `${player.name} demoted to ${newRank}`,
        playerId
      })

      // RED STAR ABILITY: If demoted to Proletariat, immediate execution
      // BUT: If player is in Gulag, they stay in Gulag at lower rank
      if (player.piece === 'redStar' && newRank === 'proletariat') {
        if (!player.inGulag) {
          get().addLogEntry({
            type: 'system',
            message: `${player.name}'s Red Star has fallen to Proletariat - IMMEDIATE EXECUTION!`,
            playerId
          })
          get().eliminatePlayer(playerId, 'redStarDemotion')
        } else {
          get().addLogEntry({
            type: 'system',
            message: `${player.name}'s Red Star has fallen to Proletariat while in the Gulag.`,
            playerId
          })
        }
      }
    }
  }
})
