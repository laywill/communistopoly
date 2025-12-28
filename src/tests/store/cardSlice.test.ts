// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore } from '../../store/gameStore'

describe('Card Slice', () => {
  beforeEach(() => {
    // Reset store before each test
    const store = useGameStore.getState()
    store.resetGame()
  })

  describe('Party Directive Deck', () => {
    it('should have deck with card IDs on initialization', () => {
      const store = useGameStore.getState()

      expect(store.partyDirectiveDeck.length).toBeGreaterThan(0)
      expect(store.partyDirectiveDiscard.length).toBe(0)

      // All deck items should be strings (card IDs)
      expect(typeof store.partyDirectiveDeck[0]).toBe('string')
    })

    it('should draw cards from deck', () => {
      const initialLength = useGameStore.getState().partyDirectiveDeck.length
      const card = useGameStore.getState().drawPartyDirective()

      expect(card).toBeDefined()
      expect(card.id).toBeDefined()
      expect(card.title).toBeDefined()

      const updatedState = useGameStore.getState()
      expect(updatedState.partyDirectiveDeck.length).toBe(initialLength - 1)
      expect(updatedState.partyDirectiveDiscard.length).toBe(1)
    })

    it('should move drawn card to discard pile', () => {
      const card = useGameStore.getState().drawPartyDirective()

      const updatedState = useGameStore.getState()
      expect(updatedState.partyDirectiveDiscard).toContain(card.id)
    })

    it('should auto-reshuffle when deck is empty', () => {
      const deckSize = useGameStore.getState().partyDirectiveDeck.length

      // Draw all cards
      for (let i = 0; i < deckSize; i++) {
        useGameStore.getState().drawPartyDirective()
      }

      // Deck should be empty, discard should have all cards
      let state = useGameStore.getState()
      expect(state.partyDirectiveDeck.length).toBe(0)
      expect(state.partyDirectiveDiscard.length).toBe(deckSize)

      // Draw one more - should trigger reshuffle
      const card = useGameStore.getState().drawPartyDirective()

      // Should have reshuffled and drawn
      expect(card).toBeDefined()
      state = useGameStore.getState()
      expect(state.partyDirectiveDeck.length).toBeGreaterThan(0)
      expect(state.partyDirectiveDiscard.length).toBe(1) // Only the newly drawn card
    })

    it('should return remaining directive count', () => {
      const store = useGameStore.getState()

      const count = store.getRemainingDirectiveCount()
      expect(count).toBe(store.partyDirectiveDeck.length)

      store.drawPartyDirective()
      const newCount = store.getRemainingDirectiveCount()
      expect(newCount).toBe(count - 1)
    })
  })

  describe('Communist Test Questions', () => {
    it('should draw question for difficulty', () => {
      const store = useGameStore.getState()

      const easyQuestion = store.drawCommunistTest('easy')
      expect(easyQuestion).toBeDefined()
      expect(easyQuestion.difficulty).toBe('easy')
      expect(easyQuestion.question).toBeDefined()
      expect(easyQuestion.answer).toBeDefined()

      const hardQuestion = store.drawCommunistTest('hard')
      expect(hardQuestion).toBeDefined()
      expect(hardQuestion.difficulty).toBe('hard')
    })

    it('should mark questions as used', () => {
      const question = useGameStore.getState().drawCommunistTest('easy')

      let state = useGameStore.getState()
      expect(state.communistTestUsedQuestions.has(question.id)).toBe(true)
      expect(state.getUsedQuestionCount()).toBe(1)

      // Draw another question
      useGameStore.getState().drawCommunistTest('medium')
      state = useGameStore.getState()
      expect(state.getUsedQuestionCount()).toBe(2)
    })

    it('should draw random difficulty when not specified', () => {
      const store = useGameStore.getState()

      const question = store.drawCommunistTest()

      expect(question).toBeDefined()
      expect(['easy', 'medium', 'hard', 'trick']).toContain(question.difficulty)
    })

    it('should track multiple used questions', () => {
      // Draw multiple questions
      const usedIds = new Set<string>()
      for (let i = 0; i < 5; i++) {
        const q = useGameStore.getState().drawCommunistTest('easy')
        usedIds.add(q.id)
      }

      const state = useGameStore.getState()
      // The store should track at least as many as unique questions drawn
      expect(state.getUsedQuestionCount()).toBeGreaterThanOrEqual(usedIds.size)

      // All unique drawn questions should be marked as used
      usedIds.forEach(id => {
        expect(state.communistTestUsedQuestions.has(id)).toBe(true)
      })
    })
  })

  describe('State Reset', () => {
    it('should reset card state on game reset', () => {
      // Draw some cards
      useGameStore.getState().drawPartyDirective()
      useGameStore.getState().drawPartyDirective()
      useGameStore.getState().drawCommunistTest('easy')

      let state = useGameStore.getState()
      expect(state.partyDirectiveDiscard.length).toBeGreaterThan(0)
      expect(state.getUsedQuestionCount()).toBeGreaterThan(0)

      // Reset game
      useGameStore.getState().resetGame()

      // Card state should be reset
      state = useGameStore.getState()
      expect(state.partyDirectiveDiscard.length).toBe(0)
      expect(state.getUsedQuestionCount()).toBe(0)
      expect(state.partyDirectiveDeck.length).toBeGreaterThan(0)
    })

    it('should reset card state on new game', () => {
      // Draw some cards
      useGameStore.getState().drawPartyDirective()
      useGameStore.getState().drawCommunistTest('medium')

      let state = useGameStore.getState()
      expect(state.partyDirectiveDiscard.length).toBeGreaterThan(0)
      expect(state.getUsedQuestionCount()).toBeGreaterThan(0)

      // Start new game
      useGameStore.getState().startNewGame()

      // Card state should be reset
      state = useGameStore.getState()
      expect(state.partyDirectiveDiscard.length).toBe(0)
      expect(state.getUsedQuestionCount()).toBe(0)
    })
  })
})
