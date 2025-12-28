// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import type { GameState } from '../types/game'
import type { GameService } from './types'

/**
 * TurnManager Service
 *
 * Handles turn-based game flow logic:
 * - Turn advancement
 * - Doubles handling
 * - Round completion detection
 * - Player turn skipping
 */
export class TurnManager implements GameService {
  constructor(public store: GameState) {}

  /**
   * Ends the current player's turn and advances to the next player.
   * Handles doubles, round completion, and player skipping.
   */
  endTurn(): void {
    const state = this.store
    const { currentPlayerIndex, players, doublesCount } = state

    // If player rolled doubles and not in gulag, they get another turn
    if (doublesCount > 0 && !players[currentPlayerIndex]?.inGulag) {
      state.setTurnPhase('pre-roll')
      state.setHasRolled(false)
      state.setPendingAction(null)
      return
    }

    // Find next player
    const nextIndex = this.calculateNextPlayerIndex(currentPlayerIndex, players)

    // Check if we've completed a round
    if (this.isRoundComplete(nextIndex, currentPlayerIndex, players)) {
      state.incrementRound()
    }

    // Advance to next player
    state.setCurrentPlayer(nextIndex)
    state.setTurnPhase('pre-roll')
    state.setDoublesCount(0)
    state.setHasRolled(false)
    state.setPendingAction(null)

    // Log turn change
    const nextPlayer = players[nextIndex]
    state.addLogEntry({
      type: 'system',
      message: `${nextPlayer.name}'s turn`,
      playerId: nextPlayer.id
    })
  }

  /**
   * Calculates the index of the next player in turn order.
   * Skips Stalin and eliminated players.
   */
  private calculateNextPlayerIndex(
    currentIndex: number,
    players: GameState['players']
  ): number {
    let nextIndex = (currentIndex + 1) % players.length
    let attempts = 0

    // Skip Stalin and eliminated players (but include Gulag players)
    while (
      (players[nextIndex].isStalin || players[nextIndex].isEliminated) &&
      attempts < players.length
    ) {
      nextIndex = (nextIndex + 1) % players.length
      attempts++
    }

    return nextIndex
  }

  /**
   * Checks if a round has been completed.
   * A round is complete when we cycle back to the first non-Stalin player.
   */
  private isRoundComplete(
    nextIndex: number,
    currentIndex: number,
    players: GameState['players']
  ): boolean {
    const firstNonStalinIndex = players.findIndex(
      (p) => !p.isStalin && !p.isEliminated
    )

    return (
      nextIndex === firstNonStalinIndex &&
      currentIndex !== firstNonStalinIndex
    )
  }
}
