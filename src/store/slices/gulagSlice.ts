// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { StateCreator } from 'zustand'
import type { GameStore } from '../types/storeTypes'
import type { GulagReason, GulagEscapeMethod } from '../../types/game'
import { getGulagReasonText, getRequiredDoublesForEscape } from '../helpers/gulagHelpers'

// Gulag slice state interface
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface GulagSliceState {
  // The gulag system uses player state (inGulag, gulagTurns) directly
  // No dedicated gulag state properties needed
}

// Gulag slice actions interface
export interface GulagSliceActions {
  sendToGulag: (playerId: string, reason: GulagReason, justification?: string) => void
  checkRedStarExecutionAfterGulagRelease: (playerId: string) => void
  handleGulagTurn: (playerId: string) => void
  attemptGulagEscape: (playerId: string, method: GulagEscapeMethod, data?: Record<string, unknown>) => void
  checkFor10TurnElimination: (playerId: string) => void
}

// Combined slice type
export type GulagSlice = GulagSliceState & GulagSliceActions

// Initial state for this slice
export const initialGulagState: GulagSliceState = {
  // No state properties for this slice
}

// Slice creator with full typing
export const createGulagSlice: StateCreator<
  GameStore,  // Full store type for get() access
  [],         // Middleware tuple (empty)
  [],         // Middleware tuple (empty)
  GulagSlice  // This slice's return type
> = (set, get) => ({
  // Spread initial state
  ...initialGulagState,

  // Action implementations
  sendToGulag: (playerId, reason, justification) => {
    const state = get()
    const player = state.players.find((p) => p.id === playerId)
    if (player == null) return

    // HAMMER ABILITY: Cannot be sent to Gulag by other players
    // Blocked reasons: denouncementGuilty, threeDoubles
    if (player.piece === 'hammer' && (reason === 'denouncementGuilty' || reason === 'threeDoubles')) {
      get().addLogEntry({
        type: 'system',
        message: `${player.name}'s Hammer protects them from Gulag! (Player-initiated imprisonment blocked)`,
        playerId
      })
      set({ turnPhase: 'post-turn' })
      return
    }

    // TANK ABILITY: Immune to first Gulag sentence (return to nearest Railway Station instead)
    if (player.piece === 'tank' && !player.hasUsedTankGulagImmunity) {
      const railwayPositions = [5, 15, 25, 35]
      const currentPos = player.position

      // Find nearest railway station
      let nearestRailway = railwayPositions[0]
      let minDistance = Math.abs(currentPos - railwayPositions[0])

      railwayPositions.forEach(railPos => {
        const distance = Math.abs(currentPos - railPos)
        if (distance < minDistance) {
          minDistance = distance
          nearestRailway = railPos
        }
      })

      get().updatePlayer(playerId, {
        position: nearestRailway,
        hasUsedTankGulagImmunity: true
      })

      get().addLogEntry({
        type: 'system',
        message: `${player.name}'s Tank evades Gulag! Redirected to nearest Railway Station (immunity used)`,
        playerId
      })

      // Still demote player (loses rank but avoids Gulag)
      get().demotePlayer(playerId)

      set({ turnPhase: 'post-turn' })
      return
    }

    const reasonText = getGulagReasonText(reason, justification)

    get().updatePlayer(playerId, {
      inGulag: true,
      gulagTurns: 0,
      position: 10 // Gulag position
    })

    // Demote player
    get().demotePlayer(playerId)

    get().addLogEntry({
      type: 'gulag',
      message: `${player.name} sent to Gulag: ${reasonText}`,
      playerId
    })

    // Check voucher consequences if applicable
    get().checkVoucherConsequences(playerId, reason)

    // End turn immediately
    set({ turnPhase: 'post-turn' })
  },

  checkRedStarExecutionAfterGulagRelease: (playerId: string) => {
    const state = get()
    const player = state.players.find((p) => p.id === playerId)
    if (player == null) return

    // RED STAR ABILITY: If released from Gulag at Proletariat rank, immediate execution
    if (player.piece === 'redStar' && player.rank === 'proletariat' && !player.inGulag) {
      get().addLogEntry({
        type: 'system',
        message: `${player.name}'s Red Star is at Proletariat rank outside the Gulag - IMMEDIATE EXECUTION!`,
        playerId
      })
      get().eliminatePlayer(playerId, 'redStarDemotion')
    }
  },

  handleGulagTurn: (playerId) => {
    const state = get()
    const player = state.players.find((p) => p.id === playerId)
    if (!player?.inGulag) return

    // Increment turn counter
    const newGulagTurns: number = (player.gulagTurns) + 1
    get().updatePlayer(playerId, { gulagTurns: newGulagTurns })

    get().addLogEntry({
      type: 'gulag',
      message: `${player.name} begins turn ${String(newGulagTurns)} in the Gulag`,
      playerId
    })

    // Check for 10-turn elimination
    get().checkFor10TurnElimination(playerId)

    // Show Gulag escape options if not eliminated
    const updatedPlayer = state.players.find((p) => p.id === playerId)
    if (updatedPlayer != null && !updatedPlayer.isEliminated) {
      set({ pendingAction: { type: 'gulag-escape-choice', data: { playerId } } })
    }
  },

  checkFor10TurnElimination: (playerId) => {
    const state = get()
    const player = state.players.find((p) => p.id === playerId)
    if (!player?.inGulag) return

    if (player.gulagTurns >= 10) {
      get().eliminatePlayer(playerId, 'gulagTimeout')
    }
  },

  attemptGulagEscape: (playerId, method) => {
    const state = get()
    const player = state.players.find((p) => p.id === playerId)
    if (!player?.inGulag) return

    switch (method) {
      case 'roll': {
        // This will be handled by the modal - check if doubles match requirements
        const requiredDoubles = getRequiredDoublesForEscape(player.gulagTurns)
        const dice = state.dice

        if (dice[0] === dice[1] && requiredDoubles.includes(dice[0])) {
          // Success! Escape the Gulag
          get().updatePlayer(playerId, {
            inGulag: false,
            gulagTurns: 0
          })

          const diceValue: number = dice[0]
          get().addLogEntry({
            type: 'gulag',
            message: `${player.name} rolled double ${String(diceValue)}s and escaped the Gulag!`,
            playerId
          })

          // Check if RedStar player at Proletariat should be executed
          get().checkRedStarExecutionAfterGulagRelease(playerId)

          set({ turnPhase: 'post-turn', pendingAction: null })
        } else {
          // Failed escape
          get().addLogEntry({
            type: 'gulag',
            message: `${player.name} failed to escape the Gulag`,
            playerId
          })

          set({ turnPhase: 'post-turn', pendingAction: null })
        }
        break
      }

      case 'pay': {
        // Pay 500₽ and lose one rank
        if (player.rubles >= 500) {
          get().updatePlayer(playerId, {
            rubles: player.rubles - 500,
            inGulag: false,
            gulagTurns: 0
          })

          get().adjustTreasury(500)
          get().demotePlayer(playerId)

          get().addLogEntry({
            type: 'gulag',
            message: `${player.name} paid ₽500 for rehabilitation and was released (with demotion)`,
            playerId
          })

          set({ turnPhase: 'post-turn', pendingAction: null })
        }
        break
      }

      case 'vouch': {
        // Set up voucher request
        set({ pendingAction: { type: 'voucher-request', data: { prisonerId: playerId } } })
        break
      }

      case 'inform': {
        // Set up inform modal
        set({ pendingAction: { type: 'inform-on-player', data: { informerId: playerId } } })
        break
      }

      case 'bribe': {
        // Set up bribe modal
        set({ pendingAction: { type: 'bribe-stalin', data: { playerId, reason: 'gulag-escape' } } })
        break
      }

      case 'card': {
        // Use "Get out of Gulag free" card
        if (player.hasFreeFromGulagCard) {
          get().updatePlayer(playerId, {
            inGulag: false,
            gulagTurns: 0,
            hasFreeFromGulagCard: false // Remove the card
          })

          get().addLogEntry({
            type: 'gulag',
            message: `${player.name} used "Get out of Gulag free" card and was immediately released!`,
            playerId
          })

          // Check if RedStar player at Proletariat should be executed
          get().checkRedStarExecutionAfterGulagRelease(playerId)

          set({ turnPhase: 'post-turn', pendingAction: null })
        }
        break
      }
    }
  }
})
