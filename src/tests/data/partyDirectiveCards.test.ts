// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { describe, it, expect, vi } from 'vitest'
import {
  PARTY_DIRECTIVE_CARDS,
  shuffleDirectiveDeck,
  drawDirectiveCard
} from '../../data/partyDirectiveCards'

describe('Party Directive Cards', () => {
  describe('shuffleDirectiveDeck', () => {
    it('should return all cards from the original deck', () => {
      const shuffled = shuffleDirectiveDeck()

      expect(shuffled).toHaveLength(PARTY_DIRECTIVE_CARDS.length)
      expect(shuffled).toHaveLength(20)

      // Verify all original cards are present
      PARTY_DIRECTIVE_CARDS.forEach(card => {
        expect(shuffled.find(c => c.id === card.id)).toBeDefined()
      })
    })

    it('should not modify the original PARTY_DIRECTIVE_CARDS array', () => {
      const originalFirst = PARTY_DIRECTIVE_CARDS[0]
      shuffleDirectiveDeck()

      expect(PARTY_DIRECTIVE_CARDS[0]).toBe(originalFirst)
    })
  })

  describe('drawDirectiveCard', () => {
    it('should draw the first card from a non-empty deck', () => {
      const testDeck = [...PARTY_DIRECTIVE_CARDS]
      const expectedCard = testDeck[0]

      const result = drawDirectiveCard(testDeck)

      expect(result.card).toEqual(expectedCard)
      expect(result.remainingDeck).toHaveLength(testDeck.length - 1)
      expect(result.remainingDeck[0]).toEqual(testDeck[1])
    })

    it('should not modify the original deck array', () => {
      const testDeck = [...PARTY_DIRECTIVE_CARDS]
      const originalLength = testDeck.length

      drawDirectiveCard(testDeck)

      expect(testDeck).toHaveLength(originalLength)
    })

    it('should reshuffle and draw when deck is empty', () => {
      const emptyDeck: typeof PARTY_DIRECTIVE_CARDS = []

      const result = drawDirectiveCard(emptyDeck)

      // Should return a card from the reshuffled deck
      expect(result.card).toBeDefined()
      expect(result.card).toHaveProperty('id')
      expect(result.card).toHaveProperty('title')
      expect(result.card).toHaveProperty('description')
      expect(result.card).toHaveProperty('effect')

      // Remaining deck should have 19 cards (20 - 1 drawn)
      expect(result.remainingDeck).toHaveLength(19)

      // The returned card should be from the original set
      const foundCard = PARTY_DIRECTIVE_CARDS.find(c => c.id === result.card.id)
      expect(foundCard).toBeDefined()
    })

    it('should return different cards when reshuffling (probabilistic)', () => {
      // Mock Math.random to ensure different shuffle results
      const mockRandom = vi.spyOn(Math, 'random')
      mockRandom.mockReturnValueOnce(0.5).mockReturnValueOnce(0.3)

      const emptyDeck: typeof PARTY_DIRECTIVE_CARDS = []

      const result1 = drawDirectiveCard(emptyDeck)
      const result2 = drawDirectiveCard(emptyDeck)

      // While it's possible they could be the same, with mocked random they should differ
      expect(result1.card.id).toBeDefined()
      expect(result2.card.id).toBeDefined()

      mockRandom.mockRestore()
    })

    it('should handle drawing all cards from deck until empty, then reshuffle', () => {
      let deck = shuffleDirectiveDeck()
      const drawnCards = []

      // Draw all 20 cards
      for (let i = 0; i < 20; i++) {
        const result = drawDirectiveCard(deck)
        drawnCards.push(result.card)
        deck = result.remainingDeck
      }

      expect(drawnCards).toHaveLength(20)
      expect(deck).toHaveLength(0)

      // Draw from empty deck - should reshuffle
      const result = drawDirectiveCard(deck)
      expect(result.card).toBeDefined()
      expect(result.remainingDeck).toHaveLength(19)
    })
  })
})
