// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import type { StoreApi } from 'zustand'
import type { DirectiveEffect } from '../../data/partyDirectiveCards'
import type { GameStore } from '../types/storeTypes'
import type { Player } from '../../types/game'
import { calculateRailwayFee } from '../../utils/propertyUtils'
import { RAILWAY_SPACE_IDS, BREAD_LOAF_WEALTH_CAP } from '../constants'

/**
 * Handles the 'advanceToNearestRailway' custom directive: moves the player to
 * the nearest railway ahead (wrapping around the board), pays STOY passing
 * bonus if applicable, and either charges quota or sets a pending purchase.
 *
 * Returns `true` if the caller should exit early (a pending action has been
 * set and is awaiting player input), or `false` if normal post-turn cleanup
 * should proceed.
 */
function handleAdvanceToNearestRailway(player: Player, playerId: string, get: () => GameStore): boolean {
  const state = get()
  const railwayPositions = [...RAILWAY_SPACE_IDS]
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

  // Only give STOY bonus if we actually wrapped around
  if (oldPosition > nearestRailway) {
    get().handleStoyPassing(playerId)
  }

  // Check railway property ownership
  const railwayProperty = state.properties.find(p => p.spaceId === nearestRailway)

  if (railwayProperty != null) {
    if (railwayProperty.custodianId === null) {
      // Railway is unowned - set pending action for purchase
      get().setPendingAction({
        type: 'property-purchase',
        data: { spaceId: nearestRailway, playerId }
      })
      get().setTurnPhase('resolving')
      return true // Exit early; awaiting player decision
    } else if (railwayProperty.custodianId !== playerId && !railwayProperty.mortgaged) {
      // Railway is owned by another player - charge fee
      const fee = calculateRailwayFee(railwayProperty.custodianId, state.properties)
      get().payQuota(playerId, railwayProperty.custodianId, fee)
    }
    // If owned by current player or mortgaged, no fee charged
  }

  return false
}

/**
 * Handles the 'triggerAnonymousTribunal' custom directive: raises a tribunal
 * against the player with Stalin as the (anonymous) accuser.
 *
 * Returns `true` if the caller should exit early (tribunal pending action
 * set, awaiting resolution), or `false` if no Stalin player was found and
 * normal post-turn cleanup should proceed.
 */
function handleTriggerAnonymousTribunal(playerId: string, get: () => GameStore): boolean {
  const state = get()
  const stalin = state.players.find(p => p.isStalin)
  if (stalin == null) return false

  get().setPendingAction({
    type: 'tribunal',
    data: { targetId: playerId, accuserId: stalin.id, isAnonymous: true }
  })
  get().setTurnPhase('resolving')
  return true // Exit early; awaiting tribunal resolution
}

/**
 * Applies a Bread Loaf piece's wealth-cap rule to a proposed rubles value,
 * mirroring updatePlayer's enforcement: any excess above the cap is donated
 * to the State and logged. Returns the (possibly capped) rubles value that
 * should actually be stored for `target`.
 */
function capBreadLoafRubles(target: Player, proposedRubles: number, get: () => GameStore): number {
  if (target.piece === 'breadLoaf' && proposedRubles > BREAD_LOAF_WEALTH_CAP) {
    const excess = proposedRubles - BREAD_LOAF_WEALTH_CAP
    get().adjustTreasury(excess)
    get().addLogEntry({
      type: 'payment',
      message: `${target.name}'s Bread Loaf forces donation of ₽${String(excess)} to the State (max ${String(BREAD_LOAF_WEALTH_CAP)}₽)`,
      playerId: target.id
    })
    return BREAD_LOAF_WEALTH_CAP
  }
  return proposedRubles
}

/**
 * Applies the effect of a Party Directive card for the given player.
 *
 * Early-return cases (move, moveRelative, unowned railway, tribunal) handle
 * their own turn-phase transition. All other cases fall through to the
 * default post-turn cleanup at the end of the function.
 */
export function applyDirectiveEffectHandler(
  effect: DirectiveEffect,
  playerId: string,
  get: () => GameStore,
  set: StoreApi<GameStore>['setState'],
): void {
  const state = get()
  const player = state.players.find(p => p.id === playerId)
  if (player == null) return

  switch (effect.type) {
    case 'move':
      if (effect.destination !== undefined) {
        const oldPosition = player.position
        get().updatePlayer(playerId, { position: effect.destination })
        // Check if passed STOY (wrapped around the board).
        if (oldPosition > effect.destination && effect.destination === 0) {
          // Moving backwards to STOY (wrapping around) - pay travel tax
          get().handleStoyPassing(playerId)
        } else if (oldPosition < effect.destination && effect.destination !== 0) {
          // Moving forward past STOY (not landing on it)
          get().handleStoyPassing(playerId)
        }
        // Resolve the space the player landed on
        get().setTurnPhase('resolving')
        get().resolveCurrentSpace(playerId)
        return // Exit early; resolveCurrentSpace handles turn phase
      }
      break

    case 'moveRelative':
      if (effect.spaces !== undefined) {
        get().movePlayer(playerId, effect.spaces)
        // Resolve the space the player landed on
        get().setTurnPhase('resolving')
        get().resolveCurrentSpace(playerId)
        return // Exit early; resolveCurrentSpace handles turn phase
      }
      break

    case 'money':
      if (effect.amount !== undefined) {
        get().updatePlayer(playerId, { rubles: player.rubles + effect.amount })
        if (effect.amount > 0) {
          get().adjustTreasury(-effect.amount)
        } else {
          get().adjustTreasury(Math.abs(effect.amount))
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
      if (effect.direction === 'up') {
        get().promotePlayer(playerId)
      } else {
        get().demotePlayer(playerId)
      }
      break

    case 'collectFromAll':
      if (effect.amount !== undefined) {
        const collectAmount = effect.amount
        state.players.forEach(p => {
          if (!p.isStalin && p.id !== playerId && !p.isEliminated) {
            const payment = Math.min(collectAmount, p.rubles)
            // Commit the payer's and recipient's rubles changes in a single
            // set() call instead of two sequential updatePlayer calls, to
            // halve the render count for this payment.
            set((current) => {
              const payer = current.players.find(cp => cp.id === p.id)
              const recipient = current.players.find(cp => cp.id === playerId)
              if (payer == null || recipient == null) return {}

              const payerRubles = capBreadLoafRubles(payer, payer.rubles - payment, get)
              const recipientRubles = capBreadLoafRubles(recipient, recipient.rubles + payment, get)

              return {
                players: current.players.map(cp => {
                  if (cp.id === payer.id) return { ...cp, rubles: payerRubles }
                  if (cp.id === recipient.id) return { ...cp, rubles: recipientRubles }
                  return cp
                })
              }
            })
          }
        })
      }
      break

    case 'payToAll':
      if (effect.amount !== undefined) {
        const payAmount = effect.amount
        state.players.forEach(p => {
          if (!p.isStalin && p.id !== playerId && !p.isEliminated) {
            const currentBalance = get().players.find(cp => cp.id === playerId)?.rubles ?? 0
            const payment = Math.min(payAmount, currentBalance)
            // Commit the payer's and recipient's rubles changes in a single
            // set() call instead of two sequential updatePlayer calls, to
            // halve the render count for this payment.
            set((current) => {
              const payer = current.players.find(cp => cp.id === playerId)
              const recipient = current.players.find(cp => cp.id === p.id)
              if (payer == null || recipient == null) return {}

              const payerRubles = capBreadLoafRubles(payer, payer.rubles - payment, get)
              const recipientRubles = capBreadLoafRubles(recipient, recipient.rubles + payment, get)

              return {
                players: current.players.map(cp => {
                  if (cp.id === payer.id) return { ...cp, rubles: payerRubles }
                  if (cp.id === recipient.id) return { ...cp, rubles: recipientRubles }
                  return cp
                })
              }
            })
          }
        })
      }
      break

    case 'propertyTax': {
      const properties = state.properties.filter(p => p.custodianId === playerId)
      let totalTax = 0
      if (effect.perProperty) {
        totalTax += properties.length * effect.perProperty
      }
      if (effect.perImprovement) {
        const totalImprovements = properties.reduce((sum, p) => sum + p.collectivizationLevel, 0)
        totalTax += totalImprovements * effect.perImprovement
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
      switch (effect.handler) {
        case 'advanceToNearestRailway':
          if (handleAdvanceToNearestRailway(player, playerId, get)) {
            return // Exit early; awaiting player decision
          }
          break

        case 'triggerAnonymousTribunal':
          if (handleTriggerAnonymousTribunal(playerId, get)) {
            return // Exit early; awaiting tribunal resolution
          }
          break

        case undefined:
          // Card declared a 'custom' effect without a handler name
          get().addLogEntry({
            type: 'system',
            message: 'Custom effect: unknown - requires special handling',
            playerId
          })
          break

        default: {
          // Exhaustiveness check: fails to compile if a new CustomHandlerType
          // member is added without a corresponding case above.
          const unhandled: never = effect.handler
          throw new Error(`Unhandled custom directive handler: ${String(unhandled)}`)
        }
      }
      break
  }

  // Default completion: clear pending action and advance to post-turn
  get().setPendingAction(null)
  get().setTurnPhase('post-turn')
}
