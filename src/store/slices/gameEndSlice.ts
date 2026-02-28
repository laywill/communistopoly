// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { StateCreator } from 'zustand'
import type { GameStore } from '../types/storeTypes'
import type { GameEndCondition } from '../../types/game'

// Slice state interface
export interface GameEndSliceState {
  gameEndCondition: GameEndCondition | null
  winnerId: string | null
  showEndScreen: boolean
  endVoteInProgress: boolean
  endVoteInitiator: string | null
  endVotes: Record<string, boolean>
}

// Slice actions interface
export interface GameEndSliceActions {
  checkGameEnd: () => GameEndCondition | null
  endGame: (condition: GameEndCondition, winnerId: string | null) => void
  initiateEndVote: (initiatorId: string) => void
  castEndVote: (playerId: string, vote: boolean) => void
}

// Combined slice type
export type GameEndSlice = GameEndSliceState & GameEndSliceActions

// Initial state for this slice
export const initialGameEndState: GameEndSliceState = {
  gameEndCondition: null,
  winnerId: null,
  showEndScreen: false,
  endVoteInProgress: false,
  endVoteInitiator: null,
  endVotes: {}
}

// Slice creator with full typing
export const createGameEndSlice: StateCreator<
  GameStore,
  [],
  [],
  GameEndSlice
> = (set, get) => ({
  ...initialGameEndState,

  checkGameEnd: () => {
    const state = get()
    const activePlayers = state.players.filter(p => !p.isEliminated && !p.isStalin)

    // Survivor victory: one player remains
    if (activePlayers.length === 1) {
      get().endGame('survivor', activePlayers[0].id)
      return 'survivor'
    }

    // Stalin victory: all players eliminated
    if (activePlayers.length === 0) {
      get().endGame('stalinWins', null)
      return 'stalinWins'
    }

    return null
  },

  endGame: (condition, winnerId) => {
    // Calculate final statistics before setting ended state
    get().calculateFinalStats()

    set({
      gamePhase: 'ended',
      gameEndCondition: condition,
      winnerId,
      showEndScreen: true
    })

    get().addLogEntry({
      type: 'system',
      message: `Game Over: ${condition === 'survivor' ? 'Survivor Victory!' : condition === 'stalinWins' ? 'Stalin Wins!' : condition === 'unanimous' ? 'Unanimous Vote to End' : 'Game Ended'}`
    })
  },

  initiateEndVote: (initiatorId) => {
    set({
      endVoteInProgress: true,
      endVoteInitiator: initiatorId,
      endVotes: {}
    })

    const initiator = get().players.find(p => p.id === initiatorId)
    const initiatorName = initiator?.name ?? 'Unknown'
    get().addLogEntry({
      type: 'system',
      message: `Comrade ${initiatorName} has initiated a vote to end the game. All players must vote unanimously to end.`
    })
  },

  castEndVote: (playerId, vote) => {
    const state = get()

    // Record this player's vote using the functional set form to avoid stale state
    set((currentState) => ({
      endVotes: { ...currentState.endVotes, [playerId]: vote }
    }))

    // Log the vote (players list does not change here, so reading from captured state is acceptable)
    const player = state.players.find(p => p.id === playerId)
    const playerName = player?.name ?? 'Unknown'
    get().addLogEntry({
      type: 'system',
      message: `${playerName} voted ${vote ? 'YES' : 'NO'} to end the game`
    })

    // Determine which active players need to vote
    const activePlayerIds = state.players
      .filter(p => !p.isStalin && !p.isEliminated)
      .map(p => p.id)

    // Read fresh endVotes after the set() call to include the vote just recorded
    const freshEndVotes = get().endVotes
    const allVoted = activePlayerIds.every(id => id in freshEndVotes)

    if (allVoted) {
      const unanimous = activePlayerIds.every(id => freshEndVotes[id])

      if (unanimous) {
        get().endGame('unanimous', null)
      } else {
        set({ endVoteInProgress: false, endVoteInitiator: null, endVotes: {} })
        get().addLogEntry({
          type: 'system',
          message: 'End vote failed - not unanimous'
        })
      }
    }
  }
})
