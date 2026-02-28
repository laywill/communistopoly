// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { useGameStore } from '../../store/gameStore';
import StoyPilferModal from './StoyPilferModal';
import { PropertyPurchaseModal } from './PropertyPurchaseModal';
import { QuotaPaymentModal } from './QuotaPaymentModal';
import { RailwayModal } from './RailwayModal';
import { UtilityModal } from './UtilityModal';
import { TaxModal } from './TaxModal';
import { GulagEscapeModal } from './GulagEscapeModal';
import { VoucherRequestModal } from './VoucherRequestModal';
import { BribeStalinModal } from './BribeStalinModal';
import { InformOnPlayerModal } from './InformOnPlayerModal';
import { LiquidationModal } from './LiquidationModal';
import { BreadlineModal } from './BreadlineModal';
import { SickleMotherlandModal } from './SickleMotherlandModal';
import { BeggingModal } from './BeggingModal';
import { TradeModal } from './TradeModal';
import { PartyDirectiveModal } from './PartyDirectiveModal';
import { CommunistTestModal } from './CommunistTestModal';
import ConfessionModal from './ConfessionModal';
import ReviewConfessionModal from './ReviewConfessionModal';
import { ConfirmationModal } from './ConfirmationModal';

/**
 * This component renders the appropriate modal based on the current pending action
 */
export function PendingActionHandler() {
  const pendingAction = useGameStore((state) => state.pendingAction);
  const setPendingAction = useGameStore((state) => state.setPendingAction);
  const currentPlayer = useGameStore((state) => state.players[state.currentPlayerIndex]);
  const drawPartyDirective = useGameStore((state) => state.drawPartyDirective);
  const drawCommunistTest = useGameStore((state) => state.drawCommunistTest);
  const approveHammerAbility = useGameStore((state) => state.approveHammerAbility);
  const approveMinistryTruthRewrite = useGameStore((state) => state.approveMinistryTruthRewrite);

  const handleClose = () => {
    setPendingAction(null);
  };

  if (!pendingAction) return null;

  switch (pendingAction.type) {
    case 'stoy-pilfer':
      return <StoyPilferModal playerId={currentPlayer.id} onClose={handleClose} />;

    case 'property-purchase':
      if (pendingAction.data?.spaceId && pendingAction.data.playerId) {
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
      if (pendingAction.data?.spaceId && pendingAction.data.payerId) {
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
      if (pendingAction.data?.spaceId && pendingAction.data.payerId) {
        return (
          <RailwayModal
            spaceId={pendingAction.data.spaceId as number}
            payerId={pendingAction.data.payerId as string}
            onClose={handleClose}
          />
        );
      }
      return null;

    case 'utility-fee':
      if (pendingAction.data?.spaceId && pendingAction.data.payerId && pendingAction.data.diceTotal) {
        return (
          <UtilityModal
            spaceId={pendingAction.data.spaceId as number}
            payerId={pendingAction.data.payerId as string}
            diceTotal={pendingAction.data.diceTotal as number}
            onClose={handleClose}
          />
        );
      }
      return null;

    case 'tax-payment':
      if (pendingAction.data?.spaceId && pendingAction.data.playerId) {
        return (
          <TaxModal
            spaceId={pendingAction.data.spaceId as number}
            playerId={pendingAction.data.playerId as string}
            onClose={handleClose}
          />
        );
      }
      return null;

    case 'gulag-escape-choice':
      if (pendingAction.data?.playerId) {
        return <GulagEscapeModal playerId={pendingAction.data.playerId as string} />;
      }
      return null;

    case 'voucher-request':
      if (pendingAction.data?.prisonerId) {
        return <VoucherRequestModal prisonerId={pendingAction.data.prisonerId as string} />;
      }
      return null;

    case 'bribe-stalin':
      if (pendingAction.data?.playerId && pendingAction.data.reason) {
        return (
          <BribeStalinModal
            playerId={pendingAction.data.playerId as string}
            reason={pendingAction.data.reason as string}
          />
        );
      }
      return null;

    case 'inform-on-player':
      if (pendingAction.data?.informerId) {
        return <InformOnPlayerModal informerId={pendingAction.data.informerId as string} />;
      }
      return null;

    case 'liquidation-required':
      if (pendingAction.data?.playerId && pendingAction.data.amountOwed && pendingAction.data.creditorId && pendingAction.data.reason) {
        return (
          <LiquidationModal
            playerId={pendingAction.data.playerId as string}
            amountOwed={pendingAction.data.amountOwed as number}
            creditorId={pendingAction.data.creditorId as string}
            reason={pendingAction.data.reason as string}
          />
        );
      }
      return null;

    case 'breadline-contribution':
      if (pendingAction.data?.landingPlayerId) {
        return (
          <BreadlineModal
            landingPlayerId={pendingAction.data.landingPlayerId as string}
            onClose={handleClose}
          />
        );
      }
      return null;

    case 'sickle-motherland-announcement':
      if (pendingAction.data?.playerId) {
        return (
          <SickleMotherlandModal
            playerId={pendingAction.data.playerId as string}
            onClose={handleClose}
          />
        );
      }
      return null;

    case 'bread-loaf-begging':
      if (pendingAction.data?.playerId) {
        return (
          <BeggingModal
            playerId={pendingAction.data.playerId as string}
            onClose={handleClose}
          />
        );
      }
      return null;

    case 'trade-offer':
      if (pendingAction.data?.proposerId) {
        return (
          <TradeModal
            mode="propose"
            proposerId={pendingAction.data.proposerId as string}
            onClose={handleClose}
          />
        );
      }
      return null;

    case 'trade-response':
      if (pendingAction.data?.tradeOfferId) {
        return (
          <TradeModal
            mode="respond"
            tradeOfferId={pendingAction.data.tradeOfferId as string}
            onClose={handleClose}
          />
        );
      }
      return null;

    case 'draw-party-directive':
      if (pendingAction.data?.playerId) {
        // Draw a card from the deck
        const card = drawPartyDirective();
        return (
          <PartyDirectiveModal
            card={card}
            playerId={pendingAction.data.playerId as string}
            onClose={handleClose}
          />
        );
      }
      return null;

    case 'draw-communist-test':
      if (pendingAction.data?.playerId) {
        // Draw a question
        const question = drawCommunistTest();
        return (
          <CommunistTestModal
            question={question}
            testedPlayerId={pendingAction.data.playerId as string}
            onClose={handleClose}
          />
        );
      }
      return null;

    case 'write-confession':
      if (pendingAction.data?.prisonerId) {
        return (
          <ConfessionModal
            prisonerId={pendingAction.data.prisonerId as string}
            onClose={handleClose}
          />
        );
      }
      return null;

    case 'review-confession':
      if (pendingAction.data?.confessionId) {
        return (
          <ReviewConfessionModal
            confessionId={pendingAction.data.confessionId as string}
          />
        );
      }
      return null;

    case 'hammer-approval':
      if (!pendingAction.data) return null;
      if (typeof pendingAction.data.custodianId !== 'string' ||
          typeof pendingAction.data.targetPlayerId !== 'string' ||
          typeof pendingAction.data.custodianName !== 'string' ||
          typeof pendingAction.data.targetName !== 'string') {
        return null;
      }
      return (
        <ConfirmationModal
          title="STALIN'S APPROVAL"
          message={`${pendingAction.data.custodianName} wants to send ${pendingAction.data.targetName} to the Gulag for "labour needs".\n\nDo you approve?`}
          confirmText="Approve"
          cancelText="Deny"
          variant="stalin"
          onConfirm={() => {
            if (!pendingAction.data) return;
            approveHammerAbility(
              pendingAction.data.custodianId as string,
              pendingAction.data.targetPlayerId as string,
              true
            );
          }}
          onCancel={() => {
            if (!pendingAction.data) return;
            approveHammerAbility(
              pendingAction.data.custodianId as string,
              pendingAction.data.targetPlayerId as string,
              false
            );
          }}
        />
      );

    case 'ministry-truth-approval':
      if (!pendingAction.data) return null;
      if (typeof pendingAction.data.custodianId !== 'string' ||
          typeof pendingAction.data.custodianName !== 'string' ||
          typeof pendingAction.data.newRule !== 'string') {
        return null;
      }
      return (
        <ConfirmationModal
          title="STALIN'S VETO POWER"
          message={`${pendingAction.data.custodianName} wants to rewrite a rule:\n\n"${pendingAction.data.newRule}"\n\nDo you approve this rule change?`}
          confirmText="Approve"
          cancelText="Veto"
          variant="danger"
          onConfirm={() => {
            if (!pendingAction.data) return;
            approveMinistryTruthRewrite(
              pendingAction.data.custodianId as string,
              pendingAction.data.newRule as string,
              true
            );
          }}
          onCancel={() => {
            if (!pendingAction.data) return;
            approveMinistryTruthRewrite(
              pendingAction.data.custodianId as string,
              pendingAction.data.newRule as string,
              false
            );
          }}
        />
      );

    case 'kgb-test-preview':
      if (!pendingAction.data) return null;
      if (typeof pendingAction.data.difficulty !== 'string' ||
          typeof pendingAction.data.question !== 'string' ||
          typeof pendingAction.data.answer !== 'string') {
        return null;
      }
      return (
        <ConfirmationModal
          title="KGB HEADQUARTERS - TEST PREVIEW"
          message={`Difficulty: ${pendingAction.data.difficulty.toUpperCase()}\n\nQuestion: ${pendingAction.data.question}\n\nAnswer: ${pendingAction.data.answer}\n\nThis preview has been noted by the KGB.`}
          confirmText="Acknowledged"
          cancelText="Close"
          variant="primary"
          onConfirm={handleClose}
          onCancel={handleClose}
        />
      );

    case 'pravda-press-revote':
      if (!pendingAction.data) return null;
      if (typeof pendingAction.data.custodianName !== 'string' ||
          typeof pendingAction.data.decision !== 'string') {
        return null;
      }
      return (
        <ConfirmationModal
          title="PRAVDA PRESS - PROPAGANDA SPREAD"
          message={`${pendingAction.data.custodianName} demands a re-vote on:\n"${pendingAction.data.decision}"\n\nTHE PEOPLE DEMAND IT!`}
          confirmText="Acknowledged"
          cancelText="Close"
          variant="danger"
          onConfirm={handleClose}
          onCancel={handleClose}
        />
      );

    default:
      return null;
  }
}
