// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import type { GulagReason } from '../../types/game'

export function getGulagReasonText (reason: GulagReason, justification?: string): string {
  const reasonTexts: Record<GulagReason, string> = {
    enemyOfState: 'Landed on Enemy of the State',
    threeDoubles: 'Rolled three consecutive doubles - counter-revolutionary dice behavior',
    denouncementGuilty: 'Found guilty in tribunal',
    debtDefault: 'Failed to pay debt within one round',
    pilferingCaught: 'Caught stealing at STOY checkpoint',
    stalinDecree: justification ?? 'Sent by Stalin',
    railwayCapture: 'Caught attempting to flee the motherland via railway',
    campLabour: 'Sent for forced labour by Siberian Camp custodian',
    voucherConsequence: 'Voucher consequence - vouchee committed an offence'
  }

  return reasonTexts[reason]
}

export function getRequiredDoublesForEscape (turnsInGulag: number): number[] {
  switch (turnsInGulag) {
    case 1:
      return [6]
    case 2:
      return [5, 6]
    case 3:
      return [4, 5, 6]
    case 4:
      return [3, 4, 5, 6]
    default:
      return [1, 2, 3, 4, 5, 6] // Any doubles after turn 5
  }
}

export function shouldTriggerVoucherConsequence (reason: GulagReason): boolean {
  // These reasons trigger voucher consequences
  const triggeringReasons: GulagReason[] = [
    'enemyOfState',
    'threeDoubles',
    'denouncementGuilty',
    'pilferingCaught',
    'stalinDecree',
    'railwayCapture',
    'campLabour'
  ]

  return triggeringReasons.includes(reason)
}
