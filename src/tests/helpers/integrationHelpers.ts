// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { useGameStore } from '../../store/gameStore'
import type { PieceType, PartyRank } from '../../types/game'
import { BOARD_SPACES } from '../../data/spaces'

/**
 * Reset the store and set up a fresh game with specified players
 */
export function setupTestGame(config: {
  players: { name: string, piece: PieceType, rank?: PartyRank }[]
  stalinName?: string
}) {
  // Reset store to clean state
  const initialState = useGameStore.getState()
  useGameStore.setState(initialState, true)

  // Add Stalin first, then other players
  const playerConfigs = [
    { name: config.stalinName ?? 'Stalin', piece: 'hammer' as PieceType, isStalin: true },
    ...config.players.map(p => ({
      name: p.name,
      piece: p.piece,
      isStalin: false
    }))
  ]

  const store = useGameStore.getState()
  store.initializePlayers(playerConfigs)

  // Set custom ranks if specified
  const allPlayers = useGameStore.getState().players
  config.players.forEach((playerConfig, index) => {
    if (playerConfig.rank && playerConfig.rank !== 'proletariat') {
      // Index + 1 because Stalin is at index 0
      const player = allPlayers[index + 1]
      if (player) {
        store.updatePlayer(player.id, { rank: playerConfig.rank })
      }
    }
  })

  const players = useGameStore.getState().players
  const stalinId = players.find(p => p.isStalin)?.id
  const playerIds = players.filter(p => !p.isStalin).map(p => p.id)

  return { stalinId: stalinId ?? '', playerIds }
}

/**
 * Start a game and return the first player's turn
 */
export function startTestGame() {
  const store = useGameStore.getState()
  // Game is already started by initializePlayers in setupTestGame
  // Just return the current player
  return store.currentPlayerIndex !== null ? store.players[store.currentPlayerIndex] : null
}

/**
 * Simulate a dice roll and movement
 */
export function rollAndMove(roll: [number, number]) {
  const store = useGameStore.getState()

  // Set the dice roll
  useGameStore.setState({ dice: roll })

  const currentPlayer = store.currentPlayerIndex !== null ? store.players[store.currentPlayerIndex] : null
  if (currentPlayer) {
    const totalRoll = roll[0] + roll[1]
    // Use the store's movePlayer method for proper movement handling
    store.movePlayer(currentPlayer.id, totalRoll)
  }

  // Get updated player state
  const updatedStore = useGameStore.getState()
  return updatedStore.currentPlayerIndex !== null ? updatedStore.players[updatedStore.currentPlayerIndex] : null
}

/**
 * Complete a full turn for the current player
 */
export function completeTurn(roll: [number, number]) {
  const store = useGameStore.getState()
  rollAndMove(roll)
  store.endTurn()
}

/**
 * Get a property's space ID by name (partial match)
 */
export function getSpaceIdByName(namePart: string): number {
  const space = BOARD_SPACES.find((s) =>
    s.name.toLowerCase().includes(namePart.toLowerCase())
  )
  if (!space) throw new Error(`Space not found: ${namePart}`)
  return space.id
}

/**
 * Get the current player
 */
export function getCurrentPlayer() {
  const store = useGameStore.getState()
  return store.currentPlayerIndex !== null ? store.players[store.currentPlayerIndex] : null
}

/**
 * Advance to the next round
 */
export function advanceRound() {
  const store = useGameStore.getState()
  const playerCount = store.players.filter(p => !p.isEliminated).length

  // Complete turns for all players
  for (let i = 0; i < playerCount; i++) {
    store.endTurn()
  }
}
