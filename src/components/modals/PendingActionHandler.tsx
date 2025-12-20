import { useGameStore } from '../../store/gameStore';
import StoyPilferModal from './StoyPilferModal';
import { PropertyPurchaseModal } from './PropertyPurchaseModal';
import { QuotaPaymentModal } from './QuotaPaymentModal';

/**
 * This component renders the appropriate modal based on the current pending action
 */
export function PendingActionHandler() {
  const pendingAction = useGameStore((state) => state.pendingAction);
  const setPendingAction = useGameStore((state) => state.setPendingAction);
  const currentPlayer = useGameStore((state) => state.players[state.currentPlayerIndex]);

  const handleClose = () => {
    setPendingAction(null);
  };

  if (!pendingAction) return null;

  switch (pendingAction.type) {
    case 'stoy-pilfer':
      if (!currentPlayer) return null;
      return <StoyPilferModal playerId={currentPlayer.id} onClose={handleClose} />;

    case 'property-purchase':
      if (pendingAction.data?.spaceId && pendingAction.data?.playerId) {
        return (
          <PropertyPurchaseModal
            spaceId={pendingAction.data.spaceId as number}
            playerId={pendingAction.data.playerId as string}
            onClose={handleClose}
          />
        );
      }
      return null;

    case 'quota-payment':
      if (pendingAction.data?.spaceId && pendingAction.data?.payerId) {
        return (
          <QuotaPaymentModal
            spaceId={pendingAction.data.spaceId as number}
            payerId={pendingAction.data.payerId as string}
            onClose={handleClose}
          />
        );
      }
      return null;

    case 'railway-fee':
      // TODO: Implement RailwayModal
      return (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: '#F5E6C8',
          padding: '20px',
          border: '4px solid #C41E3A',
          borderRadius: '8px',
          zIndex: 1000
        }}>
          <p>Railway Fee Modal - Coming soon!</p>
          <button onClick={handleClose}>Close</button>
        </div>
      );

    case 'utility-fee':
      // TODO: Implement UtilityModal
      return (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: '#F5E6C8',
          padding: '20px',
          border: '4px solid #C41E3A',
          borderRadius: '8px',
          zIndex: 1000
        }}>
          <p>Utility Fee Modal - Coming soon!</p>
          <button onClick={handleClose}>Close</button>
        </div>
      );

    case 'tax-payment':
      // TODO: Implement TaxModal
      return (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: '#F5E6C8',
          padding: '20px',
          border: '4px solid #C41E3A',
          borderRadius: '8px',
          zIndex: 1000
        }}>
          <p>Tax Payment Modal - Coming soon!</p>
          <button onClick={handleClose}>Close</button>
        </div>
      );

    default:
      return null;
  }
}
