// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { StateCreator } from 'zustand'
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

// State interface
export interface CardSliceState {
  partyDirectiveDeck: string[]
  partyDirectiveDiscard: string[]
  communistTestUsedQuestions: Set<string>
}

// Actions interface
export interface CardSliceActions {
  drawPartyDirective: () => DirectiveCard
  drawCommunistTest: (difficulty?: 'easy' | 'medium' | 'hard' | 'trick') => TestQuestion
  resetCardState: () => void
}

// Combined slice type
export type CardSlice = CardSliceState & CardSliceActions

// Initial state
const initialCardState: CardSliceState = {
  partyDirectiveDeck: shuffleDirectiveDeck().map(card => card.id),
  partyDirectiveDiscard: [],
  communistTestUsedQuestions: new Set()
}

// Slice creator using StateCreator pattern
export const createCardSlice: StateCreator<
  CardSlice,
  [],
  [],
  CardSlice
> = (set, get) => ({
  ...initialCardState,

  drawPartyDirective: () => {
    const state = get()
    let { partyDirectiveDeck, partyDirectiveDiscard } = state

    // If deck is empty, reshuffle discard pile
    if (partyDirectiveDeck.length === 0) {
      partyDirectiveDeck = [...partyDirectiveDiscard].sort(() => Math.random() - 0.5)
      partyDirectiveDiscard = []
      // Note: Reshuffle log entry handled by caller in gameStore
    }

    const cardId = partyDirectiveDeck[0]
    const card = PARTY_DIRECTIVE_CARDS.find(c => c.id === cardId)

    if (card == null) {
      // Fallback if card not found - should never happen in normal operation
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

  resetCardState: () => {
    set({
      ...initialCardState,
      partyDirectiveDeck: shuffleDirectiveDeck().map(card => card.id)
    })
  }
})
