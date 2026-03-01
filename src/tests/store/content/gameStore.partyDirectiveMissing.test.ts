// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore } from '../../../store/gameStore'
import { PARTY_DIRECTIVE_CARDS } from '../../../data/partyDirectiveCards'

describe('gameStore - Party Directive: Missing Card Coverage', () => {
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

  describe('Movement Cards - Missing Coverage', () => {
    describe('pd-2: LABOUR REASSIGNMENT (Move to Camp Vorkuta)', () => {
      const labourReassignmentCard = PARTY_DIRECTIVE_CARDS.find(c => c.id === 'pd-2')
      if (labourReassignmentCard === undefined) {
        throw new Error('LABOUR REASSIGNMENT card not found in PARTY_DIRECTIVE_CARDS')
      }

      it('should move player to position 1 (Camp Vorkuta)', () => {
        const { applyDirectiveEffect, players, updatePlayer } = useGameStore.getState()
        const player = players[0]

        // Move player away from position 1 first
        updatePlayer(player.id, { position: 15 })

        applyDirectiveEffect(labourReassignmentCard, player.id)

        const updatedPlayer = useGameStore.getState().players.find(p => p.id === player.id)
        expect(updatedPlayer?.position).toBe(1)
      })

      it('should resolve the space and trigger property-purchase if unowned', () => {
        const { applyDirectiveEffect, players } = useGameStore.getState()
        const player = players[0]

        applyDirectiveEffect(labourReassignmentCard, player.id)

        const state = useGameStore.getState()
        const updatedPlayer = state.players.find(p => p.id === player.id)

        expect(updatedPlayer?.position).toBe(1)
        // Should trigger property-purchase or quota-payment pending action
        expect(state.pendingAction).not.toBeNull()
        expect(['property-purchase', 'quota-payment']).toContain(state.pendingAction?.type)
      })

      it('should NOT pass STOY when moving from higher position (direct move)', () => {
        const { applyDirectiveEffect, players, updatePlayer } = useGameStore.getState()
        const player = players[0]

        // Start player at position 25 - card says "do not pass STOY"
        updatePlayer(player.id, { position: 25, rubles: 500 })
        const initialRubles = useGameStore.getState().players.find(p => p.id === player.id)?.rubles ?? 0

        applyDirectiveEffect(labourReassignmentCard, player.id)

        const updatedPlayer = useGameStore.getState().players.find(p => p.id === player.id)
        expect(updatedPlayer?.position).toBe(1)
        // Should NOT have paid travel tax - card says "do not pass STOY"
        expect(updatedPlayer?.rubles).toBe(initialRubles)
      })

      it('should trigger quota payment if property is owned by another player', () => {
        const { applyDirectiveEffect, players, properties } = useGameStore.getState()
        const player1 = players[0]
        const player2 = players[1]

        // Have player2 purchase Camp Vorkuta first
        const campVorkutaProperty = properties.find(p => p.spaceId === 1)
        if (campVorkutaProperty != null) {
          useGameStore.setState({
            properties: properties.map(p =>
              p.spaceId === 1 ? { ...p, custodianId: player2.id } : p
            )
          })
        }

        const initialRubles = player1.rubles

        applyDirectiveEffect(labourReassignmentCard, player1.id)

        const state = useGameStore.getState()
        const updatedPlayer1 = state.players.find(p => p.id === player1.id)

        expect(updatedPlayer1?.position).toBe(1)
        // Should have paid quota to player2
        expect(updatedPlayer1?.rubles).toBeLessThan(initialRubles)
      })
    })

    describe('pd-18: ADVANCE TO KREMLIN COMPLEX (Move to Stalin\'s Private Office)', () => {
      const advanceToKremlinCard = PARTY_DIRECTIVE_CARDS.find(c => c.id === 'pd-18')
      if (advanceToKremlinCard === undefined) {
        throw new Error('ADVANCE TO KREMLIN COMPLEX card not found in PARTY_DIRECTIVE_CARDS')
      }

      it('should move player to position 39 (Stalin\'s Private Office)', () => {
        const { applyDirectiveEffect, players, updatePlayer } = useGameStore.getState()
        const player = players[0]

        // Move player away from position 39 first
        updatePlayer(player.id, { position: 5 })

        applyDirectiveEffect(advanceToKremlinCard, player.id)

        const updatedPlayer = useGameStore.getState().players.find(p => p.id === player.id)
        expect(updatedPlayer?.position).toBe(39)
      })

      it('should resolve the space and trigger property-purchase if player has sufficient rank', () => {
        const { applyDirectiveEffect, players, updatePlayer } = useGameStore.getState()
        const player = players[0]

        // Promote player to Inner Circle (required for Kremlin properties)
        updatePlayer(player.id, { rank: 'innerCircle', rubles: 2000 })

        applyDirectiveEffect(advanceToKremlinCard, player.id)

        const state = useGameStore.getState()
        const updatedPlayer = state.players.find(p => p.id === player.id)

        expect(updatedPlayer?.position).toBe(39)
        // Should trigger property-purchase or quota-payment pending action
        expect(state.pendingAction).not.toBeNull()
        expect(['property-purchase', 'quota-payment']).toContain(state.pendingAction?.type)
      })

      it('should handle passing STOY and collect ₽200', () => {
        const { applyDirectiveEffect, players, updatePlayer } = useGameStore.getState()
        const player = players[0]

        // Start player at position 5 (will pass STOY to get to 39)
        updatePlayer(player.id, { position: 5, rubles: 500 })
        const initialRubles = useGameStore.getState().players.find(p => p.id === player.id)?.rubles ?? 0

        applyDirectiveEffect(advanceToKremlinCard, player.id)

        const updatedPlayer = useGameStore.getState().players.find(p => p.id === player.id)
        expect(updatedPlayer?.position).toBe(39)
        // Should have paid travel tax when passing STOY
        expect(updatedPlayer?.rubles).toBe(initialRubles - 200)
      })

      it('should trigger quota payment if property is owned by another player', () => {
        const { applyDirectiveEffect, players, properties, updatePlayer } = useGameStore.getState()
        const player1 = players[0]
        const player2 = players[1]

        // Promote player2 to Inner Circle and assign them Stalin's Private Office
        updatePlayer(player2.id, { rank: 'innerCircle' })
        const stalinsOfficeProperty = properties.find(p => p.spaceId === 39)
        if (stalinsOfficeProperty != null) {
          useGameStore.setState({
            properties: properties.map(p =>
              p.spaceId === 39 ? { ...p, custodianId: player2.id } : p
            )
          })
        }

        const initialRubles = player1.rubles

        applyDirectiveEffect(advanceToKremlinCard, player1.id)

        const state = useGameStore.getState()
        const updatedPlayer1 = state.players.find(p => p.id === player1.id)

        expect(updatedPlayer1?.position).toBe(39)
        // Should have paid quota to player2
        expect(updatedPlayer1?.rubles).toBeLessThan(initialRubles)
      })
    })
  })

  describe('Property Tax Cards', () => {
    describe('pd-10: PROPERTY TAX (25₽/property, 100₽/improvement)', () => {
      const propertyTaxCard = PARTY_DIRECTIVE_CARDS.find(c => c.id === 'pd-10')
      if (propertyTaxCard === undefined) {
        throw new Error('PROPERTY TAX card not found in PARTY_DIRECTIVE_CARDS')
      }

      it('should charge 0₽ for player with no properties or improvements', () => {
        const { applyDirectiveEffect, players } = useGameStore.getState()
        const player = players[0]
        const initialRubles = player.rubles
        const initialTreasury = useGameStore.getState().stateTreasury

        applyDirectiveEffect(propertyTaxCard, player.id)

        const state = useGameStore.getState()
        const updatedPlayer = state.players.find(p => p.id === player.id)

        expect(updatedPlayer?.rubles).toBe(initialRubles)
        expect(state.stateTreasury).toBe(initialTreasury)
      })

      it('should charge 25₽ per property owned', () => {
        const { applyDirectiveEffect, players, properties } = useGameStore.getState()
        const player = players[0]

        // Give player 3 properties with no improvements
        useGameStore.setState({
          properties: properties.map((p, i) =>
            i < 3 ? { ...p, custodianId: player.id, collectivizationLevel: 0 } : p
          )
        })

        const initialRubles = player.rubles
        const initialTreasury = useGameStore.getState().stateTreasury

        applyDirectiveEffect(propertyTaxCard, player.id)

        const state = useGameStore.getState()
        const updatedPlayer = state.players.find(p => p.id === player.id)

        // 3 properties × 25₽ = 75₽
        expect(updatedPlayer?.rubles).toBe(initialRubles - 75)
        expect(state.stateTreasury).toBe(initialTreasury + 75)
      })

      it('should charge 100₽ per improvement owned', () => {
        const { applyDirectiveEffect, players, properties } = useGameStore.getState()
        const player = players[0]

        // Give player 2 properties with improvements (2 improvements on first, 3 on second)
        useGameStore.setState({
          properties: properties.map((p, i) => {
            if (i === 0) return { ...p, custodianId: player.id, collectivizationLevel: 2 }
            if (i === 1) return { ...p, custodianId: player.id, collectivizationLevel: 3 }
            return p
          })
        })

        const initialRubles = player.rubles
        const initialTreasury = useGameStore.getState().stateTreasury

        applyDirectiveEffect(propertyTaxCard, player.id)

        const state = useGameStore.getState()
        const updatedPlayer = state.players.find(p => p.id === player.id)

        // 2 properties × 25₽ = 50₽
        // 5 improvements × 100₽ = 500₽
        // Total = 550₽
        expect(updatedPlayer?.rubles).toBe(initialRubles - 550)
        expect(state.stateTreasury).toBe(initialTreasury + 550)
      })

      it('should charge combined amount for properties and improvements', () => {
        const { applyDirectiveEffect, players, properties } = useGameStore.getState()
        const player = players[0]

        // Give player 4 properties with varying improvements
        useGameStore.setState({
          properties: properties.map((p, i) => {
            if (i === 0) return { ...p, custodianId: player.id, collectivizationLevel: 1 }
            if (i === 1) return { ...p, custodianId: player.id, collectivizationLevel: 0 }
            if (i === 2) return { ...p, custodianId: player.id, collectivizationLevel: 4 }
            if (i === 3) return { ...p, custodianId: player.id, collectivizationLevel: 2 }
            return p
          })
        })

        const initialRubles = player.rubles
        const initialTreasury = useGameStore.getState().stateTreasury

        applyDirectiveEffect(propertyTaxCard, player.id)

        const state = useGameStore.getState()
        const updatedPlayer = state.players.find(p => p.id === player.id)

        // 4 properties × 25₽ = 100₽
        // 7 improvements (1+0+4+2) × 100₽ = 700₽
        // Total = 800₽
        expect(updatedPlayer?.rubles).toBe(initialRubles - 800)
        expect(state.stateTreasury).toBe(initialTreasury + 800)
      })

      it('should add log entry for property tax payment', () => {
        const { applyDirectiveEffect, players, properties } = useGameStore.getState()
        const player = players[0]

        // Give player 1 property
        useGameStore.setState({
          properties: properties.map((p, i) =>
            i === 0 ? { ...p, custodianId: player.id, collectivizationLevel: 0 } : p
          )
        })

        const initialLogLength = useGameStore.getState().gameLog.length

        applyDirectiveEffect(propertyTaxCard, player.id)

        const logs = useGameStore.getState().gameLog
        expect(logs.length).toBeGreaterThan(initialLogLength)
        const paymentLog = logs.find(log => log.message.includes('property taxes'))
        expect(paymentLog).toBeDefined()
        expect(paymentLog?.message).toContain(player.name)
      })
    })

    describe('pd-16: STREET REPAIRS (0₽/property, 40₽/improvement)', () => {
      const streetRepairsCard = PARTY_DIRECTIVE_CARDS.find(c => c.id === 'pd-16')
      if (streetRepairsCard === undefined) {
        throw new Error('STREET REPAIRS card not found in PARTY_DIRECTIVE_CARDS')
      }

      it('should charge 0₽ for player with no improvements', () => {
        const { applyDirectiveEffect, players, properties } = useGameStore.getState()
        const player = players[0]

        // Give player properties but no improvements
        useGameStore.setState({
          properties: properties.map((p, i) =>
            i < 3 ? { ...p, custodianId: player.id, collectivizationLevel: 0 } : p
          )
        })

        const initialRubles = player.rubles
        const initialTreasury = useGameStore.getState().stateTreasury

        applyDirectiveEffect(streetRepairsCard, player.id)

        const state = useGameStore.getState()
        const updatedPlayer = state.players.find(p => p.id === player.id)

        // 0 improvements × 40₽ = 0₽
        expect(updatedPlayer?.rubles).toBe(initialRubles)
        expect(state.stateTreasury).toBe(initialTreasury)
      })

      it('should charge 40₽ per improvement owned', () => {
        const { applyDirectiveEffect, players, properties } = useGameStore.getState()
        const player = players[0]

        // Give player properties with improvements
        useGameStore.setState({
          properties: properties.map((p, i) => {
            if (i === 0) return { ...p, custodianId: player.id, collectivizationLevel: 3 }
            if (i === 1) return { ...p, custodianId: player.id, collectivizationLevel: 2 }
            return p
          })
        })

        const initialRubles = player.rubles
        const initialTreasury = useGameStore.getState().stateTreasury

        applyDirectiveEffect(streetRepairsCard, player.id)

        const state = useGameStore.getState()
        const updatedPlayer = state.players.find(p => p.id === player.id)

        // 5 improvements × 40₽ = 200₽
        expect(updatedPlayer?.rubles).toBe(initialRubles - 200)
        expect(state.stateTreasury).toBe(initialTreasury + 200)
      })

      it('should not charge per property (perProperty is 0)', () => {
        const { applyDirectiveEffect, players, properties } = useGameStore.getState()
        const player = players[0]

        // Give player 5 properties with no improvements
        useGameStore.setState({
          properties: properties.map((p, i) =>
            i < 5 ? { ...p, custodianId: player.id, collectivizationLevel: 0 } : p
          )
        })

        const initialRubles = player.rubles

        applyDirectiveEffect(streetRepairsCard, player.id)

        const updatedPlayer = useGameStore.getState().players.find(p => p.id === player.id)

        // No charge for properties without improvements
        expect(updatedPlayer?.rubles).toBe(initialRubles)
      })
    })

    describe('pd-17: YOU ARE ASSESSED FOR STREET REPAIRS (0₽/property, 50₽/improvement)', () => {
      const assessedRepairsCard = PARTY_DIRECTIVE_CARDS.find(c => c.id === 'pd-17')
      if (assessedRepairsCard === undefined) {
        throw new Error('YOU ARE ASSESSED FOR STREET REPAIRS card not found in PARTY_DIRECTIVE_CARDS')
      }

      it('should charge 0₽ for player with no improvements', () => {
        const { applyDirectiveEffect, players } = useGameStore.getState()
        const player = players[0]
        const initialRubles = player.rubles
        const initialTreasury = useGameStore.getState().stateTreasury

        applyDirectiveEffect(assessedRepairsCard, player.id)

        const state = useGameStore.getState()
        const updatedPlayer = state.players.find(p => p.id === player.id)

        expect(updatedPlayer?.rubles).toBe(initialRubles)
        expect(state.stateTreasury).toBe(initialTreasury)
      })

      it('should charge 50₽ per improvement owned', () => {
        const { applyDirectiveEffect, players, properties } = useGameStore.getState()
        const player = players[0]

        // Give player properties with improvements
        useGameStore.setState({
          properties: properties.map((p, i) => {
            if (i === 0) return { ...p, custodianId: player.id, collectivizationLevel: 4 }
            if (i === 1) return { ...p, custodianId: player.id, collectivizationLevel: 1 }
            return p
          })
        })

        const initialRubles = player.rubles
        const initialTreasury = useGameStore.getState().stateTreasury

        applyDirectiveEffect(assessedRepairsCard, player.id)

        const state = useGameStore.getState()
        const updatedPlayer = state.players.find(p => p.id === player.id)

        // 5 improvements × 50₽ = 250₽
        expect(updatedPlayer?.rubles).toBe(initialRubles - 250)
        expect(state.stateTreasury).toBe(initialTreasury + 250)
      })

      it('should not charge per property (perProperty is 0)', () => {
        const { applyDirectiveEffect, players, properties } = useGameStore.getState()
        const player = players[0]

        // Give player 3 properties with no improvements
        useGameStore.setState({
          properties: properties.map((p, i) =>
            i < 3 ? { ...p, custodianId: player.id, collectivizationLevel: 0 } : p
          )
        })

        const initialRubles = player.rubles

        applyDirectiveEffect(assessedRepairsCard, player.id)

        const updatedPlayer = useGameStore.getState().players.find(p => p.id === player.id)

        // No charge for properties without improvements
        expect(updatedPlayer?.rubles).toBe(initialRubles)
      })
    })

    describe('pd-19: GENERAL REPAIRS (25₽/property, 0₽/improvement)', () => {
      const generalRepairsCard = PARTY_DIRECTIVE_CARDS.find(c => c.id === 'pd-19')
      if (generalRepairsCard === undefined) {
        throw new Error('GENERAL REPAIRS card not found in PARTY_DIRECTIVE_CARDS')
      }

      it('should charge 0₽ for player with no properties', () => {
        const { applyDirectiveEffect, players } = useGameStore.getState()
        const player = players[0]
        const initialRubles = player.rubles
        const initialTreasury = useGameStore.getState().stateTreasury

        applyDirectiveEffect(generalRepairsCard, player.id)

        const state = useGameStore.getState()
        const updatedPlayer = state.players.find(p => p.id === player.id)

        expect(updatedPlayer?.rubles).toBe(initialRubles)
        expect(state.stateTreasury).toBe(initialTreasury)
      })

      it('should charge 25₽ per property owned', () => {
        const { applyDirectiveEffect, players, properties } = useGameStore.getState()
        const player = players[0]

        // Give player 4 properties
        useGameStore.setState({
          properties: properties.map((p, i) =>
            i < 4 ? { ...p, custodianId: player.id, collectivizationLevel: 0 } : p
          )
        })

        const initialRubles = player.rubles
        const initialTreasury = useGameStore.getState().stateTreasury

        applyDirectiveEffect(generalRepairsCard, player.id)

        const state = useGameStore.getState()
        const updatedPlayer = state.players.find(p => p.id === player.id)

        // 4 properties × 25₽ = 100₽
        expect(updatedPlayer?.rubles).toBe(initialRubles - 100)
        expect(state.stateTreasury).toBe(initialTreasury + 100)
      })

      it('should not charge per improvement (perImprovement is 0)', () => {
        const { applyDirectiveEffect, players, properties } = useGameStore.getState()
        const player = players[0]

        // Give player 2 properties with improvements
        useGameStore.setState({
          properties: properties.map((p, i) => {
            if (i === 0) return { ...p, custodianId: player.id, collectivizationLevel: 5 }
            if (i === 1) return { ...p, custodianId: player.id, collectivizationLevel: 3 }
            return p
          })
        })

        const initialRubles = player.rubles
        const initialTreasury = useGameStore.getState().stateTreasury

        applyDirectiveEffect(generalRepairsCard, player.id)

        const state = useGameStore.getState()
        const updatedPlayer = state.players.find(p => p.id === player.id)

        // Only charge for properties, not improvements
        // 2 properties × 25₽ = 50₽
        expect(updatedPlayer?.rubles).toBe(initialRubles - 50)
        expect(state.stateTreasury).toBe(initialTreasury + 50)
      })
    })

    describe('pd-20: SURPRISE INSPECTION (15₽/property, 50₽/improvement)', () => {
      const surpriseInspectionCard = PARTY_DIRECTIVE_CARDS.find(c => c.id === 'pd-20')
      if (surpriseInspectionCard === undefined) {
        throw new Error('SURPRISE INSPECTION card not found in PARTY_DIRECTIVE_CARDS')
      }

      it('should charge 0₽ for player with no properties or improvements', () => {
        const { applyDirectiveEffect, players } = useGameStore.getState()
        const player = players[0]
        const initialRubles = player.rubles
        const initialTreasury = useGameStore.getState().stateTreasury

        applyDirectiveEffect(surpriseInspectionCard, player.id)

        const state = useGameStore.getState()
        const updatedPlayer = state.players.find(p => p.id === player.id)

        expect(updatedPlayer?.rubles).toBe(initialRubles)
        expect(state.stateTreasury).toBe(initialTreasury)
      })

      it('should charge 15₽ per property owned', () => {
        const { applyDirectiveEffect, players, properties } = useGameStore.getState()
        const player = players[0]

        // Give player 5 properties with no improvements
        useGameStore.setState({
          properties: properties.map((p, i) =>
            i < 5 ? { ...p, custodianId: player.id, collectivizationLevel: 0 } : p
          )
        })

        const initialRubles = player.rubles
        const initialTreasury = useGameStore.getState().stateTreasury

        applyDirectiveEffect(surpriseInspectionCard, player.id)

        const state = useGameStore.getState()
        const updatedPlayer = state.players.find(p => p.id === player.id)

        // 5 properties × 15₽ = 75₽
        expect(updatedPlayer?.rubles).toBe(initialRubles - 75)
        expect(state.stateTreasury).toBe(initialTreasury + 75)
      })

      it('should charge 50₽ per improvement owned', () => {
        const { applyDirectiveEffect, players, properties } = useGameStore.getState()
        const player = players[0]

        // Give player properties with improvements
        useGameStore.setState({
          properties: properties.map((p, i) => {
            if (i === 0) return { ...p, custodianId: player.id, collectivizationLevel: 2 }
            if (i === 1) return { ...p, custodianId: player.id, collectivizationLevel: 4 }
            return p
          })
        })

        const initialRubles = player.rubles
        const initialTreasury = useGameStore.getState().stateTreasury

        applyDirectiveEffect(surpriseInspectionCard, player.id)

        const state = useGameStore.getState()
        const updatedPlayer = state.players.find(p => p.id === player.id)

        // 2 properties × 15₽ = 30₽
        // 6 improvements × 50₽ = 300₽
        // Total = 330₽
        expect(updatedPlayer?.rubles).toBe(initialRubles - 330)
        expect(state.stateTreasury).toBe(initialTreasury + 330)
      })

      it('should charge combined amount for properties and improvements', () => {
        const { applyDirectiveEffect, players, properties } = useGameStore.getState()
        const player = players[0]

        // Give player 3 properties with varying improvements
        useGameStore.setState({
          properties: properties.map((p, i) => {
            if (i === 0) return { ...p, custodianId: player.id, collectivizationLevel: 1 }
            if (i === 1) return { ...p, custodianId: player.id, collectivizationLevel: 0 }
            if (i === 2) return { ...p, custodianId: player.id, collectivizationLevel: 3 }
            return p
          })
        })

        const initialRubles = player.rubles
        const initialTreasury = useGameStore.getState().stateTreasury

        applyDirectiveEffect(surpriseInspectionCard, player.id)

        const state = useGameStore.getState()
        const updatedPlayer = state.players.find(p => p.id === player.id)

        // 3 properties × 15₽ = 45₽
        // 4 improvements (1+0+3) × 50₽ = 200₽
        // Total = 245₽
        expect(updatedPlayer?.rubles).toBe(initialRubles - 245)
        expect(state.stateTreasury).toBe(initialTreasury + 245)
      })
    })
  })

  describe('Rank Change Card', () => {
    describe('pd-12: PARTY RECOGNITION (Rank Up)', () => {
      const partyRecognitionCard = PARTY_DIRECTIVE_CARDS.find(c => c.id === 'pd-12')
      if (partyRecognitionCard === undefined) {
        throw new Error('PARTY RECOGNITION card not found in PARTY_DIRECTIVE_CARDS')
      }

      it('should promote player from Proletariat to Party Member', () => {
        const { applyDirectiveEffect, players, updatePlayer } = useGameStore.getState()
        const player = players[0]

        // Ensure player is at Proletariat rank
        updatePlayer(player.id, { rank: 'proletariat' })

        applyDirectiveEffect(partyRecognitionCard, player.id)

        const updatedPlayer = useGameStore.getState().players.find(p => p.id === player.id)
        expect(updatedPlayer?.rank).toBe('partyMember')
      })

      it('should promote player from Party Member to Commissar', () => {
        const { applyDirectiveEffect, players, updatePlayer } = useGameStore.getState()
        const player = players[0]

        // Set player to Party Member rank
        updatePlayer(player.id, { rank: 'partyMember' })

        applyDirectiveEffect(partyRecognitionCard, player.id)

        const updatedPlayer = useGameStore.getState().players.find(p => p.id === player.id)
        expect(updatedPlayer?.rank).toBe('commissar')
      })

      it('should promote player from Commissar to Inner Circle', () => {
        const { applyDirectiveEffect, players, updatePlayer } = useGameStore.getState()
        const player = players[0]

        // Set player to Commissar rank
        updatePlayer(player.id, { rank: 'commissar' })

        applyDirectiveEffect(partyRecognitionCard, player.id)

        const updatedPlayer = useGameStore.getState().players.find(p => p.id === player.id)
        expect(updatedPlayer?.rank).toBe('innerCircle')
      })

      it('should not promote beyond Inner Circle', () => {
        const { applyDirectiveEffect, players, updatePlayer } = useGameStore.getState()
        const player = players[0]

        // Set player to Inner Circle rank (max rank)
        updatePlayer(player.id, { rank: 'innerCircle' })

        applyDirectiveEffect(partyRecognitionCard, player.id)

        const updatedPlayer = useGameStore.getState().players.find(p => p.id === player.id)
        // Should remain at Inner Circle
        expect(updatedPlayer?.rank).toBe('innerCircle')
      })

      it('should add log entry for promotion', () => {
        const { applyDirectiveEffect, players, updatePlayer } = useGameStore.getState()
        const player = players[0]

        updatePlayer(player.id, { rank: 'proletariat' })
        const initialLogLength = useGameStore.getState().gameLog.length

        applyDirectiveEffect(partyRecognitionCard, player.id)

        const logs = useGameStore.getState().gameLog
        expect(logs.length).toBeGreaterThan(initialLogLength)
        const promotionLog = logs.find(log => log.message.includes('promoted'))
        expect(promotionLog).toBeDefined()
        expect(promotionLog?.message).toContain(player.name)
        expect(promotionLog?.message).toContain('partyMember')
      })

      it('should add log entry when already at max rank', () => {
        const { applyDirectiveEffect, players, updatePlayer } = useGameStore.getState()
        const player = players[0]

        updatePlayer(player.id, { rank: 'innerCircle' })
        const initialLogLength = useGameStore.getState().gameLog.length

        applyDirectiveEffect(partyRecognitionCard, player.id)

        const logs = useGameStore.getState().gameLog
        expect(logs.length).toBeGreaterThan(initialLogLength)
        const maxRankLog = logs.find(log => log.message.includes('highest rank'))
        expect(maxRankLog).toBeDefined()
        expect(maxRankLog?.message).toContain(player.name)
        expect(maxRankLog?.message).toContain('Inner Circle')
      })
    })
  })

  describe('Custom Handler Card', () => {
    describe('pd-11: DENOUNCED! (Anonymous Tribunal)', () => {
      const denouncedCard = PARTY_DIRECTIVE_CARDS.find(c => c.id === 'pd-11')
      if (denouncedCard === undefined) {
        throw new Error('DENOUNCED! card not found in PARTY_DIRECTIVE_CARDS')
      }

      it('should trigger tribunal pending action', () => {
        const { applyDirectiveEffect, players } = useGameStore.getState()
        const player = players[0]

        applyDirectiveEffect(denouncedCard, player.id)

        const state = useGameStore.getState()
        expect(state.pendingAction).not.toBeNull()
        expect(state.pendingAction?.type).toBe('tribunal')
      })

      it('should set turnPhase to resolving', () => {
        const { applyDirectiveEffect, players } = useGameStore.getState()
        const player = players[0]

        applyDirectiveEffect(denouncedCard, player.id)

        const state = useGameStore.getState()
        expect(state.turnPhase).toBe('resolving')
      })

      it('should set isAnonymous to true in pending action data', () => {
        const { applyDirectiveEffect, players } = useGameStore.getState()
        const player = players[0]

        applyDirectiveEffect(denouncedCard, player.id)

        const state = useGameStore.getState()
        expect(state.pendingAction).not.toBeNull()
        expect(state.pendingAction?.type).toBe('tribunal')
        expect(state.pendingAction?.data?.isAnonymous).toBe(true)
      })

      it('should set Stalin as the accuser', () => {
        const { applyDirectiveEffect, players } = useGameStore.getState()
        const player = players[0]
        const stalin = players.find(p => p.isStalin)

        expect(stalin).toBeDefined()

        applyDirectiveEffect(denouncedCard, player.id)

        const state = useGameStore.getState()
        expect(state.pendingAction).not.toBeNull()
        expect(state.pendingAction?.type).toBe('tribunal')
        expect(state.pendingAction?.data?.accuserId).toBe(stalin?.id)
      })

      it('should set the card player as the target', () => {
        const { applyDirectiveEffect, players } = useGameStore.getState()
        const player = players[0]

        applyDirectiveEffect(denouncedCard, player.id)

        const state = useGameStore.getState()
        expect(state.pendingAction).not.toBeNull()
        expect(state.pendingAction?.type).toBe('tribunal')
        expect(state.pendingAction?.data?.targetId).toBe(player.id)
      })

      it('should add log entry for the directive card', () => {
        const { applyDirectiveEffect, players } = useGameStore.getState()
        const player = players[0]
        const initialLogLength = useGameStore.getState().gameLog.length

        applyDirectiveEffect(denouncedCard, player.id)

        const logs = useGameStore.getState().gameLog
        expect(logs.length).toBeGreaterThan(initialLogLength)
        const cardLog = logs.find(log => log.message.includes('DENOUNCED!'))
        expect(cardLog).toBeDefined()
      })
    })
  })
})
