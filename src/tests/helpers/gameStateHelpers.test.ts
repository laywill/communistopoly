// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore } from '../../store/gameStore'
import { sendPlayerToGulag, setGulagTurns, createTestPlayer } from './gameStateHelpers'

describe('gameStateHelpers - sendPlayerToGulag', () => {
  beforeEach(() => {
    // Reset store before each test
    useGameStore.setState({
      gamePhase: 'playing',
      players: [],
      stalinPlayerId: null,
      currentPlayerIndex: 0,
      properties: [],
      stateTreasury: 0,
      turnPhase: 'pre-roll',
      doublesCount: 0,
      hasRolled: false,
      roundNumber: 1,
      dice: [1, 1],
      isRolling: false,
      gameLog: [],
      pendingAction: null,
      activeVouchers: [],
      pendingBribes: [],
      activeTradeOffers: [],
      denouncementsThisRound: [],
      activeTribunal: null,
      heroesOfSovietUnion: [],
      greatPurgeUsed: false,
      activeGreatPurge: null,
      activeFiveYearPlan: null,
      confessions: [],
      endVoteInProgress: false,
      endVoteInitiator: null,
      endVotes: {},
      gameEndCondition: null,
      winnerId: null,
      showEndScreen: false
    })
  })

  it('should send player to Gulag with specified reason', () => {
    const player = createTestPlayer({ id: 'player-1', name: 'Test Player' })
    useGameStore.setState({ players: [player] })

    sendPlayerToGulag('player-1', 'denouncementGuilty')

    const state = useGameStore.getState()
    const updatedPlayer = state.players.find(p => p.id === 'player-1')

    expect(updatedPlayer?.inGulag).toBe(true)
    expect(updatedPlayer?.gulagTurns).toBe(0)

    // Verify a log entry was created (game log should have entries)
    expect(state.gameLog.length).toBeGreaterThan(0)
  })

  it('should use correct GulagReason parameter', () => {
    const player = createTestPlayer({ id: 'player-2', name: 'Another Player' })
    useGameStore.setState({ players: [player] })

    sendPlayerToGulag('player-2', 'threeDoubles')

    const state = useGameStore.getState()
    const updatedPlayer = state.players.find(p => p.id === 'player-2')

    expect(updatedPlayer?.inGulag).toBe(true)
  })
})

describe('gameStateHelpers - setGulagTurns', () => {
  beforeEach(() => {
    useGameStore.setState({
      gamePhase: 'playing',
      players: [],
      stalinPlayerId: null,
      currentPlayerIndex: 0,
      properties: [],
      stateTreasury: 0,
      turnPhase: 'pre-roll',
      doublesCount: 0,
      hasRolled: false,
      roundNumber: 1,
      dice: [1, 1],
      isRolling: false,
      gameLog: [],
      pendingAction: null,
      activeVouchers: [],
      pendingBribes: [],
      activeTradeOffers: [],
      denouncementsThisRound: [],
      activeTribunal: null,
      heroesOfSovietUnion: [],
      greatPurgeUsed: false,
      activeGreatPurge: null,
      activeFiveYearPlan: null,
      confessions: [],
      endVoteInProgress: false,
      endVoteInitiator: null,
      endVotes: {},
      gameEndCondition: null,
      winnerId: null,
      showEndScreen: false
    })
  })

  it('should set gulagTurns for specific player', () => {
    const player1 = createTestPlayer({ id: 'player-1', name: 'Player 1', gulagTurns: 0 })
    const player2 = createTestPlayer({ id: 'player-2', name: 'Player 2', gulagTurns: 0 })
    useGameStore.setState({ players: [player1, player2] })

    setGulagTurns('player-1', 3)

    const state = useGameStore.getState()
    const updatedPlayer1 = state.players.find(p => p.id === 'player-1')
    const updatedPlayer2 = state.players.find(p => p.id === 'player-2')

    expect(updatedPlayer1?.gulagTurns).toBe(3)
    expect(updatedPlayer2?.gulagTurns).toBe(0) // Other player should not be affected
  })

  it('should update gulagTurns to any valid number', () => {
    const player = createTestPlayer({ id: 'player-3', name: 'Player 3', gulagTurns: 2 })
    useGameStore.setState({ players: [player] })

    setGulagTurns('player-3', 5)

    const state = useGameStore.getState()
    const updatedPlayer = state.players.find(p => p.id === 'player-3')

    expect(updatedPlayer?.gulagTurns).toBe(5)
  })

  it('should not affect other player properties', () => {
    const player = createTestPlayer({
      id: 'player-4',
      name: 'Player 4',
      gulagTurns: 1,
      rubles: 1000,
      rank: 'commissar'
    })
    useGameStore.setState({ players: [player] })

    setGulagTurns('player-4', 3)

    const state = useGameStore.getState()
    const updatedPlayer = state.players.find(p => p.id === 'player-4')

    expect(updatedPlayer?.gulagTurns).toBe(3)
    expect(updatedPlayer?.rubles).toBe(1000)
    expect(updatedPlayer?.rank).toBe('commissar')
    expect(updatedPlayer?.name).toBe('Player 4')
  })
})
