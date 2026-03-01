// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { StateCreator } from 'zustand'
import type { GameStore } from '../types/storeTypes'
import { getSpaceById } from '../../data/spaces'
import {
  BOARD_SIZE, CORNER_STOY, CORNER_GULAG, CORNER_BREADLINE, CORNER_ENEMY_OF_STATE,
  STOY_TRAVEL_TAX, HAMMER_STOY_BONUS, PILFER_AMOUNT, PILFER_DICE_THRESHOLD
} from '../constants'

// Slice state interface
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface MovementSliceState {
  // Movement uses player state for position (no dedicated state properties)
}

// Slice actions interface
export interface MovementSliceActions {
  movePlayer: (playerId: string, spaces: number) => void
  resolveCurrentSpace: (playerId: string) => void
  finishMoving: () => void
  endTurn: () => void
  handleStoyPassing: (playerId: string) => void
  handleStoyPilfer: (playerId: string, diceRoll: number) => void
}

// Combined slice type
export type MovementSlice = MovementSliceState & MovementSliceActions

// Initial state for this slice
export const initialMovementState: MovementSliceState = {
  // No dedicated state properties
}

// Slice creator with full typing
export const createMovementSlice: StateCreator<
  GameStore,
  [],
  [],
  MovementSlice
> = (set, get) => ({
  ...initialMovementState,

  movePlayer: (playerId, spaces) => {
    const state = get()
    const player = state.players.find((p) => p.id === playerId)
    if (player == null) return

    const oldPosition: number = player.position
    const newPosition = (oldPosition + spaces) % BOARD_SIZE

    // Check if player passed STOY (position 0)
    const passedStoy = oldPosition !== CORNER_STOY && (oldPosition + spaces >= BOARD_SIZE)

    // Update player position and track laps
    const updates: Partial<typeof player> = { position: newPosition }
    if (passedStoy) {
      updates.lapsCompleted = (player.lapsCompleted) + 1
      updates.tankRequisitionUsedThisLap = false // Reset Tank requisition for new lap
    }
    get().updatePlayer(playerId, updates)

    const fromSpace = getSpaceById(oldPosition)
    const toSpace = getSpaceById(newPosition)
    get().addLogEntry({
      type: 'movement',
      message: `${player.name} moved from ${fromSpace?.name ?? 'Unknown'} to ${toSpace?.name ?? 'Unknown'}`,
      playerId
    })

    // Handle passing STOY
    if (passedStoy && newPosition !== CORNER_STOY) {
      get().handleStoyPassing(playerId)
    }
  },

  // Helper function to resolve the space a player has landed on
  // This is called after movement completes (dice roll, card effect, etc.)
  resolveCurrentSpace: (playerId: string) => {
    const state = get()
    const player = state.players.find(p => p.id === playerId)
    if (player == null) return

    const space = getSpaceById(player.position)
    if (space == null) {
      set({ turnPhase: 'post-turn' })
      return
    }

    switch (space.type) {
      case 'corner':
        if (space.id === CORNER_STOY && player.position === CORNER_STOY) {
          // Landed exactly on STOY - pilfering opportunity
          set({ pendingAction: { type: 'stoy-pilfer' } })
        } else if (space.id === CORNER_GULAG) {
          // The Gulag - just visiting
          get().addLogEntry({
            type: 'movement',
            message: `${player.name} is just visiting the Gulag`,
            playerId: player.id
          })
          set({ turnPhase: 'post-turn' })
        } else if (space.id === CORNER_BREADLINE) {
          // Breadline - all players must contribute
          get().addLogEntry({
            type: 'system',
            message: `${player.name} landed on Breadline - all comrades must contribute!`,
            playerId: player.id
          })
          set({
            pendingAction: {
              type: 'breadline-contribution',
              data: { landingPlayerId: player.id }
            }
          })
        } else if (space.id === CORNER_ENEMY_OF_STATE) {
          // Enemy of the State - go to Gulag
          get().sendToGulag(player.id, 'enemyOfState')
        }
        break

      case 'property':
      case 'railway':
      case 'utility': {
        const property = state.properties.find((p) => p.spaceId === space.id)
        if (property == null) {
          set({ turnPhase: 'post-turn' })
          break
        }

        // Check if property is owned by State (available for purchase)
        if (property.custodianId === null) {
          set({
            pendingAction: {
              type: 'property-purchase',
              data: { spaceId: space.id, playerId: player.id }
            }
          })
        } else if (property.custodianId !== player.id) {
          // Check if property is mortgaged - mortgaged properties don't charge quota
          if (property.mortgaged) {
            const custodian = state.players.find(p => p.id === property.custodianId)
            get().addLogEntry({
              type: 'system',
              message: `${player.name} landed on ${space.name} (mortgaged by ${custodian?.name ?? 'unknown'}) - no quota charged`,
              playerId: player.id
            })
            set({ turnPhase: 'post-turn' })
          } else {
            // Check if property is owned by another player (must pay quota)
            if (space.type === 'railway') {
              set({
                pendingAction: {
                  type: 'railway-fee',
                  data: { spaceId: space.id, payerId: player.id }
                }
              })
            } else if (space.type === 'utility') {
              const die1: number = state.dice[0]
              const die2: number = state.dice[1]
              set({
                pendingAction: {
                  type: 'utility-fee',
                  data: { spaceId: space.id, payerId: player.id, diceTotal: die1 + die2 }
                }
              })
            } else {
              set({
                pendingAction: {
                  type: 'quota-payment',
                  data: { spaceId: space.id, payerId: player.id }
                }
              })
            }
          }
        } else {
          // Player owns this property - just visiting
          get().addLogEntry({
            type: 'system',
            message: `${player.name} landed on their own property: ${space.name}`,
            playerId: player.id
          })
          set({ turnPhase: 'post-turn' })
        }
        break
      }

      case 'tax':
        set({
          pendingAction: {
            type: 'tax-payment',
            data: { spaceId: space.id, playerId: player.id }
          }
        })
        break

      case 'card': {
        // Determine card type from space
        const cardSpace = space as { cardType?: 'party-directive' | 'communist-test' }

        if (cardSpace.cardType === 'party-directive') {
          get().addLogEntry({
            type: 'system',
            message: `${player.name} landed on Party Directive`,
            playerId: player.id
          })
          set({
            pendingAction: {
              type: 'draw-party-directive',
              data: { playerId: player.id }
            }
          })
        } else if (cardSpace.cardType === 'communist-test') {
          get().addLogEntry({
            type: 'system',
            message: `${player.name} landed on Communist Test`,
            playerId: player.id
          })
          set({
            pendingAction: {
              type: 'draw-communist-test',
              data: { playerId: player.id }
            }
          })
        } else {
          set({ turnPhase: 'post-turn' })
        }
        break
      }

      default:
        set({ turnPhase: 'post-turn' })
    }
  },

  finishMoving: () => {
    const state = get()
    const currentPlayer = state.players[state.currentPlayerIndex]

    set({ turnPhase: 'resolving' })
    get().resolveCurrentSpace(currentPlayer.id)
  },

  endTurn: () => {
    const state = get()
    const { currentPlayerIndex, players, doublesCount } = state

    // If player rolled doubles and not in gulag, they get another turn
    if ((doublesCount) > 0 && !players[currentPlayerIndex]?.inGulag) {
      set({
        turnPhase: 'pre-roll',
        hasRolled: false,
        pendingAction: null
      })
      return
    }

    // Find next player (skip Stalin and eliminated players, but include Gulag players)
    let nextIndex: number = (currentPlayerIndex + 1) % players.length
    let attempts = 0

    while (
      (players[nextIndex].isStalin || players[nextIndex].isEliminated) &&
      attempts < players.length
    ) {
      nextIndex = (nextIndex + 1) % players.length
      attempts++
    }

    // Check if we've completed a round (cycling back to first non-Stalin player)
    // First non-Stalin player is typically at index 1
    const firstNonStalinIndex: number = players.findIndex((p) => !p.isStalin && !p.isEliminated)
    if (nextIndex === firstNonStalinIndex && currentPlayerIndex !== firstNonStalinIndex) {
      get().incrementRound()
    }

    set({
      currentPlayerIndex: nextIndex,
      turnPhase: 'pre-roll',
      doublesCount: 0,
      hasRolled: false,
      pendingAction: null
    })

    const nextPlayer = players[nextIndex]
    get().addLogEntry({
      type: 'system',
      message: `${nextPlayer.name}'s turn`,
      playerId: nextPlayer.id
    })
  },

  // STOY handling
  handleStoyPassing: (playerId) => {
    const state = get()
    const player = state.players.find((p) => p.id === playerId)
    if (player == null) return

    // Deduct travel tax
    get().updatePlayer(playerId, { rubles: player.rubles - STOY_TRAVEL_TAX })
    get().adjustTreasury(STOY_TRAVEL_TAX)

    get().addLogEntry({
      type: 'payment',
      message: `${player.name} paid ₽${String(STOY_TRAVEL_TAX)} travel tax at STOY`,
      playerId
    })

    // HAMMER ABILITY: bonus when passing STOY
    if (player.piece === 'hammer') {
      get().updatePlayer(playerId, { rubles: player.rubles - STOY_TRAVEL_TAX + HAMMER_STOY_BONUS })
      get().addLogEntry({
        type: 'payment',
        message: `${player.name}'s Hammer earns +₽${String(HAMMER_STOY_BONUS)} bonus at STOY!`,
        playerId
      })
    }
  },

  handleStoyPilfer: (playerId, diceRoll) => {
    const state = get()
    const player = state.players.find((p) => p.id === playerId)
    if (player == null) return

    if (diceRoll >= PILFER_DICE_THRESHOLD) {
      // Success! Steal from State
      const newRubles: number = player.rubles + PILFER_AMOUNT
      get().updatePlayer(playerId, { rubles: newRubles })
      get().adjustTreasury(-PILFER_AMOUNT)

      get().addLogEntry({
        type: 'payment',
        message: `${player.name} successfully pilfered ₽${String(PILFER_AMOUNT)} from the State Treasury!`,
        playerId
      })
    } else {
      // Caught! Go to Gulag
      get().sendToGulag(playerId, 'pilferingCaught')
    }

    set({ pendingAction: null, turnPhase: 'post-turn' })
  }
})
