// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { StateCreator } from 'zustand'
import type { GameState } from '../../types/game'
import {
  PARTY_DIRECTIVE_CARDS,
  shuffleDirectiveDeck,
  type DirectiveCard
} from '../../data/partyDirectiveCards'
import {
  getRandomQuestionByDifficulty,
  getRandomDifficulty,
  type TestQuestion
} from '../../data/communistTestQuestions'

// ============================================
// STATE
// ============================================

export interface CardSliceState {
  /** Card IDs in the draw pile */
  partyDirectiveDeck: string[]

  /** Card IDs in the discard pile */
  partyDirectiveDiscard: string[]

  /** IDs of Communist Test questions already used this game */
  communistTestUsedQuestions: Set<string>
}

export const initialCardState: CardSliceState = {
  partyDirectiveDeck: shuffleDirectiveDeck().map(card => card.id),
  partyDirectiveDiscard: [],
  communistTestUsedQuestions: new Set()
}

// ============================================
// ACTIONS
// ============================================

export interface CardSliceActions {
  // Party Directive deck management
  drawPartyDirective: () => DirectiveCard

  // Communist Test question management
  drawCommunistTest: (difficulty?: 'easy' | 'medium' | 'hard' | 'trick') => TestQuestion

  // Queries
  getRemainingDirectiveCount: () => number
  getUsedQuestionCount: () => number
}

export type CardSlice = CardSliceState & CardSliceActions

// ============================================
// SLICE CREATOR
// ============================================

export const createCardSlice: StateCreator<
  GameState,
  [],
  [],
  CardSlice
> = (set, get) => ({
  // Initial state
  ...initialCardState,

  drawPartyDirective: () => {
    const state = get()
    let { partyDirectiveDeck, partyDirectiveDiscard } = state

    // If deck is empty, reshuffle discard pile
    if (partyDirectiveDeck.length === 0) {
      partyDirectiveDeck = [...partyDirectiveDiscard].sort(() => Math.random() - 0.5)
      partyDirectiveDiscard = []

      // Add log entry about reshuffle
      const fullState = get()
      if ('addLogEntry' in fullState && typeof fullState.addLogEntry === 'function') {
        (fullState.addLogEntry as (entry: { type: string, message: string }) => void)({
          type: 'system',
          message: 'Party Directive deck reshuffled'
        })
      }
    }

    const cardId = partyDirectiveDeck[0]
    const card = PARTY_DIRECTIVE_CARDS.find(c => c.id === cardId)

    if (card == null) {
      // Fallback if card not found
      return PARTY_DIRECTIVE_CARDS[0]
    }

    // Update deck state
    set({
      partyDirectiveDeck: partyDirectiveDeck.slice(1),
      partyDirectiveDiscard: [...partyDirectiveDiscard, cardId]
    })

    return card
  },

  drawCommunistTest: (difficulty) => {
    const state = get()
    const selectedDifficulty = difficulty ?? getRandomDifficulty()
    const question = getRandomQuestionByDifficulty(selectedDifficulty)

    // Mark question as used
    const newUsedQuestions = new Set(state.communistTestUsedQuestions)
    newUsedQuestions.add(question.id)

    set({ communistTestUsedQuestions: newUsedQuestions })

    return question
  },

  getRemainingDirectiveCount: () => {
    return get().partyDirectiveDeck.length
  },

  getUsedQuestionCount: () => {
    return get().communistTestUsedQuestions.size
  }
})
