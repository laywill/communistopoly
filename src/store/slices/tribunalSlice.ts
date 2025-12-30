// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { StateCreator } from 'zustand'
import type { PartyRank, Player, LogEntry } from '../../types/game'

// ============================================
// TYPES
// ============================================

// Dependencies this slice needs from the store
interface TribunalDependencies {
  players: Player[]
  currentTribunal: Tribunal | null
  addLogEntry?: (entry: Omit<LogEntry, 'id' | 'timestamp'>) => void
  canDenounce: (accuserId: string, accusedId: string) => { allowed: boolean; reason?: string }
  startTribunal: (config: { accuserId: string; accusedId: string; crime: string; isGulagInform?: boolean }) => void
  getWitnessRequirement: (accusedRank: PartyRank) => number
}

export type TribunalVerdict = 'guilty' | 'innocent' | 'bothGuilty' | 'insufficientEvidence'

export interface Tribunal {
  accuserId: string
  accusedId: string
  crime: string
  witnesses: {
    prosecution: string[]
    defense: string[]
  }
  accusationStatement?: string
  defenseStatement?: string
  phase: 'accusation' | 'defense' | 'witnesses' | 'verdict'
  isGulagInform?: boolean
}

// ============================================
// STATE
// ============================================

export interface TribunalSliceState {
  currentTribunal: Tribunal | null
}

export const initialTribunalState: TribunalSliceState = {
  currentTribunal: null,
}

// ============================================
// ACTIONS
// ============================================

export interface TribunalSliceActions {
  // Queries
  canDenounce: (accuserId: string, accusedId: string) => { allowed: boolean; reason?: string }
  getWitnessRequirement: (accusedRank: PartyRank) => number
  hasEnoughWitnesses: () => boolean
  isPlayerInvolvedInTribunal: (playerId: string) => boolean

  // Pure mutations
  startTribunal: (config: {
    accuserId: string
    accusedId: string
    crime: string
    isGulagInform?: boolean
  }) => void
  submitAccusation: (statement: string) => void
  submitDefense: (statement: string) => void
  addWitness: (playerId: string, side: 'prosecution' | 'defense') => boolean
  advancePhase: () => void
  cancelTribunal: () => void
  clearTribunal: () => void
  markUnderSuspicion: (playerId: string) => void
  incrementDenouncementCount: (playerId: string) => void
}

export type TribunalSlice = TribunalSliceState & TribunalSliceActions

// ============================================
// HELPERS
// ============================================

const RANK_ORDER: PartyRank[] = ['proletariat', 'partyMember', 'commissar', 'innerCircle']

function getRankIndex(rank: PartyRank): number {
  return RANK_ORDER.indexOf(rank)
}

// ============================================
// SLICE CREATOR
// ============================================

// ARCHITECTURE: Pure Slice
// This slice now contains ONLY:
//   - State management (currentTribunal)
//   - Pure mutations (state changes only)
//   - Queries (read-only checks)
// Business logic moved to TribunalService (see src/services/TribunalService.ts)

export const createTribunalSlice: StateCreator<
  TribunalDependencies & TribunalSlice,
  [],
  [],
  TribunalSlice
> = (set, get) => ({
  ...initialTribunalState,

  canDenounce: (accuserId, accusedId) => {
    const state = get()
    const accuser = state.players.find((p) => p.id === accuserId)
    const accused = state.players.find((p) => p.id === accusedId)

    if (!accuser || !accused) {
      return { allowed: false, reason: 'Invalid player' }
    }

    // Can't denounce yourself
    if (accuserId === accusedId) {
      return { allowed: false, reason: 'Cannot denounce yourself' }
    }

    // Can't denounce Stalin
    if (accused.isStalin) {
      return { allowed: false, reason: 'Cannot denounce Comrade Stalin!' }
    }

    // Can't denounce someone already in Gulag
    if (accused.inGulag) {
      return { allowed: false, reason: 'Cannot denounce someone already in the Gulag' }
    }

    // Check denouncement limit per round
    const limit = accuser.rank === 'commissar' || accuser.rank === 'innerCircle' ? 2 : 1
    const denouncementsMade = accuser.denouncementsMadeThisRound || 0
    if (denouncementsMade >= limit) {
      return { allowed: false, reason: 'Denouncement limit reached for this round' }
    }

    // Lenin Statue: Cannot be denounced by lower ranks
    if (accused.piece === 'leninStatue') {
      const accuserRankIndex = getRankIndex(accuser.rank)
      const accusedRankIndex = getRankIndex(accused.rank)
      if (accuserRankIndex < accusedRankIndex) {
        return { allowed: false, reason: 'Lenin Statue cannot be denounced by lower ranks' }
      }
    }

    // Already in a tribunal
    if (state.currentTribunal) {
      return { allowed: false, reason: 'A tribunal is already in progress' }
    }

    return { allowed: true }
  },

  incrementDenouncementCount: (playerId) => {
    set((s) => ({
      players: s.players.map((p) =>
        p.id === playerId
          ? { ...p, denouncementsMadeThisRound: (p.denouncementsMadeThisRound || 0) + 1 }
          : p
      ),
    }))
  },

  startTribunal: (config) => {
    const state = get()
    const accuser = state.players.find((p) => p.id === config.accuserId)
    const accused = state.players.find((p) => p.id === config.accusedId)

    set({
      currentTribunal: {
        ...config,
        witnesses: { prosecution: [], defense: [] },
        phase: 'accusation',
      },
    })

    const addLogEntry = (get()).addLogEntry
    addLogEntry?.({
      type: 'tribunal',
      message: `⚖️ TRIBUNAL: ${accuser?.name ?? 'Accuser'} denounces ${accused?.name ?? 'Accused'} for "${config.crime}"!`
    })
  },

  submitAccusation: (statement) => {
    set((s) => ({
      currentTribunal: s.currentTribunal
        ? { ...s.currentTribunal, accusationStatement: statement, phase: 'defense' as const }
        : null,
    }))
  },

  submitDefense: (statement) => {
    set((s) => ({
      currentTribunal: s.currentTribunal
        ? { ...s.currentTribunal, defenseStatement: statement, phase: 'witnesses' as const }
        : null,
    }))
  },

  addWitness: (playerId, side) => {
    const state = get()
    const tribunal = state.currentTribunal
    if (!tribunal) return false

    // Can't witness if you're the accuser or accused
    if (playerId === tribunal.accuserId || playerId === tribunal.accusedId) {
      return false
    }

    // Can't witness for both sides
    const otherSide = side === 'prosecution' ? 'defense' : 'prosecution'
    if (tribunal.witnesses[otherSide].includes(playerId)) {
      return false
    }

    // Already witnessing this side
    if (tribunal.witnesses[side].includes(playerId)) {
      return false
    }

    set((s) => ({
      currentTribunal: s.currentTribunal
        ? {
            ...s.currentTribunal,
            witnesses: {
              ...s.currentTribunal.witnesses,
              [side]: [...s.currentTribunal.witnesses[side], playerId],
            },
          }
        : null,
    }))

    const witness = state.players.find((p) => p.id === playerId)
    const addLogEntry = (get()).addLogEntry
    addLogEntry?.({
      type: 'tribunal',
      message: `${witness?.name ?? 'Someone'} stands as witness for the ${side}`
    })
    return true
  },

  advancePhase: () => {
    const phases: Tribunal['phase'][] = ['accusation', 'defense', 'witnesses', 'verdict']

    set((s) => {
      if (!s.currentTribunal) return s
      const currentIndex = phases.indexOf(s.currentTribunal.phase)
      if (currentIndex >= phases.length - 1) return s // Already at last phase
      const nextPhase = phases[currentIndex + 1]

      return {
        currentTribunal: { ...s.currentTribunal, phase: nextPhase },
      }
    })
  },

  cancelTribunal: () => {
    set({ currentTribunal: null })
    const addLogEntry = (get()).addLogEntry
    addLogEntry?.({
      type: 'tribunal',
      message: 'Tribunal cancelled'
    })
  },

  clearTribunal: () => {
    set({ currentTribunal: null })
  },

  markUnderSuspicion: (playerId) => {
    set((s) => ({
      players: s.players.map((p) =>
        p.id === playerId ? { ...p, underSuspicion: true } : p
      ),
    }))
  },

  getWitnessRequirement: (accusedRank) => {
    switch (accusedRank) {
      case 'commissar':
        return 2 // Requires 2 witnesses
      case 'innerCircle':
        return -1 // Special: requires unanimous (all eligible players)
      default:
        return 0 // No witnesses required
    }
  },

  hasEnoughWitnesses: () => {
    const state = get()
    const tribunal = state.currentTribunal
    if (!tribunal) return false

    const accused = state.players.find((p) => p.id === tribunal.accusedId)
    if (!accused) return false

    // If accused is under suspicion, no witnesses needed
    if (accused.underSuspicion) return true

    const requirement = state.getWitnessRequirement(accused.rank)

    if (requirement === 0) return true

    if (requirement === -1) {
      // Unanimous: all eligible players must be prosecution witnesses
      const eligiblePlayers = state.players.filter(
        (p) =>
          !p.inGulag &&
          !p.isStalin &&
          !p.isEliminated &&
          p.id !== tribunal.accuserId &&
          p.id !== tribunal.accusedId
      )
      return tribunal.witnesses.prosecution.length >= eligiblePlayers.length
    }

    return tribunal.witnesses.prosecution.length >= requirement
  },

  isPlayerInvolvedInTribunal: (playerId) => {
    const tribunal = get().currentTribunal
    if (!tribunal) return false
    return (
      tribunal.accuserId === playerId ||
      tribunal.accusedId === playerId ||
      tribunal.witnesses.prosecution.includes(playerId) ||
      tribunal.witnesses.defense.includes(playerId)
    )
  },

})
