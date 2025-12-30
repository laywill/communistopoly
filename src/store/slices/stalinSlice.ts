// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { StateCreator } from 'zustand'
import type {
  GameState,
  GreatPurge,
  FiveYearPlan,
  HeroOfSovietUnion
} from '../../types/game'

// ============================================
// STATE
// ============================================

export interface StalinSliceState {
  stalinPlayerId: string | null
  greatPurgeUsed: boolean
  activeGreatPurge: GreatPurge | null
  activeFiveYearPlan: FiveYearPlan | null
  heroesOfSovietUnion: HeroOfSovietUnion[]
}

export const initialStalinState: StalinSliceState = {
  stalinPlayerId: null,
  greatPurgeUsed: false,
  activeGreatPurge: null,
  activeFiveYearPlan: null,
  heroesOfSovietUnion: [],
}

// ============================================
// ACTIONS (Pure state operations)
// ============================================

export interface StalinSliceActions {
  // Stalin player ID management
  setStalinPlayerId: (playerId: string | null) => void

  // Great Purge
  setGreatPurgeUsed: (used: boolean) => void
  setActiveGreatPurge: (purge: GreatPurge | null) => void
  initiateGreatPurge: () => void
  recordPurgeVote: (voterId: string, targetId: string) => void
  clearGreatPurge: () => void

  // Five Year Plan
  setActiveFiveYearPlan: (plan: FiveYearPlan | null) => void
  initiateFiveYearPlan: (target: number, deadline: Date) => void
  updateFiveYearPlanProgress: (collected: number) => void
  clearFiveYearPlan: () => void

  // Hero of Soviet Union
  addHeroOfSovietUnion: (hero: HeroOfSovietUnion) => void
  removeHeroOfSovietUnion: (playerId: string) => void
  greatHeroOfSovietUnion: (playerId: string) => void
  expireHeroes: () => void

  // Queries
  isHeroOfSovietUnion: (playerId: string) => boolean
}

export type StalinSlice = StalinSliceState & StalinSliceActions

// ============================================
// SLICE CREATOR
// ============================================

export const createStalinSlice: StateCreator<
  GameState,
  [],
  [],
  StalinSlice
> = (set, get) => ({
  ...initialStalinState,

  setStalinPlayerId: (playerId) => {
    set({ stalinPlayerId: playerId })
  },

  setGreatPurgeUsed: (used) => {
    set({ greatPurgeUsed: used })
  },

  setActiveGreatPurge: (purge) => {
    set({ activeGreatPurge: purge })
  },

  initiateGreatPurge: () => {
    set({
      activeGreatPurge: {
        isActive: true,
        votes: {},
        timestamp: new Date(),
      },
      greatPurgeUsed: true,
    })
  },

  recordPurgeVote: (voterId, targetId) => {
    set((state) => {
      if (!state.activeGreatPurge) return state
      return {
        activeGreatPurge: {
          ...state.activeGreatPurge,
          votes: {
            ...state.activeGreatPurge.votes,
            [voterId]: targetId,
          },
        },
      }
    })
  },

  clearGreatPurge: () => {
    set({ activeGreatPurge: null })
  },

  setActiveFiveYearPlan: (plan) => {
    set({ activeFiveYearPlan: plan })
  },

  initiateFiveYearPlan: (target, deadline) => {
    set({
      activeFiveYearPlan: {
        isActive: true,
        target,
        collected: 0,
        deadline,
        startTime: new Date(),
      },
    })
  },

  updateFiveYearPlanProgress: (collected) => {
    set((state) => {
      if (!state.activeFiveYearPlan) return state
      return {
        activeFiveYearPlan: {
          ...state.activeFiveYearPlan,
          collected,
        },
      }
    })
  },

  clearFiveYearPlan: () => {
    set({ activeFiveYearPlan: null })
  },

  addHeroOfSovietUnion: (hero) => {
    set((state) => ({
      heroesOfSovietUnion: [...state.heroesOfSovietUnion, hero],
    }))
  },

  removeHeroOfSovietUnion: (playerId) => {
    set((state) => ({
      heroesOfSovietUnion: state.heroesOfSovietUnion.filter(
        (h) => h.playerId !== playerId
      ),
    }))
  },

  greatHeroOfSovietUnion: (playerId) => {
    const state = get()
    const hero: HeroOfSovietUnion = {
      playerId,
      grantedAtRound: state.currentRound,
      expiresAtRound: state.currentRound + 3,
    }
    set((state) => ({
      heroesOfSovietUnion: [...state.heroesOfSovietUnion, hero],
    }))
  },

  expireHeroes: () => {
    const state = get()
    const currentRound = state.currentRound
    set({
      heroesOfSovietUnion: state.heroesOfSovietUnion.filter(
        (h) => h.expiresAtRound > currentRound
      ),
    })
  },

  isHeroOfSovietUnion: (playerId) => {
    const state = get()
    const currentRound = state.currentRound
    return state.heroesOfSovietUnion.some(
      (h) => h.playerId === playerId && h.expiresAtRound > currentRound
    )
  },
})
