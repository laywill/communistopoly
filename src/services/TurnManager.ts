// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import type { StoreGetter, GameService, SlicesStore } from './types'

export interface TurnManager extends GameService {
  /**
   * Start the game with randomized turn order
   */
  startGame: () => void

  /**
   * Roll dice and handle movement, doubles, three-doubles-to-Gulag
   */
  rollDice: () => [number, number]

  /**
   * Roll 3 dice for Vodka Bottle ability
   */
  rollThreeDice: () => [number, number, number]

  /**
   * End current turn and advance to next player
   */
  endTurn: () => void

  /**
   * Start the current player's turn (callbacks, checks)
   */
  startTurn: () => void

  /**
   * Check if game should end
   */
  checkGameEnd: () => void

  /**
   * Get current player
   */
  getCurrentPlayer: () => ReturnType<SlicesStore['getPlayer']>
}

export function createTurnManager (get: StoreGetter<SlicesStore>): TurnManager {
  return {
    name: 'TurnManager',

    startGame: () => {
      const state = get()

      // Get non-Stalin, non-eliminated players
      const activePlayers = state.getActivePlayers()

      // Randomize turn order
      const turnOrder = activePlayers
        .map((p) => p.id)
        .sort(() => Math.random() - 0.5)

      state.setTurnOrder(turnOrder)
      state.setCurrentTurnIndex(0)
      state.setGamePhase('playing')
      state.setRound(1)
      state.setDoublesCount(0)

      // Note: Card deck shuffling should be done by CardSlice or a separate service

      state.addGameLogEntry('☭ The game begins! Glory to the Motherland! ☭')
    },

    rollDice: () => {
      const state = get()

      const die1 = Math.floor(Math.random() * 6) + 1
      const die2 = Math.floor(Math.random() * 6) + 1
      const roll: [number, number] = [die1, die2]

      state.setDiceRoll(roll)

      const isDoubles = die1 === die2

      if (isDoubles) {
        state.incrementDoublesCount()

        // Three doubles = Gulag
        if (state.doublesCount >= 3) {
          // Get current player using slice methods
          const currentPlayerId = state.getCurrentPlayerId()
          const currentPlayer = currentPlayerId ? state.getPlayer(currentPlayerId) : undefined

          if (currentPlayer) {
            const playerName = currentPlayer.name

            state.addGameLogEntry(
              `${playerName} rolled three doubles! Counter-revolutionary dice manipulation!`
            )

            // Send to Gulag using slice methods directly (business logic moved here)
            state.setPlayerInGulag(currentPlayer.id, true)
            state.setGulagTurns(currentPlayer.id, 0)
            state.addGameLogEntry(`${playerName} sent to Gulag: Rolled three consecutive doubles`)

            state.setDoublesCount(0)
          }
        }
      } else {
        state.setDoublesCount(0)
      }

      return roll
    },

    rollThreeDice: () => {
      const die1 = Math.floor(Math.random() * 6) + 1
      const die2 = Math.floor(Math.random() * 6) + 1
      const die3 = Math.floor(Math.random() * 6) + 1
      return [die1, die2, die3]
    },

    startTurn: () => {
      const state = get()
      const currentPlayerId = state.getCurrentPlayerId()
      const player = state.players.find(p => p.id === currentPlayerId)

      if (!player) return

      const playerName = player.name
      state.addGameLogEntry(`──── ${playerName}'s Turn ────`)

      // Note: Voucher liability check should be handled by GulagService or UI layer

      // Increment Gulag turn if imprisoned
      if (player.inGulag) {
        state.incrementGulagTurns(player.id)
        const gulagTurns = player.gulagTurns + 1
        state.addGameLogEntry(
          `${playerName} begins turn ${String(gulagTurns)} in the Gulag`
        )
      }

      // Bread Loaf starving check
      if (player.piece === 'breadLoaf' && player.rubles < 100) {
        state.addGameLogEntry(`${playerName} is starving! Must beg for food.`)
      }
    },

    endTurn: () => {
      const state = get()
      const [die1, die2] = state.diceRoll ?? [0, 0]
      const currentPlayer = state.players.find(
        p => p.id === state.turnOrder[state.currentTurnIndex]
      )

      // If doubles and not in Gulag, player goes again
      if (die1 === die2 && die1 > 0 && !currentPlayer?.inGulag && state.doublesCount < 3) {
        state.addGameLogEntry('Doubles! Roll again, comrade.')
        state.setDiceRoll(null)
        return // Don't advance to next player
      }

      // Reset dice for next player
      state.setDiceRoll(null)
      state.setDoublesCount(0)

      // Advance to next player
      const { turnOrder, currentTurnIndex } = state
      const turnOrderLength = turnOrder.length
      let nextIndex = (currentTurnIndex + 1) % turnOrderLength

      // Check for round completion
      if (nextIndex === 0) {
        state.incrementRound()
        state.resetDenouncementCounts()
        state.expireVouchers()
      }

      // Skip eliminated players
      let attempts = 0
      while (attempts < turnOrderLength) {
        const nextPlayerId = turnOrder[nextIndex]
        const nextPlayer = state.players.find(p => p.id === nextPlayerId)

        if (nextPlayer && !nextPlayer.isEliminated) {
          break
        }

        nextIndex = (nextIndex + 1) % turnOrderLength
        attempts++

        // Check for round completion when skipping
        if (nextIndex === 0) {
          state.incrementRound()
          state.resetDenouncementCounts()
          state.expireVouchers()
        }
      }

      state.setCurrentTurnIndex(nextIndex)
    },

    checkGameEnd: () => {
      const state = get()
      const activePlayers = state.getActivePlayers()
      const activeCount = activePlayers.length

      if (activeCount === 1 && activePlayers[0]) {
        // Survivor victory
         
        const winner = activePlayers[0]
        const winnerName = winner.name
        state.setWinner(winner.id, 'Last survivor - there are no winners, only survivors')
        state.addGameLogEntry(`🏆 ${winnerName} has survived! Glory to the survivor!`)
      } else if (activeCount === 0) {
        // Stalin victory
        state.setWinner(null, 'The State wins - all comrades eliminated')
        state.addGameLogEntry('☭ The State is victorious! All comrades have been eliminated.')
      }
    },

    getCurrentPlayer: () => {
      const state = get()
      const currentPlayerId = state.getCurrentPlayerId()
      return currentPlayerId ? state.getPlayer(currentPlayerId) : undefined
    },
  }
}
