// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import type { GameState } from '../types/game'
import type { GameService, StoreGetter } from './types'

/**
 * StoyService (Start of the Year Service)
 *
 * Handles logic for the STOY corner space:
 * - Travel tax when passing STOY
 * - Pilfering opportunity when landing exactly on STOY
 * - Hammer piece bonus
 */
export class StoyService implements GameService {
  constructor(public getStore: StoreGetter) {}

  /**
   * Handles a player passing STOY (position 0) without landing on it.
   * Deducts 200₽ travel tax and applies Hammer bonus if applicable.
   */
  handlePassing(playerId: string): void {
    const state = this.getStore()
    const player = state.players.find((p) => p.id === playerId)
    if (player == null) return

    // Calculate final rubles after tax and potential bonus
    let finalRubles = player.rubles - 200

    // HAMMER ABILITY: +50₽ bonus when passing STOY
    if (player.piece === 'hammer') {
      finalRubles += 50 // Net: -150₽
    }

    // Apply the update
    state.updatePlayer(playerId, { rubles: finalRubles })
    state.adjustTreasury(200)

    state.addLogEntry({
      type: 'payment',
      message: `${player.name} paid ₽200 travel tax at STOY`,
      playerId
    })

    if (player.piece === 'hammer') {
      state.addLogEntry({
        type: 'payment',
        message: `${player.name}'s Hammer earns +₽50 bonus at STOY!`,
        playerId
      })
    }
  }

  /**
   * Handles a player attempting to pilfer from the State Treasury.
   * Success on roll of 4+ steals 100₽. Failure sends player to Gulag.
   */
  handlePilfer(playerId: string, diceRoll: number): void {
    const state = this.getStore()
    const player = state.players.find((p) => p.id === playerId)
    if (player == null) return

    if (diceRoll >= 4) {
      // Success! Steal 100₽ from State
      const newRubles = player.rubles + 100
      state.updatePlayer(playerId, { rubles: newRubles })
      state.adjustTreasury(-100)

      state.addLogEntry({
        type: 'payment',
        message: `${player.name} successfully pilfered ₽100 from the State Treasury!`,
        playerId
      })
    } else {
      // Caught! Go to Gulag
      state.sendToGulag(playerId, 'pilferingCaught')
    }

    state.setTurnPhase('post-turn')
    state.setPendingAction(null)
  }
}
