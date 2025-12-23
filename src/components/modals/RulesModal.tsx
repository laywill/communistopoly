import './RulesModal.css';

interface RulesModalProps {
  onClose: () => void;
}

export default function RulesModal({ onClose }: RulesModalProps) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container rules-modal" onClick={(e) => { e.stopPropagation(); }}>
        <div className="modal-header">
          <h2>⚖️ HOW TO PLAY COMMUNISTOPOLY ⚖️</h2>
        </div>

        <div className="modal-body">
          <section className="rules-section">
            <h3>OBJECTIVE</h3>
            <p>
              There are no winners in Communistopoly—only survivors. Your goal is to outlast all other players by
              avoiding elimination through the Gulag, denouncements, and Stalin&apos;s whims.
            </p>
          </section>

          <section className="rules-section">
            <h3>TURN STRUCTURE</h3>
            <ol>
              <li>Roll the dice and move your piece</li>
              <li>Resolve the space you land on</li>
              <li>May denounce one player (optional)</li>
              <li>May conduct business (trade, improve properties)</li>
              <li>End your turn</li>
            </ol>
          </section>

          <section className="rules-section">
            <h3>PARTY RANKS</h3>
            <ul>
              <li><strong>Proletariat:</strong> Starting rank. Most vulnerable, no special privileges.</li>
              <li><strong>Party Member:</strong> 10% discount, can vote on denouncements.</li>
              <li><strong>Commissar:</strong> 20% discount, control utilities, harder to denounce.</li>
              <li><strong>Inner Circle:</strong> 50% discount, can veto denouncements, requires unanimous vote to denounce.</li>
            </ul>
          </section>

          <section className="rules-section">
            <h3>THE GULAG</h3>
            <p>You are sent to the Gulag when you:</p>
            <ul>
              <li>Land on &quot;Enemy of the State&quot;</li>
              <li>Are denounced and found guilty</li>
              <li>Roll three doubles in a row</li>
              <li>Fail to pay a debt</li>
            </ul>
            <p><strong>Escape:</strong> Roll doubles (difficulty increases with turns spent), pay ₽500, get vouched for, inform on another player, or bribe Stalin.</p>
          </section>

          <section className="rules-section">
            <h3>DENOUNCEMENTS</h3>
            <p>
              Any player may denounce another at any time by accusing them of a crime (real or invented). Stalin
              presides over a tribunal where both sides present their case, and Stalin renders judgement.
            </p>
            <p><strong>Outcomes:</strong> Guilty (Gulag), Innocent (accuser loses rank), Both Guilty, or Insufficient Evidence.</p>
          </section>

          <section className="rules-section">
            <h3>STALIN&apos;S ROLE</h3>
            <p>
              Stalin controls the game as the Game Master. Stalin sets property prices, judges tribunals, accepts
              bribes, and may use special powers (with theatrical justification). Stalin does not play as a regular
              player but has absolute authority.
            </p>
          </section>

          <section className="rules-section">
            <h3>PROPERTIES (&quot;CUSTODIANSHIP&quot;)</h3>
            <p>
              Instead of &quot;owning&quot; properties, you become their Custodian for the State. All properties start owned by
              the STATE. When you land on an uncontrolled property, Stalin sets a price (50-200% of base value), and
              you may accept or decline. Custodians collect &quot;productivity quotas&quot; (rent) from other players who land
              on their properties.
            </p>
          </section>

          <section className="rules-section">
            <h3>COLLECTIVIZATION (IMPROVEMENTS)</h3>
            <p>
              Improve properties through 5 levels: Worker&apos;s Committee, Party Oversight, Full Collectivization, Model
              Soviet, and People&apos;s Palace. Each level increases the quota collected. Must improve evenly across color
              groups.
            </p>
          </section>

          <section className="rules-section">
            <h3>WINNING (SURVIVING)</h3>
            <p>The game ends when only one player remains (Survivor Victory) or all players are eliminated (Stalin Victory).</p>
          </section>
        </div>

        <div className="modal-footer">
          <button className="modal-btn modal-btn-primary" onClick={onClose}>
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
}
