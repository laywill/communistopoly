// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { StateCreator } from 'zustand'
import type { GameStore } from '../types/storeTypes'
import { PARTY_DIRECTIVE_CARDS } from '../../data/partyDirectiveCards'
import type { DirectiveCard } from '../../data/partyDirectiveCards'
import {
  getRandomDifficulty,
  isAnswerCorrect,
  COMMUNIST_TEST_QUESTIONS_BY_DIFFICULTY
} from '../../data/communistTestQuestions'
import type { TestQuestion, TestDifficulty } from '../../data/communistTestQuestions'
import { calculateRailwayFee } from '../../utils/propertyUtils'

// Slice state interface
export interface CardSliceState {
  partyDirectiveDeck: string[]
  partyDirectiveDiscard: string[]
  communistTestUsedQuestions: Set<string>
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
  communistTestUsedQuestions: new Set<string>()
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

    // If deck is empty, reshuffle discard pile
    if (partyDirectiveDeck.length === 0) {
      partyDirectiveDeck = [...partyDirectiveDiscard].sort(() => Math.random() - 0.5)
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
    const availableQuestions = allQuestions.filter(q => !state.communistTestUsedQuestions.has(q.id))

    // If all questions have been used, reset the used set and use all questions
    const questionsToUse = availableQuestions.length > 0 ? availableQuestions : allQuestions

    // Select a random question from available pool
    const randomIndex = Math.floor(Math.random() * questionsToUse.length)
    const question = questionsToUse[randomIndex]

    // Mark question as used
    const newUsedQuestions = availableQuestions.length > 0
      ? new Set<string>(state.communistTestUsedQuestions)
      : new Set<string>()  // Reset if we exhausted all questions
    newUsedQuestions.add(question.id)

    set({ communistTestUsedQuestions: newUsedQuestions })

    return question
  },

  // Apply the effect of a drawn Party Directive card to the specified player.
  applyDirectiveEffect: (card, playerId) => {
    const state = get()
    const player = state.players.find(p => p.id === playerId)
    if (player == null) return

    get().addLogEntry({
      type: 'system',
      message: `${player.name} drew: ${card.title} - ${card.description}`
    })

    switch (card.effect.type) {
      case 'move':
        if (card.effect.destination !== undefined) {
          const oldPosition = player.position
          get().updatePlayer(playerId, { position: card.effect.destination })
          // Check if passed STOY (wrapped around the board).
          // Moving to position 0 from a higher position = backwards wrap past STOY.
          // Moving forward to a position higher than the old position = forward past STOY.
          if (oldPosition > card.effect.destination && card.effect.destination === 0) {
            // Moving backwards to STOY (wrapping around) - pay travel tax
            get().handleStoyPassing(playerId)
          } else if (oldPosition < card.effect.destination && card.effect.destination !== 0) {
            // Moving forward past STOY (not landing on it)
            get().handleStoyPassing(playerId)
          }
          // Resolve the space the player landed on
          set({ turnPhase: 'resolving' })
          get().resolveCurrentSpace(playerId)
          return // Exit early to prevent setting turnPhase to 'post-turn' at the end
        }
        break

      case 'moveRelative':
        if (card.effect.spaces !== undefined) {
          get().movePlayer(playerId, card.effect.spaces)
          // Resolve the space the player landed on
          set({ turnPhase: 'resolving' })
          get().resolveCurrentSpace(playerId)
          return // Exit early to prevent setting turnPhase to 'post-turn' at the end
        }
        break

      case 'money':
        if (card.effect.amount !== undefined) {
          get().updatePlayer(playerId, { rubles: player.rubles + card.effect.amount })
          if (card.effect.amount > 0) {
            get().adjustTreasury(-card.effect.amount)
          } else {
            get().adjustTreasury(Math.abs(card.effect.amount))
          }
        }
        break

      case 'gulag':
        get().sendToGulag(playerId, 'stalinDecree', 'Party Directive card')
        break

      case 'freeFromGulag':
        get().updatePlayer(playerId, { hasFreeFromGulagCard: true })
        get().addLogEntry({
          type: 'system',
          message: `${player.name} received a "Get out of Gulag free" card!`,
          playerId
        })
        break

      case 'rankChange':
        if (card.effect.direction === 'up') {
          get().promotePlayer(playerId)
        } else {
          get().demotePlayer(playerId)
        }
        break

      case 'collectFromAll':
        if (card.effect.amount !== undefined) {
          const effectAmount = card.effect.amount
          state.players.forEach(p => {
            if (!p.isStalin && p.id !== playerId && !p.isEliminated) {
              const amount = Math.min(effectAmount, p.rubles)
              get().updatePlayer(p.id, { rubles: p.rubles - amount })
              get().updatePlayer(playerId, { rubles: player.rubles + amount })
            }
          })
        }
        break

      case 'payToAll':
        if (card.effect.amount !== undefined) {
          const effectAmount = card.effect.amount
          state.players.forEach(p => {
            if (!p.isStalin && p.id !== playerId && !p.isEliminated) {
              const amount = Math.min(effectAmount, player.rubles)
              get().updatePlayer(playerId, { rubles: player.rubles - amount })
              get().updatePlayer(p.id, { rubles: p.rubles + amount })
            }
          })
        }
        break

      case 'propertyTax': {
        const properties = state.properties.filter(p => p.custodianId === playerId)
        let totalTax = 0
        if (card.effect.perProperty) {
          totalTax += properties.length * card.effect.perProperty
        }
        if (card.effect.perImprovement) {
          const totalImprovements = properties.reduce((sum, p) => sum + p.collectivizationLevel, 0)
          totalTax += totalImprovements * card.effect.perImprovement
        }
        get().updatePlayer(playerId, { rubles: player.rubles - totalTax })
        get().adjustTreasury(totalTax)
        get().addLogEntry({
          type: 'payment',
          message: `${player.name} paid ₽${String(totalTax)} in property taxes`,
          playerId
        })
        break
      }

      case 'custom':
        // Handle custom effects
        if (card.effect.handler === 'advanceToNearestRailway') {
          const railwayPositions = [5, 15, 25, 35]
          const currentPosition = player.position

          // Find the nearest railway ahead (wrapping around)
          let nearestRailway = railwayPositions[0]
          for (const railwayPos of railwayPositions) {
            if (railwayPos > currentPosition) {
              nearestRailway = railwayPos
              break
            }
          }

          // Move player to railway
          const oldPosition = player.position
          get().updatePlayer(playerId, { position: nearestRailway })

          // Check if passed STOY (position 0)
          if (oldPosition > nearestRailway || (oldPosition < nearestRailway && nearestRailway < 40)) {
            // Only give STOY bonus if we actually passed it (wrapped around)
            if (oldPosition > nearestRailway) {
              get().handleStoyPassing(playerId)
            }
          }

          // Check railway property ownership
          const railwayProperty = state.properties.find(p => p.spaceId === nearestRailway)

          if (railwayProperty != null) {
            if (railwayProperty.custodianId === null) {
              // Railway is unowned - set pending action for purchase
              set({
                pendingAction: {
                  type: 'property-purchase',
                  data: { spaceId: nearestRailway, playerId }
                },
                turnPhase: 'awaiting-action'
              })
              return
            } else if (railwayProperty.custodianId !== playerId && !railwayProperty.isMortgaged) {
              // Railway is owned by another player - charge fee
              const fee = calculateRailwayFee(railwayProperty.custodianId, state.properties)
              get().payQuota(playerId, railwayProperty.custodianId, fee)
            }
            // If owned by current player or mortgaged, no fee charged
          }
        } else if (card.effect.handler === 'triggerAnonymousTribunal') {
          // Trigger tribunal with Stalin as accuser
          const stalin = state.players.find(p => p.isStalin)
          if (stalin != null) {
            set({
              pendingAction: {
                type: 'tribunal',
                data: { targetId: playerId, accuserId: stalin.id, isAnonymous: true }
              },
              turnPhase: 'awaiting-action'
            })
            return
          }
        } else {
          // Unknown custom handler
          get().addLogEntry({
            type: 'system',
            message: `Custom effect: ${card.effect.handler ?? 'unknown'} - requires special handling`,
            playerId
          })
        }
        break
    }

    set({ pendingAction: null, turnPhase: 'post-turn' })
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
      get().updatePlayer(currentPlayer.id, {
        correctTestAnswers: currentPlayer.correctTestAnswers + 1,
        consecutiveFailedTests: 0
      })

      // Apply reward (doubled for Red Star penalty)
      const reward = currentPlayer.piece === 'redStar' ? question.reward * 2 : question.reward
      if (reward > 0) {
        get().updatePlayer(currentPlayer.id, { rubles: currentPlayer.rubles + reward })
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
      get().updatePlayer(currentPlayer.id, {
        consecutiveFailedTests: currentPlayer.consecutiveFailedTests + 1
      })

      // Apply penalty (doubled for Red Star)
      const penalty = currentPlayer.piece === 'redStar' ? question.penalty * 2 : question.penalty
      if (penalty > 0) {
        get().updatePlayer(currentPlayer.id, { rubles: currentPlayer.rubles - penalty })
        get().adjustTreasury(penalty)
      }

      // 2 consecutive failures = rank loss
      if (currentPlayer.consecutiveFailedTests >= 2) {
        get().demotePlayer(currentPlayer.id)
        get().updatePlayer(currentPlayer.id, { consecutiveFailedTests: 0 })
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
