import type { PieceType } from '../types/game'

export interface PieceAbility {
  name: string
  emoji: string
  description: string
  flavour: string
  passiveAbilities: string[]
  activeAbilities: string[]
  restrictions: string[]
}

export const PIECE_ABILITIES: Record<PieceType, PieceAbility> = {
  hammer: {
    name: 'The Hammer',
    emoji: '🔨',
    description: 'The worker\'s tool, building the future',
    flavour: 'The proletariat cannot be broken',
    passiveAbilities: [
      '+50₽ every time you pass STOY (offsets the tax)',
      'Cannot be sent to Gulag by other players (only by Stalin or landing on Enemy of the State)'
    ],
    activeAbilities: [],
    restrictions: [
      'Must always vote "guilty" in tribunals or lose ability for rest of game'
    ]
  },
  sickle: {
    name: 'The Sickle',
    emoji: '🌙',
    description: 'The farmer\'s blade, reaping the harvest',
    flavour: 'The harvest is yours to command',
    passiveAbilities: [
      'Collective Farm quotas against you are halved'
    ],
    activeAbilities: [
      'Once per game: "Harvest" another player\'s property (steal custodianship of one property worth less than 150₽)'
    ],
    restrictions: [
      'Must announce "For the Motherland!" before each roll or pay 25₽ fine'
    ]
  },
  redStar: {
    name: 'The Red Star',
    emoji: '⭐',
    description: 'Shining beacon of the revolution',
    flavour: 'The brightest star burns the fastest',
    passiveAbilities: [
      'Start at Party Member rank instead of Proletariat'
    ],
    activeAbilities: [],
    restrictions: [
      'All Communist Test penalties against you are doubled',
      'If you ever fall to Proletariat rank, you are immediately executed (eliminated from game)'
    ]
  },
  tank: {
    name: 'The Tank',
    emoji: '🛡️',
    description: 'The iron fist of the Red Army',
    flavour: 'Armour protects, but also isolates',
    passiveAbilities: [
      'Immune to first Gulag sentence (return to nearest Railway Station instead)'
    ],
    activeAbilities: [
      'May "requisition" 50₽ from any player you pass (once per lap around the board)'
    ],
    restrictions: [
      'Cannot control any properties in the Collective Farm group'
    ]
  },
  breadLoaf: {
    name: 'The Bread Loaf',
    emoji: '🍞',
    description: 'The people\'s sustenance... when available',
    flavour: 'Generosity has its price',
    passiveAbilities: [],
    activeAbilities: [
      'Whenever another player cannot pay a debt, you may pay it for them (they now owe YOU, not the state—interest accrues at 20% per round)'
    ],
    restrictions: [
      'If you ever have less than 100₽, you are "starving" and must beg other players or Stalin each turn',
      'May never have more than 1,000₽ (excess must be "donated" to the State)'
    ]
  },
  ironCurtain: {
    name: 'The Iron Curtain',
    emoji: '🚪',
    description: 'What happens in the USSR stays in the USSR',
    flavour: 'Secrecy is power, but also paranoia',
    passiveAbilities: [
      'Other players cannot see your money (keep it hidden)'
    ],
    activeAbilities: [
      'Once per game: "Disappear" a player\'s property card (shuffle it back into State ownership)'
    ],
    restrictions: [
      'Stalin may audit you at any time; if you have more than you\'ve claimed, Gulag'
    ]
  },
  vodkaBottle: {
    name: 'The Vodka Bottle',
    emoji: '🍾',
    description: 'The true opiate of the masses',
    flavour: 'Liquid courage with consequences',
    passiveAbilities: [
      'Immune to trick questions (too drunk to be held accountable)'
    ],
    activeAbilities: [
      'Before any roll: "Drink" to roll 3 dice and choose 2'
    ],
    restrictions: [
      'Every time you use drink ability, your speech must be slightly more slurred'
    ]
  },
  statueOfLenin: {
    name: 'The Statue of Lenin',
    emoji: '🗿',
    description: 'The eternal revolutionary, watching over us all',
    flavour: 'The legacy of Lenin protects and judges',
    passiveAbilities: [
      'Cannot be denounced by players of lower rank'
    ],
    activeAbilities: [
      'Once per game: Give an "inspiring speech" (30 seconds) to gain 100₽ from each player who applauds (Stalin judges sincerity of applause)'
    ],
    restrictions: [
      'Must remain standing whenever Lenin is mentioned, or lose 50₽'
    ]
  }
}

// Helper functions for ability checks
export const getPieceAbility = (piece: PieceType): PieceAbility => {
  return PIECE_ABILITIES[piece]
}

// Ability constants
export const HAMMER_STOY_BONUS = 50
export const SICKLE_FARM_QUOTA_MODIFIER = 0.5
export const SICKLE_HARVEST_MAX_VALUE = 150
export const SICKLE_MOTHERLAND_FINE = 25
export const RED_STAR_PENALTY_MULTIPLIER = 2
export const TANK_REQUISITION_AMOUNT = 50
export const BREAD_LOAF_INTEREST_RATE = 0.2
export const BREAD_LOAF_STARVING_THRESHOLD = 100
export const BREAD_LOAF_MAX_RUBLES = 1000
export const LENIN_SPEECH_PAYMENT = 100
export const LENIN_STANDING_FINE = 50
