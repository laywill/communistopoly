// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore } from '../../../store/gameStore'

describe('gameStore - Persist & Hydration Recovery', () => {
  const setupPlayers = () => {
    const { initializePlayers } = useGameStore.getState()
    initializePlayers([
      { name: 'Player 1', piece: 'sickle', isStalin: false },
      { name: 'Player 2', piece: 'hammer', isStalin: false },
      { name: 'Stalin', piece: null, isStalin: true }
    ])
  }

  beforeEach(() => {
    useGameStore.getState().resetGame()
    setupPlayers()
  })

  describe('stuck turnPhase recovery after refresh', () => {
    it('should recover from resolving phase when pendingAction is lost', () => {
      // Simulate the state after finishMoving sets turnPhase to 'resolving'
      // and a pendingAction was set (e.g., landing on Communist Test)
      // but pendingAction is NOT persisted, so after refresh it becomes null.
      // The recoverStuckTurnPhase function should fix this.
      useGameStore.setState({
        turnPhase: 'resolving',
        pendingAction: null,
        gamePhase: 'playing'
      })

      useGameStore.getState().recoverStuckTurnPhase()

      const state = useGameStore.getState()
      expect(state.turnPhase).toBe('post-turn')
    })

    it('should recover from moving phase when pendingAction is lost', () => {
      useGameStore.setState({
        turnPhase: 'moving',
        pendingAction: null,
        gamePhase: 'playing'
      })

      useGameStore.getState().recoverStuckTurnPhase()

      const state = useGameStore.getState()
      expect(state.turnPhase).toBe('post-turn')
    })

    it('should recover from rolling phase when pendingAction is lost', () => {
      useGameStore.setState({
        turnPhase: 'rolling',
        pendingAction: null,
        gamePhase: 'playing'
      })

      useGameStore.getState().recoverStuckTurnPhase()

      const state = useGameStore.getState()
      expect(state.turnPhase).toBe('post-turn')
    })

    it('should NOT recover when turnPhase is pre-roll (valid state)', () => {
      useGameStore.setState({
        turnPhase: 'pre-roll',
        pendingAction: null,
        gamePhase: 'playing'
      })

      useGameStore.getState().recoverStuckTurnPhase()

      const state = useGameStore.getState()
      expect(state.turnPhase).toBe('pre-roll')
    })

    it('should NOT recover when turnPhase is post-turn (valid state)', () => {
      useGameStore.setState({
        turnPhase: 'post-turn',
        pendingAction: null,
        gamePhase: 'playing'
      })

      useGameStore.getState().recoverStuckTurnPhase()

      const state = useGameStore.getState()
      expect(state.turnPhase).toBe('post-turn')
    })

    it('should NOT recover when pendingAction exists (action in progress)', () => {
      useGameStore.setState({
        turnPhase: 'resolving',
        pendingAction: { type: 'draw-communist-test', data: { playerId: 'p1' } },
        gamePhase: 'playing'
      })

      useGameStore.getState().recoverStuckTurnPhase()

      const state = useGameStore.getState()
      expect(state.turnPhase).toBe('resolving')
    })

    it('should NOT recover when game is not in playing phase', () => {
      useGameStore.setState({
        turnPhase: 'resolving',
        pendingAction: null,
        gamePhase: 'welcome'
      })

      useGameStore.getState().recoverStuckTurnPhase()

      const state = useGameStore.getState()
      expect(state.turnPhase).toBe('resolving')
    })
  })

  describe('communistTestUsedQuestions serialisation', () => {
    it('should round-trip communistTestUsedQuestions through JSON correctly', () => {
      // Draw a question to populate communistTestUsedQuestions
      const { drawCommunistTest } = useGameStore.getState()
      const question = drawCommunistTest()

      const state = useGameStore.getState()
      expect(state.communistTestUsedQuestions).toContain(question.id)

      // Simulate JSON round-trip (what persist middleware does)
      const serialised = JSON.stringify(state.communistTestUsedQuestions)
      const deserialised = JSON.parse(serialised) as string[]

      // After round-trip, should still be a valid array with .includes()
      expect(Array.isArray(deserialised)).toBe(true)
      expect(deserialised).toContain(question.id)
      expect(deserialised.includes(question.id)).toBe(true)
    })
  })
})
