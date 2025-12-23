import { PropertyGroup } from '../types/game'

export const PROPERTY_COLORS: Record<PropertyGroup, { background: string, border: string, text: string }> = {
  siberian: {
    background: '#8B6914',
    border: '#5D4E37',
    text: '#FAF6EF'
  },
  collective: {
    background: '#87CEEB',
    border: '#5F9EA0',
    text: '#1A1A1A'
  },
  industrial: {
    background: '#DB7093',
    border: '#C71585',
    text: '#FAF6EF'
  },
  ministry: {
    background: '#E86D1F',
    border: '#CC5500',
    text: '#FAF6EF'
  },
  military: {
    background: '#C41E3A',
    border: '#8B0000',
    text: '#FAF6EF'
  },
  media: {
    background: '#F4D03F',
    border: '#D4A84B',
    text: '#1A1A1A'
  },
  elite: {
    background: '#228B22',
    border: '#006400',
    text: '#FAF6EF'
  },
  kremlin: {
    background: '#1C3A5F',
    border: '#0D2137',
    text: '#D4A84B'
  },
  railroad: {
    background: '#1A1A1A',
    border: '#C41E3A',
    text: '#FAF6EF'
  },
  utility: {
    background: '#F5E6C8',
    border: '#1A1A1A',
    text: '#1A1A1A'
  }
}

export const COLLECTIVIZATION_COST = 100
export const PEOPLES_PALACE_COST = 200
