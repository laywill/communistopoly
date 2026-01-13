// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore } from '../../../store/gameStore'
import type { Property } from '../../../types/game'
import { calculateQuota, calculateRailwayFee } from '../../../utils/propertyUtils'
import { createTestPlayer, createTestProperty } from '../../helpers/gameStateHelpers'

describe('gameStore - Property Transactions', () => {
  beforeEach(() => {
    // Reset store to clean state
    useGameStore.setState({
      gamePhase: 'playing',
      players: [],
      properties: [],
      gameLog: [],
      stateTreasury: 1000,
      turnPhase: 'pre-roll',
      pendingAction: null
    })
  })

  describe('purchaseProperty', () => {
    it('should allow player to purchase unowned property', () => {
      const { initializePlayers, initializeProperties, purchaseProperty } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])
      initializeProperties()

      const [player1] = useGameStore.getState().players
      const initialRubles = player1.rubles

      purchaseProperty(player1.id, 3, 60) // Space 3 = Gulag Mines, baseCost 60

      const updatedPlayer = useGameStore.getState().players.find(p => p.id === player1.id)
      expect(updatedPlayer?.rubles).toBe(initialRubles - 60)
    })

    it('should set property custodianId to player', () => {
      const { initializePlayers, initializeProperties, purchaseProperty } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])
      initializeProperties()

      const [player1] = useGameStore.getState().players

      purchaseProperty(player1.id, 3, 60)

      const property = useGameStore.getState().properties.find(p => p.spaceId === 3)
      expect(property?.custodianId).toBe(player1.id)
    })

    it('should add property to player properties array', () => {
      const { initializePlayers, initializeProperties, purchaseProperty } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])
      initializeProperties()

      const [player1] = useGameStore.getState().players

      expect(player1.properties).toEqual([])

      purchaseProperty(player1.id, 3, 60)

      const updatedPlayer = useGameStore.getState().players.find(p => p.id === player1.id)
      expect(updatedPlayer?.properties).toContain('3')
    })

    it('should add purchase amount to state treasury', () => {
      const { initializePlayers, initializeProperties, purchaseProperty } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])
      initializeProperties()

      const [player1] = useGameStore.getState().players
      const initialTreasury = useGameStore.getState().stateTreasury

      purchaseProperty(player1.id, 3, 60)

      const state = useGameStore.getState()
      expect(state.stateTreasury).toBe(initialTreasury + 60)
    })

    it('should add log entry for property purchase', () => {
      const { initializePlayers, initializeProperties, purchaseProperty } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])
      initializeProperties()

      const [player1] = useGameStore.getState().players

      // Clear log
      useGameStore.setState({ gameLog: [] })

      purchaseProperty(player1.id, 3, 60)

      const state = useGameStore.getState()
      const purchaseLog = state.gameLog.find(log =>
        log.type === 'property' && log.message.includes('became Custodian')
      )

      expect(purchaseLog).toBeDefined()
      expect(purchaseLog?.playerId).toBe(player1.id)
    })

    it('should not allow purchase if player has insufficient rubles', () => {
      const { initializePlayers, initializeProperties, updatePlayer, purchaseProperty } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])
      initializeProperties()

      const [player1] = useGameStore.getState().players

      // Set player rubles to 50, less than property cost
      updatePlayer(player1.id, { rubles: 50 })

      purchaseProperty(player1.id, 3, 60) // Cost is 60

      const property = useGameStore.getState().properties.find(p => p.spaceId === 3)
      expect(property?.custodianId).toBeNull() // Property not purchased

      const updatedPlayer = useGameStore.getState().players.find(p => p.id === player1.id)
      expect(updatedPlayer?.rubles).toBe(50) // Rubles unchanged
    })

    it('should block Tank piece from purchasing Collective Farm properties', () => {
      const { initializePlayers, initializeProperties, purchaseProperty } = useGameStore.getState()

      initializePlayers([
        { name: 'Tank Player', piece: 'tank', isStalin: false }
      ])
      initializeProperties()

      const [player1] = useGameStore.getState().players
      const initialRubles = player1.rubles

      // Space 6 is a Collective Farm property
      purchaseProperty(player1.id, 6, 100)

      const property = useGameStore.getState().properties.find(p => p.spaceId === 6)
      expect(property?.custodianId).toBeNull() // Not purchased

      const updatedPlayer = useGameStore.getState().players.find(p => p.id === player1.id)
      expect(updatedPlayer?.rubles).toBe(initialRubles) // Rubles unchanged
    })

    it('should add log entry when Tank is blocked from Collective Farm', () => {
      const { initializePlayers, initializeProperties, purchaseProperty } = useGameStore.getState()

      initializePlayers([
        { name: 'Tank Player', piece: 'tank', isStalin: false }
      ])
      initializeProperties()

      const [player1] = useGameStore.getState().players

      // Clear log
      useGameStore.setState({ gameLog: [] })

      // Space 8 is a Collective Farm property
      purchaseProperty(player1.id, 8, 120)

      const state = useGameStore.getState()
      const blockLog = state.gameLog.find(log =>
        log.type === 'system' && log.message.includes('Tank cannot control Collective Farm')
      )

      expect(blockLog).toBeDefined()
      expect(blockLog?.playerId).toBe(player1.id)
    })

    it('should set turnPhase and pendingAction when Tank is blocked', () => {
      const { initializePlayers, initializeProperties, purchaseProperty } = useGameStore.getState()

      initializePlayers([
        { name: 'Tank Player', piece: 'tank', isStalin: false }
      ])
      initializeProperties()

      const [player1] = useGameStore.getState().players

      useGameStore.setState({ turnPhase: 'resolving', pendingAction: { type: 'property-purchase', data: {} } })

      purchaseProperty(player1.id, 9, 140) // Space 9 is Collective Farm

      const state = useGameStore.getState()
      expect(state.turnPhase).toBe('post-turn')
      expect(state.pendingAction).toBeNull()
    })

    it('should allow Tank to purchase non-Collective Farm properties', () => {
      const { initializePlayers, initializeProperties, purchaseProperty } = useGameStore.getState()

      initializePlayers([
        { name: 'Tank Player', piece: 'tank', isStalin: false }
      ])
      initializeProperties()

      const [player1] = useGameStore.getState().players

      // Space 3 is not a Collective Farm
      purchaseProperty(player1.id, 3, 60)

      const property = useGameStore.getState().properties.find(p => p.spaceId === 3)
      expect(property?.custodianId).toBe(player1.id) // Successfully purchased
    })

    it('should handle non-existent player gracefully', () => {
      const { initializePlayers, initializeProperties, purchaseProperty } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])
      initializeProperties()

      const initialState = useGameStore.getState()

      purchaseProperty('non-existent-id', 3, 60)

      const property = useGameStore.getState().properties.find(p => p.spaceId === 3)
      expect(property?.custodianId).toBeNull()
      expect(useGameStore.getState().stateTreasury).toBe(initialState.stateTreasury)
    })
  })

  describe('payQuota', () => {
    it('should transfer rubles from payer to custodian', () => {
      const { initializePlayers, payQuota } = useGameStore.getState()

      initializePlayers([
        { name: 'Payer', piece: 'sickle', isStalin: false },
        { name: 'Custodian', piece: 'hammer', isStalin: false }
      ])

      const [payer, custodian] = useGameStore.getState().players
      const payerInitialRubles = payer.rubles
      const custodianInitialRubles = custodian.rubles

      payQuota(payer.id, custodian.id, 100)

      const updatedPayer = useGameStore.getState().players.find(p => p.id === payer.id)
      const updatedCustodian = useGameStore.getState().players.find(p => p.id === custodian.id)

      expect(updatedPayer?.rubles).toBe(payerInitialRubles - 100)
      expect(updatedCustodian?.rubles).toBe(custodianInitialRubles + 100)
    })

    it('should add log entry for quota payment', () => {
      const { initializePlayers, payQuota } = useGameStore.getState()

      initializePlayers([
        { name: 'Payer', piece: 'sickle', isStalin: false },
        { name: 'Custodian', piece: 'hammer', isStalin: false }
      ])

      const [payer, custodian] = useGameStore.getState().players

      // Clear log
      useGameStore.setState({ gameLog: [] })

      payQuota(payer.id, custodian.id, 100)

      const state = useGameStore.getState()
      const quotaLog = state.gameLog.find(log =>
        log.type === 'payment' && log.message.includes('paid ₽100 quota to')
      )

      expect(quotaLog).toBeDefined()
      expect(quotaLog?.playerId).toBe(payer.id)
    })

    it('should handle non-existent payer gracefully', () => {
      const { initializePlayers, payQuota } = useGameStore.getState()

      initializePlayers([
        { name: 'Custodian', piece: 'hammer', isStalin: false }
      ])

      const [custodian] = useGameStore.getState().players
      const initialRubles = custodian.rubles

      payQuota('non-existent-id', custodian.id, 100)

      const updatedCustodian = useGameStore.getState().players.find(p => p.id === custodian.id)
      expect(updatedCustodian?.rubles).toBe(initialRubles) // No change
    })

    it('should handle non-existent custodian gracefully', () => {
      const { initializePlayers, payQuota } = useGameStore.getState()

      initializePlayers([
        { name: 'Payer', piece: 'sickle', isStalin: false }
      ])

      const [payer] = useGameStore.getState().players
      const initialRubles = payer.rubles

      payQuota(payer.id, 'non-existent-id', 100)

      const updatedPayer = useGameStore.getState().players.find(p => p.id === payer.id)
      expect(updatedPayer?.rubles).toBe(initialRubles) // No change
    })
  })

  describe('mortgageProperty', () => {
    it('should give player 50% of property base cost', () => {
      const { initializePlayers, initializeProperties, setPropertyCustodian, mortgageProperty } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])
      initializeProperties()

      const [player1] = useGameStore.getState().players

      // Set player as custodian of space 3 (base cost 60)
      setPropertyCustodian(3, player1.id)

      const initialRubles = useGameStore.getState().players[0].rubles

      mortgageProperty(3)

      const updatedPlayer = useGameStore.getState().players.find(p => p.id === player1.id)
      expect(updatedPlayer?.rubles).toBe(initialRubles + 30) // 50% of 60 = 30
    })

    it('should mark property as mortgaged', () => {
      const { initializePlayers, initializeProperties, setPropertyCustodian, mortgageProperty } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])
      initializeProperties()

      const [player1] = useGameStore.getState().players

      setPropertyCustodian(3, player1.id)

      mortgageProperty(3)

      const property = useGameStore.getState().properties.find(p => p.spaceId === 3)
      expect(property?.mortgaged).toBe(true)
    })

    it('should add log entry for mortgage', () => {
      const { initializePlayers, initializeProperties, setPropertyCustodian, mortgageProperty } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])
      initializeProperties()

      const [player1] = useGameStore.getState().players

      setPropertyCustodian(3, player1.id)

      // Clear log
      useGameStore.setState({ gameLog: [] })

      mortgageProperty(3)

      const state = useGameStore.getState()
      const mortgageLog = state.gameLog.find(log =>
        log.type === 'property' && log.message.includes('mortgaged')
      )

      expect(mortgageLog).toBeDefined()
      expect(mortgageLog?.playerId).toBe(player1.id)
    })

    it('should not mortgage property with no custodian', () => {
      const { initializePlayers, initializeProperties, mortgageProperty } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])
      initializeProperties()

      // Property 3 has no custodian
      mortgageProperty(3)

      const property = useGameStore.getState().properties.find(p => p.spaceId === 3)
      expect(property?.mortgaged).toBe(false) // Not mortgaged
    })

    it('should calculate mortgage value correctly for different properties', () => {
      const { initializePlayers, initializeProperties, setPropertyCustodian, mortgageProperty } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])
      initializeProperties()

      const [player1] = useGameStore.getState().players

      // Set player as custodian of space 6 (base cost 100)
      setPropertyCustodian(6, player1.id)

      const initialRubles = useGameStore.getState().players[0].rubles

      mortgageProperty(6)

      const updatedPlayer = useGameStore.getState().players.find(p => p.id === player1.id)
      expect(updatedPlayer?.rubles).toBe(initialRubles + 50) // 50% of 100 = 50
    })
  })

  describe('unmortgageProperty', () => {
    it('should deduct 60% of property base cost from player', () => {
      const { initializePlayers, initializeProperties, setPropertyCustodian, unmortgageProperty } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])
      initializeProperties()

      const [player1] = useGameStore.getState().players

      // Set player as custodian and mark property as mortgaged
      setPropertyCustodian(3, player1.id)
      useGameStore.setState({
        properties: useGameStore.getState().properties.map(p =>
          p.spaceId === 3 ? { ...p, mortgaged: true } : p
        )
      })

      const initialRubles = useGameStore.getState().players[0].rubles

      unmortgageProperty(3, player1.id)

      const updatedPlayer = useGameStore.getState().players.find(p => p.id === player1.id)
      expect(updatedPlayer?.rubles).toBe(initialRubles - 36) // 60% of 60 = 36
    })

    it('should mark property as unmortgaged', () => {
      const { initializePlayers, initializeProperties, setPropertyCustodian, unmortgageProperty } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])
      initializeProperties()

      const [player1] = useGameStore.getState().players

      setPropertyCustodian(3, player1.id)
      useGameStore.setState({
        properties: useGameStore.getState().properties.map(p =>
          p.spaceId === 3 ? { ...p, mortgaged: true } : p
        )
      })

      unmortgageProperty(3, player1.id)

      const property = useGameStore.getState().properties.find(p => p.spaceId === 3)
      expect(property?.mortgaged).toBe(false)
    })

    it('should add log entry for unmortgage', () => {
      const { initializePlayers, initializeProperties, setPropertyCustodian, unmortgageProperty } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])
      initializeProperties()

      const [player1] = useGameStore.getState().players

      setPropertyCustodian(3, player1.id)
      useGameStore.setState({
        properties: useGameStore.getState().properties.map(p =>
          p.spaceId === 3 ? { ...p, mortgaged: true } : p
        )
      })

      // Clear log
      useGameStore.setState({ gameLog: [] })

      unmortgageProperty(3, player1.id)

      const state = useGameStore.getState()
      const unmortgageLog = state.gameLog.find(log =>
        log.type === 'property' && log.message.includes('unmortgaged')
      )

      expect(unmortgageLog).toBeDefined()
      expect(unmortgageLog?.playerId).toBe(player1.id)
    })

    it('should not unmortgage if player has insufficient rubles', () => {
      const { initializePlayers, initializeProperties, setPropertyCustodian, updatePlayer, unmortgageProperty } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])
      initializeProperties()

      const [player1] = useGameStore.getState().players

      setPropertyCustodian(3, player1.id)
      useGameStore.setState({
        properties: useGameStore.getState().properties.map(p =>
          p.spaceId === 3 ? { ...p, mortgaged: true } : p
        )
      })

      // Set player rubles to 30, less than unmortgage cost of 36
      updatePlayer(player1.id, { rubles: 30 })

      unmortgageProperty(3, player1.id)

      const property = useGameStore.getState().properties.find(p => p.spaceId === 3)
      expect(property?.mortgaged).toBe(true) // Still mortgaged

      const updatedPlayer = useGameStore.getState().players.find(p => p.id === player1.id)
      expect(updatedPlayer?.rubles).toBe(30) // Rubles unchanged
    })

    it('should handle non-existent property gracefully', () => {
      const { initializePlayers, initializeProperties, unmortgageProperty } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])
      initializeProperties()

      const [player1] = useGameStore.getState().players
      const initialRubles = player1.rubles

      unmortgageProperty(999, player1.id) // Non-existent property

      const updatedPlayer = useGameStore.getState().players.find(p => p.id === player1.id)
      expect(updatedPlayer?.rubles).toBe(initialRubles) // No change
    })

    it('should handle non-existent player gracefully', () => {
      const { initializePlayers, initializeProperties, setPropertyCustodian, unmortgageProperty } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])
      initializeProperties()

      const [player1] = useGameStore.getState().players

      setPropertyCustodian(3, player1.id)
      useGameStore.setState({
        properties: useGameStore.getState().properties.map(p =>
          p.spaceId === 3 ? { ...p, mortgaged: true } : p
        )
      })

      unmortgageProperty(3, 'non-existent-id')

      const property = useGameStore.getState().properties.find(p => p.spaceId === 3)
      expect(property?.mortgaged).toBe(true) // Still mortgaged
    })
  })

  describe('transferProperty', () => {
    it('should update property custodianId to new owner', () => {
      const { initializePlayers, initializeProperties, setPropertyCustodian, transferProperty } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false },
        { name: 'Player 2', piece: 'hammer', isStalin: false }
      ])
      initializeProperties()

      const [player1, player2] = useGameStore.getState().players

      setPropertyCustodian(3, player1.id)

      transferProperty('3', player2.id)

      const property = useGameStore.getState().properties.find(p => p.spaceId === 3)
      expect(property?.custodianId).toBe(player2.id)
    })

    it('should remove property from old owner properties array', () => {
      const { initializePlayers, initializeProperties, setPropertyCustodian, updatePlayer, transferProperty } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false },
        { name: 'Player 2', piece: 'hammer', isStalin: false }
      ])
      initializeProperties()

      const [player1, player2] = useGameStore.getState().players

      setPropertyCustodian(3, player1.id)
      updatePlayer(player1.id, { properties: ['3'] })

      transferProperty('3', player2.id)

      const updatedPlayer1 = useGameStore.getState().players.find(p => p.id === player1.id)
      expect(updatedPlayer1?.properties).not.toContain('3')
    })

    it('should add property to new owner properties array', () => {
      const { initializePlayers, initializeProperties, setPropertyCustodian, updatePlayer, transferProperty } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false },
        { name: 'Player 2', piece: 'hammer', isStalin: false }
      ])
      initializeProperties()

      const [player1, player2] = useGameStore.getState().players

      setPropertyCustodian(3, player1.id)
      updatePlayer(player1.id, { properties: ['3'] })
      expect(player2.properties).toEqual([])

      transferProperty('3', player2.id)

      const updatedPlayer2 = useGameStore.getState().players.find(p => p.id === player2.id)
      expect(updatedPlayer2?.properties).toContain('3')
    })

    it('should handle transfer from unowned property', () => {
      const { initializePlayers, initializeProperties, transferProperty } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])
      initializeProperties()

      const [player1] = useGameStore.getState().players

      // Property 3 has no custodian
      transferProperty('3', player1.id)

      const property = useGameStore.getState().properties.find(p => p.spaceId === 3)
      expect(property?.custodianId).toBe(player1.id)

      const updatedPlayer1 = useGameStore.getState().players.find(p => p.id === player1.id)
      expect(updatedPlayer1?.properties).toContain('3')
    })

    it('should handle non-existent property gracefully', () => {
      const { initializePlayers, initializeProperties, transferProperty } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])
      initializeProperties()

      const [player1] = useGameStore.getState().players

      const initialState = useGameStore.getState()

      transferProperty('999', player1.id) // Non-existent property

      // State should remain unchanged
      const finalState = useGameStore.getState()
      expect(finalState.properties).toEqual(initialState.properties)
    })

    it('should handle transfer between same properties of same owner', () => {
      const { initializePlayers, initializeProperties, setPropertyCustodian, updatePlayer, transferProperty } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])
      initializeProperties()

      const [player1] = useGameStore.getState().players

      setPropertyCustodian(3, player1.id)
      updatePlayer(player1.id, { properties: ['3'] })

      // Transfer to same player
      transferProperty('3', player1.id)

      const property = useGameStore.getState().properties.find(p => p.spaceId === 3)
      expect(property?.custodianId).toBe(player1.id)

      const updatedPlayer1 = useGameStore.getState().players.find(p => p.id === player1.id)
      // Property should be in array (added again since it was removed first)
      expect(updatedPlayer1?.properties).toContain('3')
    })
  })

  describe('Quota Calculations', () => {
    describe('Base Quotas', () => {
      it('should return correct base quota for Camp Vorkuta (Siberian)', () => {
        const property = createTestProperty(1, { custodianId: 'custodian-1' })
        const properties: Property[] = [property]
        const quota = calculateQuota(property, properties)
        expect(quota).toBe(2)
      })

      it('should return correct base quota for Camp Kolyma (Siberian)', () => {
        const property = createTestProperty(3, { custodianId: 'custodian-1' })
        const properties: Property[] = [property]
        const quota = calculateQuota(property, properties)
        expect(quota).toBe(4)
      })

      it('should return correct base quota for Kolkhoz Sunrise (Collective Farm)', () => {
        const property = createTestProperty(6, { custodianId: 'custodian-1' })
        const properties: Property[] = [property]
        const quota = calculateQuota(property, properties)
        expect(quota).toBe(6)
      })

      it('should return correct base quota for Kolkhoz Progress (Collective Farm)', () => {
        const property = createTestProperty(8, { custodianId: 'custodian-1' })
        const properties: Property[] = [property]
        const quota = calculateQuota(property, properties)
        expect(quota).toBe(6)
      })

      it('should return correct base quota for Kolkhoz Victory (Collective Farm)', () => {
        const property = createTestProperty(9, { custodianId: 'custodian-1' })
        const properties: Property[] = [property]
        const quota = calculateQuota(property, properties)
        expect(quota).toBe(8)
      })

      it('should return correct base quota for Tractor Factory #47 (Industrial)', () => {
        const property = createTestProperty(11, { custodianId: 'custodian-1' })
        const properties: Property[] = [property]
        const quota = calculateQuota(property, properties)
        expect(quota).toBe(10)
      })

      it('should return correct base quota for Lenin\'s Mausoleum (Kremlin)', () => {
        const property = createTestProperty(37, { custodianId: 'custodian-1' })
        const properties: Property[] = [property]
        const quota = calculateQuota(property, properties)
        expect(quota).toBe(35)
      })

      it('should return correct base quota for Stalin\'s Private Office (Kremlin)', () => {
        const property = createTestProperty(39, { custodianId: 'custodian-1' })
        const properties: Property[] = [property]
        const quota = calculateQuota(property, properties)
        expect(quota).toBe(50)
      })

      it('should calculate base quota regardless of custodian status', () => {
        // Note: The function calculates quota based on property data alone
        // The check for custodian happens before calling this function in actual usage
        const property = createTestProperty(1, { custodianId: null })
        const properties: Property[] = [property]
        const quota = calculateQuota(property, properties)
        expect(quota).toBe(2) // Still returns base quota
      })
    })

    describe('Collectivization Level Multipliers', () => {
      it('should apply 1.0x multiplier for level 0 (None)', () => {
        const property = createTestProperty(1, {
          custodianId: 'custodian-1',
          collectivizationLevel: 0
        })
        const properties: Property[] = [property]
        const quota = calculateQuota(property, properties)
        expect(quota).toBe(2) // 2 * 1.0 = 2
      })

      it('should apply 4.0x multiplier for level 1 (Worker\'s Committee)', () => {
        const property = createTestProperty(1, {
          custodianId: 'custodian-1',
          collectivizationLevel: 1
        })
        const properties: Property[] = [property]
        const quota = calculateQuota(property, properties)
        expect(quota).toBe(8) // 2 * 4.0 = 8
      })

      it('should apply 9.0x multiplier for level 2 (Party Oversight)', () => {
        const property = createTestProperty(1, {
          custodianId: 'custodian-1',
          collectivizationLevel: 2
        })
        const properties: Property[] = [property]
        const quota = calculateQuota(property, properties)
        expect(quota).toBe(18) // 2 * 9.0 = 18
      })

      it('should apply 15.0x multiplier for level 3 (Full Collectivization)', () => {
        const property = createTestProperty(1, {
          custodianId: 'custodian-1',
          collectivizationLevel: 3
        })
        const properties: Property[] = [property]
        const quota = calculateQuota(property, properties)
        expect(quota).toBe(30) // 2 * 15.0 = 30
      })

      it('should apply 20.0x multiplier for level 4 (Model Soviet)', () => {
        const property = createTestProperty(1, {
          custodianId: 'custodian-1',
          collectivizationLevel: 4
        })
        const properties: Property[] = [property]
        const quota = calculateQuota(property, properties)
        expect(quota).toBe(40) // 2 * 20.0 = 40
      })

      it('should apply 30.0x multiplier for level 5 (People\'s Palace)', () => {
        const property = createTestProperty(1, {
          custodianId: 'custodian-1',
          collectivizationLevel: 5
        })
        const properties: Property[] = [property]
        const quota = calculateQuota(property, properties)
        expect(quota).toBe(60) // 2 * 30.0 = 60
      })
    })

    describe('Complete Group Ownership', () => {
      it('should double quota when custodian owns complete Siberian group', () => {
        const property1 = createTestProperty(1, { custodianId: 'custodian-1' })
        const property2 = createTestProperty(3, { custodianId: 'custodian-1' })
        const properties: Property[] = [property1, property2]

        const quota = calculateQuota(property1, properties)
        expect(quota).toBe(4) // 2 * 1.0 (level 0) * 2 (complete group) = 4
      })

      it('should double quota when custodian owns complete Collective Farm group', () => {
        const property1 = createTestProperty(6, { custodianId: 'custodian-1' })
        const property2 = createTestProperty(8, { custodianId: 'custodian-1' })
        const property3 = createTestProperty(9, { custodianId: 'custodian-1' })
        const properties: Property[] = [property1, property2, property3]

        const quota = calculateQuota(property1, properties)
        expect(quota).toBe(12) // 6 * 1.0 * 2 = 12
      })

      it('should NOT double quota when custodian does not own complete group', () => {
        const property1 = createTestProperty(1, { custodianId: 'custodian-1' })
        const property2 = createTestProperty(3, { custodianId: 'custodian-2' })
        const properties: Property[] = [property1, property2]

        const quota = calculateQuota(property1, properties)
        expect(quota).toBe(2) // 2 * 1.0 (no complete group bonus)
      })
    })

    describe('Piece Ability Modifiers', () => {
      it('should halve Collective Farm quotas for Sickle piece', () => {
        const property = createTestProperty(6, { custodianId: 'custodian-1' })
        const properties: Property[] = [property]
        const player = createTestPlayer({ piece: 'sickle' })

        const quota = calculateQuota(property, properties, player)
        expect(quota).toBe(3) // 6 * 0.5 = 3
      })

      it('should halve Collective Farm quotas with complete group for Sickle', () => {
        const property1 = createTestProperty(6, { custodianId: 'custodian-1' })
        const property2 = createTestProperty(8, { custodianId: 'custodian-1' })
        const property3 = createTestProperty(9, { custodianId: 'custodian-1' })
        const properties: Property[] = [property1, property2, property3]
        const player = createTestPlayer({ piece: 'sickle' })

        const quota = calculateQuota(property1, properties, player)
        expect(quota).toBe(6) // 6 * 2 (complete group) * 0.5 (sickle) = 6
      })

      it('should NOT modify non-Collective Farm quotas for Sickle piece', () => {
        const property = createTestProperty(11, { custodianId: 'custodian-1' })
        const properties: Property[] = [property]
        const player = createTestPlayer({ piece: 'sickle' })

        const quota = calculateQuota(property, properties, player)
        expect(quota).toBe(10) // 10 * 1.0 (no sickle modifier for non-farms)
      })

      it('should NOT modify quotas for non-Sickle pieces', () => {
        const property = createTestProperty(6, { custodianId: 'custodian-1' })
        const properties: Property[] = [property]
        const player = createTestPlayer({ piece: 'hammer' })

        const quota = calculateQuota(property, properties, player)
        expect(quota).toBe(6) // 6 * 1.0 (no modifier)
      })
    })

    describe('Party Elite District Special Rules', () => {
      it('should double quota for Proletariat players in Elite properties', () => {
        const property = createTestProperty(31, { custodianId: 'custodian-1' })
        const properties: Property[] = [property]
        const player = createTestPlayer({ rank: 'proletariat' })

        const quota = calculateQuota(property, properties, player)
        expect(quota).toBe(52) // 26 * 2 (proletariat penalty) = 52
      })

      it('should NOT double quota for Party Member in Elite properties', () => {
        const property = createTestProperty(31, { custodianId: 'custodian-1' })
        const properties: Property[] = [property]
        const player = createTestPlayer({ rank: 'partyMember' })

        const quota = calculateQuota(property, properties, player)
        expect(quota).toBe(26) // 26 * 1.0 (no penalty)
      })

      it('should NOT double quota for Commissar in Elite properties', () => {
        const property = createTestProperty(31, { custodianId: 'custodian-1' })
        const properties: Property[] = [property]
        const player = createTestPlayer({ rank: 'commissar' })

        const quota = calculateQuota(property, properties, player)
        expect(quota).toBe(26)
      })

      it('should NOT double quota for Inner Circle in Elite properties', () => {
        const property = createTestProperty(31, { custodianId: 'custodian-1' })
        const properties: Property[] = [property]
        const player = createTestPlayer({ rank: 'innerCircle' })

        const quota = calculateQuota(property, properties, player)
        expect(quota).toBe(26)
      })
    })

    describe('Railway Station Quotas', () => {
      it('should return 50 for 1 station controlled', () => {
        const property = createTestProperty(5, { custodianId: 'custodian-1' })
        const properties: Property[] = [property]

        const fee = calculateRailwayFee('custodian-1', properties)
        expect(fee).toBe(50)
      })

      it('should return 100 for 2 stations controlled', () => {
        const property1 = createTestProperty(5, { custodianId: 'custodian-1' })
        const property2 = createTestProperty(15, { custodianId: 'custodian-1' })
        const properties: Property[] = [property1, property2]

        const fee = calculateRailwayFee('custodian-1', properties)
        expect(fee).toBe(100)
      })

      it('should return 150 for 3 stations controlled', () => {
        const property1 = createTestProperty(5, { custodianId: 'custodian-1' })
        const property2 = createTestProperty(15, { custodianId: 'custodian-1' })
        const property3 = createTestProperty(25, { custodianId: 'custodian-1' })
        const properties: Property[] = [property1, property2, property3]

        const fee = calculateRailwayFee('custodian-1', properties)
        expect(fee).toBe(150)
      })

      it('should return 200 for all 4 stations controlled', () => {
        const property1 = createTestProperty(5, { custodianId: 'custodian-1' })
        const property2 = createTestProperty(15, { custodianId: 'custodian-1' })
        const property3 = createTestProperty(25, { custodianId: 'custodian-1' })
        const property4 = createTestProperty(35, { custodianId: 'custodian-1' })
        const properties: Property[] = [property1, property2, property3, property4]

        const fee = calculateRailwayFee('custodian-1', properties)
        expect(fee).toBe(200)
      })

      it('should return 0 for no stations controlled', () => {
        const properties: Property[] = []
        const fee = calculateRailwayFee('custodian-1', properties)
        expect(fee).toBe(0)
      })
    })

    describe('Complex Scenarios', () => {
      it('should correctly calculate quota with collectivization and complete group', () => {
        // Complete Siberian group with level 2 collectivization
        const property1 = createTestProperty(1, {
          custodianId: 'custodian-1',
          collectivizationLevel: 2
        })
        const property2 = createTestProperty(3, {
          custodianId: 'custodian-1',
          collectivizationLevel: 1
        })
        const properties: Property[] = [property1, property2]

        const quota = calculateQuota(property1, properties)
        expect(quota).toBe(18) // 2 * 9.0 (level 2) - collectivization replaces group bonus
      })

      it('should correctly calculate quota with collectivization, complete group, and Sickle', () => {
        // Complete Collective Farm group with level 1 collectivization and Sickle piece
        const property1 = createTestProperty(6, {
          custodianId: 'custodian-1',
          collectivizationLevel: 1
        })
        const property2 = createTestProperty(8, {
          custodianId: 'custodian-1',
          collectivizationLevel: 1
        })
        const property3 = createTestProperty(9, {
          custodianId: 'custodian-1',
          collectivizationLevel: 1
        })
        const properties: Property[] = [property1, property2, property3]
        const player = createTestPlayer({ piece: 'sickle' })

        const quota = calculateQuota(property1, properties, player)
        expect(quota).toBe(12) // 6 * 4.0 (level 1) * 0.5 (sickle) - collectivization replaces group bonus
      })

      it('should correctly calculate quota with collectivization and Proletariat in Elite', () => {
        // Elite property with level 3 collectivization, Proletariat player
        const property = createTestProperty(31, {
          custodianId: 'custodian-1',
          collectivizationLevel: 3
        })
        const properties: Property[] = [property]
        const player = createTestPlayer({ rank: 'proletariat' })

        const quota = calculateQuota(property, properties, player)
        expect(quota).toBe(780) // 26 * 15.0 (level 3) * 2 (proletariat) = 780
      })
    })

    describe('Edge Cases', () => {
      it('should calculate quota even for mortgaged properties', () => {
        // Note: The function doesn't check mortgage status
        // In practice, mortgaged properties shouldn't charge quotas,
        // but this is handled by the caller, not calculateQuota itself
        const property = createTestProperty(1, {
          custodianId: 'custodian-1',
          mortgaged: true
        })
        const properties: Property[] = [property]

        const quota = calculateQuota(property, properties)
        expect(quota).toBe(2) // Still calculates base quota
      })

      it('should floor decimal results', () => {
        // Test that quota calculation floors the result
        const property = createTestProperty(9, {
          custodianId: 'custodian-1',
          collectivizationLevel: 0
        })
        const properties: Property[] = [property]
        const player = createTestPlayer({ piece: 'sickle' })

        const quota = calculateQuota(property, properties, player)
        expect(quota).toBe(4) // 8 * 0.5 = 4.0 (floored)
      })

      it('should handle maximum collectivization level', () => {
        const property = createTestProperty(39, {
          custodianId: 'custodian-1',
          collectivizationLevel: 5
        })
        const properties: Property[] = [property]

        const quota = calculateQuota(property, properties)
        expect(quota).toBe(1500) // 50 * 30.0 = 1500
      })
    })
  })
})
