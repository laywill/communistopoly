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
      const getActive = state.getActivePlayers
      const activePlayers = getActive ? getActive() : []

      // Randomize turn order
      const turnOrder = activePlayers
        .map((p) => p.id)
        .sort(() => Math.random() - 0.5)

      const setTurnOrder = state.setTurnOrder
      const setCurrentTurnIndex = state.setCurrentTurnIndex
      const setGamePhase = state.setGamePhase
      const setRound = state.setRound
      const setDoublesCount = state.setDoublesCount
      const addLog = state.addGameLogEntry

      if (setTurnOrder) setTurnOrder(turnOrder)
      if (setCurrentTurnIndex) setCurrentTurnIndex(0)
      if (setGamePhase) setGamePhase('playing')
      if (setRound) setRound(1)
      if (setDoublesCount) setDoublesCount(0)

      // Note: Card deck shuffling should be done by CardSlice or a separate service

      if (addLog) addLog('☭ The game begins! Glory to the Motherland! ☭')
    },

    rollDice: () => {
      const state = get()

      const die1 = Math.floor(Math.random() * 6) + 1
      const die2 = Math.floor(Math.random() * 6) + 1
      const roll: [number, number] = [die1, die2]

      const setDiceRoll = state.setDiceRoll
      if (setDiceRoll) setDiceRoll(roll)

      const isDoubles = die1 === die2

      if (isDoubles) {
        const incrementDoubles = state.incrementDoublesCount
        if (incrementDoubles) incrementDoubles()

        // Three doubles = Gulag
        if (state.doublesCount >= 3) {
          // Get current player using slice methods
          const getCurrentId = state.getCurrentPlayerId
          const getPlayer = state.getPlayer
          const currentPlayerId = getCurrentId ? getCurrentId() : undefined
          const currentPlayer = currentPlayerId && getPlayer ? getPlayer(currentPlayerId) : undefined

          if (currentPlayer) {
            const addLog = state.addGameLogEntry
            const setPlayerInGulag = state.setPlayerInGulag
            const setGulagTurns = state.setGulagTurns
            const setDoublesCount = state.setDoublesCount
            const playerName = currentPlayer.name

            if (addLog) {
              addLog(
                `${playerName} rolled three doubles! Counter-revolutionary dice manipulation!`
              )
            }

            // Send to Gulag using slice methods directly (business logic moved here)
            if (setPlayerInGulag && setGulagTurns) {
              setPlayerInGulag(currentPlayer.id, true)
              setGulagTurns(currentPlayer.id, 0)
              if (addLog) addLog(`${playerName} sent to Gulag: Rolled three consecutive doubles`)
            }

            if (setDoublesCount) setDoublesCount(0)
          }
        }
      } else {
        const setDoublesCount = state.setDoublesCount
        if (setDoublesCount) setDoublesCount(0)
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
      const getCurrentId = state.getCurrentPlayerId
      const currentPlayerId = getCurrentId ? getCurrentId() : undefined
      const player = state.players.find(p => p.id === currentPlayerId)

      if (!player) return

      const addLog = state.addGameLogEntry
      const playerName = player.name
      if (addLog) addLog(`──── ${playerName}'s Turn ────`)

      // Note: Voucher liability check should be handled by GulagService or UI layer

      // Increment Gulag turn if imprisoned
      if (player.inGulag) {
        const incrementGulag = state.incrementGulagTurns
        if (incrementGulag) incrementGulag(player.id)
        const gulagTurns = player.gulagTurns + 1
        if (addLog) {
          addLog(
            `${playerName} begins turn ${String(gulagTurns)} in the Gulag`
          )
        }
      }

      // Bread Loaf starving check
      if (player.piece === 'breadLoaf' && player.rubles < 100) {
        if (addLog) addLog(`${playerName} is starving! Must beg for food.`)
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
        const addLog = state.addGameLogEntry
        const setDiceRoll = state.setDiceRoll
        if (addLog) addLog('Doubles! Roll again, comrade.')
        if (setDiceRoll) setDiceRoll(null)
        return // Don't advance to next player
      }

      // Reset dice for next player
      const setDiceRoll = state.setDiceRoll
      const setDoublesCount = state.setDoublesCount
      if (setDiceRoll) setDiceRoll(null)
      if (setDoublesCount) setDoublesCount(0)

      // Advance to next player
      const { turnOrder, currentTurnIndex } = state
      const turnOrderLength = turnOrder.length
      let nextIndex = (currentTurnIndex + 1) % turnOrderLength

      // Check for round completion
      if (nextIndex === 0) {
        const incrementRound = state.incrementRound
        const resetDenouncements = state.resetDenouncementCounts
        if (incrementRound) incrementRound()
        if (resetDenouncements) resetDenouncements()
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
          const incrementRound = state.incrementRound
          const resetDenouncements = state.resetDenouncementCounts
          if (incrementRound) incrementRound()
          if (resetDenouncements) resetDenouncements()
        }
      }

      const setCurrentTurnIndex = state.setCurrentTurnIndex
      if (setCurrentTurnIndex) setCurrentTurnIndex(nextIndex)
    },

    checkGameEnd: () => {
      const state = get()
      const getActive = state.getActivePlayers
      const activePlayers = getActive ? getActive() : []
      const activeCount = activePlayers.length

      if (activeCount === 1) {
        // Survivor victory
        const winner = activePlayers[0]
        const setWinner = state.setWinner
        const addLog = state.addGameLogEntry
        if (winner) {
          const winnerName = winner.name
          if (setWinner) setWinner(winner.id, 'Last survivor - there are no winners, only survivors')
          if (addLog) addLog(`🏆 ${winnerName} has survived! Glory to the survivor!`)
        }
      } else if (activeCount === 0) {
        // Stalin victory
        const setWinner = state.setWinner
        const addLog = state.addGameLogEntry
        if (setWinner) setWinner(null, 'The State wins - all comrades eliminated')
        if (addLog) addLog('☭ The State is victorious! All comrades have been eliminated.')
      }
    },

    getCurrentPlayer: () => {
      const state = get()
      const getCurrentId = state.getCurrentPlayerId
      const getPlayer = state.getPlayer
      const currentPlayerId = getCurrentId ? getCurrentId() : undefined
      return (currentPlayerId && getPlayer) ? getPlayer(currentPlayerId) : undefined
    },
  }
}
