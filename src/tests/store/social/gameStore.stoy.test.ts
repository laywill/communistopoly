// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore } from '../../../store/gameStore'

describe('gameStore - STOY & Special Mechanics', () => {
  beforeEach(() => {
    // Reset store to clean state
    useGameStore.setState({
      gamePhase: 'playing',
      players: [],
      gameLog: [],
      stateTreasury: 1000,
      turnPhase: 'pre-roll',
      pendingAction: null
    })
  })

  describe('handleStoyPassing', () => {
    it('should deduct 200 rubles travel tax from player', () => {
      const { initializePlayers, handleStoyPassing } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])

      const [player1] = useGameStore.getState().players

      handleStoyPassing(player1.id)

      const updatedPlayer = useGameStore.getState().players.find(p => p.id === player1.id)
      expect(updatedPlayer?.rubles).toBe(1300) // 1500 - 200
    })

    it('should add 200 rubles to state treasury', () => {
      const { initializePlayers, handleStoyPassing } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])

      const [player1] = useGameStore.getState().players
      const initialTreasury = useGameStore.getState().stateTreasury

      handleStoyPassing(player1.id)

      const state = useGameStore.getState()
      expect(state.stateTreasury).toBe(initialTreasury + 200)
    })

    it('should add log entry for travel tax payment', () => {
      const { initializePlayers, handleStoyPassing } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])

      const [player1] = useGameStore.getState().players

      // Clear log
      useGameStore.setState({ gameLog: [] })

      handleStoyPassing(player1.id)

      const state = useGameStore.getState()
      const taxLog = state.gameLog.find(log =>
        log.type === 'payment' && log.message.includes('paid ₽200 travel tax at STOY')
      )

      expect(taxLog).toBeDefined()
      expect(taxLog?.playerId).toBe(player1.id)
    })

    it('should grant Hammer piece +50 rubles bonus when passing STOY', () => {
      const { initializePlayers, handleStoyPassing } = useGameStore.getState()

      initializePlayers([
        { name: 'Hammer Player', piece: 'hammer', isStalin: false }
      ])

      const [player1] = useGameStore.getState().players

      handleStoyPassing(player1.id)

      const updatedPlayer = useGameStore.getState().players.find(p => p.id === player1.id)
      // Net: -200 + 50 = -150 from initial 1500 = 1350
      expect(updatedPlayer?.rubles).toBe(1350)
    })

    it('should add log entry for Hammer bonus', () => {
      const { initializePlayers, handleStoyPassing } = useGameStore.getState()

      initializePlayers([
        { name: 'Hammer Player', piece: 'hammer', isStalin: false }
      ])

      const [player1] = useGameStore.getState().players

      // Clear log
      useGameStore.setState({ gameLog: [] })

      handleStoyPassing(player1.id)

      const state = useGameStore.getState()
      const bonusLog = state.gameLog.find(log =>
        log.type === 'payment' && log.message.includes("Hammer earns +₽50 bonus at STOY")
      )

      expect(bonusLog).toBeDefined()
      expect(bonusLog?.playerId).toBe(player1.id)
    })

    it('should not grant bonus to non-Hammer pieces', () => {
      const { initializePlayers, handleStoyPassing } = useGameStore.getState()

      initializePlayers([
        { name: 'Sickle Player', piece: 'sickle', isStalin: false }
      ])

      const [player1] = useGameStore.getState().players

      // Clear log
      useGameStore.setState({ gameLog: [] })

      handleStoyPassing(player1.id)

      const state = useGameStore.getState()
      const bonusLog = state.gameLog.find(log =>
        log.message.includes("Hammer earns +₽50 bonus at STOY")
      )

      expect(bonusLog).toBeUndefined()

      const updatedPlayer = useGameStore.getState().players.find(p => p.id === player1.id)
      expect(updatedPlayer?.rubles).toBe(1300) // Only -200, no bonus
    })

    it('should handle non-existent player gracefully', () => {
      const { initializePlayers, handleStoyPassing } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])

      const initialState = useGameStore.getState()

      // Try to call with non-existent player ID
      handleStoyPassing('non-existent-id')

      // State should remain unchanged
      const finalState = useGameStore.getState()
      expect(finalState.players).toEqual(initialState.players)
      expect(finalState.stateTreasury).toBe(initialState.stateTreasury)
    })
  })

  describe('handleStoyPilfer', () => {
    it('should successfully pilfer 100 rubles on dice roll >= 4', () => {
      const { initializePlayers, handleStoyPilfer } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])

      const [player1] = useGameStore.getState().players
      const initialRubles = player1.rubles

      handleStoyPilfer(player1.id, 6)

      const updatedPlayer = useGameStore.getState().players.find(p => p.id === player1.id)
      expect(updatedPlayer?.rubles).toBe(initialRubles + 100)
    })

    it('should successfully pilfer on exactly dice roll 4', () => {
      const { initializePlayers, handleStoyPilfer } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])

      const [player1] = useGameStore.getState().players
      const initialRubles = player1.rubles

      handleStoyPilfer(player1.id, 4)

      const updatedPlayer = useGameStore.getState().players.find(p => p.id === player1.id)
      expect(updatedPlayer?.rubles).toBe(initialRubles + 100)
    })

    it('should deduct 100 rubles from state treasury on successful pilfer', () => {
      const { initializePlayers, handleStoyPilfer } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])

      const [player1] = useGameStore.getState().players
      const initialTreasury = useGameStore.getState().stateTreasury

      handleStoyPilfer(player1.id, 6)

      const state = useGameStore.getState()
      expect(state.stateTreasury).toBe(initialTreasury - 100)
    })

    it('should add success log entry on successful pilfer', () => {
      const { initializePlayers, handleStoyPilfer } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])

      const [player1] = useGameStore.getState().players

      // Clear log
      useGameStore.setState({ gameLog: [] })

      handleStoyPilfer(player1.id, 6)

      const state = useGameStore.getState()
      const pilferLog = state.gameLog.find(log =>
        log.type === 'payment' && log.message.includes('successfully pilfered ₽100')
      )

      expect(pilferLog).toBeDefined()
      expect(pilferLog?.playerId).toBe(player1.id)
    })

    it('should send player to Gulag on dice roll < 4', () => {
      const { initializePlayers, handleStoyPilfer } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])

      const [player1] = useGameStore.getState().players

      handleStoyPilfer(player1.id, 3)

      const updatedPlayer = useGameStore.getState().players.find(p => p.id === player1.id)
      expect(updatedPlayer?.inGulag).toBe(true)
      expect(updatedPlayer?.position).toBe(10)
    })

    it('should send player to Gulag on dice roll 1', () => {
      const { initializePlayers, handleStoyPilfer } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])

      const [player1] = useGameStore.getState().players

      handleStoyPilfer(player1.id, 1)

      const updatedPlayer = useGameStore.getState().players.find(p => p.id === player1.id)
      expect(updatedPlayer?.inGulag).toBe(true)
    })

    it('should not change rubles when caught pilfering', () => {
      const { initializePlayers, handleStoyPilfer } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])

      const [player1] = useGameStore.getState().players
      const initialRubles = player1.rubles

      handleStoyPilfer(player1.id, 2)

      const updatedPlayer = useGameStore.getState().players.find(p => p.id === player1.id)
      expect(updatedPlayer?.rubles).toBe(initialRubles)
    })

    it('should set turnPhase to post-turn', () => {
      const { initializePlayers, handleStoyPilfer } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])

      const [player1] = useGameStore.getState().players

      useGameStore.setState({ turnPhase: 'resolving' })

      handleStoyPilfer(player1.id, 6)

      const state = useGameStore.getState()
      expect(state.turnPhase).toBe('post-turn')
    })

    it('should set pendingAction to null', () => {
      const { initializePlayers, handleStoyPilfer } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])

      const [player1] = useGameStore.getState().players

      useGameStore.setState({ pendingAction: { type: 'stoy-pilfer', data: {} } })

      handleStoyPilfer(player1.id, 6)

      const state = useGameStore.getState()
      expect(state.pendingAction).toBeNull()
    })

    it('should handle non-existent player gracefully', () => {
      const { initializePlayers, handleStoyPilfer } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])

      const initialState = useGameStore.getState()

      // Try to call with non-existent player ID
      handleStoyPilfer('non-existent-id', 6)

      // State should remain mostly unchanged (turnPhase still changes)
      const finalState = useGameStore.getState()
      expect(finalState.players).toEqual(initialState.players)
    })
  })

  describe('tankRequisition', () => {
    it('should requisition 50 rubles from target player', () => {
      const { initializePlayers, tankRequisition } = useGameStore.getState()

      initializePlayers([
        { name: 'Tank Player', piece: 'tank', isStalin: false },
        { name: 'Target Player', piece: 'sickle', isStalin: false }
      ])

      const [tankPlayer, targetPlayer] = useGameStore.getState().players

      tankRequisition(tankPlayer.id, targetPlayer.id)

      const updatedTarget = useGameStore.getState().players.find(p => p.id === targetPlayer.id)
      expect(updatedTarget?.rubles).toBe(1450) // 1500 - 50
    })

    it('should add 50 rubles to tank player', () => {
      const { initializePlayers, tankRequisition } = useGameStore.getState()

      initializePlayers([
        { name: 'Tank Player', piece: 'tank', isStalin: false },
        { name: 'Target Player', piece: 'sickle', isStalin: false }
      ])

      const [tankPlayer, targetPlayer] = useGameStore.getState().players

      tankRequisition(tankPlayer.id, targetPlayer.id)

      const updatedTank = useGameStore.getState().players.find(p => p.id === tankPlayer.id)
      expect(updatedTank?.rubles).toBe(1550) // 1500 + 50
    })

    it('should set tankRequisitionUsedThisLap to true', () => {
      const { initializePlayers, tankRequisition } = useGameStore.getState()

      initializePlayers([
        { name: 'Tank Player', piece: 'tank', isStalin: false },
        { name: 'Target Player', piece: 'sickle', isStalin: false }
      ])

      const [tankPlayer, targetPlayer] = useGameStore.getState().players

      expect(tankPlayer.tankRequisitionUsedThisLap).toBe(false)

      tankRequisition(tankPlayer.id, targetPlayer.id)

      const updatedTank = useGameStore.getState().players.find(p => p.id === tankPlayer.id)
      expect(updatedTank?.tankRequisitionUsedThisLap).toBe(true)
    })

    it('should add log entry for requisition', () => {
      const { initializePlayers, tankRequisition } = useGameStore.getState()

      initializePlayers([
        { name: 'Tank Player', piece: 'tank', isStalin: false },
        { name: 'Target Player', piece: 'sickle', isStalin: false }
      ])

      const [tankPlayer, targetPlayer] = useGameStore.getState().players

      // Clear log
      useGameStore.setState({ gameLog: [] })

      tankRequisition(tankPlayer.id, targetPlayer.id)

      const state = useGameStore.getState()
      const reqLog = state.gameLog.find(log =>
        log.type === 'payment' && log.message.includes("Tank requisitioned ₽50")
      )

      expect(reqLog).toBeDefined()
      expect(reqLog?.playerId).toBe(tankPlayer.id)
    })

    it('should requisition all money if target has less than 50 rubles', () => {
      const { initializePlayers, updatePlayer, tankRequisition } = useGameStore.getState()

      initializePlayers([
        { name: 'Tank Player', piece: 'tank', isStalin: false },
        { name: 'Target Player', piece: 'sickle', isStalin: false }
      ])

      const [tankPlayer, targetPlayer] = useGameStore.getState().players

      // Target has only 30 rubles
      updatePlayer(targetPlayer.id, { rubles: 30 })

      tankRequisition(tankPlayer.id, targetPlayer.id)

      const updatedTarget = useGameStore.getState().players.find(p => p.id === targetPlayer.id)
      const updatedTank = useGameStore.getState().players.find(p => p.id === tankPlayer.id)

      expect(updatedTarget?.rubles).toBe(0) // All taken
      expect(updatedTank?.rubles).toBe(1530) // 1500 + 30
    })

    it('should not requisition if tank player already used ability this lap', () => {
      const { initializePlayers, updatePlayer, tankRequisition } = useGameStore.getState()

      initializePlayers([
        { name: 'Tank Player', piece: 'tank', isStalin: false },
        { name: 'Target Player', piece: 'sickle', isStalin: false }
      ])

      const [tankPlayer, targetPlayer] = useGameStore.getState().players

      // Mark ability as used
      updatePlayer(tankPlayer.id, { tankRequisitionUsedThisLap: true })

      const initialTargetRubles = useGameStore.getState().players[1].rubles
      const initialTankRubles = useGameStore.getState().players[0].rubles

      tankRequisition(tankPlayer.id, targetPlayer.id)

      const updatedTarget = useGameStore.getState().players.find(p => p.id === targetPlayer.id)
      const updatedTank = useGameStore.getState().players.find(p => p.id === tankPlayer.id)

      expect(updatedTarget?.rubles).toBe(initialTargetRubles) // No change
      expect(updatedTank?.rubles).toBe(initialTankRubles) // No change
    })

    it('should not requisition if player is not a tank piece', () => {
      const { initializePlayers, tankRequisition } = useGameStore.getState()

      initializePlayers([
        { name: 'Sickle Player', piece: 'sickle', isStalin: false },
        { name: 'Target Player', piece: 'hammer', isStalin: false }
      ])

      const [player1, player2] = useGameStore.getState().players

      const initialPlayer2Rubles = player2.rubles
      const initialPlayer1Rubles = player1.rubles

      tankRequisition(player1.id, player2.id)

      const updatedPlayer1 = useGameStore.getState().players.find(p => p.id === player1.id)
      const updatedPlayer2 = useGameStore.getState().players.find(p => p.id === player2.id)

      expect(updatedPlayer1?.rubles).toBe(initialPlayer1Rubles) // No change
      expect(updatedPlayer2?.rubles).toBe(initialPlayer2Rubles) // No change
    })

    it('should handle non-existent tank player gracefully', () => {
      const { initializePlayers, tankRequisition } = useGameStore.getState()

      initializePlayers([
        { name: 'Target Player', piece: 'sickle', isStalin: false }
      ])

      const [targetPlayer] = useGameStore.getState().players
      const initialRubles = targetPlayer.rubles

      tankRequisition('non-existent-id', targetPlayer.id)

      const updatedTarget = useGameStore.getState().players.find(p => p.id === targetPlayer.id)
      expect(updatedTarget?.rubles).toBe(initialRubles) // No change
    })

    it('should handle non-existent target player gracefully', () => {
      const { initializePlayers, tankRequisition } = useGameStore.getState()

      initializePlayers([
        { name: 'Tank Player', piece: 'tank', isStalin: false }
      ])

      const [tankPlayer] = useGameStore.getState().players
      const initialRubles = tankPlayer.rubles

      tankRequisition(tankPlayer.id, 'non-existent-id')

      const updatedTank = useGameStore.getState().players.find(p => p.id === tankPlayer.id)
      expect(updatedTank?.rubles).toBe(initialRubles) // No change
    })

    it('should requisition 0 rubles if target has no money', () => {
      const { initializePlayers, updatePlayer, tankRequisition } = useGameStore.getState()

      initializePlayers([
        { name: 'Tank Player', piece: 'tank', isStalin: false },
        { name: 'Target Player', piece: 'sickle', isStalin: false }
      ])

      const [tankPlayer, targetPlayer] = useGameStore.getState().players

      // Target has no money
      updatePlayer(targetPlayer.id, { rubles: 0 })

      tankRequisition(tankPlayer.id, targetPlayer.id)

      const updatedTarget = useGameStore.getState().players.find(p => p.id === targetPlayer.id)
      const updatedTank = useGameStore.getState().players.find(p => p.id === tankPlayer.id)

      expect(updatedTarget?.rubles).toBe(0)
      expect(updatedTank?.rubles).toBe(1500) // No change (+ 0)
      expect(updatedTank?.tankRequisitionUsedThisLap).toBe(true) // Still marks as used
    })
  })
})
