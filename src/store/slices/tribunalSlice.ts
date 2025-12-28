import { StateCreator } from 'zustand'
import type { PartyRank } from '../../types/game'

// ============================================
// TYPES
// ============================================

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
  // Denouncement
  canDenounce: (accuserId: string, accusedId: string) => { allowed: boolean; reason?: string }
  denouncePlayer: (accuserId: string, accusedId: string, crime: string) => boolean

  // Tribunal flow
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

  // Verdict
  renderVerdict: (verdict: TribunalVerdict) => void

  // Queries
  getWitnessRequirement: (accusedRank: PartyRank) => number
  hasEnoughWitnesses: () => boolean
  isPlayerInvolvedInTribunal: (playerId: string) => boolean
}

export type TribunalSlice = TribunalSliceState & TribunalSliceActions

// ============================================
// HELPERS
// ============================================

const RANK_ORDER: PartyRank[] = ['proletariat', 'partyMember', 'commissar', 'innerCircle']

function getRankIndex(rank: PartyRank): number {
  return RANK_ORDER.indexOf(rank)
}

function demoteRank(rank: PartyRank): PartyRank {
  const index = getRankIndex(rank)
  return RANK_ORDER[Math.max(0, index - 1)]
}

// ============================================
// SLICE CREATOR
// ============================================

export const createTribunalSlice: StateCreator<
  any, // Will be composed with full GameStore type
  [],
  [],
  TribunalSlice
> = (set, get) => ({
  ...initialTribunalState,

  canDenounce: (accuserId, accusedId) => {
    const state = get()
    const accuser = state.players.find((p: any) => p.id === accuserId)
    const accused = state.players.find((p: any) => p.id === accusedId)

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
    const denouncementsMade = accuser.denouncementsMadeThisRound ?? 0
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

  denouncePlayer: (accuserId, accusedId, crime) => {
    const state = get()

    // Check eligibility using the current implementation
    const canDo = get().canDenounce(accuserId, accusedId)
    if (!canDo.allowed) {
      const addLogEntry = (get()).addLogEntry
      addLogEntry?.({
        type: 'system',
        message: `Denouncement blocked: ${canDo.reason}`
      })
      return false
    }

    const accuser = state.players.find((p: any) => p.id === accuserId)
    const accused = state.players.find((p: any) => p.id === accusedId)

    // Special case: Trying to denounce Stalin (though canDenounce should prevent this)
    if (accused?.isStalin) {
      // Send the accuser to Gulag for this counter-revolutionary act
      const sendToGulag = (get()).sendToGulag
      const addLogEntry = (get()).addLogEntry
      sendToGulag?.(accuserId, 'stalinDecree', 'Attempted to denounce Comrade Stalin')
      addLogEntry?.({
        type: 'tribunal',
        message: `${accuser?.name} foolishly attempted to denounce Stalin! Sent to Gulag.`
      })
      return false
    }

    // Increment denouncement count
    set((s: any) => ({
      players: s.players.map((p: any) =>
        p.id === accuserId
          ? { ...p, denouncementsMadeThisRound: (p.denouncementsMadeThisRound ?? 0) + 1 }
          : p
      ),
    }))

    // Start tribunal - call it through get() to ensure it's the composed method
    get().startTribunal({ accuserId, accusedId, crime })
    return true
  },

  startTribunal: (config) => {
    const state = get()
    const accuser = state.players.find((p: any) => p.id === config.accuserId)
    const accused = state.players.find((p: any) => p.id === config.accusedId)

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
      message: `⚖️ TRIBUNAL: ${accuser?.name} denounces ${accused?.name} for "${config.crime}"!`
    })
  },

  submitAccusation: (statement) => {
    set((s: any) => ({
      currentTribunal: s.currentTribunal
        ? { ...s.currentTribunal, accusationStatement: statement, phase: 'defense' }
        : null,
    }))
  },

  submitDefense: (statement) => {
    set((s: any) => ({
      currentTribunal: s.currentTribunal
        ? { ...s.currentTribunal, defenseStatement: statement, phase: 'witnesses' }
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

    set((s: any) => ({
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

    const witness = state.players.find((p: any) => p.id === playerId)
    const addLogEntry = (get()).addLogEntry
    addLogEntry?.({
      type: 'tribunal',
      message: `${witness?.name} stands as witness for the ${side}`
    })
    return true
  },

  advancePhase: () => {
    const phases: Tribunal['phase'][] = ['accusation', 'defense', 'witnesses', 'verdict']

    set((s: any) => {
      if (!s.currentTribunal) return s
      const currentIndex = phases.indexOf(s.currentTribunal.phase)
      const nextPhase = phases[currentIndex + 1]
      if (!nextPhase) return s

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

    const accused = state.players.find((p: any) => p.id === tribunal.accusedId)
    if (!accused) return false

    // If accused is under suspicion, no witnesses needed
    if (accused.underSuspicion) return true

    const requirement = state.getWitnessRequirement(accused.rank)

    if (requirement === 0) return true

    if (requirement === -1) {
      // Unanimous: all eligible players must be prosecution witnesses
      const eligiblePlayers = state.players.filter(
        (p: any) =>
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

  renderVerdict: (verdict) => {
    const state = get()
    const tribunal = state.currentTribunal
    if (!tribunal) return

    const accuser = state.players.find((p: any) => p.id === tribunal.accuserId)
    const accused = state.players.find((p: any) => p.id === tribunal.accusedId)

    const addLogEntry = (get()).addLogEntry
    const sendToGulag = (get()).sendToGulag
    const updatePlayer = (get()).updatePlayer
    const releaseFromGulag = (get()).releaseFromGulag

    addLogEntry?.({
      type: 'tribunal',
      message: `⚖️ VERDICT: ${verdict.toUpperCase()}`
    })

    switch (verdict) {
      case 'guilty': {
        // Accused → Gulag
        sendToGulag?.(tribunal.accusedId, 'denouncementGuilty', tribunal.crime)

        // Accuser gets 100₽ informant bonus
        if (accuser) {
          updatePlayer?.(tribunal.accuserId, { rubles: accuser.rubles + 100 })
          addLogEntry?.({
            type: 'tribunal',
            message: `${accuser.name} receives 100₽ informant bonus`
          })
        }

        // If this was a Gulag inform, release the informer
        if (tribunal.isGulagInform) {
          releaseFromGulag?.(tribunal.accuserId, 'successful informing')
        }
        break
      }

      case 'innocent': {
        // Accuser loses rank for wasting Party's time
        const newRank = demoteRank(accuser?.rank ?? 'proletariat')
        updatePlayer?.(tribunal.accuserId, { rank: newRank })
        addLogEntry?.({
          type: 'tribunal',
          message: `${accuser?.name} demoted to ${newRank} for wasting the Party's time!`
        })

        // If Gulag inform, add 2 turns to informer's sentence
        if (tribunal.isGulagInform && accuser) {
          const currentTurns = accuser.gulagTurns ?? 0
          updatePlayer?.(tribunal.accuserId, { gulagTurns: currentTurns + 2 })
          addLogEntry?.({
            type: 'tribunal',
            message: `${accuser.name}'s Gulag sentence extended by 2 turns for false accusation`
          })
        }
        break
      }

      case 'bothGuilty': {
        // Both go to Gulag
        sendToGulag?.(tribunal.accuserId, 'denouncementGuilty', 'Both found guilty')
        sendToGulag?.(tribunal.accusedId, 'denouncementGuilty', tribunal.crime)
        break
      }

      case 'insufficientEvidence': {
        // No punishment, but accused is now "under suspicion"
        set((s: any) => ({
          players: s.players.map((p: any) =>
            p.id === tribunal.accusedId ? { ...p, underSuspicion: true } : p
          ),
        }))
        addLogEntry?.({
          type: 'tribunal',
          message: `${accused?.name} is now under suspicion (next denouncement needs no witnesses)`
        })
        break
      }
    }

    // Clear the tribunal
    set({ currentTribunal: null })
  },
})
