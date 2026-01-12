// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useGameStore } from '../../../store/gameStore'

describe('gameStore - Five Year Plan', () => {
  const setupPlayers = () => {
    const { initializePlayers } = useGameStore.getState()
    initializePlayers([
      { name: 'Player 1', piece: 'sickle', isStalin: false },
      { name: 'Player 2', piece: 'star', isStalin: false },
      { name: 'Player 3', piece: 'boot', isStalin: false },
      { name: 'Player 4', piece: 'anvil', isStalin: false }
    ])

    // Give players some rubles for testing
    const { players, updatePlayer } = useGameStore.getState()
    updatePlayer(players[0].id, { rubles: 500 })
    updatePlayer(players[1].id, { rubles: 300 })
    updatePlayer(players[2].id, { rubles: 200 })
    updatePlayer(players[3].id, { rubles: 100 })
  }

  beforeEach(() => {
    useGameStore.getState().resetGame()
    setupPlayers()
  })

  describe('initiateFiveYearPlan()', () => {
    it('should initiate Five Year Plan with correct state', () => {
      const { initiateFiveYearPlan } = useGameStore.getState()
      const target = 1000
      const durationMinutes = 10

      const beforeTime = Date.now()
      initiateFiveYearPlan(target, durationMinutes)
      const afterTime = Date.now()

      const state = useGameStore.getState()
      expect(state.activeFiveYearPlan).not.toBeNull()
      expect(state.activeFiveYearPlan?.isActive).toBe(true)
      expect(state.activeFiveYearPlan?.target).toBe(target)
      expect(state.activeFiveYearPlan?.collected).toBe(0)
      expect(state.activeFiveYearPlan?.startTime).toBeInstanceOf(Date)
      expect(state.activeFiveYearPlan?.deadline).toBeInstanceOf(Date)

      // Check deadline is approximately durationMinutes from now
      const deadlineTime = state.activeFiveYearPlan?.deadline.getTime() ?? 0
      const expectedDeadline = beforeTime + durationMinutes * 60 * 1000
      expect(deadlineTime).toBeGreaterThanOrEqual(expectedDeadline)
      expect(deadlineTime).toBeLessThanOrEqual(afterTime + durationMinutes * 60 * 1000)
    })

    it('should add log entry when Five Year Plan is initiated', () => {
      const { initiateFiveYearPlan } = useGameStore.getState()
      const target = 1000
      const durationMinutes = 10
      const initialLogLength = useGameStore.getState().gameLog.length

      initiateFiveYearPlan(target, durationMinutes)

      const logs = useGameStore.getState().gameLog
      expect(logs.length).toBe(initialLogLength + 1)
      expect(logs[logs.length - 1].type).toBe('system')
      expect(logs[logs.length - 1].message).toContain('FIVE-YEAR PLAN INITIATED')
      expect(logs[logs.length - 1].message).toContain('₽1000')
      expect(logs[logs.length - 1].message).toContain('10 minutes')
    })

    it('should calculate deadline correctly', () => {
      const { initiateFiveYearPlan } = useGameStore.getState()
      const durationMinutes = 5

      const beforeTime = Date.now()
      initiateFiveYearPlan(500, durationMinutes)
      const afterTime = Date.now()

      const state = useGameStore.getState()
      const deadlineTime = state.activeFiveYearPlan?.deadline.getTime() ?? 0
      const startTime = state.activeFiveYearPlan?.startTime.getTime() ?? 0

      // Deadline should be approximately startTime + durationMinutes
      const expectedDuration = durationMinutes * 60 * 1000
      const actualDuration = deadlineTime - startTime

      expect(actualDuration).toBeGreaterThanOrEqual(expectedDuration - 100) // Allow 100ms tolerance
      expect(actualDuration).toBeLessThanOrEqual(expectedDuration + 100)
    })

    it('should initialize collected to 0', () => {
      const { initiateFiveYearPlan } = useGameStore.getState()

      initiateFiveYearPlan(1000, 10)

      expect(useGameStore.getState().activeFiveYearPlan?.collected).toBe(0)
    })

    it('should allow initiating multiple Five Year Plans', () => {
      const { initiateFiveYearPlan, resolveFiveYearPlan } = useGameStore.getState()

      // First plan
      initiateFiveYearPlan(500, 5)
      expect(useGameStore.getState().activeFiveYearPlan?.target).toBe(500)

      // Resolve first plan
      resolveFiveYearPlan()

      // Second plan
      initiateFiveYearPlan(1000, 10)
      expect(useGameStore.getState().activeFiveYearPlan?.target).toBe(1000)
    })
  })

  describe('contributeToFiveYearPlan()', () => {
    beforeEach(() => {
      // Always initiate Five Year Plan before contribution tests
      useGameStore.getState().initiateFiveYearPlan(1000, 10)
    })

    it('should deduct rubles from player when contributing', () => {
      const { contributeToFiveYearPlan, players } = useGameStore.getState()
      const player = players[0]
      const initialRubles = player.rubles
      const contribution = 100

      contributeToFiveYearPlan(player.id, contribution)

      const updatedPlayer = useGameStore.getState().players.find(p => p.id === player.id)
      expect(updatedPlayer?.rubles).toBe(initialRubles - contribution)
    })

    it('should increase collected amount when player contributes', () => {
      const { contributeToFiveYearPlan, players } = useGameStore.getState()
      const contribution = 100

      expect(useGameStore.getState().activeFiveYearPlan?.collected).toBe(0)

      contributeToFiveYearPlan(players[0].id, contribution)

      expect(useGameStore.getState().activeFiveYearPlan?.collected).toBe(contribution)
    })

    it('should add to State Treasury when player contributes', () => {
      const { contributeToFiveYearPlan, players } = useGameStore.getState()
      const initialTreasury = useGameStore.getState().stateTreasury
      const contribution = 100

      contributeToFiveYearPlan(players[0].id, contribution)

      expect(useGameStore.getState().stateTreasury).toBe(initialTreasury + contribution)
    })

    it('should add log entry when player contributes', () => {
      const { contributeToFiveYearPlan, players } = useGameStore.getState()
      const player = players[0]
      const contribution = 100
      const initialLogLength = useGameStore.getState().gameLog.length

      contributeToFiveYearPlan(player.id, contribution)

      const logs = useGameStore.getState().gameLog
      expect(logs.length).toBe(initialLogLength + 1)
      expect(logs[logs.length - 1].type).toBe('system')
      expect(logs[logs.length - 1].message).toContain(player.name)
      expect(logs[logs.length - 1].message).toContain('₽100')
      expect(logs[logs.length - 1].message).toContain('Five-Year Plan')
    })

    it('should track multiple contributions from different players', () => {
      const { contributeToFiveYearPlan, players } = useGameStore.getState()

      contributeToFiveYearPlan(players[0].id, 200)
      contributeToFiveYearPlan(players[1].id, 150)
      contributeToFiveYearPlan(players[2].id, 100)

      expect(useGameStore.getState().activeFiveYearPlan?.collected).toBe(450)
    })

    it('should not allow contribution if player does not have enough rubles', () => {
      const { contributeToFiveYearPlan, players } = useGameStore.getState()
      const player = players[3] // Has 100 rubles
      const initialRubles = player.rubles
      const initialCollected = useGameStore.getState().activeFiveYearPlan?.collected ?? 0

      contributeToFiveYearPlan(player.id, 200) // Try to contribute more than they have

      const updatedPlayer = useGameStore.getState().players.find(p => p.id === player.id)
      expect(updatedPlayer?.rubles).toBe(initialRubles) // Rubles unchanged
      expect(useGameStore.getState().activeFiveYearPlan?.collected).toBe(initialCollected) // Collected unchanged
    })

    it('should not allow contribution if Five Year Plan is not active', () => {
      const { contributeToFiveYearPlan, resolveFiveYearPlan, players } = useGameStore.getState()
      const player = players[0]
      const initialRubles = player.rubles

      // Resolve the Five Year Plan to deactivate it
      resolveFiveYearPlan()

      contributeToFiveYearPlan(player.id, 100)

      const updatedPlayer = useGameStore.getState().players.find(p => p.id === player.id)
      expect(updatedPlayer?.rubles).toBe(initialRubles) // Rubles unchanged
    })

    it('should not allow contribution if player does not exist', () => {
      const { contributeToFiveYearPlan } = useGameStore.getState()
      const initialTreasury = useGameStore.getState().stateTreasury

      contributeToFiveYearPlan('invalid-player-id', 100)

      // Treasury should be unchanged
      expect(useGameStore.getState().stateTreasury).toBe(initialTreasury)
    })

    it('should allow player to contribute exact amount they have', () => {
      const { contributeToFiveYearPlan, players } = useGameStore.getState()
      const player = players[3] // Has 100 rubles
      const contribution = 100

      contributeToFiveYearPlan(player.id, contribution)

      const updatedPlayer = useGameStore.getState().players.find(p => p.id === player.id)
      expect(updatedPlayer?.rubles).toBe(0)
      expect(useGameStore.getState().activeFiveYearPlan?.collected).toBe(contribution)
    })

    it('should show progress in log entry', () => {
      const { contributeToFiveYearPlan, players } = useGameStore.getState()

      contributeToFiveYearPlan(players[0].id, 300)

      const logs = useGameStore.getState().gameLog
      const lastLog = logs[logs.length - 1]
      expect(lastLog.message).toContain('300/₽1000') // Shows progress toward target
    })
  })

  describe('resolveFiveYearPlan()', () => {
    beforeEach(() => {
      useGameStore.getState().initiateFiveYearPlan(1000, 10)
    })

    it('should give bonus to all players when Five Year Plan succeeds', () => {
      const { contributeToFiveYearPlan, resolveFiveYearPlan, players } = useGameStore.getState()

      // Contribute enough to meet target
      contributeToFiveYearPlan(players[0].id, 500)
      contributeToFiveYearPlan(players[1].id, 300)
      contributeToFiveYearPlan(players[2].id, 200)

      const initialRubles = players.map(p => useGameStore.getState().players.find(pl => pl.id === p.id)?.rubles ?? 0)

      resolveFiveYearPlan()

      const finalRubles = players.map(p => useGameStore.getState().players.find(pl => pl.id === p.id)?.rubles ?? 0)

      // Each player should have gained 100 rubles
      finalRubles.forEach((rubles, index) => {
        expect(rubles).toBe(initialRubles[index] + 100)
      })
    })

    it('should add success log entry when Five Year Plan succeeds', () => {
      const { contributeToFiveYearPlan, resolveFiveYearPlan, players } = useGameStore.getState()

      // Player 0 has 500, Player 1 has 300, Player 2 has 200
      contributeToFiveYearPlan(players[0].id, 500)
      contributeToFiveYearPlan(players[1].id, 300)
      contributeToFiveYearPlan(players[2].id, 200)

      const initialLogLength = useGameStore.getState().gameLog.length
      resolveFiveYearPlan()

      const logs = useGameStore.getState().gameLog
      expect(logs.length).toBeGreaterThan(initialLogLength)
      const successLog = logs.find(log => log.message.includes('SUCCESSFUL'))
      expect(successLog).toBeDefined()
      expect(successLog?.message).toContain('₽100 bonus')
    })

    it('should send poorest player to Gulag when Five Year Plan fails', () => {
      const { resolveFiveYearPlan, players } = useGameStore.getState()
      const poorestPlayer = players[3] // Has 100 rubles (least)

      // Don't contribute enough (need 1000, contribute 0)
      resolveFiveYearPlan()

      const updatedPlayer = useGameStore.getState().players.find(p => p.id === poorestPlayer.id)
      expect(updatedPlayer?.inGulag).toBe(true)
    })

    it('should add failure log entry when Five Year Plan fails', () => {
      const { resolveFiveYearPlan, players } = useGameStore.getState()
      const poorestPlayer = players[3]

      const initialLogLength = useGameStore.getState().gameLog.length
      resolveFiveYearPlan()

      const logs = useGameStore.getState().gameLog
      expect(logs.length).toBeGreaterThan(initialLogLength)
      const failureLog = logs.find(log => log.message.includes('FAILED'))
      expect(failureLog).toBeDefined()
      expect(failureLog?.message).toContain(poorestPlayer.name)
      expect(failureLog?.message).toContain('poorest player')
      expect(failureLog?.message).toContain('Gulag')
    })

    it('should set activeFiveYearPlan to null after resolution', () => {
      const { resolveFiveYearPlan } = useGameStore.getState()

      expect(useGameStore.getState().activeFiveYearPlan).not.toBeNull()

      resolveFiveYearPlan()

      expect(useGameStore.getState().activeFiveYearPlan).toBeNull()
    })

    it('should consider plan successful when collected equals target exactly', () => {
      const { contributeToFiveYearPlan, resolveFiveYearPlan, players } = useGameStore.getState()

      // Contribute exactly the target amount
      contributeToFiveYearPlan(players[0].id, 500)
      contributeToFiveYearPlan(players[1].id, 300)
      contributeToFiveYearPlan(players[2].id, 200)

      const initialRubles = players[0].rubles

      resolveFiveYearPlan()

      // Should be successful, so players get bonus
      const logs = useGameStore.getState().gameLog
      const successLog = logs.find(log => log.message.includes('SUCCESSFUL'))
      expect(successLog).toBeDefined()

      // Poorest player should NOT be in Gulag
      const poorestPlayer = useGameStore.getState().players[3]
      expect(poorestPlayer.inGulag).toBe(false)
    })

    it('should not send Stalin to Gulag when plan fails', () => {
      const { initializePlayers, initiateFiveYearPlan, resolveFiveYearPlan } = useGameStore.getState()

      // Reset and create players with Stalin as the poorest
      useGameStore.getState().resetGame()
      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false },
        { name: 'Player 2', piece: 'star', isStalin: false },
        { name: 'Stalin', piece: null, isStalin: true }
      ])

      const { players, updatePlayer } = useGameStore.getState()
      updatePlayer(players[0].id, { rubles: 500 })
      updatePlayer(players[1].id, { rubles: 300 })
      updatePlayer(players[2].id, { rubles: 50 }) // Stalin is poorest

      initiateFiveYearPlan(1000, 10)
      resolveFiveYearPlan()

      // Stalin should not be sent to Gulag
      const stalin = useGameStore.getState().players.find(p => p.isStalin)
      expect(stalin?.inGulag).toBe(false)

      // Next poorest player should be sent instead
      const player2 = useGameStore.getState().players.find(p => p.id === players[1].id)
      expect(player2?.inGulag).toBe(true)
    })

    it('should not send eliminated player to Gulag when plan fails', () => {
      const { eliminatePlayer, resolveFiveYearPlan, players } = useGameStore.getState()
      const poorestPlayer = players[3] // Has 100 rubles

      // Eliminate the poorest player
      eliminatePlayer(poorestPlayer.id, 'bankruptcy')

      resolveFiveYearPlan()

      // Poorest player already eliminated, should not be sent to Gulag
      const poorest = useGameStore.getState().players.find(p => p.id === poorestPlayer.id)
      expect(poorest?.inGulag).toBe(false)

      // Next poorest should be sent instead (Player 3 with 200 rubles)
      const nextPoorest = useGameStore.getState().players.find(p => p.id === players[2].id)
      expect(nextPoorest?.inGulag).toBe(true)
    })

    it('should not send player already in Gulag when plan fails', () => {
      const { sendToGulag, resolveFiveYearPlan, players } = useGameStore.getState()
      const poorestPlayer = players[3]

      // Send poorest player to Gulag before resolving
      sendToGulag(poorestPlayer.id, 'denouncementGuilty')
      const initialGulagTurns = useGameStore.getState().players.find(p => p.id === poorestPlayer.id)?.gulagTurns

      resolveFiveYearPlan()

      // Poorest player already in Gulag, gulagTurns should not change
      const finalGulagTurns = useGameStore.getState().players.find(p => p.id === poorestPlayer.id)?.gulagTurns
      expect(finalGulagTurns).toBe(initialGulagTurns)

      // Next poorest should be sent instead (Player 3 with 200 rubles)
      const nextPoorest = useGameStore.getState().players.find(p => p.id === players[2].id)
      expect(nextPoorest?.inGulag).toBe(true)
    })

    it('should handle resolution when activeFiveYearPlan is null', () => {
      const { resolveFiveYearPlan } = useGameStore.getState()

      // Resolve once
      resolveFiveYearPlan()

      // Try to resolve again when already null
      resolveFiveYearPlan()

      // Should not error
      expect(useGameStore.getState().activeFiveYearPlan).toBeNull()
    })

    it('should not give bonus to Stalin when plan succeeds', () => {
      const { initializePlayers, initiateFiveYearPlan, contributeToFiveYearPlan, resolveFiveYearPlan } = useGameStore.getState()

      // Reset and create players with Stalin
      useGameStore.getState().resetGame()
      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false },
        { name: 'Player 2', piece: 'star', isStalin: false },
        { name: 'Stalin', piece: null, isStalin: true }
      ])

      const { players, updatePlayer } = useGameStore.getState()
      updatePlayer(players[0].id, { rubles: 500 })
      updatePlayer(players[1].id, { rubles: 300 })
      updatePlayer(players[2].id, { rubles: 200 }) // Stalin

      initiateFiveYearPlan(500, 10)
      contributeToFiveYearPlan(players[0].id, 500)

      const stalinInitialRubles = useGameStore.getState().players.find(p => p.isStalin)?.rubles ?? 0

      resolveFiveYearPlan()

      const stalinFinalRubles = useGameStore.getState().players.find(p => p.isStalin)?.rubles ?? 0
      expect(stalinFinalRubles).toBe(stalinInitialRubles) // No bonus for Stalin
    })

    it('should not give bonus to eliminated players when plan succeeds', () => {
      const { eliminatePlayer, contributeToFiveYearPlan, resolveFiveYearPlan, players } = useGameStore.getState()

      // Eliminate one player
      eliminatePlayer(players[3].id, 'bankruptcy')
      const eliminatedInitialRubles = useGameStore.getState().players.find(p => p.id === players[3].id)?.rubles ?? 0

      // Meet the target
      contributeToFiveYearPlan(players[0].id, 500)
      contributeToFiveYearPlan(players[1].id, 300)
      contributeToFiveYearPlan(players[2].id, 200)

      resolveFiveYearPlan()

      // Eliminated player should not receive bonus
      const eliminatedFinalRubles = useGameStore.getState().players.find(p => p.id === players[3].id)?.rubles ?? 0
      expect(eliminatedFinalRubles).toBe(eliminatedInitialRubles)
    })
  })

  describe('Five Year Plan - Integration', () => {
    it('should complete full Five Year Plan flow from initiation to success', () => {
      const { initiateFiveYearPlan, contributeToFiveYearPlan, resolveFiveYearPlan, players } = useGameStore.getState()

      // Step 1: Initiate
      initiateFiveYearPlan(800, 15)
      expect(useGameStore.getState().activeFiveYearPlan?.isActive).toBe(true)

      // Step 2: Players contribute
      contributeToFiveYearPlan(players[0].id, 400)
      contributeToFiveYearPlan(players[1].id, 200)
      contributeToFiveYearPlan(players[2].id, 200)

      expect(useGameStore.getState().activeFiveYearPlan?.collected).toBe(800)

      // Capture rubles AFTER contributions
      const player1AfterContribution = useGameStore.getState().players.find(p => p.id === players[0].id)
      const rublesBeforeBonus = player1AfterContribution?.rubles ?? 0

      // Step 3: Resolve successfully
      resolveFiveYearPlan()

      const state = useGameStore.getState()
      expect(state.activeFiveYearPlan).toBeNull()

      // Players should have received bonus (+100)
      const player1 = state.players.find(p => p.id === players[0].id)
      expect(player1?.rubles).toBe(rublesBeforeBonus + 100)
    })

    it('should complete full Five Year Plan flow from initiation to failure', () => {
      const { initiateFiveYearPlan, contributeToFiveYearPlan, resolveFiveYearPlan, players } = useGameStore.getState()

      // Step 1: Initiate
      initiateFiveYearPlan(1500, 15)

      // Step 2: Players contribute (not enough)
      contributeToFiveYearPlan(players[0].id, 200)
      contributeToFiveYearPlan(players[1].id, 100)

      expect(useGameStore.getState().activeFiveYearPlan?.collected).toBe(300)
      expect(300).toBeLessThan(1500) // Verify failure condition

      // After contributions:
      // Player 0: 500 - 200 = 300
      // Player 1: 300 - 100 = 200
      // Player 2: 200 (no contribution)
      // Player 3: 100 (no contribution) <- poorest

      // Step 3: Resolve with failure
      resolveFiveYearPlan()

      const state = useGameStore.getState()
      expect(state.activeFiveYearPlan).toBeNull()

      // Poorest player (Player 3 with 100 rubles) should be in Gulag
      const poorest = state.players.find(p => p.id === players[3].id)
      expect(poorest?.inGulag).toBe(true)
    })
  })
})
