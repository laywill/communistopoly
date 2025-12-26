// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

export type DirectiveEffectType =
  | 'move' // Move to specific position
  | 'moveRelative' // Move forward/backward N spaces
  | 'money' // Gain or lose rubles
  | 'gulag' // Go directly to Gulag
  | 'freeFromGulag' // Get out of Gulag free card
  | 'rankChange' // Change rank up or down
  | 'collectFromAll' // Collect from all players
  | 'payToAll' // Pay to all players
  | 'propertyTax' // Pay based on properties and improvements
  | 'custom' // Custom handler (for special cases)

export interface DirectiveEffect {
  type: DirectiveEffectType
  // Move effects
  destination?: number // Board position (0-39)
  spaces?: number // Relative movement (positive = forward, negative = backward)

  // Money effects
  amount?: number // Amount to gain (positive) or lose (negative)

  // Rank effects
  direction?: 'up' | 'down'

  // Property tax effects
  perProperty?: number // Amount per property owned
  perImprovement?: number // Amount per collectivization level

  // Custom handler
  handler?: string // Handler function name
}

export interface DirectiveCard {
  id: string
  title: string
  description: string
  effect: DirectiveEffect
  flavourText?: string
}

export const PARTY_DIRECTIVE_CARDS: DirectiveCard[] = [
  {
    id: 'pd-1',
    title: 'ADVANCE TO STOY',
    description: 'Report to checkpoint immediately. Pay travel tax if you pass.',
    effect: { type: 'move', destination: 0 }
  },
  {
    id: 'pd-2',
    title: 'LABOUR REASSIGNMENT',
    description: 'You are needed at Camp Vorkuta. Go directly, do not pass STOY.',
    effect: { type: 'move', destination: 1 }
  },
  {
    id: 'pd-3',
    title: 'PARTY BONUS',
    description: 'Your dedication has been noted. Collect ₽200 from the State.',
    effect: { type: 'money', amount: 200 }
  },
  {
    id: 'pd-4',
    title: 'COUNTER-REVOLUTIONARY ACTIVITY DETECTED',
    description: 'Go directly to Gulag. Do not pass STOY.',
    effect: { type: 'gulag' }
  },
  {
    id: 'pd-5',
    title: 'REHABILITATION COMPLETE',
    description: 'Your re-education is successful. Get out of Gulag free.',
    effect: { type: 'freeFromGulag' },
    flavourText: 'Keep this card until needed or traded'
  },
  {
    id: 'pd-6',
    title: 'PRODUCTION QUOTA MET',
    description: 'Each comrade must contribute ₽50 to your excellence.',
    effect: { type: 'collectFromAll', amount: 50 }
  },
  {
    id: 'pd-7',
    title: 'VOLUNTARY DONATION',
    description: 'The State requires your support. Pay ₽150.',
    effect: { type: 'money', amount: -150 }
  },
  {
    id: 'pd-8',
    title: 'ADVANCE TO MINISTRY OF LOVE',
    description: 'You are required for questioning.',
    effect: { type: 'move', destination: 19 }
  },
  {
    id: 'pd-9',
    title: 'GO BACK THREE SPACES',
    description: 'Administrative error. Return whence you came.',
    effect: { type: 'moveRelative', spaces: -3 }
  },
  {
    id: 'pd-10',
    title: 'PROPERTY TAX',
    description: 'Pay ₽25 per property, ₽100 per improvement.',
    effect: { type: 'propertyTax', perProperty: 25, perImprovement: 100 }
  },
  {
    id: 'pd-11',
    title: 'DENOUNCED!',
    description: 'An anonymous comrade has reported you. Tribunal immediately.',
    effect: { type: 'custom', handler: 'triggerAnonymousTribunal' },
    flavourText: 'Stalin will preside over the tribunal'
  },
  {
    id: 'pd-12',
    title: 'PARTY RECOGNITION',
    description: 'Your loyalty is exemplary. Advance one rank.',
    effect: { type: 'rankChange', direction: 'up' }
  },
  {
    id: 'pd-13',
    title: 'ADVANCE TO NEAREST RAILWAY',
    description: 'Take the train. If unowned, you may purchase from the State. If owned, pay quota.',
    effect: { type: 'custom', handler: 'advanceToNearestRailway' }
  },
  {
    id: 'pd-14',
    title: 'BANK ERROR IN YOUR FAVOUR',
    description: 'The State accounting office has made a mistake. Collect ₽300.',
    effect: { type: 'money', amount: 300 }
  },
  {
    id: 'pd-15',
    title: 'GO TO BREADLINE',
    description: 'Advance directly to Breadline. Collect from all players.',
    effect: { type: 'move', destination: 20 }
  },
  {
    id: 'pd-16',
    title: 'STREET REPAIRS',
    description: 'Pay ₽40 per improvement you own.',
    effect: { type: 'propertyTax', perProperty: 0, perImprovement: 40 }
  },
  {
    id: 'pd-17',
    title: 'YOU ARE ASSESSED FOR STREET REPAIRS',
    description: 'Pay ₽50 per improvement.',
    effect: { type: 'propertyTax', perProperty: 0, perImprovement: 50 }
  },
  {
    id: 'pd-18',
    title: 'ADVANCE TO KREMLIN COMPLEX',
    description: 'Advance to Stalin\'s Private Office. If you pass STOY, collect ₽200.',
    effect: { type: 'move', destination: 39 }
  },
  {
    id: 'pd-19',
    title: 'GENERAL REPAIRS',
    description: 'Make general repairs on all your properties. Pay ₽25 per property.',
    effect: { type: 'propertyTax', perProperty: 25, perImprovement: 0 }
  },
  {
    id: 'pd-20',
    title: 'SURPRISE INSPECTION',
    description: 'Your properties are inspected. Pay ₽15 per property, ₽50 per improvement.',
    effect: { type: 'propertyTax', perProperty: 15, perImprovement: 50 }
  }
]

// Shuffle the deck
export function shuffleDirectiveDeck (): DirectiveCard[] {
  const deck = [...PARTY_DIRECTIVE_CARDS]
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]]
  }
  return deck
}

// Draw a card from the deck
export function drawDirectiveCard (deck: DirectiveCard[]): { card: DirectiveCard, remainingDeck: DirectiveCard[] } {
  if (deck.length === 0) {
    // Reshuffle when deck is empty
    const newDeck = shuffleDirectiveDeck()
    return {
      card: newDeck[0],
      remainingDeck: newDeck.slice(1)
    }
  }

  return {
    card: deck[0],
    remainingDeck: deck.slice(1)
  }
}
