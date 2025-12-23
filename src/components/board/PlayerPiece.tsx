import { Player } from '../../types/game';
import { getPieceByType } from '../../data/pieces';
import './PlayerPiece.css';

interface PlayerPieceProps {
  player: Player;
  isCurrentPlayer?: boolean;
}

export default function PlayerPiece({ player, isCurrentPlayer }: PlayerPieceProps) {
  if (!player.piece) return null;

  const pieceData = getPieceByType(player.piece);

  return (
    <div
      className={`player-piece ${isCurrentPlayer ? 'current-player' : ''}`}
      title={`${player.name} (${pieceData?.name ?? ''})`}
    >
      <span className="piece-icon">{pieceData?.icon}</span>
    </div>
  );
}
