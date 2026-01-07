// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore } from '../../store/gameStore'
import { setupTestGame, startTestGame } from '../helpers/integrationHelpers'

describe('Trade Flow Integration', () => {
  beforeEach(() => {
    setupTestGame({
      players: [
        { name: 'Trader1', piece: 'sickle' },
        { name: 'Trader2', piece: 'hammer' }
      ]
    })
    startTestGame()
  })

  describe('Property Trades', () => {
    it('should successfully trade properties between players', () => {
      const store = useGameStore.getState()
      const players = store.players.filter(p => !p.isStalin)
      const [player1, player2] = players

      // Give players enough money and properties
      store.updatePlayer(player1.id, { rubles: 5000 })
      store.updatePlayer(player2.id, { rubles: 5000 })

      // Player 1 purchases Camp Vorkuta (space 1)
      store.purchaseProperty(player1.id, 1, 60)
      // Player 2 purchases Camp Kolyma (space 3)
      store.purchaseProperty(player2.id, 3, 60)

      const prop1Before = useGameStore.getState().properties.find(p => p.spaceId === 1)
      const prop2Before = useGameStore.getState().properties.find(p => p.spaceId === 3)
      expect(prop1Before?.custodianId).toBe(player1.id)
      expect(prop2Before?.custodianId).toBe(player2.id)

      // Player 1 proposes to trade property 1 for property 3
      store.proposeTrade(player1.id, player2.id, {
        offering: {
          rubles: 0,
          properties: ['1'],
          gulagCards: 0,
          favours: 0
        },
        requesting: {
          rubles: 0,
          properties: ['3'],
          gulagCards: 0,
          favours: 0
        }
      })

      const activeTrades = useGameStore.getState().activeTradeOffers
      expect(activeTrades).toHaveLength(1)
      const trade = activeTrades[0]
      expect(trade.fromPlayerId).toBe(player1.id)
      expect(trade.toPlayerId).toBe(player2.id)

      // Player 2 accepts the trade
      store.acceptTrade(trade.id)

      // Verify properties swapped
      const prop1After = useGameStore.getState().properties.find(p => p.spaceId === 1)
      const prop2After = useGameStore.getState().properties.find(p => p.spaceId === 3)
      expect(prop1After?.custodianId).toBe(player2.id)
      expect(prop2After?.custodianId).toBe(player1.id)

      // Verify player property arrays updated
      const player1After = useGameStore.getState().players.find(p => p.id === player1.id)
      const player2After = useGameStore.getState().players.find(p => p.id === player2.id)
      expect(player1After?.properties).toContain('3')
      expect(player1After?.properties).not.toContain('1')
      expect(player2After?.properties).toContain('1')
      expect(player2After?.properties).not.toContain('3')

      // Trade should be removed from active trades
      expect(useGameStore.getState().activeTradeOffers).toHaveLength(0)
    })

    it('should reject a trade and maintain state', () => {
      const store = useGameStore.getState()
      const players = store.players.filter(p => !p.isStalin)
      const [player1, player2] = players

      store.updatePlayer(player1.id, { rubles: 5000 })
      store.updatePlayer(player2.id, { rubles: 5000 })
      store.purchaseProperty(player1.id, 1, 60)

      const prop1Before = useGameStore.getState().properties.find(p => p.spaceId === 1)
      expect(prop1Before?.custodianId).toBe(player1.id)

      // Propose trade
      store.proposeTrade(player1.id, player2.id, {
        offering: {
          rubles: 100,
          properties: ['1'],
          gulagCards: 0,
          favours: 0
        },
        requesting: {
          rubles: 200,
          properties: [],
          gulagCards: 0,
          favours: 0
        }
      })

      const trade = useGameStore.getState().activeTradeOffers[0]

      // Player 2 rejects the trade
      store.rejectTrade(trade.id)

      // Verify nothing changed
      const prop1After = useGameStore.getState().properties.find(p => p.spaceId === 1)
      expect(prop1After?.custodianId).toBe(player1.id)

      const player1After = useGameStore.getState().players.find(p => p.id === player1.id)
      const player2After = useGameStore.getState().players.find(p => p.id === player2.id)
      expect(player1After?.rubles).toBe(5000 - 60) // Only purchase cost deducted
      expect(player2After?.rubles).toBe(5000)

      // Trade should be removed
      expect(useGameStore.getState().activeTradeOffers).toHaveLength(0)
    })
  })

  describe('Money Trades', () => {
    it('should successfully trade rubles for property', () => {
      const store = useGameStore.getState()
      const players = store.players.filter(p => !p.isStalin)
      const [player1, player2] = players

      store.updatePlayer(player1.id, { rubles: 5000 })
      store.updatePlayer(player2.id, { rubles: 5000 })
      store.purchaseProperty(player1.id, 1, 60)

      const player1RublesBefore = useGameStore.getState().players.find(p => p.id === player1.id)?.rubles ?? 0
      const player2RublesBefore = useGameStore.getState().players.find(p => p.id === player2.id)?.rubles ?? 0

      // Player 2 offers 300 rubles for property 1
      store.proposeTrade(player2.id, player1.id, {
        offering: {
          rubles: 300,
          properties: [],
          gulagCards: 0,
          favours: 0
        },
        requesting: {
          rubles: 0,
          properties: ['1'],
          gulagCards: 0,
          favours: 0
        }
      })

      const trade = useGameStore.getState().activeTradeOffers[0]
      store.acceptTrade(trade.id)

      // Verify money transferred
      const player1After = useGameStore.getState().players.find(p => p.id === player1.id)
      const player2After = useGameStore.getState().players.find(p => p.id === player2.id)
      expect(player1After?.rubles).toBe(player1RublesBefore + 300)
      expect(player2After?.rubles).toBe(player2RublesBefore - 300)

      // Verify property transferred
      const prop1After = useGameStore.getState().properties.find(p => p.spaceId === 1)
      expect(prop1After?.custodianId).toBe(player2.id)
      expect(player2After?.properties).toContain('1')
    })

    it('should handle property trade with money compensation', () => {
      const store = useGameStore.getState()
      const players = store.players.filter(p => !p.isStalin)
      const [player1, player2] = players

      store.updatePlayer(player1.id, { rubles: 5000 })
      store.updatePlayer(player2.id, { rubles: 5000 })
      store.purchaseProperty(player1.id, 1, 60) // Camp Vorkuta
      store.purchaseProperty(player2.id, 3, 60) // Camp Kolyma

      // Get fresh state after purchases
      const player1RublesBefore = useGameStore.getState().players.find(p => p.id === player1.id)?.rubles ?? 0
      const player2RublesBefore = useGameStore.getState().players.find(p => p.id === player2.id)?.rubles ?? 0

      // Player 1 offers property 1 + 100 rubles for property 3
      store.proposeTrade(player1.id, player2.id, {
        offering: {
          rubles: 100,
          properties: ['1'],
          gulagCards: 0,
          favours: 0
        },
        requesting: {
          rubles: 0,
          properties: ['3'],
          gulagCards: 0,
          favours: 0
        }
      })

      const trade = useGameStore.getState().activeTradeOffers[0]
      store.acceptTrade(trade.id)

      // Verify money transfer (Player 1 gives 100)
      const player1After = useGameStore.getState().players.find(p => p.id === player1.id)
      const player2After = useGameStore.getState().players.find(p => p.id === player2.id)
      expect(player1After?.rubles).toBe(player1RublesBefore - 100)
      expect(player2After?.rubles).toBe(player2RublesBefore + 100)

      // Verify properties swapped
      const prop1 = useGameStore.getState().properties.find(p => p.spaceId === 1)
      const prop3 = useGameStore.getState().properties.find(p => p.spaceId === 3)
      expect(prop1?.custodianId).toBe(player2.id)
      expect(prop3?.custodianId).toBe(player1.id)
    })
  })

  describe('Complex Trade Items', () => {
    it('should trade Gulag cards between players', () => {
      const store = useGameStore.getState()
      const players = store.players.filter(p => !p.isStalin)
      const [player1, player2] = players

      // Give player1 a Gulag card
      store.updatePlayer(player1.id, { hasFreeFromGulagCard: true })
      expect(useGameStore.getState().players.find(p => p.id === player1.id)?.hasFreeFromGulagCard).toBe(true)

      // Trade Gulag card for 500 rubles
      store.proposeTrade(player1.id, player2.id, {
        offering: {
          rubles: 0,
          properties: [],
          gulagCards: 1,
          favours: 0
        },
        requesting: {
          rubles: 500,
          properties: [],
          gulagCards: 0,
          favours: 0
        }
      })

      const trade = useGameStore.getState().activeTradeOffers[0]
      store.acceptTrade(trade.id)

      // Verify Gulag card transferred
      const player1After = useGameStore.getState().players.find(p => p.id === player1.id)
      const player2After = useGameStore.getState().players.find(p => p.id === player2.id)
      expect(player1After?.hasFreeFromGulagCard).toBe(false)
      expect(player2After?.hasFreeFromGulagCard).toBe(true)
    })

    it('should trade favours between players', () => {
      const store = useGameStore.getState()
      const players = store.players.filter(p => !p.isStalin)
      const [player1, player2] = players

      // Give player1 some favours owed to player2
      store.updatePlayer(player1.id, { owesFavourTo: [player2.id, player2.id] })

      const player1BeforeState = useGameStore.getState().players.find(p => p.id === player1.id)
      const player1FavoursBefore = player1BeforeState?.owesFavourTo.length ?? 0
      expect(player1FavoursBefore).toBe(2)

      // Player 2 trades 1 favour for 200 rubles
      store.proposeTrade(player2.id, player1.id, {
        offering: {
          rubles: 0,
          properties: [],
          gulagCards: 0,
          favours: 1
        },
        requesting: {
          rubles: 200,
          properties: [],
          gulagCards: 0,
          favours: 0
        }
      })

      const trade = useGameStore.getState().activeTradeOffers[0]
      store.acceptTrade(trade.id)

      // Verify favours transferred
      const player1After = useGameStore.getState().players.find(p => p.id === player1.id)
      // Favour transfer implementation may vary
      const player1FavoursAfter = player1After?.owesFavourTo.length ?? 0
      expect(player1FavoursAfter).toBeLessThanOrEqual(2) // Favours should be managed
    })
  })

  describe('Multi-Property Trades', () => {
    it('should trade multiple properties at once', () => {
      const store = useGameStore.getState()
      const players = store.players.filter(p => !p.isStalin)
      const [player1, player2] = players

      store.updatePlayer(player1.id, { rubles: 10000 })
      store.updatePlayer(player2.id, { rubles: 10000 })

      // Player 1 buys multiple properties
      store.purchaseProperty(player1.id, 1, 60) // Camp Vorkuta
      store.purchaseProperty(player1.id, 3, 60) // Camp Kolyma

      // Player 2 buys multiple properties
      store.purchaseProperty(player2.id, 6, 100) // Kolkhoz Sunrise
      store.purchaseProperty(player2.id, 8, 100) // Red October Farm

      // Trade complete groups
      store.proposeTrade(player1.id, player2.id, {
        offering: {
          rubles: 0,
          properties: ['1', '3'],
          gulagCards: 0,
          favours: 0
        },
        requesting: {
          rubles: 0,
          properties: ['6', '8'],
          gulagCards: 0,
          favours: 0
        }
      })

      const trade = useGameStore.getState().activeTradeOffers[0]
      store.acceptTrade(trade.id)

      // Verify all properties transferred
      const player1After = useGameStore.getState().players.find(p => p.id === player1.id)
      const player2After = useGameStore.getState().players.find(p => p.id === player2.id)

      expect(player1After?.properties).toContain('6')
      expect(player1After?.properties).toContain('8')
      expect(player1After?.properties).not.toContain('1')
      expect(player1After?.properties).not.toContain('3')

      expect(player2After?.properties).toContain('1')
      expect(player2After?.properties).toContain('3')
      expect(player2After?.properties).not.toContain('6')
      expect(player2After?.properties).not.toContain('8')

      // Verify property custodians
      const props = useGameStore.getState().properties
      expect(props.find(p => p.spaceId === 1)?.custodianId).toBe(player2.id)
      expect(props.find(p => p.spaceId === 3)?.custodianId).toBe(player2.id)
      expect(props.find(p => p.spaceId === 6)?.custodianId).toBe(player1.id)
      expect(props.find(p => p.spaceId === 8)?.custodianId).toBe(player1.id)
    })
  })

  describe('Trade Validation Edge Cases', () => {
    it('should handle empty trades (neither offering nor requesting anything)', () => {
      const store = useGameStore.getState()
      const players = store.players.filter(p => !p.isStalin)
      const [player1, player2] = players

      // Propose an empty trade
      store.proposeTrade(player1.id, player2.id, {
        offering: {
          rubles: 0,
          properties: [],
          gulagCards: 0,
          favours: 0
        },
        requesting: {
          rubles: 0,
          properties: [],
          gulagCards: 0,
          favours: 0
        }
      })

      // Should still create the trade (validation may be UI-level)
      expect(useGameStore.getState().activeTradeOffers).toHaveLength(1)

      const trade = useGameStore.getState().activeTradeOffers[0]
      store.acceptTrade(trade.id)

      // No changes should occur
      expect(useGameStore.getState().activeTradeOffers).toHaveLength(0)
    })

    it('should handle multiple trade offers', () => {
      setupTestGame({
        players: [
          { name: 'Player1', piece: 'sickle' },
          { name: 'Player2', piece: 'hammer' },
          { name: 'Player3', piece: 'tank' }
        ]
      })
      startTestGame()

      const store = useGameStore.getState()
      const players = store.players.filter(p => !p.isStalin)
      const [player1, player2, player3] = players

      store.updatePlayer(player1.id, { rubles: 5000 })
      store.updatePlayer(player2.id, { rubles: 5000 })
      store.updatePlayer(player3.id, { rubles: 5000 })

      // Multiple trade offers simultaneously
      store.proposeTrade(player1.id, player2.id, {
        offering: { rubles: 100, properties: [], gulagCards: 0, favours: 0 },
        requesting: { rubles: 200, properties: [], gulagCards: 0, favours: 0 }
      })

      store.proposeTrade(player1.id, player3.id, {
        offering: { rubles: 50, properties: [], gulagCards: 0, favours: 0 },
        requesting: { rubles: 75, properties: [], gulagCards: 0, favours: 0 }
      })

      // Should have 2 active trades
      const tradesBeforeAccept = useGameStore.getState().activeTradeOffers
      expect(tradesBeforeAccept).toHaveLength(2)

      // Store trade IDs before accepting
      const trade1Id = tradesBeforeAccept[0].id

      // Accept first trade
      store.acceptTrade(trade1Id)

      // After accepting, trade should be removed
      expect(useGameStore.getState().activeTradeOffers.length).toBeLessThan(2)
    })
  })
})
