// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { BoardSpace } from '../../types/game'
import PropertySpace from './PropertySpace'
import RailwaySpace from './RailwaySpace'
import UtilitySpace from './UtilitySpace'
import CardSpace from './CardSpace'
import TaxSpace from './TaxSpace'

interface BoardSpaceProps {
  space: BoardSpace
}

const BoardSpaceComponent = ({ space }: BoardSpaceProps): JSX.Element => {
  switch (space.type) {
    case 'property':
      return <PropertySpace space={space} />
    case 'railway':
      return <RailwaySpace space={space} />
    case 'utility':
      return <UtilitySpace space={space} />
    case 'card':
      return <CardSpace space={space} />
    case 'tax':
      return <TaxSpace space={space} />
    default:
      return <div>Unknown space type</div>
  }
}

export default BoardSpaceComponent
