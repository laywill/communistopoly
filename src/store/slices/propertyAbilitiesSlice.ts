// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { StateCreator } from 'zustand'
import type { GameStore } from '../types/storeTypes'
import { getRandomQuestionByDifficulty, getRandomDifficulty } from '../../data/communistTestQuestions'

// This slice has no dedicated state properties — all ability-used flags are stored
// on the Player object (e.g. hasUsedSiberianCampsGulag, kgbTestPreviewsUsedThisRound).
// It is therefore a pure actions-only slice.

/** Space IDs for the Siberian Camps property group */
const SPACE_ID_CAMP_VORKUTA = 1
const SPACE_ID_CAMP_KOLYMA = 3

/** Space ID for KGB Headquarters */
const SPACE_ID_KGB_HEADQUARTERS = 23

/** Space IDs for the Government Ministries property group */
const SPACE_IDS_MINISTRIES = [16, 18, 19] as const

/** Space IDs for the State Media property group */
const SPACE_IDS_STATE_MEDIA = [26, 27, 29] as const

// Slice actions interface
export interface PropertyAbilitiesSliceActions {
  // Siberian Camps group ability: send a target player to the Gulag.
  // Requires the custodian to control both Siberian Camps (spaces 1 and 3).
  // Requires Stalin's approval via a pending action modal.
  siberianCampsGulag: (custodianId: string, targetPlayerId: string) => void

  // Resolves Stalin's approval or denial for the Siberian Camps ability.
  approveHammerAbility: (custodianId: string, targetPlayerId: string, approved: boolean) => void

  // KGB Headquarters group ability: preview the next Communist Test question.
  // Requires the custodian to control KGB Headquarters (space 23).
  // Limited to once per round.
  kgbPreviewTest: (custodianId: string) => void

  // Ministry of Truth group ability: rewrite a game rule.
  // Requires the custodian to control all three Ministry properties (16, 18, 19).
  // Requires Stalin's approval via a pending action modal.
  ministryTruthRewrite: (custodianId: string, newRule: string) => void

  // Resolves Stalin's approval or veto for the Ministry of Truth ability.
  approveMinistryTruthRewrite: (custodianId: string, newRule: string, approved: boolean) => void

  // Pravda Press group ability: force a re-vote on a decision.
  // Requires the custodian to control all three State Media properties (26, 27, 29).
  pravdaPressRevote: (custodianId: string, decision: string) => void
}

// Combined slice type (actions only — no store-level state)
export type PropertyAbilitiesSlice = PropertyAbilitiesSliceActions

// Slice creator with full typing
export const createPropertyAbilitiesSlice: StateCreator<
  GameStore, // Full store type for cross-slice access via get()
  [],        // Middleware tuple (empty)
  [],        // Middleware tuple (empty)
  PropertyAbilitiesSlice // This slice's return type
> = (set, get) => ({
  // Siberian Camps ability: check ownership of both camps and request Stalin's approval
  // via a pending action modal. If the custodian already used the ability this game,
  // the request is silently ignored.
  siberianCampsGulag: (custodianId, targetPlayerId) => {
    const state = get()
    const custodian = state.players.find(p => p.id === custodianId)
    const target = state.players.find(p => p.id === targetPlayerId)

    if ((custodian == null) || (target == null)) return
    if (custodian.hasUsedSiberianCampsGulag) return

    // Check if custodian owns both Siberian Camps (spaces 1 and 3)
    const ownsCampVorkuta = state.properties.find(p => p.spaceId === SPACE_ID_CAMP_VORKUTA && p.custodianId === custodianId)
    const ownsCampKolyma = state.properties.find(p => p.spaceId === SPACE_ID_CAMP_KOLYMA && p.custodianId === custodianId)

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

  // Resolves the Siberian Camps pending approval. If approved, the target is sent to the
  // Gulag and the custodian's ability flag is set. The pending action is cleared regardless.
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

  // KGB Headquarters ability: draw a random Communist Test question and display it to the
  // custodian as a preview. Limited to once per round per player. The counter resets when
  // the round ends (handled externally via updatePlayer).
  kgbPreviewTest: (custodianId) => {
    const state = get()
    const custodian = state.players.find(p => p.id === custodianId)

    if (custodian == null) return

    // Check if custodian owns KGB Headquarters (space 23)
    const ownsKGB = state.properties.find(p => p.spaceId === SPACE_ID_KGB_HEADQUARTERS && p.custodianId === custodianId)

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

    // Show the question to the custodian via a pending action modal
    set({
      pendingAction: {
        type: 'kgb-test-preview',
        data: {
          difficulty,
          question: question.question,
          answer: question.answer
        }
      }
    })

    get().updatePlayer(custodianId, {
      kgbTestPreviewsUsedThisRound: custodian.kgbTestPreviewsUsedThisRound + 1
    })

    get().addLogEntry({
      type: 'system',
      message: `${custodian.name} used KGB Headquarters to preview a Communist Test question`,
      playerId: custodianId
    })
  },

  // Ministry of Truth ability: propose a rule rewrite for Stalin's approval via a pending
  // action modal. If the custodian has already used the ability this game, the request is
  // silently ignored. Requires all three Ministry properties (spaces 16, 18, 19).
  ministryTruthRewrite: (custodianId, newRule) => {
    const state = get()
    const custodian = state.players.find(p => p.id === custodianId)

    if (custodian == null) return
    if (custodian.hasUsedMinistryTruthRewrite) return

    // Check if custodian owns all three Ministry properties (16, 18, 19)
    const ownsMinistries = SPACE_IDS_MINISTRIES.every(spaceId =>
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

  // Resolves the Ministry of Truth pending approval. If approved, the custodian's flag is
  // set and the rule rewrite is logged. If vetoed, a denial log entry is added. The pending
  // action is cleared regardless.
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

  // Pravda Press ability: force a public re-vote on a decision. Requires all three State
  // Media properties (spaces 26, 27, 29). Can only be used once per game. The decision
  // is announced via an alert to all players.
  pravdaPressRevote: (custodianId, decision) => {
    const state = get()
    const custodian = state.players.find(p => p.id === custodianId)

    if (custodian == null) return
    if (custodian.hasUsedPravdaPressRevote) return

    // Check if custodian owns all three State Media properties (26, 27, 29)
    const ownsMedia = SPACE_IDS_STATE_MEDIA.every(spaceId =>
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

    set({
      pendingAction: {
        type: 'pravda-press-revote',
        data: {
          custodianName: custodian.name,
          decision
        }
      }
    })
  }
})
