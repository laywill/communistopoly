// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { GameState, Player, PlayerStatistics } from '../types/game'
import { getSpaceById } from '../data/spaces'
import { PARTY_DIRECTIVE_CARDS, shuffleDirectiveDeck } from '../data/partyDirectiveCards'
import { getRandomQuestionByDifficulty, getRandomDifficulty, isAnswerCorrect, COMMUNIST_TEST_QUESTIONS_BY_DIFFICULTY } from '../data/communistTestQuestions'
import { calculateTotalWealth } from './helpers/wealthCalculation'
import { initializePlayerStats } from './helpers/playerStats'
import { calculateRailwayFee } from '../utils/propertyUtils'
import { createUiSlice, initialUiState } from './slices/uiSlice'
import { createLogSlice, initialLogState } from './slices/logSlice'
import { createStatisticsSlice, initialStatisticsState } from './slices/statisticsSlice'
import { createDiceSlice, initialDiceState } from './slices/diceSlice'
import { createTreasurySlice, initialTreasuryState } from './slices/treasurySlice'
import { createPlayerSlice, initialPlayerState } from './slices/playerSlice'
import { createPropertySlice, initialPropertyState } from './slices/propertySlice'
import { createMovementSlice } from './slices/movementSlice'
import { createGulagSlice } from './slices/gulagSlice'
import { createVoucherSlice, initialVoucherState } from './slices/voucherSlice'
import { createConfessionSlice, initialConfessionState } from './slices/confessionSlice'
import { createTradeSlice, initialTradeState } from './slices/tradeSlice'
import { createDebtAndEliminationSlice } from './slices/debtAndEliminationSlice'
import type { GameStore, GameActions } from './types/storeTypes'

// Re-export helper functions for testing
export { calculateTotalWealth, initializePlayerStats }

// Re-export GameActions for backward compatibility
export type { GameActions }

const initialState: GameState = {
  gamePhase: 'welcome',
  ...initialPlayerState,
  ...initialPropertyState,
  ...initialTreasuryState,
  ...initialDiceState,
  ...initialUiState,
  ...initialLogState,
  ...initialVoucherState,
  ...initialConfessionState,
  ...initialTradeState,
  partyDirectiveDeck: shuffleDirectiveDeck().map(card => card.id),
  partyDirectiveDiscard: [],
  communistTestUsedQuestions: new Set(),

  // Game end tracking
  gameEndCondition: null,
  winnerId: null,
  showEndScreen: false,

  ...initialStatisticsState,

  // Unanimous end vote
  endVoteInProgress: false,
  endVoteInitiator: null,
  endVotes: {},

  // Denouncement and Tribunal System
  denouncementsThisRound: [],
  activeTribunal: null,

  // Special Decrees
  greatPurgeUsed: false,
  activeGreatPurge: null,
  activeFiveYearPlan: null,
  heroesOfSovietUnion: []
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      ...createUiSlice(set, get),
      ...createLogSlice(set, get),
      ...createStatisticsSlice(set, get),
      ...createDiceSlice(set, get),
      ...createTreasurySlice(set, get),
      ...createPlayerSlice(set, get),
      ...createPropertySlice(set, get),
      ...createMovementSlice(set, get),
      ...createGulagSlice(set, get),
      ...createVoucherSlice(set, get),
      ...createConfessionSlice(set, get),
      ...createTradeSlice(set, get),
      ...createDebtAndEliminationSlice(set, get),

      setGamePhase: (phase) => set({ gamePhase: phase }),

      startNewGame: () => set({ ...initialState, gamePhase: 'setup' }),

      resetGame: () => {
        // Clear localStorage save
        localStorage.removeItem('communistopoly-save')

        // Reset all state to initial values
        set({
          ...initialState,
          gamePhase: 'welcome'
        })
      },

      initializePlayers: (playerSetups) => {
        const players: Player[] = playerSetups.map((setup, index: number) => ({
          id: `player-${String(index)}`,
          name: setup.name,
          piece: setup.piece,
          rank: setup.piece === 'redStar' ? 'partyMember' : 'proletariat',
          rubles: 1500,
          position: 0,
          properties: [],
          inGulag: false,
          gulagTurns: 0,
          isEliminated: false,
          isStalin: setup.isStalin,
          correctTestAnswers: 0,
          consecutiveFailedTests: 0,
          underSuspicion: false,
          skipNextTurn: false,
          usedRailwayGulagPower: false,
          vouchingFor: null,
          vouchedByRound: null,
          debt: null,
          debtCreatedAtRound: null,
          hasUsedTankGulagImmunity: false,
          tankRequisitionUsedThisLap: false,
          lapsCompleted: 0,
          hasUsedSickleHarvest: false,
          sickleMotherlandForgotten: false,
          hasUsedLeninSpeech: false,
          hasUsedIronCurtainDisappear: false,
          hasFreeFromGulagCard: false,
          vodkaUseCount: 0,
          ironCurtainClaimedRubles: 1500, // Start with initial amount claimed
          owesFavourTo: [],
          hasUsedSiberianCampsGulag: false,
          kgbTestPreviewsUsedThisRound: 0,
          hasUsedMinistryTruthRewrite: false,
          hasUsedPravdaPressRevote: false
        }))

        const stalinPlayer = players.find(p => p.isStalin)
        const nonStalinPlayers = players.filter(p => !p.isStalin)

        // Calculate state treasury based on player count
        const playerCount = nonStalinPlayers.length
        const stateTreasury = playerCount * 1500 // Starting treasury

        // Initialize player statistics
        const playerStats: Record<string, PlayerStatistics> = {}
        players.forEach(player => {
          if (!player.isStalin) {
            playerStats[player.id] = initializePlayerStats()
          }
        })

        set({
          players,
          stalinPlayerId: stalinPlayer?.id ?? null,
          currentPlayerIndex: 1, // Start with first non-Stalin player
          stateTreasury,
          partyDirectiveDeck: shuffleDirectiveDeck().map(card => card.id),
          partyDirectiveDiscard: [],
          communistTestUsedQuestions: new Set(),
          gameStatistics: {
            gameStartTime: new Date(),
            totalTurns: 0,
            playerStats,
            totalDenouncements: 0,
            totalTribunals: 0,
            totalGulagSentences: 0,
            stateTreasuryPeak: stateTreasury
          }
        })

        // Initialize properties
        get().initializeProperties()
      },

      // Turn management and movement - moved to movementSlice
      // movePlayer, resolveCurrentSpace, finishMoving, endTurn, handleStoyPassing, handleStoyPilfer

      // Gulag management - moved to gulagSlice
      // sendToGulag, checkRedStarExecutionAfterGulagRelease, handleGulagTurn, attemptGulagEscape, checkFor10TurnElimination are now in gulagSlice

      // Piece abilities
      tankRequisition: (tankPlayerId, targetPlayerId) => {
        const state = get()
        const tankPlayer = state.players.find((p) => p.id === tankPlayerId)
        const targetPlayer = state.players.find((p) => p.id === targetPlayerId)

        if (tankPlayer == null || targetPlayer == null) return
        if (tankPlayer.piece !== 'tank') return
        if (tankPlayer.tankRequisitionUsedThisLap) return

        // Requisition ₽50 from target (or all their money if they have less)
        const requisitionAmount = Math.min(50, targetPlayer.rubles)

        get().updatePlayer(targetPlayerId, { rubles: targetPlayer.rubles - requisitionAmount })
        get().updatePlayer(tankPlayerId, {
          rubles: tankPlayer.rubles + requisitionAmount,
          tankRequisitionUsedThisLap: true
        })

        get().addLogEntry({
          type: 'payment',
          message: `${tankPlayer.name}'s Tank requisitioned ₽${String(requisitionAmount)} from ${targetPlayer.name}!`,
          playerId: tankPlayerId
        })
      },

      payQuota: (payerId, custodianId, amount) => {
        const state = get()
        const payer = state.players.find((p) => p.id === payerId)
        const custodian = state.players.find((p) => p.id === custodianId)
        if (payer == null || custodian == null) return

        // Transfer rubles
        get().updatePlayer(payerId, { rubles: payer.rubles - amount })
        get().updatePlayer(custodianId, { rubles: custodian.rubles + amount })

        get().addLogEntry({
          type: 'payment',
          message: `${payer.name} paid ₽${String(amount)} quota to ${custodian.name}`,
          playerId: payerId
        })
      },

      checkGameEnd: () => {
        const state = get()
        const activePlayers = state.players.filter(p => !p.isEliminated && !p.isStalin)

        // Survivor victory
        if (activePlayers.length === 1) {
          get().endGame('survivor', activePlayers[0].id)
          return 'survivor'
        }

        // Stalin victory (all eliminated)
        if (activePlayers.length === 0) {
          get().endGame('stalinWins', null)
          return 'stalinWins'
        }

        return null
      },

      endGame: (condition, winnerId) => {
        // Calculate final statistics
        get().calculateFinalStats()

        set({
          gamePhase: 'ended',
          gameEndCondition: condition,
          winnerId,
          showEndScreen: true
        })

        get().addLogEntry({
          type: 'system',
          message: `Game Over: ${condition === 'survivor' ? 'Survivor Victory!' : condition === 'stalinWins' ? 'Stalin Wins!' : condition === 'unanimous' ? 'Unanimous Vote to End' : 'Game Ended'}`
        })
      },

      initiateEndVote: (initiatorId) => {
        set({
          endVoteInProgress: true,
          endVoteInitiator: initiatorId,
          endVotes: {}
        })

        const initiator = get().players.find(p => p.id === initiatorId)
        const initiatorName = initiator?.name ?? 'Unknown'
        get().addLogEntry({
          type: 'system',
          message: `Comrade ${initiatorName} has initiated a vote to end the game. All players must vote unanimously to end.`
        })
      },

      castEndVote: (playerId, vote) => {
        const state = get()

        set((state) => ({
          endVotes: { ...state.endVotes, [playerId]: vote }
        }))

        const player = state.players.find(p => p.id === playerId)
        const playerName = player?.name ?? 'Unknown'
        get().addLogEntry({
          type: 'system',
          message: `${playerName} voted ${vote ? 'YES' : 'NO'} to end the game`
        })

        // Check if all active players have voted
        const activePlayerIds = state.players
          .filter(p => !p.isStalin && !p.isEliminated)
          .map(p => p.id)
        const allVoted = activePlayerIds.every(id => id in state.endVotes || id in get().endVotes)

        if (allVoted) {
          const votes = get().endVotes
          const unanimous = activePlayerIds.every(id => votes[id])

          if (unanimous) {
            get().endGame('unanimous', null)
          } else {
            set({ endVoteInProgress: false, endVoteInitiator: null, endVotes: {} })
            get().addLogEntry({
              type: 'system',
              message: 'End vote failed - not unanimous'
            })
          }
        }
      },

      // Card system
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
              // Check if passed STOY (wrapped around the board)
              // If moving to position 0 from a higher position, or if destination > oldPosition for normal forward movement
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
      },

      // Piece abilities
      sickleHarvest: (sicklePlayerId, targetPropertyId) => {
        const state = get()
        const sicklePlayer = state.players.find(p => p.id === sicklePlayerId)
        const property = state.properties.find(p => p.spaceId === targetPropertyId)
        const space = getSpaceById(targetPropertyId)

        if ((sicklePlayer == null) || (property == null) || (space == null)) return
        if (sicklePlayer.piece !== 'sickle') return
        if (sicklePlayer.hasUsedSickleHarvest) return

        // Check property value < ₽150
        if ((space.baseCost ?? 0) >= 150) {
          get().addLogEntry({
            type: 'system',
            message: `Cannot harvest ${space.name} - value must be less than ₽150!`,
            playerId: sicklePlayerId
          })
          return
        }

        // Transfer property
        const oldCustodian = state.players.find(p => p.id === property.custodianId)
        get().setPropertyCustodian(targetPropertyId, sicklePlayerId)

        get().updatePlayer(sicklePlayerId, { hasUsedSickleHarvest: true })

        get().addLogEntry({
          type: 'property',
          message: `${sicklePlayer.name}'s Sickle harvested ${space.name} from ${oldCustodian?.name ?? 'the State'}!`,
          playerId: sicklePlayerId
        })

        set({ pendingAction: null })
      },

      ironCurtainDisappear: (ironCurtainPlayerId, targetPropertyId) => {
        const state = get()
        const ironCurtainPlayer = state.players.find(p => p.id === ironCurtainPlayerId)
        const property = state.properties.find(p => p.spaceId === targetPropertyId)
        const space = getSpaceById(targetPropertyId)

        if ((ironCurtainPlayer == null) || (property == null) || (space == null)) return
        if (ironCurtainPlayer.piece !== 'ironCurtain') return
        if (ironCurtainPlayer.hasUsedIronCurtainDisappear) return

        const victimPlayer = state.players.find(p => p.id === property.custodianId)

        // Return property to State
        get().setPropertyCustodian(targetPropertyId, null)

        get().updatePlayer(ironCurtainPlayer.id, { hasUsedIronCurtainDisappear: true })

        get().addLogEntry({
          type: 'property',
          message: `${ironCurtainPlayer.name}'s Iron Curtain made ${space.name} disappear from ${victimPlayer?.name ?? 'the State'}!`,
          playerId: ironCurtainPlayer.id
        })

        set({ pendingAction: null })
      },

      leninSpeech: (leninPlayerId, applauders) => {
        const state = get()
        const leninPlayer = state.players.find(p => p.id === leninPlayerId)

        if (leninPlayer == null) return
        if (leninPlayer.piece !== 'statueOfLenin') return
        if (leninPlayer.hasUsedLeninSpeech) return

        // Collect ₽100 from each applauder
        let totalCollected = 0
        applauders.forEach(applauderId => {
          const applauder = state.players.find(p => p.id === applauderId)
          if ((applauder != null) && !applauder.isEliminated) {
            const amount = Math.min(100, applauder.rubles)
            get().updatePlayer(applauderId, { rubles: applauder.rubles - amount })
            totalCollected += amount
          }
        })

        get().updatePlayer(leninPlayerId, {
          rubles: leninPlayer.rubles + totalCollected,
          hasUsedLeninSpeech: true
        })

        get().addLogEntry({
          type: 'payment',
          message: `${leninPlayer.name}'s inspiring speech collected ₽${String(totalCollected)} from ${String(applauders.length)} applauders!`,
          playerId: leninPlayerId
        })

        set({ pendingAction: null })
      },

      // Property special abilities
      siberianCampsGulag: (custodianId, targetPlayerId) => {
        const state = get()
        const custodian = state.players.find(p => p.id === custodianId)
        const target = state.players.find(p => p.id === targetPlayerId)

        if ((custodian == null) || (target == null)) return
        if (custodian.hasUsedSiberianCampsGulag) return

        // Check if custodian owns both Siberian Camps (spaces 1 and 3)
        const ownsCampVorkuta = state.properties.find(p => p.spaceId === 1 && p.custodianId === custodianId)
        const ownsCampKolyma = state.properties.find(p => p.spaceId === 3 && p.custodianId === custodianId)

        if ((ownsCampVorkuta == null) || (ownsCampKolyma == null)) {
          get().addLogEntry({
            type: 'system',
            message: `${custodian.name} must control both Siberian Camps to use this ability!`
          })
          return
        }

        // Ask Stalin for approval via modal
        set({
          pendingAction: {
            type: 'hammer-approval',
            data: {
              custodianId,
              custodianName: custodian.name,
              targetPlayerId,
              targetName: target.name
            }
          }
        })
      },

      approveHammerAbility: (custodianId, targetPlayerId, approved) => {
        const state = get()
        const custodian = state.players.find(p => p.id === custodianId)
        const target = state.players.find(p => p.id === targetPlayerId)

        if ((custodian == null) || (target == null)) {
          set({ pendingAction: null })
          return
        }

        if (approved) {
          get().sendToGulag(targetPlayerId, 'campLabour')
          get().updatePlayer(custodianId, { hasUsedSiberianCampsGulag: true })

          get().addLogEntry({
            type: 'gulag',
            message: `${custodian.name} sent ${target.name} to the Gulag for forced labour! (Siberian Camps ability)`,
            playerId: custodianId
          })
        } else {
          get().addLogEntry({
            type: 'system',
            message: `Stalin denied ${custodian.name}'s request to send ${target.name} to the Gulag`
          })
        }

        set({ pendingAction: null })
      },

      kgbPreviewTest: (custodianId) => {
        const state = get()
        const custodian = state.players.find(p => p.id === custodianId)

        if (custodian == null) return

        // Check if custodian owns KGB Headquarters (space 23)
        const ownsKGB = state.properties.find(p => p.spaceId === 23 && p.custodianId === custodianId)

        if (ownsKGB == null) {
          get().addLogEntry({
            type: 'system',
            message: `${custodian.name} must control KGB Headquarters to use this ability!`
          })
          return
        }

        // Check if already used this round
        if (custodian.kgbTestPreviewsUsedThisRound >= 1) {
          get().addLogEntry({
            type: 'system',
            message: `${custodian.name} has already used KGB Preview this round!`
          })
          return
        }

        // Draw a random question to preview
        const difficulty = getRandomDifficulty()
        const question = getRandomQuestionByDifficulty(difficulty)

        // Show the question to the custodian
        alert(
          'KGB HEADQUARTERS - TEST PREVIEW\n\n' +
          `Difficulty: ${difficulty.toUpperCase()}\n` +
          `Question: ${question.question}\n\n` +
          `Answer: ${question.answer}\n\n` +
          'This preview has been noted by the KGB.'
        )

        get().updatePlayer(custodianId, {
          kgbTestPreviewsUsedThisRound: custodian.kgbTestPreviewsUsedThisRound + 1
        })

        get().addLogEntry({
          type: 'system',
          message: `${custodian.name} used KGB Headquarters to preview a Communist Test question`,
          playerId: custodianId
        })
      },

      ministryTruthRewrite: (custodianId, newRule) => {
        const state = get()
        const custodian = state.players.find(p => p.id === custodianId)

        if (custodian == null) return
        if (custodian.hasUsedMinistryTruthRewrite) return

        // Check if custodian owns all three Ministry properties (16, 18, 19)
        const ownsMinistries = [16, 18, 19].every(spaceId =>
          state.properties.find(p => p.spaceId === spaceId && p.custodianId === custodianId)
        )

        if (!ownsMinistries) {
          get().addLogEntry({
            type: 'system',
            message: `${custodian.name} must control all three Government Ministries to use this ability!`
          })
          return
        }

        // Ask Stalin for approval via modal
        set({
          pendingAction: {
            type: 'ministry-truth-approval',
            data: {
              custodianId,
              custodianName: custodian.name,
              newRule
            }
          }
        })
      },

      approveMinistryTruthRewrite: (custodianId, newRule, approved) => {
        const state = get()
        const custodian = state.players.find(p => p.id === custodianId)

        if (custodian == null) {
          set({ pendingAction: null })
          return
        }

        if (approved) {
          get().updatePlayer(custodianId, { hasUsedMinistryTruthRewrite: true })

          get().addLogEntry({
            type: 'system',
            message: `${custodian.name} used Ministry of Truth to rewrite a rule: "${newRule}"`,
            playerId: custodianId
          })
        } else {
          get().addLogEntry({
            type: 'system',
            message: `Stalin vetoed ${custodian.name}'s rule rewrite attempt`
          })
        }

        set({ pendingAction: null })
      },

      pravdaPressRevote: (custodianId, decision) => {
        const state = get()
        const custodian = state.players.find(p => p.id === custodianId)

        if (custodian == null) return
        if (custodian.hasUsedPravdaPressRevote) return

        // Check if custodian owns all three State Media properties (26, 27, 29)
        const ownsMedia = [26, 27, 29].every(spaceId =>
          state.properties.find(p => p.spaceId === spaceId && p.custodianId === custodianId)
        )

        if (!ownsMedia) {
          get().addLogEntry({
            type: 'system',
            message: `${custodian.name} must control all three State Media properties to use this ability!`
          })
          return
        }

        get().updatePlayer(custodianId, { hasUsedPravdaPressRevote: true })

        get().addLogEntry({
          type: 'system',
          message: `${custodian.name} used Pravda Press to force a re-vote on: "${decision}" - The people demand it!`,
          playerId: custodianId
        })

        alert(
          'PRAVDA PRESS - PROPAGANDA SPREAD\n\n' +
          `${custodian.name} demands a re-vote on:\n"${decision}"\n\n` +
          'THE PEOPLE DEMAND IT!'
        )

        set({ pendingAction: null })
      },

      // Denouncement and Tribunal System
      canPlayerDenounce: (playerId) => {
        const state = get()
        const player = state.players.find(p => p.id === playerId)

        if (player == null) {
          return { canDenounce: false, reason: 'Player not found' }
        }

        // Check if already denounced this round (unless Commissar or Inner Circle)
        const hasDenounced = state.denouncementsThisRound.some(d => d.accuserId === playerId)
        if (hasDenounced && player.rank !== 'commissar' && player.rank !== 'innerCircle') {
          return { canDenounce: false, reason: 'You may only denounce once per round (unless Commissar+)' }
        }

        return { canDenounce: true, reason: '' }
      },

      initiateDenouncement: (accuserId, accusedId, crime) => {
        const state = get()
        const accuser = state.players.find(p => p.id === accuserId)
        const accused = state.players.find(p => p.id === accusedId)

        if (accuser == null || accused == null) return

        // Create denouncement record
        const denouncement: import('../types/game').Denouncement = {
          id: `denouncement-${String(Date.now())}`,
          accuserId,
          accusedId,
          crime,
          timestamp: new Date(),
          roundNumber: state.roundNumber
        }

        // Get witness requirement for accused
        const witnessReq = get().getWitnessRequirement(accusedId)

        // Create tribunal
        const tribunal: import('../types/game').ActiveTribunal = {
          id: `tribunal-${String(Date.now())}`,
          accuserId,
          accusedId,
          crime,
          phase: 'accusation',
          phaseStartTime: new Date(),
          witnessesFor: [],
          witnessesAgainst: [],
          requiredWitnesses: witnessReq.required
        }

        set({
          denouncementsThisRound: [...state.denouncementsThisRound, denouncement],
          activeTribunal: tribunal
        })

        // Update statistics
        set({
          gameStatistics: {
            ...state.gameStatistics,
            totalDenouncements: state.gameStatistics.totalDenouncements + 1,
            totalTribunals: state.gameStatistics.totalTribunals + 1
          }
        })

        get().addLogEntry({
          type: 'tribunal',
          message: `${accuser.name} has denounced ${accused.name} for "${crime}". Tribunal is now in session!`
        })
      },

      getWitnessRequirement: (playerId) => {
        const state = get()
        const player = state.players.find(p => p.id === playerId)

        if (player == null) {
          return { required: 0, reason: 'Player not found' }
        }

        // Check if under suspicion
        if (player.underSuspicion) {
          return { required: 0, reason: 'Player is under suspicion - no witnesses required' }
        }

        // Check if Hero of Soviet Union
        const isHero = get().isHeroOfSovietUnion(playerId)
        if (isHero) {
          return { required: 'unanimous', reason: 'Hero of Soviet Union requires unanimous agreement' }
        }

        // Rank-based requirements
        switch (player.rank) {
          case 'commissar':
            return { required: 2, reason: 'Commissar rank requires 2 witnesses' }
          case 'innerCircle':
            return { required: 'unanimous', reason: 'Inner Circle rank requires unanimous agreement' }
          default:
            return { required: 0, reason: 'No witnesses required' }
        }
      },

      advanceTribunalPhase: () => {
        const state = get()
        if (state.activeTribunal == null) return

        const phaseOrder: import('../types/game').TribunalPhase[] = ['accusation', 'defence', 'witnesses', 'judgement']
        const currentIndex = phaseOrder.indexOf(state.activeTribunal.phase)
        const nextPhase = phaseOrder[currentIndex + 1]

        set({
          activeTribunal: {
            ...state.activeTribunal,
            phase: nextPhase,
            phaseStartTime: new Date()
          }
        })
      },

      addWitness: (witnessId, side) => {
        const state = get()
        if (state.activeTribunal == null) return

        const witness = state.players.find(p => p.id === witnessId)
        if (witness == null) return

        if (side === 'for') {
          set({
            activeTribunal: {
              ...state.activeTribunal,
              witnessesFor: [...state.activeTribunal.witnessesFor, witnessId]
            }
          })
        } else {
          set({
            activeTribunal: {
              ...state.activeTribunal,
              witnessesAgainst: [...state.activeTribunal.witnessesAgainst, witnessId]
            }
          })
        }

        get().addLogEntry({
          type: 'tribunal',
          message: `${witness.name} testified ${side === 'for' ? 'for the accuser' : 'for the accused'}`
        })
      },

      renderTribunalVerdict: (verdict) => {
        const state = get()
        if (state.activeTribunal == null) return

        const accuser = state.players.find(p => p.id === state.activeTribunal?.accuserId)
        const accused = state.players.find(p => p.id === state.activeTribunal?.accusedId)

        if (accuser == null || accused == null) return

        switch (verdict) {
          case 'guilty': {
            // Send accused to Gulag
            get().sendToGulag(accused.id, 'denouncementGuilty')

            // If accuser was in Gulag, release them (informant reward)
            if (accuser.inGulag) {
              get().updatePlayer(accuser.id, {
                inGulag: false,
                gulagTurns: 0,
                position: 10, // Release to Just Visiting
                rubles: accuser.rubles + 100
              })
              get().addLogEntry({
                type: 'gulag',
                message: `${accuser.name} is released from Gulag for successful denunciation and receives ₽100 informant bonus.`
              })

              // Check if RedStar player at Proletariat should be executed
              get().checkRedStarExecutionAfterGulagRelease(accuser.id)
            } else {
              // Give accuser informant bonus
              get().updatePlayer(accuser.id, {
                rubles: accuser.rubles + 100
              })
              get().addLogEntry({
                type: 'tribunal',
                message: `GUILTY! ${accused.name} has been sent to the Gulag. ${accuser.name} receives ₽100 informant bonus.`
              })
            }

            // Update statistics
            get().updatePlayerStat(accuser.id, 'tribunalsWon', 1)
            get().updatePlayerStat(accused.id, 'tribunalsLost', 1)
            break
          }

          case 'innocent': {
            // Demote accuser
            get().demotePlayer(accuser.id)

            get().addLogEntry({
              type: 'tribunal',
              message: `INNOCENT! ${accused.name} is innocent. ${accuser.name} loses one rank for wasting the Party's time.`
            })

            // Update statistics
            get().updatePlayerStat(accuser.id, 'tribunalsLost', 1)
            get().updatePlayerStat(accused.id, 'tribunalsWon', 1)
            break
          }

          case 'bothGuilty': {
            // Send both to Gulag
            get().sendToGulag(accused.id, 'denouncementGuilty')
            get().sendToGulag(accuser.id, 'denouncementGuilty')

            get().addLogEntry({
              type: 'tribunal',
              message: `BOTH GUILTY! ${accuser.name} and ${accused.name} have both been sent to the Gulag.`
            })

            // Update statistics
            get().updatePlayerStat(accuser.id, 'tribunalsLost', 1)
            get().updatePlayerStat(accused.id, 'tribunalsLost', 1)
            break
          }

          case 'insufficient':
            // Mark accused as under suspicion
            get().updatePlayer(accused.id, {
              underSuspicion: true
            })

            get().addLogEntry({
              type: 'tribunal',
              message: `INSUFFICIENT EVIDENCE. ${accused.name} is now under suspicion. Next denouncement requires no witnesses.`
            })
            break
        }

        // Close tribunal
        set({ activeTribunal: null })
      },

      // Special Decrees
      initiateGreatPurge: () => {
        const state = get()

        if (state.greatPurgeUsed) {
          get().addLogEntry({
            type: 'system',
            message: 'The Great Purge has already been used this game!'
          })
          return
        }

        set({
          greatPurgeUsed: true,
          activeGreatPurge: {
            isActive: true,
            votes: {},
            timestamp: new Date()
          }
        })

        get().addLogEntry({
          type: 'system',
          message: '☭ THE GREAT PURGE HAS BEGUN! All players must simultaneously vote by pointing at another player.'
        })
      },

      voteInGreatPurge: (voterId, targetId) => {
        const state = get()
        if (!state.activeGreatPurge?.isActive) return

        set({
          activeGreatPurge: {
            ...state.activeGreatPurge,
            votes: {
              ...state.activeGreatPurge.votes,
              [voterId]: targetId
            }
          }
        })
      },

      resolveGreatPurge: () => {
        const state = get()
        if (state.activeGreatPurge == null) return

        // Count votes
        const voteCounts: Record<string, number> = {}
        Object.values(state.activeGreatPurge.votes).forEach(targetId => {
          voteCounts[targetId] = (voteCounts[targetId] ?? 0) + 1
        })

        // Find max votes
        const maxVotes = Math.max(...Object.values(voteCounts))
        const targets = Object.entries(voteCounts)
          .filter(([, count]) => count === maxVotes)
          .map(([playerId]) => playerId)

        // Send all targets to Gulag
        targets.forEach(playerId => {
          const player = state.players.find(p => p.id === playerId)
          if (player != null && !player.inGulag) {
            get().sendToGulag(playerId, 'stalinDecree')
          }
        })

        const targetNames = targets.map(id => state.players.find(p => p.id === id)?.name).join(' and ')
        get().addLogEntry({
          type: 'system',
          message: `The Great Purge is complete. ${targetNames} received the most votes (${String(maxVotes)}) and have been sent to the Gulag!`
        })

        set({ activeGreatPurge: null })
      },

      initiateFiveYearPlan: (target, durationMinutes) => {
        const deadline = new Date(Date.now() + durationMinutes * 60 * 1000)

        set({
          activeFiveYearPlan: {
            isActive: true,
            target,
            collected: 0,
            deadline,
            startTime: new Date()
          }
        })

        get().addLogEntry({
          type: 'system',
          message: `☭ FIVE-YEAR PLAN INITIATED! The State requires ₽${String(target)} from the collective within ${String(durationMinutes)} minutes.`
        })
      },

      contributeToFiveYearPlan: (playerId, amount) => {
        const state = get()
        if (!state.activeFiveYearPlan?.isActive) return

        const player = state.players.find(p => p.id === playerId)
        if (player == null || player.rubles < amount) return

        // Deduct from player
        get().updatePlayer(playerId, {
          rubles: player.rubles - amount
        })

        // Add to State Treasury
        get().adjustTreasury(amount)

        // Update plan collected
        set({
          activeFiveYearPlan: {
            ...state.activeFiveYearPlan,
            collected: state.activeFiveYearPlan.collected + amount
          }
        })

        get().addLogEntry({
          type: 'system',
          message: `${player.name} contributed ₽${String(amount)} to the Five-Year Plan (${String(state.activeFiveYearPlan.collected + amount)}/₽${String(state.activeFiveYearPlan.target)})`
        })
      },

      resolveFiveYearPlan: () => {
        const state = get()
        if (state.activeFiveYearPlan == null) return

        const plan = state.activeFiveYearPlan
        const success = plan.collected >= plan.target

        if (success) {
          // Give bonus to all players
          state.players.filter(p => !p.isStalin && !p.isEliminated).forEach(player => {
            get().updatePlayer(player.id, {
              rubles: player.rubles + 100
            })
          })

          get().addLogEntry({
            type: 'system',
            message: 'Five-Year Plan SUCCESSFUL! All players receive ₽100 bonus for meeting the quota.'
          })
        } else {
          // Find poorest eligible player and send to Gulag
          // Keep trying until someone is successfully sent (handles tank immunity, etc.)
          const eligiblePlayers = state.players
            .filter(p => !p.isStalin && !p.isEliminated && !p.inGulag)
            .sort((a, b) => a.rubles - b.rubles)

          let sentToGulag = false
          for (const player of eligiblePlayers) {
            const wasInGulag = player.inGulag
            const hadTankImmunity = player.piece === 'tank' && !player.hasUsedTankGulagImmunity

            get().sendToGulag(player.id, 'stalinDecree')

            // Check if player was punished (sent to Gulag, immunity consumed, or eliminated)
            const currentState = get()
            const updatedPlayer = currentState.players.find(p => p.id === player.id)

            if (updatedPlayer) {
              const nowInGulag = updatedPlayer.inGulag && !wasInGulag
              const immunityConsumed = hadTankImmunity && updatedPlayer.hasUsedTankGulagImmunity
              const wasEliminated = updatedPlayer.isEliminated

              if (nowInGulag || immunityConsumed || wasEliminated) {
                const punishmentType = nowInGulag ? 'sent to the Gulag'
                  : immunityConsumed ? 'punished (redirected via Tank immunity)'
                  : 'eliminated'

                get().addLogEntry({
                  type: 'system',
                  message: `Five-Year Plan FAILED! ${player.name} (poorest player) has been ${punishmentType} for sabotage.`
                })
                sentToGulag = true
                break
              }
            }
          }

          if (!sentToGulag && eligiblePlayers.length > 0) {
            // All players had immunity or were redirected
            get().addLogEntry({
              type: 'system',
              message: 'Five-Year Plan FAILED! No player could be sent to the Gulag (all protected).'
            })
          }
        }

        set({ activeFiveYearPlan: null })
      },

      grantHeroOfSovietUnion: (playerId) => {
        const state = get()
        const player = state.players.find(p => p.id === playerId)

        if (player == null) return

        // Check if player is already a Hero
        const existingHero = state.heroesOfSovietUnion.find(h => h.playerId === playerId && h.expiresAtRound > state.roundNumber)
        if (existingHero != null) {
          get().addLogEntry({
            type: 'system',
            message: `${player.name} is already a Hero of the Soviet Union!`
          })
          return
        }

        const hero: import('../types/game').HeroOfSovietUnion = {
          playerId,
          grantedAtRound: state.roundNumber,
          expiresAtRound: state.roundNumber + 3
        }

        set({
          heroesOfSovietUnion: [...state.heroesOfSovietUnion, hero]
        })

        get().addLogEntry({
          type: 'rank',
          message: `⭐ ${player.name} has been declared a HERO OF THE SOVIET UNION! Immune to all negative effects for 3 rounds.`
        })
      },

      isHeroOfSovietUnion: (playerId) => {
        const state = get()
        return state.heroesOfSovietUnion.some(
          h => h.playerId === playerId && h.expiresAtRound > state.roundNumber
        )
      }
    }),
    {
      name: 'communistopoly-save',
      partialize: (state) => ({
        gamePhase: state.gamePhase,
        players: state.players,
        stalinPlayerId: state.stalinPlayerId,
        currentPlayerIndex: state.currentPlayerIndex,
        properties: state.properties,
        stateTreasury: state.stateTreasury,
        turnPhase: state.turnPhase,
        doublesCount: state.doublesCount,
        hasRolled: state.hasRolled,
        roundNumber: state.roundNumber,
        dice: state.dice,
        gameLog: state.gameLog,
        activeVouchers: state.activeVouchers,
        pendingBribes: state.pendingBribes,
        partyDirectiveDeck: state.partyDirectiveDeck,
        partyDirectiveDiscard: state.partyDirectiveDiscard,
        communistTestUsedQuestions: state.communistTestUsedQuestions,
        gameEndCondition: state.gameEndCondition,
        winnerId: state.winnerId,
        showEndScreen: state.showEndScreen,
        gameStatistics: state.gameStatistics,
        endVoteInProgress: state.endVoteInProgress,
        endVoteInitiator: state.endVoteInitiator,
        endVotes: state.endVotes,
        confessions: state.confessions,
        denouncementsThisRound: state.denouncementsThisRound,
        activeTribunal: state.activeTribunal,
        greatPurgeUsed: state.greatPurgeUsed,
        activeGreatPurge: state.activeGreatPurge,
        activeFiveYearPlan: state.activeFiveYearPlan,
        heroesOfSovietUnion: state.heroesOfSovietUnion
      })
    }
  )
)
