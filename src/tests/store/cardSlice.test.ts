// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { describe, it, expect, beforeEach } from 'vitest'
import { create, type StoreApi, type UseBoundStore } from 'zustand'
import { createCardSlice, type CardSlice } from '../../store/slices/cardSlice'
import { PARTY_DIRECTIVE_CARDS } from '../../data/partyDirectiveCards'

describe('Card Slice', () => {
  let store: UseBoundStore<StoreApi<CardSlice>>

  beforeEach(() => {
    store = create<CardSlice>(createCardSlice)
  })

  describe('Party Directive Deck', () => {
    it('should initialize with shuffled deck', () => {
      const state = store.getState()
      expect(state.partyDirectiveDeck.length).toBe(PARTY_DIRECTIVE_CARDS.length)
      expect(state.partyDirectiveDiscard.length).toBe(0)
    })

    it('should draw a card from the deck', () => {
      const initialDeckSize = store.getState().partyDirectiveDeck.length
      const card = store.getState().drawPartyDirective()

      expect(card).toBeDefined()
      expect(card.id).toBeDefined()
      expect(store.getState().partyDirectiveDeck.length).toBe(initialDeckSize - 1)
      expect(store.getState().partyDirectiveDiscard.length).toBe(1)
      expect(store.getState().partyDirectiveDiscard[0]).toBe(card.id)
    })

    it('should reshuffle discard pile when deck is empty', () => {
      // Draw all cards
      const totalCards = PARTY_DIRECTIVE_CARDS.length
      for (let i = 0; i < totalCards; i++) {
        store.getState().drawPartyDirective()
      }

      expect(store.getState().partyDirectiveDeck.length).toBe(0)
      expect(store.getState().partyDirectiveDiscard.length).toBe(totalCards)

      // Draw one more - should trigger reshuffle
      const card = store.getState().drawPartyDirective()
      expect(card).toBeDefined()
      expect(store.getState().partyDirectiveDeck.length).toBeGreaterThan(0)
      expect(store.getState().partyDirectiveDiscard.length).toBe(1)
    })

    it('should return fallback card if card not found', () => {
      // Manually set invalid card ID
      store.setState({ partyDirectiveDeck: ['invalid-id'] })
      const card = store.getState().drawPartyDirective()
      expect(card).toBe(PARTY_DIRECTIVE_CARDS[0])
    })
  })

  describe('Communist Test Questions', () => {
    it('should draw a random question', () => {
      const question = store.getState().drawCommunistTest()
      expect(question).toBeDefined()
      expect(question.id).toBeDefined()
      expect(question.difficulty).toBeDefined()
      expect(['easy', 'medium', 'hard', 'trick']).toContain(question.difficulty)
    })

    it('should mark question as used', () => {
      const question = store.getState().drawCommunistTest()
      expect(store.getState().communistTestUsedQuestions.has(question.id)).toBe(true)
    })

    it('should draw question with specified difficulty', () => {
      const question = store.getState().drawCommunistTest('hard')
      expect(question.difficulty).toBe('hard')
    })

    it('should accumulate used questions', () => {
      store.getState().drawCommunistTest()
      store.getState().drawCommunistTest()
      store.getState().drawCommunistTest()

      expect(store.getState().communistTestUsedQuestions.size).toBeGreaterThanOrEqual(1)
      // Note: Could be less than 3 if same question drawn multiple times randomly
    })

    it('should handle all difficulty levels', () => {
      const easyQuestion = store.getState().drawCommunistTest('easy')
      expect(easyQuestion.difficulty).toBe('easy')

      const mediumQuestion = store.getState().drawCommunistTest('medium')
      expect(mediumQuestion.difficulty).toBe('medium')

      const hardQuestion = store.getState().drawCommunistTest('hard')
      expect(hardQuestion.difficulty).toBe('hard')

      const trickQuestion = store.getState().drawCommunistTest('trick')
      expect(trickQuestion.difficulty).toBe('trick')
    })
  })

  describe('Reset Functionality', () => {
    it('should reset card state to initial values', () => {
      // Draw some cards
      store.getState().drawPartyDirective()
      store.getState().drawCommunistTest()

      // Reset
      store.getState().resetCardState()

      expect(store.getState().partyDirectiveDeck.length).toBe(PARTY_DIRECTIVE_CARDS.length)
      expect(store.getState().partyDirectiveDiscard.length).toBe(0)
      expect(store.getState().communistTestUsedQuestions.size).toBe(0)
    })
  })

  describe('Edge Cases', () => {
    it('should handle drawing multiple times in sequence', () => {
      const cards = []
      for (let i = 0; i < 5; i++) {
        cards.push(store.getState().drawPartyDirective())
      }

      expect(cards.length).toBe(5)
      cards.forEach(card => {
        expect(card).toBeDefined()
        expect(card.id).toBeDefined()
      })
    })

    it('should handle empty deck gracefully', () => {
      // Empty the deck completely
      const totalCards = PARTY_DIRECTIVE_CARDS.length
      for (let i = 0; i < totalCards; i++) {
        store.getState().drawPartyDirective()
      }

      // Deck should be empty
      expect(store.getState().partyDirectiveDeck.length).toBe(0)

      // Drawing should still work (triggers reshuffle)
      const card = store.getState().drawPartyDirective()
      expect(card).toBeDefined()
    })
  })
})
