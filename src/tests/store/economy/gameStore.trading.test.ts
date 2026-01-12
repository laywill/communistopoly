// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore } from '../../../store/gameStore'

describe('gameStore - Trading System', () => {
  beforeEach(() => {
    useGameStore.getState().resetGame()
  })

  describe('proposeTrade', () => {
    it('should create a trade offer with rubles only', () => {
      const { initializePlayers, proposeTrade } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false },
        { name: 'Player 2', piece: 'hammer', isStalin: false }
      ])

      const [player1, player2] = useGameStore.getState().players

      proposeTrade(player1.id, player2.id, {
        offering: { rubles: 100, properties: [], gulagCards: 0, favours: 0 },
        requesting: { rubles: 200, properties: [], gulagCards: 0, favours: 0 }
      })

      const { activeTradeOffers } = useGameStore.getState()
      expect(activeTradeOffers).toHaveLength(1)
      expect(activeTradeOffers[0].fromPlayerId).toBe(player1.id)
      expect(activeTradeOffers[0].toPlayerId).toBe(player2.id)
      expect(activeTradeOffers[0].offering.rubles).toBe(100)
      expect(activeTradeOffers[0].requesting.rubles).toBe(200)
      expect(activeTradeOffers[0].status).toBe('pending')
    })

    it('should create a trade offer with properties', () => {
      const { initializePlayers, initializeProperties, proposeTrade } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false },
        { name: 'Player 2', piece: 'hammer', isStalin: false }
      ])

      initializeProperties()
      const [player1, player2] = useGameStore.getState().players
      const properties = useGameStore.getState().properties

      // Get some property IDs
      const prop1 = properties[0].spaceId.toString()
      const prop2 = properties[1].spaceId.toString()

      proposeTrade(player1.id, player2.id, {
        offering: { rubles: 0, properties: [prop1], gulagCards: 0, favours: 0 },
        requesting: { rubles: 0, properties: [prop2], gulagCards: 0, favours: 0 }
      })

      const { activeTradeOffers } = useGameStore.getState()
      expect(activeTradeOffers).toHaveLength(1)
      expect(activeTradeOffers[0].offering.properties).toEqual([prop1])
      expect(activeTradeOffers[0].requesting.properties).toEqual([prop2])
    })

    it('should create a trade offer with mixed items', () => {
      const { initializePlayers, initializeProperties, proposeTrade } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false },
        { name: 'Player 2', piece: 'hammer', isStalin: false }
      ])

      initializeProperties()
      const [player1, player2] = useGameStore.getState().players
      const properties = useGameStore.getState().properties
      const prop1 = properties[0].spaceId.toString()

      proposeTrade(player1.id, player2.id, {
        offering: { rubles: 100, properties: [prop1], gulagCards: 1, favours: 2 },
        requesting: { rubles: 50, properties: [], gulagCards: 0, favours: 1 }
      })

      const { activeTradeOffers } = useGameStore.getState()
      expect(activeTradeOffers).toHaveLength(1)
      expect(activeTradeOffers[0].offering.rubles).toBe(100)
      expect(activeTradeOffers[0].offering.properties).toEqual([prop1])
      expect(activeTradeOffers[0].offering.gulagCards).toBe(1)
      expect(activeTradeOffers[0].offering.favours).toBe(2)
    })

    it('should add log entry when proposing trade', () => {
      const { initializePlayers, proposeTrade } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false },
        { name: 'Player 2', piece: 'hammer', isStalin: false }
      ])

      const [player1, player2] = useGameStore.getState().players
      const initialLogLength = useGameStore.getState().gameLog.length

      proposeTrade(player1.id, player2.id, {
        offering: { rubles: 100, properties: [], gulagCards: 0, favours: 0 },
        requesting: { rubles: 200, properties: [], gulagCards: 0, favours: 0 }
      })

      const { gameLog } = useGameStore.getState()
      expect(gameLog.length).toBe(initialLogLength + 1)
      expect(gameLog[gameLog.length - 1].message).toContain('Player 1 proposed a trade to Player 2')
    })

    it('should set pending action for trade response', () => {
      const { initializePlayers, proposeTrade } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false },
        { name: 'Player 2', piece: 'hammer', isStalin: false }
      ])

      const [player1, player2] = useGameStore.getState().players

      proposeTrade(player1.id, player2.id, {
        offering: { rubles: 100, properties: [], gulagCards: 0, favours: 0 },
        requesting: { rubles: 200, properties: [], gulagCards: 0, favours: 0 }
      })

      const { pendingAction, activeTradeOffers } = useGameStore.getState()
      expect(pendingAction?.type).toBe('trade-response')
      expect(pendingAction?.data.tradeOfferId).toBe(activeTradeOffers[0].id)
    })

    it('should not create trade if fromPlayer does not exist', () => {
      const { initializePlayers, proposeTrade } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])

      const [player1] = useGameStore.getState().players

      proposeTrade('invalid-id', player1.id, {
        offering: { rubles: 100, properties: [], gulagCards: 0, favours: 0 },
        requesting: { rubles: 200, properties: [], gulagCards: 0, favours: 0 }
      })

      const { activeTradeOffers } = useGameStore.getState()
      expect(activeTradeOffers).toHaveLength(0)
    })

    it('should not create trade if toPlayer does not exist', () => {
      const { initializePlayers, proposeTrade } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])

      const [player1] = useGameStore.getState().players

      proposeTrade(player1.id, 'invalid-id', {
        offering: { rubles: 100, properties: [], gulagCards: 0, favours: 0 },
        requesting: { rubles: 200, properties: [], gulagCards: 0, favours: 0 }
      })

      const { activeTradeOffers } = useGameStore.getState()
      expect(activeTradeOffers).toHaveLength(0)
    })
  })

  describe('acceptTrade', () => {
    it('should transfer rubles when accepting trade', () => {
      const { initializePlayers, proposeTrade, acceptTrade, updatePlayer } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false },
        { name: 'Player 2', piece: 'hammer', isStalin: false }
      ])

      const [player1, player2] = useGameStore.getState().players

      // Set up rubles
      updatePlayer(player1.id, { rubles: 500 })
      updatePlayer(player2.id, { rubles: 300 })

      // Need to get fresh player references after update
      const updatedPlayer1Before = useGameStore.getState().players.find(p => p.id === player1.id)!
      const updatedPlayer2Before = useGameStore.getState().players.find(p => p.id === player2.id)!

      proposeTrade(updatedPlayer1Before.id, updatedPlayer2Before.id, {
        offering: { rubles: 100, properties: [], gulagCards: 0, favours: 0 },
        requesting: { rubles: 50, properties: [], gulagCards: 0, favours: 0 }
      })

      const tradeId = useGameStore.getState().activeTradeOffers[0].id
      acceptTrade(tradeId)

      const updatedPlayers = useGameStore.getState().players
      const updatedPlayer1 = updatedPlayers.find(p => p.id === player1.id)
      const updatedPlayer2 = updatedPlayers.find(p => p.id === player2.id)

      expect(updatedPlayer1?.rubles).toBe(500 - 100 + 50) // Lost 100, gained 50
      expect(updatedPlayer2?.rubles).toBe(300 + 100 - 50) // Gained 100, lost 50
    })

    it('should transfer properties when accepting trade', () => {
      const { initializePlayers, initializeProperties, proposeTrade, acceptTrade, setPropertyCustodian, updatePlayer } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false },
        { name: 'Player 2', piece: 'hammer', isStalin: false }
      ])

      initializeProperties()
      const [player1, player2] = useGameStore.getState().players
      const properties = useGameStore.getState().properties

      // Assign properties to players using setPropertyCustodian
      setPropertyCustodian(properties[0].spaceId, player1.id)
      setPropertyCustodian(properties[1].spaceId, player2.id)
      updatePlayer(player1.id, { properties: [properties[0].spaceId.toString()] })
      updatePlayer(player2.id, { properties: [properties[1].spaceId.toString()] })

      proposeTrade(player1.id, player2.id, {
        offering: { rubles: 0, properties: [properties[0].spaceId.toString()], gulagCards: 0, favours: 0 },
        requesting: { rubles: 0, properties: [properties[1].spaceId.toString()], gulagCards: 0, favours: 0 }
      })

      const tradeId = useGameStore.getState().activeTradeOffers[0].id
      acceptTrade(tradeId)

      const updatedProperties = useGameStore.getState().properties
      const prop0 = updatedProperties.find(p => p.spaceId === properties[0].spaceId)
      const prop1 = updatedProperties.find(p => p.spaceId === properties[1].spaceId)

      expect(prop0?.custodianId).toBe(player2.id)
      expect(prop1?.custodianId).toBe(player1.id)
    })

    it('should transfer gulag card when accepting trade', () => {
      const { initializePlayers, proposeTrade, acceptTrade, updatePlayer } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false },
        { name: 'Player 2', piece: 'hammer', isStalin: false }
      ])

      const [player1, player2] = useGameStore.getState().players

      // Give player1 a gulag card
      updatePlayer(player1.id, { hasFreeFromGulagCard: true })

      proposeTrade(player1.id, player2.id, {
        offering: { rubles: 0, properties: [], gulagCards: 1, favours: 0 },
        requesting: { rubles: 0, properties: [], gulagCards: 0, favours: 0 }
      })

      const tradeId = useGameStore.getState().activeTradeOffers[0].id
      acceptTrade(tradeId)

      const updatedPlayers = useGameStore.getState().players
      const updatedPlayer1 = updatedPlayers.find(p => p.id === player1.id)
      const updatedPlayer2 = updatedPlayers.find(p => p.id === player2.id)

      expect(updatedPlayer1?.hasFreeFromGulagCard).toBe(false)
      expect(updatedPlayer2?.hasFreeFromGulagCard).toBe(true)
    })

    it('should transfer gulag card in requesting direction', () => {
      const { initializePlayers, proposeTrade, acceptTrade, updatePlayer } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false },
        { name: 'Player 2', piece: 'hammer', isStalin: false }
      ])

      const [player1, player2] = useGameStore.getState().players

      // Give player2 a gulag card
      updatePlayer(player2.id, { hasFreeFromGulagCard: true })

      proposeTrade(player1.id, player2.id, {
        offering: { rubles: 0, properties: [], gulagCards: 0, favours: 0 },
        requesting: { rubles: 0, properties: [], gulagCards: 1, favours: 0 }
      })

      const tradeId = useGameStore.getState().activeTradeOffers[0].id
      acceptTrade(tradeId)

      const updatedPlayers = useGameStore.getState().players
      const updatedPlayer1 = updatedPlayers.find(p => p.id === player1.id)
      const updatedPlayer2 = updatedPlayers.find(p => p.id === player2.id)

      expect(updatedPlayer1?.hasFreeFromGulagCard).toBe(true)
      expect(updatedPlayer2?.hasFreeFromGulagCard).toBe(false)
    })

    it('should transfer favours when accepting trade', () => {
      const { initializePlayers, proposeTrade, acceptTrade, updatePlayer } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false },
        { name: 'Player 2', piece: 'hammer', isStalin: false }
      ])

      const [player1, player2] = useGameStore.getState().players

      // Player1 owes Player2 2 favours
      updatePlayer(player1.id, { owesFavourTo: [player2.id, player2.id] })

      proposeTrade(player1.id, player2.id, {
        offering: { rubles: 0, properties: [], gulagCards: 0, favours: 1 },
        requesting: { rubles: 0, properties: [], gulagCards: 0, favours: 0 }
      })

      const tradeId = useGameStore.getState().activeTradeOffers[0].id
      acceptTrade(tradeId)

      const updatedPlayers = useGameStore.getState().players
      const updatedPlayer1 = updatedPlayers.find(p => p.id === player1.id)

      expect(updatedPlayer1?.owesFavourTo).toHaveLength(1)
    })

    it('should transfer favours in requesting direction', () => {
      const { initializePlayers, proposeTrade, acceptTrade, updatePlayer } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false },
        { name: 'Player 2', piece: 'hammer', isStalin: false }
      ])

      const [player1, player2] = useGameStore.getState().players

      // Player2 owes Player1 2 favours
      updatePlayer(player2.id, { owesFavourTo: [player1.id, player1.id] })

      proposeTrade(player1.id, player2.id, {
        offering: { rubles: 0, properties: [], gulagCards: 0, favours: 0 },
        requesting: { rubles: 0, properties: [], gulagCards: 0, favours: 1 }
      })

      const tradeId = useGameStore.getState().activeTradeOffers[0].id
      acceptTrade(tradeId)

      const updatedPlayers = useGameStore.getState().players
      const updatedPlayer2 = updatedPlayers.find(p => p.id === player2.id)

      expect(updatedPlayer2?.owesFavourTo).toHaveLength(1)
    })

    it('should handle complex trade with multiple items', () => {
      const { initializePlayers, initializeProperties, proposeTrade, acceptTrade, updatePlayer, setPropertyCustodian } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false },
        { name: 'Player 2', piece: 'hammer', isStalin: false }
      ])

      initializeProperties()
      const [player1, player2] = useGameStore.getState().players
      const properties = useGameStore.getState().properties

      // Set up players
      updatePlayer(player1.id, {
        rubles: 1000,
        hasFreeFromGulagCard: true,
        properties: [properties[0].spaceId.toString()]
      })
      updatePlayer(player2.id, {
        rubles: 800,
        owesFavourTo: [player1.id, player1.id],
        properties: [properties[1].spaceId.toString()]
      })
      setPropertyCustodian(properties[0].spaceId, player1.id)
      setPropertyCustodian(properties[1].spaceId, player2.id)

      proposeTrade(player1.id, player2.id, {
        offering: { rubles: 100, properties: [properties[0].spaceId.toString()], gulagCards: 1, favours: 0 },
        requesting: { rubles: 50, properties: [properties[1].spaceId.toString()], gulagCards: 0, favours: 1 }
      })

      const tradeId = useGameStore.getState().activeTradeOffers[0].id
      acceptTrade(tradeId)

      const updatedPlayers = useGameStore.getState().players
      const updatedPlayer1 = updatedPlayers.find(p => p.id === player1.id)
      const updatedPlayer2 = updatedPlayers.find(p => p.id === player2.id)
      const updatedProperties = useGameStore.getState().properties
      const prop0 = updatedProperties.find(p => p.spaceId === properties[0].spaceId)
      const prop1 = updatedProperties.find(p => p.spaceId === properties[1].spaceId)

      // Check rubles
      expect(updatedPlayer1?.rubles).toBe(1000 - 100 + 50)
      expect(updatedPlayer2?.rubles).toBe(800 + 100 - 50)

      // Check properties
      expect(prop0?.custodianId).toBe(player2.id)
      expect(prop1?.custodianId).toBe(player1.id)

      // Check gulag card
      expect(updatedPlayer1?.hasFreeFromGulagCard).toBe(false)
      expect(updatedPlayer2?.hasFreeFromGulagCard).toBe(true)

      // Check favours
      expect(updatedPlayer2?.owesFavourTo).toHaveLength(1)
    })

    it('should remove trade from activeTradeOffers after accepting', () => {
      const { initializePlayers, proposeTrade, acceptTrade } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false },
        { name: 'Player 2', piece: 'hammer', isStalin: false }
      ])

      const [player1, player2] = useGameStore.getState().players

      proposeTrade(player1.id, player2.id, {
        offering: { rubles: 100, properties: [], gulagCards: 0, favours: 0 },
        requesting: { rubles: 50, properties: [], gulagCards: 0, favours: 0 }
      })

      expect(useGameStore.getState().activeTradeOffers).toHaveLength(1)

      const tradeId = useGameStore.getState().activeTradeOffers[0].id
      acceptTrade(tradeId)

      expect(useGameStore.getState().activeTradeOffers).toHaveLength(0)
    })

    it('should add log entry when accepting trade', () => {
      const { initializePlayers, proposeTrade, acceptTrade } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false },
        { name: 'Player 2', piece: 'hammer', isStalin: false }
      ])

      const [player1, player2] = useGameStore.getState().players

      proposeTrade(player1.id, player2.id, {
        offering: { rubles: 100, properties: [], gulagCards: 0, favours: 0 },
        requesting: { rubles: 50, properties: [], gulagCards: 0, favours: 0 }
      })

      const initialLogLength = useGameStore.getState().gameLog.length
      const tradeId = useGameStore.getState().activeTradeOffers[0].id
      acceptTrade(tradeId)

      const { gameLog } = useGameStore.getState()
      expect(gameLog.length).toBe(initialLogLength + 1)
      expect(gameLog[gameLog.length - 1].message).toContain('Player 2 accepted trade from Player 1')
      expect(gameLog[gameLog.length - 1].type).toBe('property')
    })

    it('should do nothing if trade does not exist', () => {
      const { initializePlayers, acceptTrade, updatePlayer } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])

      const [player1] = useGameStore.getState().players
      updatePlayer(player1.id, { rubles: 500 })

      acceptTrade('invalid-trade-id')

      const updatedPlayer = useGameStore.getState().players.find(p => p.id === player1.id)
      expect(updatedPlayer?.rubles).toBe(500) // No change
    })

    it('should do nothing if fromPlayer does not exist', () => {
      const { initializePlayers, proposeTrade, acceptTrade } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false },
        { name: 'Player 2', piece: 'hammer', isStalin: false }
      ])

      const [player1, player2] = useGameStore.getState().players

      proposeTrade(player1.id, player2.id, {
        offering: { rubles: 100, properties: [], gulagCards: 0, favours: 0 },
        requesting: { rubles: 50, properties: [], gulagCards: 0, favours: 0 }
      })

      const tradeId = useGameStore.getState().activeTradeOffers[0].id

      // Manually modify the trade to have invalid fromPlayerId
      useGameStore.setState({
        activeTradeOffers: [{
          ...useGameStore.getState().activeTradeOffers[0],
          fromPlayerId: 'invalid-id'
        }]
      })

      const initialLogLength = useGameStore.getState().gameLog.length
      acceptTrade(tradeId)

      // Trade should not be removed
      expect(useGameStore.getState().activeTradeOffers).toHaveLength(1)
      // No log entry should be added
      expect(useGameStore.getState().gameLog.length).toBe(initialLogLength)
    })
  })

  describe('rejectTrade', () => {
    it('should remove trade from activeTradeOffers when rejecting', () => {
      const { initializePlayers, proposeTrade, rejectTrade } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false },
        { name: 'Player 2', piece: 'hammer', isStalin: false }
      ])

      const [player1, player2] = useGameStore.getState().players

      proposeTrade(player1.id, player2.id, {
        offering: { rubles: 100, properties: [], gulagCards: 0, favours: 0 },
        requesting: { rubles: 50, properties: [], gulagCards: 0, favours: 0 }
      })

      expect(useGameStore.getState().activeTradeOffers).toHaveLength(1)

      const tradeId = useGameStore.getState().activeTradeOffers[0].id
      rejectTrade(tradeId)

      expect(useGameStore.getState().activeTradeOffers).toHaveLength(0)
    })

    it('should add log entry when rejecting trade', () => {
      const { initializePlayers, proposeTrade, rejectTrade } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false },
        { name: 'Player 2', piece: 'hammer', isStalin: false }
      ])

      const [player1, player2] = useGameStore.getState().players

      proposeTrade(player1.id, player2.id, {
        offering: { rubles: 100, properties: [], gulagCards: 0, favours: 0 },
        requesting: { rubles: 50, properties: [], gulagCards: 0, favours: 0 }
      })

      const initialLogLength = useGameStore.getState().gameLog.length
      const tradeId = useGameStore.getState().activeTradeOffers[0].id
      rejectTrade(tradeId)

      const { gameLog } = useGameStore.getState()
      expect(gameLog.length).toBe(initialLogLength + 1)
      expect(gameLog[gameLog.length - 1].message).toContain('Player 2 rejected trade from Player 1')
      expect(gameLog[gameLog.length - 1].type).toBe('system')
    })

    it('should not transfer any items when rejecting trade', () => {
      const { initializePlayers, proposeTrade, rejectTrade, updatePlayer } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false },
        { name: 'Player 2', piece: 'hammer', isStalin: false }
      ])

      const [player1, player2] = useGameStore.getState().players

      updatePlayer(player1.id, { rubles: 500 })
      updatePlayer(player2.id, { rubles: 300 })

      proposeTrade(player1.id, player2.id, {
        offering: { rubles: 100, properties: [], gulagCards: 0, favours: 0 },
        requesting: { rubles: 50, properties: [], gulagCards: 0, favours: 0 }
      })

      const tradeId = useGameStore.getState().activeTradeOffers[0].id
      rejectTrade(tradeId)

      const updatedPlayers = useGameStore.getState().players
      const updatedPlayer1 = updatedPlayers.find(p => p.id === player1.id)
      const updatedPlayer2 = updatedPlayers.find(p => p.id === player2.id)

      expect(updatedPlayer1?.rubles).toBe(500)
      expect(updatedPlayer2?.rubles).toBe(300)
    })

    it('should do nothing if trade does not exist', () => {
      const { initializePlayers, rejectTrade } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])

      const initialLogLength = useGameStore.getState().gameLog.length

      rejectTrade('invalid-trade-id')

      expect(useGameStore.getState().gameLog.length).toBe(initialLogLength)
    })

    it('should handle rejection when fromPlayer does not exist', () => {
      const { initializePlayers, proposeTrade, rejectTrade } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false },
        { name: 'Player 2', piece: 'hammer', isStalin: false }
      ])

      const [player1, player2] = useGameStore.getState().players

      proposeTrade(player1.id, player2.id, {
        offering: { rubles: 100, properties: [], gulagCards: 0, favours: 0 },
        requesting: { rubles: 50, properties: [], gulagCards: 0, favours: 0 }
      })

      const tradeId = useGameStore.getState().activeTradeOffers[0].id

      // Manually modify the trade to have invalid fromPlayerId
      useGameStore.setState({
        activeTradeOffers: [{
          ...useGameStore.getState().activeTradeOffers[0],
          fromPlayerId: 'invalid-id'
        }]
      })

      const initialLogLength = useGameStore.getState().gameLog.length
      rejectTrade(tradeId)

      // Trade should still be removed
      expect(useGameStore.getState().activeTradeOffers).toHaveLength(0)
      // No log entry should be added (because players don't exist)
      expect(useGameStore.getState().gameLog.length).toBe(initialLogLength)
    })
  })
})
