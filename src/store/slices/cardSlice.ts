// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { StateCreator } from 'zustand'
import type { GameStore } from '../types/storeTypes'
import { PARTY_DIRECTIVE_CARDS, shuffleDirectiveDeck } from '../../data/partyDirectiveCards'
import type { DirectiveCard } from '../../data/partyDirectiveCards'
import {
  getRandomDifficulty,
  isAnswerCorrect,
  COMMUNIST_TEST_QUESTIONS_BY_DIFFICULTY
} from '../../data/communistTestQuestions'
import type { TestQuestion, TestDifficulty } from '../../data/communistTestQuestions'
import { applyDirectiveEffectHandler } from '../helpers/directiveEffectHandlers'
import type { Player } from '../../types/game'
import { BREAD_LOAF_WEALTH_CAP } from '../constants'

// Slice state interface
export interface CardSliceState {
  partyDirectiveDeck: string[]
  partyDirectiveDiscard: string[]
  communistTestUsedQuestions: string[]
}

// Slice actions interface
export interface CardSliceActions {
  drawPartyDirective: () => DirectiveCard
  drawCommunistTest: (difficulty?: TestDifficulty) => TestQuestion
  applyDirectiveEffect: (card: DirectiveCard, playerId: string) => void
  answerCommunistTest: (question: TestQuestion, answer: string, readerId: string) => void
}

// Combined slice type
export type CardSlice = CardSliceState & CardSliceActions

// Initial state for this slice
// Note: the deck is initialised to an empty array here; it is populated when
// initializePlayers is called (which shuffles and maps the directive deck).
export const initialCardState: CardSliceState = {
  partyDirectiveDeck: [],
  partyDirectiveDiscard: [],
  communistTestUsedQuestions: []
}

// Slice creator with full typing
export const createCardSlice: StateCreator<
  GameStore,
  [],
  [],
  CardSlice
> = (set, get) => ({
  // Spread initial state
  ...initialCardState,

  // Draw a card from the Party Directive deck, reshuffling the discard pile if needed.
  drawPartyDirective: () => {
    const state = get()
    let { partyDirectiveDeck, partyDirectiveDiscard } = state

    // If deck is empty, reshuffle discard pile using Fisher-Yates.
    // Every drawn card is pushed to the discard pile (see below), so once the deck
    // empties the discard pile holds the full set of cards - reshuffling the full
    // card list is behaviourally equivalent to shuffling the discard pile itself.
    if (partyDirectiveDeck.length === 0) {
      partyDirectiveDeck = shuffleDirectiveDeck().map(card => card.id)
      partyDirectiveDiscard = []
      get().addLogEntry({
        type: 'system',
        message: 'Party Directive deck reshuffled'
      })
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

  // Draw a Communist Test question, avoiding recently used questions where possible.
  drawCommunistTest: (difficulty) => {
    const state = get()
    const selectedDifficulty = difficulty ?? getRandomDifficulty()

    // Get all questions for this difficulty
    const allQuestions = COMMUNIST_TEST_QUESTIONS_BY_DIFFICULTY[selectedDifficulty]

    // Filter out already-used questions
    const availableQuestions = allQuestions.filter(q => !state.communistTestUsedQuestions.includes(q.id))

    // If all questions have been used, reset the used set and use all questions
    const questionsToUse = availableQuestions.length > 0 ? availableQuestions : allQuestions

    // Select a random question from available pool
    const randomIndex = Math.floor(Math.random() * questionsToUse.length)
    const question = questionsToUse[randomIndex]

    // Mark question as used
    const newUsedQuestions = availableQuestions.length > 0
      ? [...state.communistTestUsedQuestions, question.id]
      : [question.id]  // Reset if we exhausted all questions

    set({ communistTestUsedQuestions: newUsedQuestions })

    return question
  },

  // Apply the effect of a drawn Party Directive card to the specified player.
  applyDirectiveEffect: (card, playerId) => {
    const player = get().players.find(p => p.id === playerId)
    if (player == null) return

    get().addLogEntry({
      type: 'system',
      message: `${player.name} drew: ${card.title} - ${card.description}`
    })

    applyDirectiveEffectHandler(card.effect, playerId, get)
  },

  // Handle a player's answer to a Communist Test question.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  answerCommunistTest: (question, answer, _readerId) => {
    const state = get()
    const currentPlayer = state.players[state.currentPlayerIndex]

    // Check if Vodka Bottle is immune to trick questions
    const isCorrect = isAnswerCorrect(question, answer)

    if (question.difficulty === 'trick' && currentPlayer.piece === 'vodkaBottle') {
      get().addLogEntry({
        type: 'system',
        message: `${currentPlayer.name}'s Vodka Bottle makes them immune to trick questions!`,
        playerId: currentPlayer.id
      })
      set({ pendingAction: null, turnPhase: 'post-turn' })
      return
    }

    if (isCorrect) {
      // Correct answer
      // Apply reward (doubled for Red Star penalty)
      const reward = currentPlayer.piece === 'redStar' ? question.reward * 2 : question.reward

      const updates: Partial<Player> = {
        correctTestAnswers: currentPlayer.correctTestAnswers + 1,
        consecutiveFailedTests: 0
      }
      if (reward > 0) {
        updates.rubles = currentPlayer.rubles + reward
      }

      // Mirror updatePlayer's Bread Loaf wealth-cap enforcement before committing,
      // so batching the stat update with the reward payment into a single set()
      // doesn't change that behaviour.
      if (currentPlayer.piece === 'breadLoaf' && updates.rubles !== undefined && updates.rubles > BREAD_LOAF_WEALTH_CAP) {
        const excess = updates.rubles - BREAD_LOAF_WEALTH_CAP
        updates.rubles = BREAD_LOAF_WEALTH_CAP

        get().adjustTreasury(excess)
        get().addLogEntry({
          type: 'payment',
          message: `${currentPlayer.name}'s Bread Loaf forces donation of ₽${String(excess)} to the State (max ${String(BREAD_LOAF_WEALTH_CAP)}₽)`,
          playerId: currentPlayer.id
        })
      }

      set((state) => ({
        players: state.players.map((p) => p.id === currentPlayer.id ? { ...p, ...updates } : p)
      }))

      if (reward > 0) {
        get().adjustTreasury(-reward)
      }

      // Hard questions grant rank up
      if (question.grantsRankUp) {
        get().promotePlayer(currentPlayer.id)
      }

      // Check for Party Member eligibility (2 correct answers)
      if (currentPlayer.correctTestAnswers >= 2 && currentPlayer.rank === 'proletariat') {
        get().promotePlayer(currentPlayer.id)
      }

      get().addLogEntry({
        type: 'system',
        message: `${currentPlayer.name} answered correctly! Reward: ₽${String(reward)}`,
        playerId: currentPlayer.id
      })
    } else {
      // Wrong answer
      // 2 consecutive failures = rank loss. Note: this reads the stale
      // `currentPlayer` snapshot captured at the start of the function (not the
      // post-increment value), matching the pre-batching behaviour exactly.
      const rankLoss = currentPlayer.consecutiveFailedTests >= 2

      // Apply penalty (doubled for Red Star)
      const penalty = currentPlayer.piece === 'redStar' ? question.penalty * 2 : question.penalty

      const updates: Partial<Player> = {
        consecutiveFailedTests: rankLoss ? 0 : currentPlayer.consecutiveFailedTests + 1
      }
      if (penalty > 0) {
        updates.rubles = currentPlayer.rubles - penalty
      }

      // Mirror updatePlayer's Bread Loaf wealth-cap enforcement before committing,
      // so batching the stat update with the penalty payment into a single set()
      // doesn't change that behaviour.
      if (currentPlayer.piece === 'breadLoaf' && updates.rubles !== undefined && updates.rubles > BREAD_LOAF_WEALTH_CAP) {
        const excess = updates.rubles - BREAD_LOAF_WEALTH_CAP
        updates.rubles = BREAD_LOAF_WEALTH_CAP

        get().adjustTreasury(excess)
        get().addLogEntry({
          type: 'payment',
          message: `${currentPlayer.name}'s Bread Loaf forces donation of ₽${String(excess)} to the State (max ${String(BREAD_LOAF_WEALTH_CAP)}₽)`,
          playerId: currentPlayer.id
        })
      }

      set((state) => ({
        players: state.players.map((p) => p.id === currentPlayer.id ? { ...p, ...updates } : p)
      }))

      if (penalty > 0) {
        get().adjustTreasury(penalty)
      }

      if (rankLoss) {
        get().demotePlayer(currentPlayer.id)
      }

      get().addLogEntry({
        type: 'system',
        message: `${currentPlayer.name} answered incorrectly. Penalty: ₽${String(penalty)}`,
        playerId: currentPlayer.id
      })
    }

    set({ pendingAction: null, turnPhase: 'post-turn' })
  }
})
