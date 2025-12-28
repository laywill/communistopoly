// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { useGameStore } from '../../store/gameStore';
import './ReviewConfessionModal.css';

interface ReviewConfessionModalProps {
  confessionId: string;
}

export default function ReviewConfessionModal({ confessionId }: ReviewConfessionModalProps) {
  const confession = useGameStore((state) => state.confessions.find((c: import('../../types/game').Confession) => c.id === confessionId));
  const prisoner = useGameStore((state) => state.players.find((p: import('../../types/game').Player) => p.id === confession?.prisonerId));
  const reviewConfession = useGameStore((state) => state.reviewConfession);

  if (!confession || !prisoner) return null;

  const handleAccept = () => {
    reviewConfession(confessionId, true);
  };

  const handleReject = () => {
    reviewConfession(confessionId, false);
  };

  return (
    <div className="modal-overlay">
      <div className="review-confession-modal modal-content">
        <div className="review-header">
          <h2>☭ STALIN&apos;S JUDGMENT ☭</h2>
          <p className="review-subtitle">Review the prisoner&apos;s rehabilitation confession</p>
        </div>

        <div className="prisoner-details">
          <div className="prisoner-icon">{prisoner.piece}</div>
          <div className="prisoner-text">
            <h3>{prisoner.name}</h3>
            <p>Gulag Turn: {prisoner.gulagTurns}/10</p>
            <p className="prisoner-rank">Rank: {prisoner.rank}</p>
          </div>
        </div>

        <div className="confession-display">
          <h3>Confession:</h3>
          <div className="confession-text">
            &quot;{confession.confession}&quot;
          </div>
          <div className="confession-meta">
            Submitted: {new Date(confession.timestamp).toLocaleString()}
          </div>
        </div>

        <div className="stalin-decision">
          <p className="decision-prompt">
            Comrade Stalin, what is your judgment on this confession?
          </p>
          <div className="decision-buttons">
            <button className="accept-button" onClick={handleAccept}>
              ✓ ACCEPT - RELEASE FROM GULAG
            </button>
            <button className="reject-button" onClick={handleReject}>
              ✗ REJECT - REMAIN IN GULAG
            </button>
          </div>
        </div>

        <div className="stalin-note">
          <p>
            <strong>Remember:</strong> Accepting the confession will release the prisoner
            immediately. Rejecting it will keep them in the Gulag.
          </p>
        </div>
      </div>
    </div>
  );
}
