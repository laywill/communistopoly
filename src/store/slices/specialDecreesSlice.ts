// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { StateCreator } from 'zustand'
import type { GameStore } from '../types/storeTypes'
import type { GreatPurge, FiveYearPlan, HeroOfSovietUnion } from '../../types/game'

// Constants
const HERO_DURATION_ROUNDS = 3
const FIVE_YEAR_PLAN_BONUS = 100

// Slice state interface
export interface SpecialDecreesSliceState {
  greatPurgeUsed: boolean
  activeGreatPurge: GreatPurge | null
  activeFiveYearPlan: FiveYearPlan | null
  heroesOfSovietUnion: HeroOfSovietUnion[]
}

// Slice actions interface
export interface SpecialDecreesSliceActions {
  // Great Purge actions
  initiateGreatPurge: () => void
  voteInGreatPurge: (voterId: string, targetId: string) => void
  resolveGreatPurge: () => void

  // Five-Year Plan actions
  initiateFiveYearPlan: (target: number, durationMinutes: number) => void
  contributeToFiveYearPlan: (playerId: string, amount: number) => void
  resolveFiveYearPlan: () => void

  // Hero of Soviet Union actions
  grantHeroOfSovietUnion: (playerId: string) => void
  isHeroOfSovietUnion: (playerId: string) => boolean
}

// Combined slice type
export type SpecialDecreesSlice = SpecialDecreesSliceState & SpecialDecreesSliceActions

// Initial state for this slice
export const initialSpecialDecreesState: SpecialDecreesSliceState = {
  greatPurgeUsed: false,
  activeGreatPurge: null,
  activeFiveYearPlan: null,
  heroesOfSovietUnion: []
}

// Slice creator with full typing
export const createSpecialDecreesSlice: StateCreator<
  GameStore,
  [],
  [],
  SpecialDecreesSlice
> = (set, get) => ({
  // Spread initial state
  ...initialSpecialDecreesState,

  // Great Purge Actions
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

  /**
   * Resolves the Great Purge by counting votes and sending the most-voted player(s) to the Gulag.
   *
   * Counts all votes, finds the player(s) with the maximum votes, and sends them to the Gulag
   * via the `sendToGulag` action with the 'stalinDecree' reason. In case of a tie, all tied
   * players are sent to the Gulag. If no votes are cast, the purge ends with a warning message.
   */
  resolveGreatPurge: () => {
    const state = get()
    if (state.activeGreatPurge == null) return

    // Count votes
    const voteCounts: Record<string, number> = {}
    Object.values(state.activeGreatPurge.votes).forEach(targetId => {
      voteCounts[targetId] = (voteCounts[targetId] ?? 0) + 1
    })

    // Guard against no votes
    if (Object.keys(voteCounts).length === 0) {
      get().addLogEntry({
        type: 'system',
        message: 'The Great Purge ended with no votes cast. The Party is watching...'
      })
      set({ activeGreatPurge: null })
      return
    }

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

  // Five-Year Plan Actions
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

  /**
   * Resolves the Five-Year Plan by checking if the target was met.
   *
   * If successful, all non-Stalin, non-eliminated players receive a bonus.
   * If failed, the poorest eligible player is sent to the Gulag for sabotage.
   * The method handles tank immunity and continues trying eligible players until
   * one is successfully punished or all are immune.
   */
  resolveFiveYearPlan: () => {
    const state = get()
    if (state.activeFiveYearPlan == null) return

    const plan = state.activeFiveYearPlan
    const success = plan.collected >= plan.target

    if (success) {
      // Give bonus to all players - get fresh state for each player
      const eligiblePlayerIds = state.players
        .filter(p => !p.isStalin && !p.isEliminated)
        .map(p => p.id)

      eligiblePlayerIds.forEach(playerId => {
        const currentPlayer = get().players.find(p => p.id === playerId)
        if (currentPlayer) {
          get().updatePlayer(playerId, {
            rubles: currentPlayer.rubles + FIVE_YEAR_PLAN_BONUS
          })
        }
      })

      get().addLogEntry({
        type: 'system',
        message: `Five-Year Plan SUCCESSFUL! All players receive ₽${String(FIVE_YEAR_PLAN_BONUS)} bonus for meeting the quota.`
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

  // Hero of Soviet Union Actions
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

    const hero: HeroOfSovietUnion = {
      playerId,
      grantedAtRound: state.roundNumber,
      expiresAtRound: state.roundNumber + HERO_DURATION_ROUNDS
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
})
