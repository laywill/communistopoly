import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { getSpaceById } from '../../data/spaces';
import styles from './TradeModal.module.css';

interface TradeModalProps {
  mode: 'propose' | 'respond';
  proposerId?: string; // Required for propose mode
  tradeOfferId?: string; // Required for respond mode
  onClose: () => void;
}

export function TradeModal({ mode, proposerId, tradeOfferId, onClose }: TradeModalProps) {
  const players = useGameStore((state) => state.players);
  const properties = useGameStore((state) => state.properties);
  const activeTradeOffers = useGameStore((state) => state.activeTradeOffers);
  const proposeTrade = useGameStore((state) => state.proposeTrade);
  const acceptTrade = useGameStore((state) => state.acceptTrade);
  const rejectTrade = useGameStore((state) => state.rejectTrade);

  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('');
  const [offeringRubles, setOfferingRubles] = useState<number>(0);
  const [offeringProperties, setOfferingProperties] = useState<string[]>([]);
  const [offeringGulagCards, setOfferingGulagCards] = useState<number>(0);
  const [offeringFavours, setOfferingFavours] = useState<number>(0);
  const [requestingRubles, setRequestingRubles] = useState<number>(0);
  const [requestingProperties, setRequestingProperties] = useState<string[]>([]);
  const [requestingGulagCards, setRequestingGulagCards] = useState<number>(0);
  const [requestingFavours, setRequestingFavours] = useState<number>(0);

  if (mode === 'propose' && !proposerId) {
    return null;
  }

  if (mode === 'respond' && !tradeOfferId) {
    return null;
  }

  const tradeOffer = mode === 'respond' ? activeTradeOffers.find((t) => t.id === tradeOfferId) : null;
  const proposer = mode === 'propose'
    ? players.find((p) => p.id === proposerId)
    : tradeOffer
    ? players.find((p) => p.id === tradeOffer.fromPlayerId)
    : null;

  const partner = mode === 'propose'
    ? players.find((p) => p.id === selectedPartnerId)
    : tradeOffer
    ? players.find((p) => p.id === tradeOffer.toPlayerId)
    : null;

  if (!proposer) {
    return null;
  }

  const eligiblePartners = players.filter((p) =>
    !p.isStalin && p.id !== proposer.id && !p.isEliminated && !p.inGulag
  );

  const proposerProperties = properties.filter((p) =>
    p.custodianId === proposer.id && !p.mortgaged
  );

  const partnerProperties = partner
    ? properties.filter((p) => p.custodianId === partner.id && !p.mortgaged)
    : [];

  const proposerFavoursOwed = partner
    ? proposer.owesFavourTo.filter((id) => id === partner.id).length
    : 0;

  const partnerFavoursOwed = partner
    ? partner.owesFavourTo.filter((id) => id === proposer.id).length
    : 0;

  const toggleOfferingProperty = (propertyId: string) => {
    if (offeringProperties.includes(propertyId)) {
      setOfferingProperties(offeringProperties.filter((id) => id !== propertyId));
    } else {
      setOfferingProperties([...offeringProperties, propertyId]);
    }
  };

  const toggleRequestingProperty = (propertyId: string) => {
    if (requestingProperties.includes(propertyId)) {
      setRequestingProperties(requestingProperties.filter((id) => id !== propertyId));
    } else {
      setRequestingProperties([...requestingProperties, propertyId]);
    }
  };

  const handlePropose = () => {
    if (!selectedPartnerId) {
      alert('Please select a player to trade with!');
      return;
    }

    // Validate offering
    if (offeringRubles > proposer.rubles) {
      alert('You cannot offer more rubles than you have!');
      return;
    }

    if (offeringGulagCards > (proposer.hasFreeFromGulagCard ? 1 : 0)) {
      alert('You do not have enough Gulag cards!');
      return;
    }

    if (offeringFavours > proposerFavoursOwed) {
      alert(`You only owe ${String(proposerFavoursOwed)} favour(s) to this player!`);
      return;
    }

    // Check if offering anything
    const offeringSomething = offeringRubles > 0 || offeringProperties.length > 0 ||
                              offeringGulagCards > 0 || offeringFavours > 0;
    const requestingSomething = requestingRubles > 0 || requestingProperties.length > 0 ||
                                requestingGulagCards > 0 || requestingFavours > 0;

    if (!offeringSomething && !requestingSomething) {
      alert('Trade must include at least one item!');
      return;
    }

    proposeTrade(proposer.id, selectedPartnerId, {
      offering: {
        rubles: offeringRubles,
        properties: offeringProperties,
        gulagCards: offeringGulagCards,
        favours: offeringFavours
      },
      requesting: {
        rubles: requestingRubles,
        properties: requestingProperties,
        gulagCards: requestingGulagCards,
        favours: requestingFavours
      }
    });

    onClose();
  };

  const handleAccept = () => {
    if (!tradeOffer) return;
    acceptTrade(tradeOffer.id);
    onClose();
  };

  const handleReject = () => {
    if (!tradeOffer) return;
    rejectTrade(tradeOffer.id);
    onClose();
  };

  if (mode === 'respond' && tradeOffer) {
    return (
      <div className={styles.overlay} onClick={(e) => { e.stopPropagation(); }}>
        <div className={styles.modal} onClick={(e) => { e.stopPropagation(); }}>
          <div className={styles.header}>
            <span className={styles.icon}>🤝</span>
            <h2 className={styles.title}>Trade Offer</h2>
            <span className={styles.icon}>🤝</span>
          </div>

          <div className={styles.content}>
            <p className={styles.description}>
              <strong>{proposer.name}</strong> proposes a trade with <strong>{partner?.name}</strong>:
            </p>

            <div className={styles.tradePreview}>
              <div className={styles.tradeSide}>
                <h3 className={styles.sideTitle}>{proposer.name} Offers:</h3>
                <div className={styles.itemList}>
                  {tradeOffer.offering.rubles > 0 && (
                    <div className={styles.item}>💰 ₽{tradeOffer.offering.rubles}</div>
                  )}
                  {tradeOffer.offering.properties.map((propId) => {
                    const prop = properties.find((p) => p.spaceId === parseInt(propId));
                    const space = prop ? getSpaceById(prop.spaceId) : null;
                    return (
                      <div key={propId} className={styles.item}>
                        🏭 {space?.name ?? `Property ${propId}`}
                      </div>
                    );
                  })}
                  {tradeOffer.offering.gulagCards > 0 && (
                    <div className={styles.item}>
                      🎫 {tradeOffer.offering.gulagCards} Gulag {tradeOffer.offering.gulagCards === 1 ? 'Card' : 'Cards'}
                    </div>
                  )}
                  {tradeOffer.offering.favours > 0 && (
                    <div className={styles.item}>
                      🤝 {tradeOffer.offering.favours} {tradeOffer.offering.favours === 1 ? 'Favour' : 'Favours'} Released
                    </div>
                  )}
                  {tradeOffer.offering.rubles === 0 &&
                   tradeOffer.offering.properties.length === 0 &&
                   tradeOffer.offering.gulagCards === 0 &&
                   tradeOffer.offering.favours === 0 && (
                    <div className={styles.nothingItem}>Nothing</div>
                  )}
                </div>
              </div>

              <div className={styles.tradeArrow}>⇄</div>

              <div className={styles.tradeSide}>
                <h3 className={styles.sideTitle}>{partner?.name} Gives:</h3>
                <div className={styles.itemList}>
                  {tradeOffer.requesting.rubles > 0 && (
                    <div className={styles.item}>💰 ₽{tradeOffer.requesting.rubles}</div>
                  )}
                  {tradeOffer.requesting.properties.map((propId) => {
                    const prop = properties.find((p) => p.spaceId === parseInt(propId));
                    const space = prop ? getSpaceById(prop.spaceId) : null;
                    return (
                      <div key={propId} className={styles.item}>
                        🏭 {space?.name ?? `Property ${propId}`}
                      </div>
                    );
                  })}
                  {tradeOffer.requesting.gulagCards > 0 && (
                    <div className={styles.item}>
                      🎫 {tradeOffer.requesting.gulagCards} Gulag {tradeOffer.requesting.gulagCards === 1 ? 'Card' : 'Cards'}
                    </div>
                  )}
                  {tradeOffer.requesting.favours > 0 && (
                    <div className={styles.item}>
                      🤝 {tradeOffer.requesting.favours} {tradeOffer.requesting.favours === 1 ? 'Favour' : 'Favours'} Released
                    </div>
                  )}
                  {tradeOffer.requesting.rubles === 0 &&
                   tradeOffer.requesting.properties.length === 0 &&
                   tradeOffer.requesting.gulagCards === 0 &&
                   tradeOffer.requesting.favours === 0 && (
                    <div className={styles.nothingItem}>Nothing</div>
                  )}
                </div>
              </div>
            </div>

            <div className={styles.responseButtons}>
              <button className={styles.acceptButton} onClick={handleAccept}>
                <div className={styles.buttonIcon}>✅</div>
                <div className={styles.buttonText}>ACCEPT TRADE</div>
              </button>
              <button className={styles.rejectButton} onClick={handleReject}>
                <div className={styles.buttonIcon}>❌</div>
                <div className={styles.buttonText}>REJECT TRADE</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Propose mode
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => { e.stopPropagation(); }}>
        <div className={styles.header}>
          <span className={styles.icon}>🤝</span>
          <h2 className={styles.title}>Propose Trade</h2>
          <span className={styles.icon}>🤝</span>
        </div>

        <div className={styles.content}>
          <div className={styles.partnerSelection}>
            <label className={styles.label}>Trade with:</label>
            <select
              className={styles.partnerSelect}
              value={selectedPartnerId}
              onChange={(e) => { setSelectedPartnerId(e.target.value); }}
            >
              <option value="">Select player...</option>
              {eligiblePartners.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (₽{p.rubles})
                </option>
              ))}
            </select>
          </div>

          {selectedPartnerId && partner && (
            <>
              <div className={styles.tradeBuilder}>
                {/* YOUR OFFER */}
                <div className={styles.offerSection}>
                  <h3 className={styles.sectionTitle}>You Offer:</h3>

                  {/* Rubles */}
                  <div className={styles.itemBuilder}>
                    <label className={styles.itemLabel}>Rubles: (You have: ₽{proposer.rubles})</label>
                    <input
                      type="number"
                      className={styles.numberInput}
                      min="0"
                      max={proposer.rubles}
                      value={offeringRubles}
                      onChange={(e) => { setOfferingRubles(Math.max(0, parseInt(e.target.value) || 0)); }}
                    />
                  </div>

                  {/* Properties */}
                  {proposerProperties.length > 0 && (
                    <div className={styles.itemBuilder}>
                      <label className={styles.itemLabel}>Properties:</label>
                      <div className={styles.propertyList}>
                        {proposerProperties.map((prop) => {
                          const space = getSpaceById(prop.spaceId);
                          const isSelected = offeringProperties.includes(String(prop.spaceId));
                          return (
                            <button
                              key={prop.spaceId}
                              className={`${styles.propertyButton} ${isSelected ? styles.selected : ''}`}
                              onClick={() => { toggleOfferingProperty(String(prop.spaceId)); }}
                            >
                              {space?.name ?? `Property ${String(prop.spaceId)}`}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Gulag Cards */}
                  {proposer.hasFreeFromGulagCard && (
                    <div className={styles.itemBuilder}>
                      <label className={styles.itemLabel}>Gulag Cards:</label>
                      <input
                        type="number"
                        className={styles.numberInput}
                        min="0"
                        max="1"
                        value={offeringGulagCards}
                        onChange={(e) => { setOfferingGulagCards(Math.max(0, Math.min(1, parseInt(e.target.value) || 0))); }}
                      />
                    </div>
                  )}

                  {/* Favours */}
                  {proposerFavoursOwed > 0 && (
                    <div className={styles.itemBuilder}>
                      <label className={styles.itemLabel}>
                        Release Favours: (You owe {proposerFavoursOwed})
                      </label>
                      <input
                        type="number"
                        className={styles.numberInput}
                        min="0"
                        max={proposerFavoursOwed}
                        value={offeringFavours}
                        onChange={(e) => { setOfferingFavours(Math.max(0, Math.min(proposerFavoursOwed, parseInt(e.target.value) || 0))); }}
                      />
                    </div>
                  )}
                </div>

                <div className={styles.divider}>⇄</div>

                {/* YOUR REQUEST */}
                <div className={styles.offerSection}>
                  <h3 className={styles.sectionTitle}>You Request:</h3>

                  {/* Rubles */}
                  <div className={styles.itemBuilder}>
                    <label className={styles.itemLabel}>Rubles: (They have: ₽{partner.rubles})</label>
                    <input
                      type="number"
                      className={styles.numberInput}
                      min="0"
                      max={partner.rubles}
                      value={requestingRubles}
                      onChange={(e) => { setRequestingRubles(Math.max(0, parseInt(e.target.value) || 0)); }}
                    />
                  </div>

                  {/* Properties */}
                  {partnerProperties.length > 0 && (
                    <div className={styles.itemBuilder}>
                      <label className={styles.itemLabel}>Properties:</label>
                      <div className={styles.propertyList}>
                        {partnerProperties.map((prop) => {
                          const space = getSpaceById(prop.spaceId);
                          const isSelected = requestingProperties.includes(String(prop.spaceId));
                          return (
                            <button
                              key={prop.spaceId}
                              className={`${styles.propertyButton} ${isSelected ? styles.selected : ''}`}
                              onClick={() => { toggleRequestingProperty(String(prop.spaceId)); }}
                            >
                              {space?.name ?? `Property ${String(prop.spaceId)}`}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Gulag Cards */}
                  {partner.hasFreeFromGulagCard && (
                    <div className={styles.itemBuilder}>
                      <label className={styles.itemLabel}>Gulag Cards:</label>
                      <input
                        type="number"
                        className={styles.numberInput}
                        min="0"
                        max="1"
                        value={requestingGulagCards}
                        onChange={(e) => { setRequestingGulagCards(Math.max(0, Math.min(1, parseInt(e.target.value) || 0))); }}
                      />
                    </div>
                  )}

                  {/* Favours */}
                  {partnerFavoursOwed > 0 && (
                    <div className={styles.itemBuilder}>
                      <label className={styles.itemLabel}>
                        Release Favours: (They owe you {partnerFavoursOwed})
                      </label>
                      <input
                        type="number"
                        className={styles.numberInput}
                        min="0"
                        max={partnerFavoursOwed}
                        value={requestingFavours}
                        onChange={(e) => { setRequestingFavours(Math.max(0, Math.min(partnerFavoursOwed, parseInt(e.target.value) || 0))); }}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.actionButtons}>
                <button className={styles.proposeButton} onClick={handlePropose}>
                  PROPOSE TRADE
                </button>
                <button className={styles.cancelButton} onClick={onClose}>
                  CANCEL
                </button>
              </div>
            </>
          )}

          {!selectedPartnerId && (
            <p className={styles.hint}>Select a player to start building your trade offer.</p>
          )}
        </div>
      </div>
    </div>
  );
}
