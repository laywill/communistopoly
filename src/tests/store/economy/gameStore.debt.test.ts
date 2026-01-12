// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore } from '../../../store/gameStore'

describe('gameStore - Debt & Elimination', () => {
  const setupPlayers = () => {
    const { initializePlayers } = useGameStore.getState()
    initializePlayers([
      { name: 'Player 1', piece: 'sickle', isStalin: false },
      { name: 'Player 2', piece: 'hammer', isStalin: false },
      { name: 'Player 3', piece: 'redStar', isStalin: false },
      { name: 'Stalin', piece: null, isStalin: true }
    ])
  }

  beforeEach(() => {
    useGameStore.getState().resetGame()
    setupPlayers()
  })

  describe('createDebt()', () => {
    it('should create debt for player with correct properties', () => {
      const { createDebt, players } = useGameStore.getState()
      const player = players[0]

      createDebt(player.id, 'state', 500, 'unpaid rent')

      const updatedPlayer = useGameStore.getState().players.find(p => p.id === player.id)
      expect(updatedPlayer?.debt).toBeDefined()
      expect(updatedPlayer?.debt?.amount).toBe(500)
      expect(updatedPlayer?.debt?.creditorId).toBe('state')
      expect(updatedPlayer?.debt?.reason).toBe('unpaid rent')
      expect(updatedPlayer?.debt?.createdAtRound).toBe(1)
      expect(updatedPlayer?.debtCreatedAtRound).toBe(1)
    })

    it('should create debt to another player', () => {
      const { createDebt, players } = useGameStore.getState()
      const debtor = players[0]
      const creditor = players[1]

      createDebt(debtor.id, creditor.id, 300, 'property rent')

      const updatedPlayer = useGameStore.getState().players.find(p => p.id === debtor.id)
      expect(updatedPlayer?.debt).toBeDefined()
      expect(updatedPlayer?.debt?.creditorId).toBe(creditor.id)
      expect(updatedPlayer?.debt?.amount).toBe(300)
    })

    it('should add log entry when debt is created', () => {
      const { createDebt, players } = useGameStore.getState()
      const player = players[0]
      const initialLogLength = useGameStore.getState().gameLog.length

      createDebt(player.id, 'state', 500, 'unpaid rent')

      const logs = useGameStore.getState().gameLog
      expect(logs.length).toBe(initialLogLength + 1)
      expect(logs[logs.length - 1].type).toBe('payment')
      expect(logs[logs.length - 1].message).toContain('owes ₽500')
      expect(logs[logs.length - 1].message).toContain('the State')
      expect(logs[logs.length - 1].message).toContain('unpaid rent')
    })

    it('should handle invalid player id gracefully', () => {
      const { createDebt } = useGameStore.getState()
      const initialState = useGameStore.getState()

      createDebt('invalid-id', 'state', 500, 'test')

      const newState = useGameStore.getState()
      expect(newState.players).toEqual(initialState.players)
    })

    it('should include creditor name in log entry for player debt', () => {
      const { createDebt, players } = useGameStore.getState()
      const debtor = players[0]
      const creditor = players[1]

      createDebt(debtor.id, creditor.id, 300, 'property rent')

      const logs = useGameStore.getState().gameLog
      expect(logs[logs.length - 1].message).toContain(creditor.name)
    })
  })

  describe('checkDebtStatus()', () => {
    it('should send player to gulag when debt is past due (2 rounds)', () => {
      const { createDebt, checkDebtStatus, players } = useGameStore.getState()
      const player = players[0]

      // Create debt in round 1
      createDebt(player.id, 'state', 500, 'unpaid rent')

      // Advance to round 3 (1 round after debt created = round 2, so round 3 is past due)
      useGameStore.setState({ roundNumber: 3 })

      checkDebtStatus()

      const updatedPlayer = useGameStore.getState().players.find(p => p.id === player.id)
      expect(updatedPlayer?.inGulag).toBe(true)
      expect(updatedPlayer?.debt).toBeNull()
      expect(updatedPlayer?.debtCreatedAtRound).toBeNull()
    })

    it('should not send player to gulag if debt is not past due (within 1 round)', () => {
      const { createDebt, checkDebtStatus, players } = useGameStore.getState()
      const player = players[0]

      // Create debt in round 1
      createDebt(player.id, 'state', 500, 'unpaid rent')

      // Advance to round 2 (within 1 round grace period)
      useGameStore.setState({ roundNumber: 2 })

      checkDebtStatus()

      const updatedPlayer = useGameStore.getState().players.find(p => p.id === player.id)
      expect(updatedPlayer?.inGulag).toBe(false)
      expect(updatedPlayer?.debt).toBeDefined()
    })

    it('should handle multiple players with debt', () => {
      const { createDebt, checkDebtStatus, players } = useGameStore.getState()
      const player1 = players[0]
      const player2 = players[1]

      // Create debts for both players
      createDebt(player1.id, 'state', 500, 'rent')
      createDebt(player2.id, 'state', 300, 'tax')

      // Advance to round 3 (past due)
      useGameStore.setState({ roundNumber: 3 })

      checkDebtStatus()

      const updatedPlayer1 = useGameStore.getState().players.find(p => p.id === player1.id)
      const updatedPlayer2 = useGameStore.getState().players.find(p => p.id === player2.id)

      expect(updatedPlayer1?.inGulag).toBe(true)
      expect(updatedPlayer2?.inGulag).toBe(true)
      expect(updatedPlayer1?.debt).toBeNull()
      expect(updatedPlayer2?.debt).toBeNull()
    })

    it('should not affect players without debt', () => {
      const { createDebt, checkDebtStatus, players } = useGameStore.getState()
      const playerWithDebt = players[0]
      const playerWithoutDebt = players[1]

      createDebt(playerWithDebt.id, 'state', 500, 'rent')

      useGameStore.setState({ roundNumber: 3 })
      checkDebtStatus()

      const updatedPlayerWithoutDebt = useGameStore.getState().players.find(p => p.id === playerWithoutDebt.id)
      expect(updatedPlayerWithoutDebt?.inGulag).toBe(false)
      expect(updatedPlayerWithoutDebt?.debt).toBeNull()
    })
  })

  describe('eliminatePlayer()', () => {
    it('should eliminate player and set isEliminated to true', () => {
      const { eliminatePlayer, players } = useGameStore.getState()
      const player = players[0]

      eliminatePlayer(player.id, 'bankruptcy')

      const updatedPlayer = useGameStore.getState().players.find(p => p.id === player.id)
      expect(updatedPlayer?.isEliminated).toBe(true)
      expect(updatedPlayer?.eliminationReason).toBe('bankruptcy')
    })

    it('should return all properties to State', () => {
      const { setPropertyCustodian, updatePlayer, eliminatePlayer, players } = useGameStore.getState()
      const player = players[0]

      // Give player some properties (space IDs 3 and 6)
      const prop1 = 3 // Brown property
      const prop2 = 6 // Light blue property

      setPropertyCustodian(prop1, player.id)
      setPropertyCustodian(prop2, player.id)
      updatePlayer(player.id, { properties: [prop1.toString(), prop2.toString()] })

      const playerBefore = useGameStore.getState().players.find(p => p.id === player.id)
      expect(playerBefore?.properties.length).toBeGreaterThan(0)

      eliminatePlayer(player.id, 'bankruptcy')

      const updatedPlayer = useGameStore.getState().players.find(p => p.id === player.id)
      expect(updatedPlayer?.properties).toEqual([])

      // Check that properties are returned to state (custodian set to null)
      const property1 = useGameStore.getState().properties.find(p => p.spaceId === prop1)
      expect(property1?.custodianId).toBeNull()

      const property2 = useGameStore.getState().properties.find(p => p.spaceId === prop2)
      expect(property2?.custodianId).toBeNull()
    })

    it('should reset collectivization levels on properties', () => {
      const { setPropertyCustodian, updateCollectivizationLevel, eliminatePlayer, players, properties } = useGameStore.getState()
      const player = players[0]

      const prop = properties.find(p => p.color === 'brown')?.spaceId
      if (prop) {
        setPropertyCustodian(prop, player.id)
        updateCollectivizationLevel(prop, 3)

        const propertyBefore = useGameStore.getState().properties.find(p => p.spaceId === prop)
        expect(propertyBefore?.collectivizationLevel).toBe(3)

        eliminatePlayer(player.id, 'bankruptcy')

        const propertyAfter = useGameStore.getState().properties.find(p => p.spaceId === prop)
        expect(propertyAfter?.collectivizationLevel).toBe(0)
      }
    })

    it('should remove player from gulag if in gulag', () => {
      const { sendToGulag, eliminatePlayer, players } = useGameStore.getState()
      const player = players[0]

      sendToGulag(player.id, 'debtDefault')

      const playerBefore = useGameStore.getState().players.find(p => p.id === player.id)
      expect(playerBefore?.inGulag).toBe(true)

      eliminatePlayer(player.id, 'bankruptcy')

      const updatedPlayer = useGameStore.getState().players.find(p => p.id === player.id)
      expect(updatedPlayer?.inGulag).toBe(false)
    })

    it('should record elimination details (round, wealth, rank, properties)', () => {
      const { setPropertyCustodian, eliminatePlayer, updatePlayer, players } = useGameStore.getState()
      const player = players[0]

      // Set up player state (space ID 3 = brown property)
      const prop = 3
      setPropertyCustodian(prop, player.id)
      updatePlayer(player.id, { properties: [prop.toString()], rubles: 250 })
      useGameStore.setState({ roundNumber: 5 })

      eliminatePlayer(player.id, 'bankruptcy')

      const updatedPlayer = useGameStore.getState().players.find(p => p.id === player.id)
      expect(updatedPlayer?.eliminationTurn).toBe(5)
      expect(updatedPlayer?.finalWealth).toBe(250)
      expect(updatedPlayer?.finalRank).toBe(player.rank)
      expect(updatedPlayer?.finalProperties).toBe(1)
    })

    it('should add appropriate log entry for bankruptcy', () => {
      const { eliminatePlayer, players } = useGameStore.getState()
      const player = players[0]
      const initialLogLength = useGameStore.getState().gameLog.length

      eliminatePlayer(player.id, 'bankruptcy')

      const logs = useGameStore.getState().gameLog
      expect(logs.length).toBe(initialLogLength + 1)
      expect(logs[logs.length - 1].type).toBe('system')
      expect(logs[logs.length - 1].message).toContain(player.name)
      expect(logs[logs.length - 1].message).toContain('bankruptcy')
      expect(logs[logs.length - 1].message).toContain('Enemy of the People')
    })

    it('should add appropriate log entry for execution', () => {
      const { eliminatePlayer, players } = useGameStore.getState()
      const player = players[0]

      eliminatePlayer(player.id, 'execution')

      const logs = useGameStore.getState().gameLog
      expect(logs[logs.length - 1].message).toContain('executed by order of Stalin')
      expect(logs[logs.length - 1].message).toContain('Ghost of the Revolution')
    })

    it('should add appropriate log entry for gulag timeout', () => {
      const { eliminatePlayer, players } = useGameStore.getState()
      const player = players[0]

      eliminatePlayer(player.id, 'gulagTimeout')

      const logs = useGameStore.getState().gameLog
      expect(logs[logs.length - 1].message).toContain('died in the Gulag')
      expect(logs[logs.length - 1].message).toContain('10 turns')
    })

    it('should call checkGameEnd after elimination', () => {
      const { eliminatePlayer, players } = useGameStore.getState()

      // Eliminate all non-Stalin players except one
      const nonStalinPlayers = players.filter(p => !p.isStalin)
      for (let i = 0; i < nonStalinPlayers.length - 1; i++) {
        eliminatePlayer(nonStalinPlayers[i].id, 'bankruptcy')
      }

      // Game should end with survivor victory
      const state = useGameStore.getState()
      expect(state.gamePhase).toBe('ended')
      expect(state.gameEndCondition).toBe('survivor')
      expect(state.winnerId).toBe(nonStalinPlayers[nonStalinPlayers.length - 1].id)
    })

    it('should handle invalid player id gracefully', () => {
      const { eliminatePlayer } = useGameStore.getState()
      const initialState = useGameStore.getState()

      eliminatePlayer('invalid-id', 'bankruptcy')

      const newState = useGameStore.getState()
      expect(newState.players).toEqual(initialState.players)
    })
  })

  describe('checkElimination()', () => {
    it('should eliminate player with negative total wealth and debt', () => {
      const { updatePlayer, createDebt, checkElimination, players } = useGameStore.getState()
      const player = players[0]

      // Set player to negative wealth and create debt
      updatePlayer(player.id, { rubles: -100 })
      createDebt(player.id, 'state', 500, 'rent')

      const eliminated = checkElimination(player.id)

      expect(eliminated).toBe(true)
      const updatedPlayer = useGameStore.getState().players.find(p => p.id === player.id)
      expect(updatedPlayer?.isEliminated).toBe(true)
      expect(updatedPlayer?.eliminationReason).toBe('bankruptcy')
    })

    it('should not eliminate player with negative rubles but no debt', () => {
      const { updatePlayer, checkElimination, players } = useGameStore.getState()
      const player = players[0]

      updatePlayer(player.id, { rubles: -100 })

      const eliminated = checkElimination(player.id)

      expect(eliminated).toBe(false)
      const updatedPlayer = useGameStore.getState().players.find(p => p.id === player.id)
      expect(updatedPlayer?.isEliminated).toBe(false)
    })

    it('should not eliminate player with positive total wealth despite debt', () => {
      const { updatePlayer, createDebt, setPropertyCustodian, checkElimination, players } = useGameStore.getState()
      const player = players[0]

      // Give player valuable properties (space ID 39 = dark blue/Kremlin property)
      const prop = 39
      setPropertyCustodian(prop, player.id)
      updatePlayer(player.id, { properties: [prop.toString()], rubles: -50 })
      createDebt(player.id, 'state', 100, 'rent')

      const eliminated = checkElimination(player.id)

      expect(eliminated).toBe(false)
    })

    it('should not check elimination for Stalin', () => {
      const { updatePlayer, checkElimination, players } = useGameStore.getState()
      const stalin = players.find(p => p.isStalin)

      if (stalin) {
        updatePlayer(stalin.id, { rubles: -1000 })

        const eliminated = checkElimination(stalin.id)

        expect(eliminated).toBe(false)
        const updatedStalin = useGameStore.getState().players.find(p => p.id === stalin.id)
        expect(updatedStalin?.isEliminated).toBe(false)
      }
    })

    it('should not check elimination for already eliminated player', () => {
      const { eliminatePlayer, updatePlayer, createDebt, checkElimination, players } = useGameStore.getState()
      const player = players[0]

      eliminatePlayer(player.id, 'execution')

      // Try to trigger another elimination
      updatePlayer(player.id, { rubles: -1000 })
      createDebt(player.id, 'state', 500, 'test')

      const eliminated = checkElimination(player.id)

      expect(eliminated).toBe(false)
    })

    it('should return false for invalid player id', () => {
      const { checkElimination } = useGameStore.getState()

      const eliminated = checkElimination('invalid-id')

      expect(eliminated).toBe(false)
    })
  })

  describe('checkGameEnd()', () => {
    it('should end game with survivor victory when 1 player remains', () => {
      const { eliminatePlayer, checkGameEnd, players } = useGameStore.getState()

      // Eliminate all players except one (skip Stalin)
      const nonStalinPlayers = players.filter(p => !p.isStalin)
      for (let i = 0; i < nonStalinPlayers.length - 1; i++) {
        eliminatePlayer(nonStalinPlayers[i].id, 'bankruptcy')
      }

      const result = checkGameEnd()
      const state = useGameStore.getState()

      expect(result).toBe('survivor')
      expect(state.gamePhase).toBe('ended')
      expect(state.gameEndCondition).toBe('survivor')
      expect(state.winnerId).toBe(nonStalinPlayers[nonStalinPlayers.length - 1].id)
    })

    it('should end game with Stalin victory when all players eliminated', () => {
      const { eliminatePlayer, checkGameEnd, players } = useGameStore.getState()

      // Eliminate all non-Stalin players
      const nonStalinPlayers = players.filter(p => !p.isStalin)
      nonStalinPlayers.forEach(p => {
        eliminatePlayer(p.id, 'execution')
      })

      const result = checkGameEnd()
      const state = useGameStore.getState()

      expect(result).toBe('stalinWins')
      expect(state.gamePhase).toBe('ended')
      expect(state.gameEndCondition).toBe('stalinWins')
      expect(state.winnerId).toBeNull()
    })

    it('should not end game when multiple players remain', () => {
      const { checkGameEnd } = useGameStore.getState()

      const result = checkGameEnd()
      const state = useGameStore.getState()

      expect(result).toBeNull()
      expect(state.gamePhase).not.toBe('ended')
    })

    it('should not end game when 2 players remain', () => {
      const { eliminatePlayer, checkGameEnd, players } = useGameStore.getState()

      // Eliminate all but 2 players (excluding Stalin)
      const nonStalinPlayers = players.filter(p => !p.isStalin)
      for (let i = 0; i < nonStalinPlayers.length - 2; i++) {
        eliminatePlayer(nonStalinPlayers[i].id, 'bankruptcy')
      }

      const result = checkGameEnd()
      const state = useGameStore.getState()

      expect(result).toBeNull()
      expect(state.gamePhase).not.toBe('ended')
    })
  })
})
