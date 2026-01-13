// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useGameStore } from '../../../store/gameStore'

describe('gameStore - Dice Rolling & Movement', () => {
  beforeEach(() => {
    // Reset store to clean state
    useGameStore.setState({
      gamePhase: 'playing',
      players: [],
      properties: [],
      gameLog: [],
      dice: [0, 0],
      isRolling: false,
      hasRolled: false,
      turnPhase: 'pre-roll',
      doublesCount: 0,
      currentPlayerIndex: 0,
      pendingAction: null
    })

    // Initialize players
    const { initializePlayers } = useGameStore.getState()
    initializePlayers([
      { name: 'Player 1', piece: 'sickle', isStalin: false },
      { name: 'Player 2', piece: 'hammer', isStalin: false }
    ])
  })

  describe('rollDice', () => {
    it('should roll dice with values between 1 and 6', () => {
      const { rollDice } = useGameStore.getState()

      rollDice()

      const state = useGameStore.getState()
      const [die1, die2] = state.dice

      expect(die1).toBeGreaterThanOrEqual(1)
      expect(die1).toBeLessThanOrEqual(6)
      expect(die2).toBeGreaterThanOrEqual(1)
      expect(die2).toBeLessThanOrEqual(6)
    })

    it('should update dice state', () => {
      const mathRandomSpy = vi.spyOn(Math, 'random')
      mathRandomSpy.mockReturnValueOnce(0.5).mockReturnValueOnce(0.8)

      const { rollDice } = useGameStore.getState()
      rollDice()

      const state = useGameStore.getState()
      expect(state.dice).toEqual([4, 5]) // floor(0.5 * 6) + 1 = 4, floor(0.8 * 6) + 1 = 5

      mathRandomSpy.mockRestore()
    })

    it('should set hasRolled to true', () => {
      const { rollDice } = useGameStore.getState()

      rollDice()

      const state = useGameStore.getState()
      expect(state.hasRolled).toBe(true)
    })

    it('should set turnPhase to rolling', () => {
      const { rollDice } = useGameStore.getState()

      rollDice()

      const state = useGameStore.getState()
      expect(state.turnPhase).toBe('rolling')
    })

    it('should set isRolling to true', () => {
      const { rollDice } = useGameStore.getState()

      rollDice()

      const state = useGameStore.getState()
      expect(state.isRolling).toBe(true)
    })

    it('should add dice log entry', () => {
      const mathRandomSpy = vi.spyOn(Math, 'random')
      mathRandomSpy.mockReturnValueOnce(0.5).mockReturnValueOnce(0.8)

      const { rollDice } = useGameStore.getState()
      rollDice()

      const state = useGameStore.getState()
      const diceLog = state.gameLog.find(log => log.type === 'dice')

      expect(diceLog).toBeDefined()
      expect(diceLog?.message).toContain('Rolled 4 + 5 = 9')

      mathRandomSpy.mockRestore()
    })
  })

  describe('rollVodka3Dice', () => {
    beforeEach(() => {
      // Update current player to be vodka bottle piece
      const players = useGameStore.getState().players
      const currentIndex = useGameStore.getState().currentPlayerIndex
      useGameStore.setState({
        players: players.map((p, i) =>
          i === currentIndex ? { ...p, piece: 'vodkaBottle', vodkaUseCount: 0 } : p
        )
      })
    })

    it('should roll 3 dice and select best 2', () => {
      const mathRandomSpy = vi.spyOn(Math, 'random')
      // Roll 3, 5, 2 -> sorted descending: 5, 3, 2 -> best two: [5, 3]
      mathRandomSpy.mockReturnValueOnce(0.4).mockReturnValueOnce(0.7).mockReturnValueOnce(0.2)

      const { rollVodka3Dice } = useGameStore.getState()
      rollVodka3Dice()

      const state = useGameStore.getState()
      // floor(0.4 * 6) + 1 = 3, floor(0.7 * 6) + 1 = 5, floor(0.2 * 6) + 1 = 2
      // Sorted descending: [5, 3, 2] -> best two: [5, 3]
      expect(state.dice).toEqual([5, 3])

      mathRandomSpy.mockRestore()
    })

    it('should increment vodkaUseCount', () => {
      const { rollVodka3Dice } = useGameStore.getState()
      const currentIndex = useGameStore.getState().currentPlayerIndex
      const playerBefore = useGameStore.getState().players[currentIndex]
      const initialCount = playerBefore.vodkaUseCount

      rollVodka3Dice()

      const playerAfter = useGameStore.getState().players[currentIndex]
      expect(playerAfter.vodkaUseCount).toBe(initialCount + 1)
    })

    it('should set turnPhase to rolling', () => {
      const { rollVodka3Dice } = useGameStore.getState()

      rollVodka3Dice()

      const state = useGameStore.getState()
      expect(state.turnPhase).toBe('rolling')
    })

    it('should add detailed log entry showing all 3 dice', () => {
      const mathRandomSpy = vi.spyOn(Math, 'random')
      mathRandomSpy.mockReturnValueOnce(0.4).mockReturnValueOnce(0.7).mockReturnValueOnce(0.2)

      const { rollVodka3Dice } = useGameStore.getState()
      rollVodka3Dice()

      const state = useGameStore.getState()
      const diceLog = state.gameLog.find(log => log.type === 'dice' && log.message.includes('3 dice'))

      expect(diceLog).toBeDefined()
      expect(diceLog?.message).toContain('rolled 3 dice: 3, 5, 2')
      expect(diceLog?.message).toContain('Using best 2: 5 + 3 = 8')

      mathRandomSpy.mockRestore()
    })
  })

  describe('finishRolling', () => {
    it('should detect doubles and increment doublesCount', () => {
      const { rollDice, finishRolling } = useGameStore.getState()

      // Mock rolling doubles
      const mathRandomSpy = vi.spyOn(Math, 'random')
      mathRandomSpy.mockReturnValueOnce(0.5).mockReturnValueOnce(0.5)
      rollDice()

      finishRolling()

      const state = useGameStore.getState()
      expect(state.doublesCount).toBe(1)

      mathRandomSpy.mockRestore()
    })

    it('should reset doublesCount to 0 on non-doubles', () => {
      // Set initial doublesCount
      useGameStore.setState({ doublesCount: 1 })

      const { rollDice, finishRolling } = useGameStore.getState()

      // Mock rolling non-doubles
      const mathRandomSpy = vi.spyOn(Math, 'random')
      mathRandomSpy.mockReturnValueOnce(0.3).mockReturnValueOnce(0.7)
      rollDice()

      finishRolling()

      const state = useGameStore.getState()
      expect(state.doublesCount).toBe(0)

      mathRandomSpy.mockRestore()
    })

    it('should transition turnPhase from rolling to moving', () => {
      const { rollDice, finishRolling } = useGameStore.getState()

      const mathRandomSpy = vi.spyOn(Math, 'random')
      mathRandomSpy.mockReturnValueOnce(0.3).mockReturnValueOnce(0.7)
      rollDice()

      expect(useGameStore.getState().turnPhase).toBe('rolling')

      finishRolling()

      expect(useGameStore.getState().turnPhase).toBe('moving')

      mathRandomSpy.mockRestore()
    })

    it('should set isRolling to false', () => {
      const { rollDice, finishRolling } = useGameStore.getState()

      const mathRandomSpy = vi.spyOn(Math, 'random')
      mathRandomSpy.mockReturnValueOnce(0.3).mockReturnValueOnce(0.7)
      rollDice()

      expect(useGameStore.getState().isRolling).toBe(true)

      finishRolling()

      expect(useGameStore.getState().isRolling).toBe(false)

      mathRandomSpy.mockRestore()
    })

    it('should move player after rolling', () => {
      const { rollDice, finishRolling } = useGameStore.getState()
      const currentIndex = useGameStore.getState().currentPlayerIndex
      const player = useGameStore.getState().players[currentIndex]
      const initialPosition = player.position

      const mathRandomSpy = vi.spyOn(Math, 'random')
      mathRandomSpy.mockReturnValueOnce(0.3).mockReturnValueOnce(0.5)
      rollDice() // floor(0.3*6)+1=2, floor(0.5*6)+1=4, total=6

      finishRolling()

      const newPosition = useGameStore.getState().players[currentIndex].position
      expect(newPosition).toBe((initialPosition + 6) % 40)

      mathRandomSpy.mockRestore()
    })
  })

  describe('movePlayer', () => {
    it('should move player forward by specified spaces', () => {
      const { movePlayer } = useGameStore.getState()
      const player = useGameStore.getState().players[0]

      movePlayer(player.id, 5)

      const updatedPlayer = useGameStore.getState().players[0]
      expect(updatedPlayer.position).toBe(5)
    })

    it('should wrap position around board (modulo 40)', () => {
      const { updatePlayer, movePlayer } = useGameStore.getState()
      const player = useGameStore.getState().players[0]

      // Start at position 38
      updatePlayer(player.id, { position: 38 })

      // Move 5 spaces: 38 + 5 = 43 -> 43 % 40 = 3
      movePlayer(player.id, 5)

      const updatedPlayer = useGameStore.getState().players[0]
      expect(updatedPlayer.position).toBe(3)
    })

    it('should detect passing STOY and increment lapsCompleted', () => {
      const { updatePlayer, movePlayer } = useGameStore.getState()
      const player = useGameStore.getState().players[0]

      // Start at position 38, laps = 0
      updatePlayer(player.id, { position: 38, lapsCompleted: 0 })

      // Move 5 spaces: crosses STOY (position 0)
      movePlayer(player.id, 5)

      const updatedPlayer = useGameStore.getState().players[0]
      expect(updatedPlayer.lapsCompleted).toBe(1)
    })

    it('should not increment lapsCompleted when not passing STOY', () => {
      const { updatePlayer, movePlayer } = useGameStore.getState()
      const player = useGameStore.getState().players[0]

      // Start at position 10
      updatePlayer(player.id, { position: 10, lapsCompleted: 0 })

      // Move 5 spaces: no STOY pass
      movePlayer(player.id, 5)

      const updatedPlayer = useGameStore.getState().players[0]
      expect(updatedPlayer.lapsCompleted).toBe(0)
    })

    it('should add movement log entry', () => {
      const { movePlayer } = useGameStore.getState()
      const player = useGameStore.getState().players[0]

      movePlayer(player.id, 5)

      const state = useGameStore.getState()
      const movementLog = state.gameLog.find(log => log.type === 'movement' && log.message.includes('moved from'))

      expect(movementLog).toBeDefined()
      expect(movementLog?.playerId).toBe(player.id)
    })

    it('should reset tankRequisitionUsedThisLap when passing STOY', () => {
      const { updatePlayer, movePlayer } = useGameStore.getState()
      const player = useGameStore.getState().players[0]

      // Start at position 38 with tankRequisitionUsedThisLap = true
      updatePlayer(player.id, { position: 38, tankRequisitionUsedThisLap: true })

      // Move 5 spaces: crosses STOY
      movePlayer(player.id, 5)

      const updatedPlayer = useGameStore.getState().players[0]
      expect(updatedPlayer.tankRequisitionUsedThisLap).toBe(false)
    })
  })

  describe('finishMoving', () => {
    beforeEach(() => {
      // Initialize properties
      const { initializeProperties } = useGameStore.getState()
      initializeProperties()
    })

    it('should set turnPhase to resolving', () => {
      const { updatePlayer, finishMoving } = useGameStore.getState()
      const currentIndex = useGameStore.getState().currentPlayerIndex
      const player = useGameStore.getState().players[currentIndex]

      // Position player on an unowned property (space 3)
      updatePlayer(player.id, { position: 3 })

      // Set currentPlayerIndex to match the player we positioned
      useGameStore.setState({ currentPlayerIndex: currentIndex })

      finishMoving()

      const state = useGameStore.getState()
      expect(state.turnPhase).toBe('resolving')
    })

    it('should set pendingAction for unowned property', () => {
      const { updatePlayer, finishMoving } = useGameStore.getState()
      const currentIndex = useGameStore.getState().currentPlayerIndex
      const player = useGameStore.getState().players[currentIndex]

      // Position player on an unowned property (space 3)
      updatePlayer(player.id, { position: 3 })

      finishMoving()

      const state = useGameStore.getState()
      expect(state.pendingAction).toBeDefined()
      expect(state.pendingAction?.type).toBe('property-purchase')
      expect(state.pendingAction?.data?.spaceId).toBe(3)
    })

    it('should set pendingAction for quota payment on owned property', () => {
      const { updatePlayer, setPropertyCustodian, finishMoving } = useGameStore.getState()
      const players = useGameStore.getState().players
      const currentIndex = useGameStore.getState().currentPlayerIndex
      const player1 = players[currentIndex]
      const player2 = players[currentIndex === 0 ? 1 : 0]

      // Player 2 owns property at space 3
      setPropertyCustodian(3, player2.id)

      // Player 1 lands on player 2's property
      updatePlayer(player1.id, { position: 3 })

      finishMoving()

      const state = useGameStore.getState()
      expect(state.pendingAction).toBeDefined()
      expect(state.pendingAction?.type).toBe('quota-payment')
      expect(state.pendingAction?.data?.spaceId).toBe(3)
      expect(state.pendingAction?.data?.payerId).toBe(player1.id)
    })

    it('should set turnPhase to post-turn when landing on own property', () => {
      const { updatePlayer, setPropertyCustodian, finishMoving } = useGameStore.getState()
      const currentIndex = useGameStore.getState().currentPlayerIndex
      const player = useGameStore.getState().players[currentIndex]

      // Player owns property at space 3
      setPropertyCustodian(3, player.id)

      // Player lands on their own property
      updatePlayer(player.id, { position: 3 })

      finishMoving()

      const state = useGameStore.getState()
      expect(state.turnPhase).toBe('post-turn')
      expect(state.pendingAction).toBeNull()
    })

    it('should set pendingAction for Party Directive card space', () => {
      const { updatePlayer, finishMoving } = useGameStore.getState()
      const currentIndex = useGameStore.getState().currentPlayerIndex
      const player = useGameStore.getState().players[currentIndex]

      // Position player on Party Directive space (space 7)
      updatePlayer(player.id, { position: 7 })

      finishMoving()

      const state = useGameStore.getState()
      expect(state.pendingAction).toBeDefined()
      expect(state.pendingAction?.type).toBe('draw-party-directive')
      expect(state.pendingAction?.data?.playerId).toBe(player.id)
    })

    it('should set pendingAction for Communist Test card space', () => {
      const { updatePlayer, finishMoving } = useGameStore.getState()
      const currentIndex = useGameStore.getState().currentPlayerIndex
      const player = useGameStore.getState().players[currentIndex]

      // Position player on Communist Test space (space 2)
      updatePlayer(player.id, { position: 2 })

      finishMoving()

      const state = useGameStore.getState()
      expect(state.pendingAction).toBeDefined()
      expect(state.pendingAction?.type).toBe('draw-communist-test')
      expect(state.pendingAction?.data?.playerId).toBe(player.id)
    })

    it('should not charge quota on mortgaged property', () => {
      const { updatePlayer, setPropertyCustodian, finishMoving } = useGameStore.getState()
      const players = useGameStore.getState().players
      const currentIndex = useGameStore.getState().currentPlayerIndex
      const player1 = players[currentIndex]
      const player2 = players[currentIndex === 0 ? 1 : 0]

      // Player 2 owns property at space 3 and mortgages it
      setPropertyCustodian(3, player2.id)
      const property = useGameStore.getState().properties.find(p => p.spaceId === 3)
      if (property) {
        useGameStore.setState({
          properties: useGameStore.getState().properties.map(p =>
            p.spaceId === 3 ? { ...p, mortgaged: true } : p
          )
        })
      }

      // Player 1 lands on player 2's mortgaged property
      updatePlayer(player1.id, { position: 3 })

      finishMoving()

      const state = useGameStore.getState()
      expect(state.turnPhase).toBe('post-turn')
      expect(state.pendingAction).toBeNull()
    })
  })
})
