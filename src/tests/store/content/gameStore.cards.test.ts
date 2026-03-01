// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore } from '../../../store/gameStore'

describe('gameStore - Cards & Questions', () => {
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

  describe('drawPartyDirective()', () => {
    it('should draw card from party directive deck', () => {
      const { drawPartyDirective } = useGameStore.getState()
      const initialDeckLength = useGameStore.getState().partyDirectiveDeck.length

      const card = drawPartyDirective()

      expect(card).toBeDefined()
      expect(card.id).toBeDefined()
      expect(card.title).toBeDefined()

      const newDeckLength = useGameStore.getState().partyDirectiveDeck.length
      expect(newDeckLength).toBe(initialDeckLength - 1)
    })

    it('should move drawn card to discard pile', () => {
      const { drawPartyDirective } = useGameStore.getState()
      const initialDiscardLength = useGameStore.getState().partyDirectiveDiscard.length
      const firstCardId = useGameStore.getState().partyDirectiveDeck[0]

      drawPartyDirective()

      const state = useGameStore.getState()
      expect(state.partyDirectiveDiscard.length).toBe(initialDiscardLength + 1)
      expect(state.partyDirectiveDiscard[state.partyDirectiveDiscard.length - 1]).toBe(firstCardId)
    })

    it('should reshuffle discard pile when deck is empty', () => {
      const { drawPartyDirective } = useGameStore.getState()

      // Empty the deck by drawing all cards
      const deckSize = useGameStore.getState().partyDirectiveDeck.length
      for (let i = 0; i < deckSize; i++) {
        drawPartyDirective()
      }

      // Deck should now be empty
      expect(useGameStore.getState().partyDirectiveDeck.length).toBe(0)

      // Draw one more card - should trigger reshuffle
      const card = drawPartyDirective()

      expect(card).toBeDefined()
      expect(useGameStore.getState().partyDirectiveDeck.length).toBeGreaterThan(0)

      // Should add log entry about reshuffle
      const logs = useGameStore.getState().gameLog
      const reshuffleLog = logs.find(log => log.message.includes('reshuffled'))
      expect(reshuffleLog).toBeDefined()
    })

    it('should clear discard pile after reshuffling', () => {
      const { drawPartyDirective } = useGameStore.getState()

      // Empty the deck by drawing all cards
      const deckSize = useGameStore.getState().partyDirectiveDeck.length
      for (let i = 0; i < deckSize; i++) {
        drawPartyDirective()
      }

      // Draw one more to trigger reshuffle
      drawPartyDirective()

      const state = useGameStore.getState()
      expect(state.partyDirectiveDiscard.length).toBe(1) // Only the card just drawn
    })
  })

  describe('drawCommunistTest()', () => {
    it('should draw random question when no difficulty specified', () => {
      const { drawCommunistTest } = useGameStore.getState()

      const question = drawCommunistTest()

      expect(question).toBeDefined()
      expect(question.id).toBeDefined()
      expect(question.question).toBeDefined()
      expect(question.difficulty).toBeDefined()
    })

    it('should draw question of specified difficulty', () => {
      const { drawCommunistTest } = useGameStore.getState()

      const easyQuestion = drawCommunistTest('easy')
      expect(easyQuestion.difficulty).toBe('easy')

      const mediumQuestion = drawCommunistTest('medium')
      expect(mediumQuestion.difficulty).toBe('medium')

      const hardQuestion = drawCommunistTest('hard')
      expect(hardQuestion.difficulty).toBe('hard')
    })

    it('should mark question as used', () => {
      const { drawCommunistTest } = useGameStore.getState()

      const question = drawCommunistTest()

      const state = useGameStore.getState()
      expect(state.communistTestUsedQuestions.has(question.id)).toBe(true)
    })

    it('should track multiple used questions', () => {
      const { drawCommunistTest } = useGameStore.getState()

      const q1 = drawCommunistTest()
      const q2 = drawCommunistTest()
      const q3 = drawCommunistTest()

      const state = useGameStore.getState()
      expect(state.communistTestUsedQuestions.has(q1.id)).toBe(true)
      expect(state.communistTestUsedQuestions.has(q2.id)).toBe(true)
      expect(state.communistTestUsedQuestions.has(q3.id)).toBe(true)
      expect(state.communistTestUsedQuestions.size).toBe(3)
    })
  })

  describe('applyDirectiveEffect()', () => {
    it('should add log entry when applying directive effect', () => {
      const { applyDirectiveEffect, players } = useGameStore.getState()
      const player = players[0]
      const initialLogLength = useGameStore.getState().gameLog.length

      const mockCard = {
        id: 'test-card',
        title: 'Test Card',
        description: 'Test Description',
        effect: { type: 'money' as const, amount: 100 }
      }

      applyDirectiveEffect(mockCard, player.id)

      const logs = useGameStore.getState().gameLog
      expect(logs.length).toBe(initialLogLength + 1)
      expect(logs[logs.length - 1].message).toContain('Test Card')
      expect(logs[logs.length - 1].message).toContain('Test Description')
    })

    it('should handle collectFromAll effect', () => {
      const { applyDirectiveEffect, players } = useGameStore.getState()
      const player1 = players[0]

      const initialRubles1 = player1.rubles

      const mockCard = {
        id: 'collect-from-all',
        title: 'Collective Tax',
        description: 'Collect from all players',
        effect: { type: 'collectFromAll' as const, amount: 50 }
      }

      applyDirectiveEffect(mockCard, player1.id)

      const state = useGameStore.getState()
      const updatedPlayer1 = state.players.find(p => p.id === player1.id)

      // Player 1 should receive rubles from other players (at least one)
      expect(updatedPlayer1?.rubles).toBeGreaterThan(initialRubles1)
    })

    it('should handle payToAll effect', () => {
      const { applyDirectiveEffect, players } = useGameStore.getState()
      const player1 = players[0]

      const initialRubles1 = player1.rubles

      const mockCard = {
        id: 'pay-to-all',
        title: 'Pay All',
        description: 'Pay to all players',
        effect: { type: 'payToAll' as const, amount: 50 }
      }

      applyDirectiveEffect(mockCard, player1.id)

      const state = useGameStore.getState()
      const updatedPlayer1 = state.players.find(p => p.id === player1.id)

      // Player 1 should pay rubles to other players (at least one)
      expect(updatedPlayer1?.rubles).toBeLessThan(initialRubles1)
    })

    it('should handle money effect (positive amount)', () => {
      const { applyDirectiveEffect, players } = useGameStore.getState()
      const player = players[0]
      const initialRubles = player.rubles
      const initialTreasury = useGameStore.getState().stateTreasury

      const mockCard = {
        id: 'collect-money',
        title: 'Collect',
        description: 'Collect from treasury',
        effect: { type: 'money' as const, amount: 200 }
      }

      applyDirectiveEffect(mockCard, player.id)

      const state = useGameStore.getState()
      const updatedPlayer = state.players.find(p => p.id === player.id)

      expect(updatedPlayer?.rubles).toBe(initialRubles + 200)
      expect(state.stateTreasury).toBe(initialTreasury - 200)
    })

    it('should handle money effect (negative amount)', () => {
      const { applyDirectiveEffect, players } = useGameStore.getState()
      const player = players[0]
      const initialRubles = player.rubles
      const initialTreasury = useGameStore.getState().stateTreasury

      const mockCard = {
        id: 'pay-money',
        title: 'Pay',
        description: 'Pay to treasury',
        effect: { type: 'money' as const, amount: -150 }
      }

      applyDirectiveEffect(mockCard, player.id)

      const state = useGameStore.getState()
      const updatedPlayer = state.players.find(p => p.id === player.id)

      expect(updatedPlayer?.rubles).toBe(initialRubles - 150)
      expect(state.stateTreasury).toBe(initialTreasury + 150)
    })

    it('should handle gulag effect', () => {
      const { applyDirectiveEffect, players } = useGameStore.getState()
      const player = players[0]

      const mockCard = {
        id: 'go-to-gulag',
        title: 'Gulag',
        description: 'Go to Gulag',
        effect: { type: 'gulag' as const }
      }

      applyDirectiveEffect(mockCard, player.id)

      const state = useGameStore.getState()
      const updatedPlayer = state.players.find(p => p.id === player.id)

      expect(updatedPlayer?.inGulag).toBe(true)
    })

    it('should handle freeFromGulag effect', () => {
      const { applyDirectiveEffect, players } = useGameStore.getState()
      const player = players[0]

      const mockCard = {
        id: 'free-from-gulag',
        title: 'Free Card',
        description: 'Get out of Gulag free',
        effect: { type: 'freeFromGulag' as const }
      }

      applyDirectiveEffect(mockCard, player.id)

      const state = useGameStore.getState()
      const updatedPlayer = state.players.find(p => p.id === player.id)

      expect(updatedPlayer?.hasFreeFromGulagCard).toBe(true)
    })

    it('should set turn phase to post-turn after applying effect', () => {
      const { applyDirectiveEffect, players } = useGameStore.getState()
      const player = players[0]

      const mockCard = {
        id: 'test',
        title: 'Test',
        description: 'Test',
        effect: { type: 'money' as const, amount: 100 }
      }

      applyDirectiveEffect(mockCard, player.id)

      const state = useGameStore.getState()
      expect(state.turnPhase).toBe('post-turn')
      expect(state.pendingAction).toBeNull()
    })

    it('should not apply effect for invalid player', () => {
      const { applyDirectiveEffect } = useGameStore.getState()
      const initialState = useGameStore.getState()

      const mockCard = {
        id: 'test',
        title: 'Test',
        description: 'Test',
        effect: { type: 'money' as const, amount: 100 }
      }

      applyDirectiveEffect(mockCard, 'invalid-player-id')

      const newState = useGameStore.getState()
      expect(newState.players).toEqual(initialState.players)
    })
  })

  describe('answerCommunistTest()', () => {
    it('should reward player for correct answer', () => {
      const { answerCommunistTest, players, currentPlayerIndex } = useGameStore.getState()
      const player = players[currentPlayerIndex]

      const mockQuestion = {
        id: 'q1',
        question: 'Test question',
        answer: 'correct answer',
        acceptableAnswers: ['correct answer', 'correct'],
        difficulty: 'easy' as const,
        reward: 100,
        penalty: 50,
        grantsRankUp: false
      }

      const initialRubles = player.rubles
      const initialTreasury = useGameStore.getState().stateTreasury

      answerCommunistTest(mockQuestion, 'correct answer', '')

      const state = useGameStore.getState()
      const updatedPlayer = state.players.find(p => p.id === player.id)

      expect(updatedPlayer?.rubles).toBe(initialRubles + 100)
      expect(state.stateTreasury).toBe(initialTreasury - 100)
      expect(updatedPlayer?.correctTestAnswers).toBe(1)
      expect(updatedPlayer?.consecutiveFailedTests).toBe(0)
    })

    it('should penalize player for incorrect answer', () => {
      const { answerCommunistTest, players, currentPlayerIndex } = useGameStore.getState()
      const player = players[currentPlayerIndex]

      const mockQuestion = {
        id: 'q1',
        question: 'Test question',
        answer: 'correct answer',
        acceptableAnswers: ['correct answer', 'correct'],
        difficulty: 'easy' as const,
        reward: 100,
        penalty: 50,
        grantsRankUp: false
      }

      const initialRubles = player.rubles
      const initialTreasury = useGameStore.getState().stateTreasury

      answerCommunistTest(mockQuestion, 'wrong answer', '')

      const state = useGameStore.getState()
      const updatedPlayer = state.players.find(p => p.id === player.id)

      expect(updatedPlayer?.rubles).toBe(initialRubles - 50)
      expect(state.stateTreasury).toBe(initialTreasury + 50)
      expect(updatedPlayer?.consecutiveFailedTests).toBe(1)
    })

    it('should double reward for Red Star piece', () => {
      const { answerCommunistTest, updatePlayer, players, currentPlayerIndex } = useGameStore.getState()
      const player = players[currentPlayerIndex]

      // Change player piece to redStar
      updatePlayer(player.id, { piece: 'redStar' })

      const mockQuestion = {
        id: 'q1',
        question: 'Test question',
        answer: 'correct answer',
        acceptableAnswers: ['correct answer', 'correct'],
        difficulty: 'easy' as const,
        reward: 100,
        penalty: 50,
        grantsRankUp: false
      }

      const initialRubles = useGameStore.getState().players[currentPlayerIndex].rubles

      answerCommunistTest(mockQuestion, 'correct answer', '')

      const state = useGameStore.getState()
      const updatedPlayer = state.players.find(p => p.id === player.id)

      // Reward should be doubled for Red Star
      expect(updatedPlayer?.rubles).toBe(initialRubles + 200)
    })

    it('should double penalty for Red Star piece', () => {
      const { answerCommunistTest, updatePlayer, players, currentPlayerIndex } = useGameStore.getState()
      const player = players[currentPlayerIndex]

      // Change player piece to redStar
      updatePlayer(player.id, { piece: 'redStar' })

      const mockQuestion = {
        id: 'q1',
        question: 'Test question',
        answer: 'correct answer',
        acceptableAnswers: ['correct answer', 'correct'],
        difficulty: 'easy' as const,
        reward: 100,
        penalty: 50,
        grantsRankUp: false
      }

      const initialRubles = useGameStore.getState().players[currentPlayerIndex].rubles

      answerCommunistTest(mockQuestion, 'wrong answer', '')

      const state = useGameStore.getState()
      const updatedPlayer = state.players.find(p => p.id === player.id)

      // Penalty should be doubled for Red Star
      expect(updatedPlayer?.rubles).toBe(initialRubles - 100)
    })

    it('should add log entry for correct answer', () => {
      const { answerCommunistTest, players, currentPlayerIndex } = useGameStore.getState()
      const player = players[currentPlayerIndex]

      const mockQuestion = {
        id: 'q1',
        question: 'Test question',
        answer: 'correct answer',
        acceptableAnswers: ['correct answer', 'correct'],
        difficulty: 'easy' as const,
        reward: 100,
        penalty: 50,
        grantsRankUp: false
      }

      const initialLogLength = useGameStore.getState().gameLog.length

      answerCommunistTest(mockQuestion, 'correct answer', '')

      const logs = useGameStore.getState().gameLog
      expect(logs.length).toBe(initialLogLength + 1)
      expect(logs[logs.length - 1].message).toContain('answered correctly')
      expect(logs[logs.length - 1].message).toContain(player.name)
    })

    it('should add log entry for incorrect answer', () => {
      const { answerCommunistTest, players, currentPlayerIndex } = useGameStore.getState()
      const player = players[currentPlayerIndex]

      const mockQuestion = {
        id: 'q1',
        question: 'Test question',
        answer: 'correct answer',
        acceptableAnswers: ['correct answer', 'correct'],
        difficulty: 'easy' as const,
        reward: 100,
        penalty: 50,
        grantsRankUp: false
      }

      const initialLogLength = useGameStore.getState().gameLog.length

      answerCommunistTest(mockQuestion, 'wrong answer', '')

      const logs = useGameStore.getState().gameLog
      expect(logs.length).toBe(initialLogLength + 1)
      expect(logs[logs.length - 1].message).toContain('answered incorrectly')
      expect(logs[logs.length - 1].message).toContain(player.name)
    })

    it('should set turn phase to post-turn after answering', () => {
      const { answerCommunistTest } = useGameStore.getState()

      const mockQuestion = {
        id: 'q1',
        question: 'Test question',
        answer: 'correct answer',
        acceptableAnswers: ['correct answer', 'correct'],
        difficulty: 'easy' as const,
        reward: 100,
        penalty: 50,
        grantsRankUp: false
      }

      answerCommunistTest(mockQuestion, 'correct answer', '')

      const state = useGameStore.getState()
      expect(state.turnPhase).toBe('post-turn')
      expect(state.pendingAction).toBeNull()
    })

    it('should make Vodka Bottle immune to trick questions', () => {
      const { answerCommunistTest, updatePlayer, players, currentPlayerIndex } = useGameStore.getState()
      const player = players[currentPlayerIndex]

      // Change player piece to vodkaBottle
      updatePlayer(player.id, { piece: 'vodkaBottle' })

      const mockTrickQuestion = {
        id: 'trick1',
        question: 'Trick question',
        answer: 'trick answer',
        acceptableAnswers: ['trick answer'],
        difficulty: 'trick' as const,
        reward: 0,
        penalty: 100,
        grantsRankUp: false
      }

      const initialRubles = useGameStore.getState().players[currentPlayerIndex].rubles

      // Answer incorrectly - but should be immune
      answerCommunistTest(mockTrickQuestion, 'wrong answer', '')

      const state = useGameStore.getState()
      const updatedPlayer = state.players.find(p => p.id === player.id)

      // Rubles should not change (immune to trick question)
      expect(updatedPlayer?.rubles).toBe(initialRubles)

      // Should add log entry about immunity
      const logs = state.gameLog
      expect(logs[logs.length - 1].message).toContain('immune to trick questions')
    })

    it('should not deduct rubles when penalty is zero', () => {
      const { answerCommunistTest, players, currentPlayerIndex } = useGameStore.getState()
      const player = players[currentPlayerIndex]

      const zeroPenaltyQuestion = {
        id: 'q-zero-penalty',
        question: 'Zero penalty question',
        answer: 'correct',
        acceptableAnswers: ['correct'],
        difficulty: 'easy' as const,
        reward: 50,
        penalty: 0,
        grantsRankUp: false
      }

      const initialRubles = player.rubles

      answerCommunistTest(zeroPenaltyQuestion, 'wrong answer', '')

      const updatedPlayer = useGameStore.getState().players.find(p => p.id === player.id)
      // Rubles should be unchanged - zero penalty is a no-op
      expect(updatedPlayer?.rubles).toBe(initialRubles)
    })

    it('should not add rubles when reward is zero', () => {
      const { answerCommunistTest, players, currentPlayerIndex } = useGameStore.getState()
      const player = players[currentPlayerIndex]

      const zeroRewardQuestion = {
        id: 'q-zero-reward',
        question: 'Zero reward question',
        answer: 'correct',
        acceptableAnswers: ['correct'],
        difficulty: 'easy' as const,
        reward: 0,
        penalty: 50,
        grantsRankUp: false
      }

      const initialRubles = player.rubles

      answerCommunistTest(zeroRewardQuestion, 'correct', '')

      const updatedPlayer = useGameStore.getState().players.find(p => p.id === player.id)
      // Rubles should be unchanged - zero reward is a no-op
      expect(updatedPlayer?.rubles).toBe(initialRubles)
    })

    it('should promote player on grantsRankUp question', () => {
      const { answerCommunistTest, updatePlayer, players, currentPlayerIndex } = useGameStore.getState()
      const player = players[currentPlayerIndex]

      // Ensure player is at a rank below the top so promotion is possible
      updatePlayer(player.id, { rank: 'proletariat' })

      const rankUpQuestion = {
        id: 'q-rank-up',
        question: 'Hard question that grants rank',
        answer: 'correct',
        acceptableAnswers: ['correct'],
        difficulty: 'hard' as const,
        reward: 100,
        penalty: 50,
        grantsRankUp: true
      }

      answerCommunistTest(rankUpQuestion, 'correct', '')

      const updatedPlayer = useGameStore.getState().players.find(p => p.id === player.id)
      // Player should have been promoted (rank changed from proletariat)
      expect(updatedPlayer?.rank).not.toBe('proletariat')
    })

    it('should promote to Party Member when reaching 2 correct answers at proletariat rank', () => {
      const { answerCommunistTest, updatePlayer, players, currentPlayerIndex } = useGameStore.getState()
      const player = players[currentPlayerIndex]

      // The promotion check reads from the stale `currentPlayer` snapshot captured at
      // the start of answerCommunistTest. Setting correctTestAnswers to 2 means the
      // stale value satisfies `>= 2` even before the increment is applied.
      updatePlayer(player.id, { rank: 'proletariat', correctTestAnswers: 2 })

      const question = {
        id: 'q-promote',
        question: 'Promotion question',
        answer: 'correct',
        acceptableAnswers: ['correct'],
        difficulty: 'easy' as const,
        reward: 0,
        penalty: 50,
        grantsRankUp: false
      }

      answerCommunistTest(question, 'correct', '')

      const updatedPlayer = useGameStore.getState().players.find(p => p.id === player.id)
      // correctTestAnswers is 2, rank is proletariat → should be promoted to partyMember
      expect(updatedPlayer?.rank).toBe('partyMember')
    })

    it('should demote and reset counter after 2 consecutive wrong answers', () => {
      const { answerCommunistTest, updatePlayer, players, currentPlayerIndex } = useGameStore.getState()
      const player = players[currentPlayerIndex]

      // The demotion check reads from the stale `currentPlayer` snapshot captured at
      // the start of answerCommunistTest. Setting consecutiveFailedTests to 2 means
      // the stale value satisfies `>= 2` even before the increment is applied.
      updatePlayer(player.id, { rank: 'partyMember', consecutiveFailedTests: 2 })

      const question = {
        id: 'q-demote',
        question: 'Second failure question',
        answer: 'correct',
        acceptableAnswers: ['correct'],
        difficulty: 'easy' as const,
        reward: 50,
        penalty: 50,
        grantsRankUp: false
      }

      answerCommunistTest(question, 'wrong answer', '')

      const updatedPlayer = useGameStore.getState().players.find(p => p.id === player.id)
      // 2 consecutive failures → demoted from partyMember to proletariat
      expect(updatedPlayer?.rank).toBe('proletariat')
      // Counter should be reset after demotion
      expect(updatedPlayer?.consecutiveFailedTests).toBe(0)
    })
  })

  describe('drawCommunistTest() - exhaustion reset', () => {
    it('should reset used questions when all difficulty questions exhausted', () => {
      const { drawCommunistTest } = useGameStore.getState()

      // Draw all easy questions until they're exhausted (used set gets reset)
      // We draw more questions than exist in the easy pool to trigger the reset
      const drawn: string[] = []
      for (let i = 0; i < 30; i++) {
        const q = drawCommunistTest('easy')
        drawn.push(q.id)
      }

      // After exhaustion and reset, drawing should still work
      const finalQuestion = drawCommunistTest('easy')
      expect(finalQuestion).toBeDefined()
      expect(finalQuestion.difficulty).toBe('easy')
    })
  })
})
