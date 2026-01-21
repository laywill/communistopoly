# ConfirmationModal Usage Guide

## Overview

The `ConfirmationModal` component is a reusable, fully-typed modal dialog that replaces `window.confirm` calls throughout the Communistopoly game. It provides a styled, game-themed confirmation dialog with multiple visual variants.

## Location

- **Component**: `src/components/modals/ConfirmationModal.tsx`
- **Tests**: `src/tests/components/ConfirmationModal.test.tsx`
- **Styling**: Uses `src/components/modals/Modal.module.css`

## TypeScript Interface

```typescript
interface ConfirmationModalProps {
  title: string;           // Modal header title
  message: string;         // Message body (supports newlines)
  confirmText: string;     // Text for confirm button
  cancelText: string;      // Text for cancel button
  onConfirm: () => void;   // Callback when confirmed
  onCancel: () => void;    // Callback when cancelled
  variant?: 'stalin' | 'danger' | 'primary';  // Visual style (default: 'primary')
  nested?: boolean;        // If true, uses higher z-index for nested modals (default: false)
}
```

## Variants

### Primary (default)
- **Header Color**: `var(--color-soviet-red)`
- **Button Style**: Soviet red gradient
- **Use Case**: Standard confirmations

### Stalin
- **Header Color**: `var(--color-steel-blue)`
- **Button Style**: Steel blue with gold text
- **Use Case**: Stalin's judgement, authority-based decisions
- **Example**: "Stalin's approval for Hammer ability"

### Danger
- **Header Color**: `var(--color-blood-burgundy)`
- **Button Style**: Blood burgundy gradient
- **Use Case**: Dangerous or punitive actions
- **Example**: "Stalin's veto for Ministry of Truth"

## Usage Examples

### Basic Usage (Primary Variant)

```tsx
import { ConfirmationModal } from './components/modals/ConfirmationModal';

const [showConfirm, setShowConfirm] = useState(false);

{showConfirm && (
  <ConfirmationModal
    title="Confirm Action"
    message="Are you sure you want to proceed?"
    confirmText="Yes, Continue"
    cancelText="No, Cancel"
    onConfirm={() => {
      // Handle confirmation
      setShowConfirm(false);
    }}
    onCancel={() => {
      setShowConfirm(false);
    }}
  />
)}
```

### Stalin Variant (Authority Decision)

```tsx
<ConfirmationModal
  title="STALIN'S APPROVAL"
  message="Hammer ability: Send player to Gulag?\n\nThis requires Stalin's approval."
  confirmText="Approve"
  cancelText="Deny"
  variant="stalin"
  onConfirm={handleStalinApproval}
  onCancel={handleDenial}
/>
```

### Danger Variant (Punitive Action)

```tsx
<ConfirmationModal
  title="STALIN'S VETO"
  message="Ministry of Truth ability: Rewrite game rule?\n\nWARNING: This is a powerful action!"
  confirmText="Veto"
  cancelText="Allow"
  variant="danger"
  onConfirm={handleVeto}
  onCancel={handleAllow}
/>
```

### Nested Modal (Within Another Modal)

```tsx
<ConfirmationModal
  title="STALIN'S JUDGEMENT"
  message="Does Stalin find the accused GUILTY?"
  confirmText="Guilty"
  cancelText="Innocent"
  variant="stalin"
  nested={true}  // Higher z-index and darker overlay
  onConfirm={handleGuiltyVerdict}
  onCancel={handleInnocentVerdict}
/>
```

### Multi-line Messages

```tsx
<ConfirmationModal
  title="VOUCHER REQUEST"
  message={`${voucherName}, do you accept to vouch for ${prisonerName}?

WARNING: If ${prisonerName} commits ANY offence in the next 3 rounds,
YOU will also go to the Gulag!`}
  confirmText="Accept"
  cancelText="Decline"
  onConfirm={handleVoucherAccept}
  onCancel={handleVoucherDecline}
/>
```

## Replacing window.confirm

### Before (System Dialog)
```tsx
const approved = window.confirm(
  `STALIN'S APPROVAL\n\nApprove sending ${targetName} to the Gulag?`
);

if (approved) {
  sendToGulag(targetId);
}
```

### After (ConfirmationModal)
```tsx
const [showConfirm, setShowConfirm] = useState(false);

// Trigger the modal
setShowConfirm(true);

// Render the modal
{showConfirm && (
  <ConfirmationModal
    title="STALIN'S APPROVAL"
    message={`Approve sending ${targetName} to the Gulag?`}
    confirmText="Approve"
    cancelText="Deny"
    variant="stalin"
    onConfirm={() => {
      sendToGulag(targetId);
      setShowConfirm(false);
    }}
    onCancel={() => {
      setShowConfirm(false);
    }}
  />
)}
```

## Locations to Replace window.confirm

There are 4 `window.confirm` calls in the codebase to replace:

1. **src/store/gameStore.ts:1839** - Stalin approval for Hammer ability (send to Gulag)
   - Use `variant="stalin"`

2. **src/store/gameStore.ts:1933** - Stalin veto for Ministry of Truth ability (rewrite rule)
   - Use `variant="danger"`

3. **src/components/modals/InformOnPlayerModal.tsx:64** - Stalin's judgement on informer accusation
   - Use `variant="stalin"` and `nested={true}`

4. **src/components/modals/VoucherRequestModal.tsx:40** - Voucher acceptance
   - Use `variant="primary"` and `nested={true}`

## Features

### Click Outside to Close
The modal closes when clicking the overlay (outside the modal content).

### Newline Support
Messages automatically preserve newlines with `white-space: pre-wrap` styling.

### Event Propagation
Clicking inside the modal content does not trigger the overlay click handler.

### Z-index Management
- Default overlay: `z-index: 1000`
- Nested overlay: `z-index: 1100`
- Default overlay opacity: `rgba(0, 0, 0, 0.75)`
- Nested overlay opacity: `rgba(0, 0, 0, 0.85)` (darker)

## Styling Details

### Button Classes (from Modal.module.css)
- `primaryButton` - Soviet red gradient
- `stalinButton` - Steel blue with gold text
- `dangerButton` - Blood burgundy gradient
- `disabledButton` - Grey gradient (used for cancel button)

### CSS Variables Used
- `--color-soviet-red` - Primary red color
- `--color-steel-blue` - Stalin blue color
- `--color-blood-burgundy` - Danger red color
- `--color-kremlin-gold` - Gold accent color
- `--color-parchment` - Background color
- `--font-display` - Display font family

## Test Coverage

The component has comprehensive test coverage:
- **Statements**: 100%
- **Branches**: 93.75%
- **Functions**: 100%
- **Lines**: 100%

### Test Cases
1. Renders with title and message
2. Renders confirm and cancel buttons
3. Calls onConfirm when confirm clicked
4. Calls onCancel when cancel clicked
5. Calls onCancel when overlay clicked
6. Does not call onCancel when modal content clicked
7. Renders with primary variant by default
8. Renders with stalin variant styling
9. Renders with danger variant styling
10. Applies nested overlay styling
11. Applies default overlay styling
12. Preserves newlines in message
13. Renders multi-line messages correctly

## Quality Metrics

- **Zero lint errors**
- **All 983 tests passing**
- **Coverage**: 96.65% (increased from 94.52%)
- **Strict TypeScript**: No `any` types
- **Copyright header**: Present on all files
