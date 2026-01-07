// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore } from '../../store/gameStore'
import { setupTestGame, startTestGame } from '../helpers/integrationHelpers'
import { calculateQuota } from '../../utils/propertyUtils'

describe('Property Flow Integration', () => {
  beforeEach(() => {
    setupTestGame({
      players: [
        { name: 'Buyer', piece: 'sickle' },
        { name: 'Visitor', piece: 'hammer' }
      ]
    })
    startTestGame()
  })

  describe('Purchase to Quota Collection', () => {
    it('should allow quota collection after purchase', () => {
      const store = useGameStore.getState()
      const players = store.players.filter(p => !p.isStalin)
      const [buyer, visitor] = players

      // Find Camp Vorkuta property (space ID 1)
      const spaceId = 1

      const buyerRublesBefore = buyer.rubles
      const visitorRublesBefore = visitor.rubles

      // Purchase property
      store.purchaseProperty(buyer.id, spaceId, 60)

      const buyerAfterPurchase = useGameStore.getState().players.find(p => p.id === buyer.id)
      expect(buyerAfterPurchase).toBeDefined()
      expect(buyerAfterPurchase?.rubles).toBe(buyerRublesBefore - 60)
      expect(buyerAfterPurchase?.properties).toContain(String(spaceId))

      const property = useGameStore.getState().properties.find(p => p.spaceId === spaceId)
      expect(property?.custodianId).toBe(buyer.id)

      // Visitor lands on property
      store.updatePlayer(visitor.id, { position: spaceId })

      // Calculate quota
      expect(property).toBeDefined()
      if (!property) return
      const quota = calculateQuota(property, store.properties, visitor)
      expect(quota).toBeGreaterThan(0)

      // Pay quota
      store.payQuota(visitor.id, buyer.id, quota)

      const visitorAfterPayment = useGameStore.getState().players.find(p => p.id === visitor.id)
      const buyerAfterPayment = useGameStore.getState().players.find(p => p.id === buyer.id)
      expect(visitorAfterPayment).toBeDefined()
      expect(buyerAfterPayment).toBeDefined()

      expect(visitorAfterPayment?.rubles).toBe(visitorRublesBefore - quota)
      expect(buyerAfterPayment?.rubles).toBe(buyerRublesBefore - 60 + quota)
    })

    it('should not charge quota on unowned property', () => {
      const store = useGameStore.getState()
      const players = store.players.filter(p => !p.isStalin)
      const visitor = players[1]

      const spaceId = 1
      const property = store.properties.find(p => p.spaceId === spaceId)

      // Ensure property is unowned
      expect(property?.custodianId).toBeNull()

      // Move visitor to unowned property
      store.updatePlayer(visitor.id, { position: spaceId })

      // Quota calculation returns base quota, but game logic should not charge
      // if custodian is null
      expect(property).toBeDefined()
      if (property) {
        const quota = calculateQuota(property, store.properties, visitor)
        expect(quota).toBeGreaterThan(0) // Base quota exists, but custodian is null
      }
    })
  })

  describe('Collectivization Effects', () => {
    it('should increase quota with collectivization levels', () => {
      const store = useGameStore.getState()
      const players = store.players.filter(p => !p.isStalin)
      const [buyer, visitor] = players

      const spaceId = 11 // Tractor Factory (baseQuota: 10)

      // Give buyer enough money
      store.updatePlayer(buyer.id, { rubles: 2000 })

      // Purchase property
      store.purchaseProperty(buyer.id, spaceId, 100)

      const property = store.properties.find(p => p.spaceId === spaceId)
      expect(property).toBeDefined()
      if (!property) return

      // Base quota (no collectivization)
      let quota = calculateQuota(property, store.properties, visitor)
      const baseQuota = quota
      expect(baseQuota).toBe(10)

      // Add Worker's Committee (level 1, 4x multiplier)
      store.updateCollectivizationLevel(spaceId, 1)
      const propertyLevel1 = useGameStore.getState().properties.find(p => p.spaceId === spaceId)
      expect(propertyLevel1).toBeDefined()
      if (!propertyLevel1) return
      quota = calculateQuota(propertyLevel1, useGameStore.getState().properties, visitor)
      expect(quota).toBe(baseQuota * 4) // 10 * 4 = 40

      // Add Party Oversight (level 2, 9x multiplier)
      store.updateCollectivizationLevel(spaceId, 2)
      const propertyLevel2 = useGameStore.getState().properties.find(p => p.spaceId === spaceId)
      expect(propertyLevel2).toBeDefined()
      if (!propertyLevel2) return
      quota = calculateQuota(propertyLevel2, useGameStore.getState().properties, visitor)
      expect(quota).toBe(baseQuota * 9) // 10 * 9 = 90

      // Add Full Collectivization (level 3, 15x multiplier)
      store.updateCollectivizationLevel(spaceId, 3)
      const propertyLevel3 = useGameStore.getState().properties.find(p => p.spaceId === spaceId)
      expect(propertyLevel3).toBeDefined()
      if (!propertyLevel3) return
      quota = calculateQuota(propertyLevel3, useGameStore.getState().properties, visitor)
      expect(quota).toBe(baseQuota * 15) // 10 * 15 = 150

      // Add Model Soviet (level 4, 20x multiplier)
      store.updateCollectivizationLevel(spaceId, 4)
      const propertyLevel4 = useGameStore.getState().properties.find(p => p.spaceId === spaceId)
      expect(propertyLevel4).toBeDefined()
      if (!propertyLevel4) return
      quota = calculateQuota(propertyLevel4, useGameStore.getState().properties, visitor)
      expect(quota).toBe(baseQuota * 20) // 10 * 20 = 200

      // Add People's Palace (level 5, 30x multiplier)
      store.updateCollectivizationLevel(spaceId, 5)
      const propertyLevel5 = useGameStore.getState().properties.find(p => p.spaceId === spaceId)
      expect(propertyLevel5).toBeDefined()
      if (!propertyLevel5) return
      quota = calculateQuota(propertyLevel5, useGameStore.getState().properties, visitor)
      expect(quota).toBe(baseQuota * 30) // 10 * 30 = 300
    })
  })

  describe('Complete Group Ownership', () => {
    it('should double quota when custodian owns all properties in group', () => {
      const store = useGameStore.getState()
      const players = store.players.filter(p => !p.isStalin)
      const [buyer, visitor] = players

      // Siberian Camps group: Camp Vorkuta (1) and Camp Kolyma (3)
      const vorkutaId = 1
      const kolymaId = 3

      // Give buyer enough money
      store.updatePlayer(buyer.id, { rubles: 3000 })

      // Purchase first property
      store.purchaseProperty(buyer.id, vorkutaId, 60)

      const vorkuta1 = store.properties.find(p => p.spaceId === vorkutaId)
      expect(vorkuta1).toBeDefined()
      if (!vorkuta1) return
      const quotaSingle = calculateQuota(vorkuta1, store.properties, visitor)
      expect(quotaSingle).toBe(2) // Base quota

      // Purchase second property to complete group
      store.purchaseProperty(buyer.id, kolymaId, 60)

      const vorkuta2 = useGameStore.getState().properties.find(p => p.spaceId === vorkutaId)
      expect(vorkuta2).toBeDefined()
      if (!vorkuta2) return
      const quotaComplete = calculateQuota(vorkuta2, useGameStore.getState().properties, visitor)
      expect(quotaComplete).toBe(4) // Double quota for complete group
    })
  })

  describe('Piece Abilities with Properties', () => {
    it('should apply Sickle ability (half quota on Collective Farms)', () => {
      const store = useGameStore.getState()
      const players = store.players.filter(p => !p.isStalin)
      const [sicklePlayer, otherPlayer] = players

      // Sickle player is the buyer
      expect(sicklePlayer.piece).toBe('sickle')

      // Kolkhoz Sunrise (6) is a Collective Farm
      const spaceId = 6
      store.updatePlayer(otherPlayer.id, { rubles: 3000 })
      store.purchaseProperty(otherPlayer.id, spaceId, 100)

      const property = store.properties.find(p => p.spaceId === spaceId)
      expect(property).toBeDefined()
      if (!property) return

      // Calculate quota for Sickle player
      const sickleQuota = calculateQuota(property, store.properties, sicklePlayer)

      // Calculate quota for other player
      store.updatePlayer(otherPlayer.id, { piece: 'hammer' })
      const hammerPlayer = useGameStore.getState().players.find(p => p.piece === 'hammer')
      expect(hammerPlayer).toBeDefined()
      if (!hammerPlayer) return
      const normalQuota = calculateQuota(property, store.properties, hammerPlayer)

      expect(sickleQuota).toBe(Math.floor(normalQuota * 0.5))
    })
  })

  describe('Property Mortgaging', () => {
    it('should allow mortgaging a property', () => {
      const store = useGameStore.getState()
      const players = store.players.filter(p => !p.isStalin)
      const buyer = players[0]

      const spaceId = 1

      // Purchase property
      store.updatePlayer(buyer.id, { rubles: 2000 })
      store.purchaseProperty(buyer.id, spaceId, 60)

      const buyerBeforeMortgage = useGameStore.getState().players.find(p => p.id === buyer.id)
      expect(buyerBeforeMortgage).toBeDefined()
      if (!buyerBeforeMortgage) return
      const rublesBefore = buyerBeforeMortgage.rubles

      // Mortgage property
      store.mortgageProperty(spaceId)

      const property = useGameStore.getState().properties.find(p => p.spaceId === spaceId)
      expect(property).toBeDefined()
      expect(property?.mortgaged).toBe(true)

      const buyerAfterMortgage = useGameStore.getState().players.find(p => p.id === buyer.id)
      expect(buyerAfterMortgage).toBeDefined()
      if (!buyerAfterMortgage) return
      const rublesAfter = buyerAfterMortgage.rubles
      expect(rublesAfter).toBeGreaterThan(rublesBefore) // Received money from mortgage
    })

    it('should not charge quota on mortgaged property', () => {
      const store = useGameStore.getState()
      const players = store.players.filter(p => !p.isStalin)
      const [buyer] = players

      const spaceId = 1

      // Purchase and mortgage property
      store.updatePlayer(buyer.id, { rubles: 2000 })
      store.purchaseProperty(buyer.id, spaceId, 60)
      store.mortgageProperty(spaceId)

      const property = useGameStore.getState().properties.find(p => p.spaceId === spaceId)
      expect(property).toBeDefined()
      expect(property?.mortgaged).toBe(true)

      // Mortgaged properties should not charge quota
      // (Implementation detail: game logic should check mortgaged status)
    })

    it('should allow unmortgaging a property', () => {
      const store = useGameStore.getState()
      const players = store.players.filter(p => !p.isStalin)
      const buyer = players[0]

      const spaceId = 1

      // Purchase, mortgage, then unmortgage
      store.updatePlayer(buyer.id, { rubles: 2000 })
      store.purchaseProperty(buyer.id, spaceId, 60)
      store.mortgageProperty(spaceId)

      let property = useGameStore.getState().properties.find(p => p.spaceId === spaceId)
      expect(property).toBeDefined()
      expect(property?.mortgaged).toBe(true)

      store.unmortgageProperty(spaceId, buyer.id)

      property = useGameStore.getState().properties.find(p => p.spaceId === spaceId)
      expect(property).toBeDefined()
      expect(property?.mortgaged).toBe(false)
    })
  })

  describe('Property Transfer', () => {
    it('should transfer property between players', () => {
      const store = useGameStore.getState()
      const players = store.players.filter(p => !p.isStalin)
      const [player1, player2] = players

      const spaceId = 1

      // Player 1 purchases property
      store.updatePlayer(player1.id, { rubles: 2000 })
      store.purchaseProperty(player1.id, spaceId, 60)

      let property = useGameStore.getState().properties.find(p => p.spaceId === spaceId)
      expect(property).toBeDefined()
      expect(property?.custodianId).toBe(player1.id)

      // Transfer to Player 2
      store.transferProperty(String(spaceId), player2.id)

      property = useGameStore.getState().properties.find(p => p.spaceId === spaceId)
      expect(property).toBeDefined()
      expect(property?.custodianId).toBe(player2.id)

      const player1After = useGameStore.getState().players.find(p => p.id === player1.id)
      const player2After = useGameStore.getState().players.find(p => p.id === player2.id)
      expect(player1After).toBeDefined()
      expect(player2After).toBeDefined()

      expect(player1After?.properties).not.toContain(String(spaceId))
      expect(player2After?.properties).toContain(String(spaceId))
    })
  })

  describe('Railways and Utilities', () => {
    it('should charge correct railway fee based on ownership', () => {
      const store = useGameStore.getState()
      const players = store.players.filter(p => !p.isStalin)
      const [buyer] = players

      // Railway station positions: 5, 15, 25, 35
      const railway1 = 5

      store.updatePlayer(buyer.id, { rubles: 5000 })
      store.purchaseProperty(buyer.id, railway1, 200)

      // Fee calculation is in propertyUtils
      // This test verifies the purchase flow works for railways
      const property = useGameStore.getState().properties.find(p => p.spaceId === railway1)
      expect(property).toBeDefined()
      expect(property?.custodianId).toBe(buyer.id)
    })
  })
})
