// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import './StalinPanel.css';

export default function StalinPanel() {
  const players = useGameStore((state) => state.players);
  const sendToGulag = useGameStore((state) => state.sendToGulag);
  const respondToBribe = useGameStore((state) => state.respondToBribe);
  const pendingBribes = useGameStore((state) => state.pendingBribes);
  const stateTreasury = useGameStore((state) => state.stateTreasury);
  const roundNumber = useGameStore((state) => state.roundNumber);

  const [selectedPlayer, setSelectedPlayer] = useState<string>('');
  const [justification, setJustification] = useState('');

  // Get Gulag inmates
  const gulagInmates = players.filter((p) => !p.isStalin && p.inGulag);

  // Get non-Stalin, non-Gulag, non-eliminated players
  const availablePlayers = players.filter(
    (p) => !p.isStalin && !p.inGulag && !p.isEliminated
  );

  const handleSendToGulag = () => {
    if (selectedPlayer && justification.trim()) {
      sendToGulag(selectedPlayer, 'stalinDecree', justification);
      setSelectedPlayer('');
      setJustification('');
    }
  };

  const handleBribeResponse = (bribeId: string, accepted: boolean) => {
    respondToBribe(bribeId, accepted);
  };

  return (
    <div className="stalin-panel">
      <div className="stalin-header">
        <span className="stalin-icon">☭</span>
        <h2>STALIN&apos;S CONTROL PANEL</h2>
      </div>

      <div className="stalin-content">
        {/* Treasury and Round Info */}
        <div className="stalin-section">
          <div className="stalin-stat">
            <label>STATE TREASURY:</label>
            <span className="treasury-value">₽{stateTreasury}</span>
          </div>
          <div className="stalin-stat">
            <label>ROUND:</label>
            <span className="round-value">{roundNumber}</span>
          </div>
        </div>

        {/* Gulag Population */}
        <div className="stalin-section">
          <h3>⛓️ GULAG POPULATION</h3>
          {gulagInmates.length === 0 ? (
            <p className="empty-message">No inmates currently</p>
          ) : (
            <div className="inmates-list">
              {gulagInmates.map((inmate) => (
                <div key={inmate.id} className="inmate-card">
                  <div className="inmate-info">
                    <span className="inmate-name">{inmate.name}</span>
                    <span className="inmate-sentence">Day {inmate.gulagTurns + 1}</span>
                  </div>
                  <div className="inmate-details">
                    <span className="inmate-rubles">₽{inmate.rubles}</span>
                    <span className="inmate-rank">{inmate.rank}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Bribes */}
        <div className="stalin-section">
          <h3>💸 PENDING BRIBES</h3>
          {pendingBribes.length === 0 ? (
            <p className="empty-message">No pending bribes</p>
          ) : (
            <div className="bribes-list">
              {pendingBribes.map((bribe) => {
                const player = players.find((p) => p.id === bribe.playerId);
                return (
                  <div key={bribe.id} className="bribe-card">
                    <div className="bribe-info">
                      <span className="bribe-player">{player?.name}</span>
                      <span className="bribe-amount">₽{bribe.amount}</span>
                    </div>
                    <div className="bribe-reason">{bribe.reason}</div>
                    <div className="bribe-actions">
                      <button
                        className="bribe-button accept"
                        onClick={() => { handleBribeResponse(bribe.id, true); }}
                      >
                        ✓ ACCEPT
                      </button>
                      <button
                        className="bribe-button reject"
                        onClick={() => { handleBribeResponse(bribe.id, false); }}
                      >
                        ✗ REJECT
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Send to Gulag */}
        <div className="stalin-section">
          <h3>⚡ SEND TO GULAG</h3>
          <div className="send-gulag-form">
            <select
              className="player-select"
              value={selectedPlayer}
              onChange={(e) => { setSelectedPlayer(e.target.value); }}
            >
              <option value="">Select a player...</option>
              {availablePlayers.map((player) => (
                <option key={player.id} value={player.id}>
                  {player.name} - {player.rank} - ₽{player.rubles}
                </option>
              ))}
            </select>

            <textarea
              className="justification-input"
              placeholder="Justification (required)"
              value={justification}
              onChange={(e) => { setJustification(e.target.value); }}
              rows={3}
            />

            <button
              className="send-gulag-button"
              onClick={handleSendToGulag}
              disabled={!selectedPlayer || !justification.trim()}
            >
              SEND TO GULAG
            </button>
          </div>
        </div>

        {/* Coming Soon */}
        <div className="stalin-section coming-soon">
          <h3>🚧 COMING IN MILESTONE 6</h3>
          <ul>
            <li>Tribunal/Denouncement System</li>
            <li>Great Purge</li>
            <li>Five-Year Plan</li>
            <li>Hero of Soviet Union</li>
            <li>Price Setting Controls</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
