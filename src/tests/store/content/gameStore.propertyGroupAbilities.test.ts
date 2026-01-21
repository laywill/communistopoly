// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useGameStore } from '../../../store/gameStore'

describe('Property Group Abilities', () => {
  beforeEach(() => {
    const store = useGameStore.getState()
    store.resetGame()
    // Reset mocks
    vi.clearAllMocks()
  })

  describe('siberianCampsGulag', () => {
    it('should send target to Gulag when custodian owns both camps and Stalin approves', () => {
      const store = useGameStore.getState()

      // Setup: Create players
      store.initializePlayers([
        { name: 'Custodian', piece: 'hammer', isStalin: false },
        { name: 'Target', piece: 'sickle', isStalin: false }
      ])
      const [custodian, target] = useGameStore.getState().players
      const custodianId = custodian.id
      const targetId = target.id

      // Setup: Give custodian both Siberian Camps (spaces 1 and 3)
      store.setPropertyCustodian(1, custodianId)
      store.setPropertyCustodian(3, custodianId)

      // Execute: Request to send to Gulag (creates pending action)
      store.siberianCampsGulag(custodianId, targetId)

      // Verify pending action was created
      const pendingAction = useGameStore.getState().pendingAction
      expect(pendingAction?.type).toBe('hammer-approval')

      // Approve the action
      store.approveHammerAbility(custodianId, targetId, true)

      // Verify target is in Gulag
      const updatedTarget = useGameStore.getState().players.find(p => p.id === targetId)
      expect(updatedTarget?.inGulag).toBe(true)

      // Verify custodian marked as having used ability
      const updatedCustodian = useGameStore.getState().players.find(p => p.id === custodianId)
      expect(updatedCustodian?.hasUsedSiberianCampsGulag).toBe(true)

      // Verify log entry added
      const logs = useGameStore.getState().gameLog
      expect(logs.some(log =>
        log.type === 'gulag' &&
        log.message.includes('sent') &&
        log.message.includes('to the Gulag')
      )).toBe(true)
    })

    it('should not send target to Gulag when Stalin denies', () => {
      const store = useGameStore.getState()

      // Setup: Create players
      store.initializePlayers([
        { name: 'Custodian', piece: 'hammer', isStalin: false },
        { name: 'Target', piece: 'sickle', isStalin: false }
      ])
      const [custodian, target] = useGameStore.getState().players

      // Setup: Give custodian both Siberian Camps
      store.setPropertyCustodian(1, custodian.id)
      store.setPropertyCustodian(3, custodian.id)

      // Execute: Request to send to Gulag (creates pending action)
      store.siberianCampsGulag(custodian.id, target.id)

      // Verify pending action was created
      const pendingAction = useGameStore.getState().pendingAction
      expect(pendingAction?.type).toBe('hammer-approval')

      // Deny the action
      store.approveHammerAbility(custodian.id, target.id, false)

      // Verify target is NOT in Gulag
      const updatedTarget = useGameStore.getState().players.find(p => p.id === target.id)
      expect(updatedTarget?.inGulag).toBe(false)

      // Verify log entry about Stalin's denial
      const logs = useGameStore.getState().gameLog
      expect(logs.some(log =>
        log.type === 'system' &&
        log.message.includes('Stalin denied')
      )).toBe(true)
    })

    it('should fail when custodian does not own both camps', () => {
      const store = useGameStore.getState()

      // Setup: Create players
      store.initializePlayers([
        { name: 'Custodian', piece: 'hammer', isStalin: false },
        { name: 'Target', piece: 'sickle', isStalin: false }
      ])
      const [custodian, target] = useGameStore.getState().players

      // Setup: Give custodian only one camp
      store.setPropertyCustodian(1, custodian.id)
      // Space 3 is not owned by custodian

      // Execute
      store.siberianCampsGulag(custodian.id, target.id)

      // Verify target is NOT in Gulag
      const updatedTarget = useGameStore.getState().players.find(p => p.id === target.id)
      expect(updatedTarget?.inGulag).toBe(false)

      // Verify error log entry
      const logs = useGameStore.getState().gameLog
      expect(logs.some(log =>
        log.type === 'system' &&
        log.message.includes('must control both Siberian Camps')
      )).toBe(true)
    })

    it('should fail when custodian has already used ability', () => {
      const store = useGameStore.getState()

      // Setup: Create players
      store.initializePlayers([
        { name: 'Custodian', piece: 'hammer', isStalin: false },
        { name: 'Target', piece: 'sickle', isStalin: false }
      ])
      const [custodian, target] = useGameStore.getState().players

      // Setup: Give custodian both camps and mark ability as used
      store.setPropertyCustodian(1, custodian.id)
      store.setPropertyCustodian(3, custodian.id)
      store.updatePlayer(custodian.id, { hasUsedSiberianCampsGulag: true })

      // Mock Stalin's approval
      vi.spyOn(window, 'confirm').mockReturnValue(true)

      // Execute
      store.siberianCampsGulag(custodian.id, target.id)

      // Verify target is NOT in Gulag (ability already used)
      const updatedTarget = useGameStore.getState().players.find(p => p.id === target.id)
      expect(updatedTarget?.inGulag).toBe(false)

      // Verify confirm was not called
      expect(window.confirm).not.toHaveBeenCalled()
    })

    it('should handle invalid custodian ID gracefully', () => {
      const store = useGameStore.getState()

      store.initializePlayers([
        { name: 'Target', piece: 'sickle', isStalin: false }
      ])
      const [target] = useGameStore.getState().players

      // Execute with invalid custodian ID
      store.siberianCampsGulag('invalid-id', target.id)

      // Should not crash
      const updatedTarget = useGameStore.getState().players.find(p => p.id === target.id)
      expect(updatedTarget?.inGulag).toBe(false)
    })

    it('should handle invalid target ID gracefully', () => {
      const store = useGameStore.getState()

      store.initializePlayers([
        { name: 'Custodian', piece: 'hammer', isStalin: false }
      ])
      const [custodian] = useGameStore.getState().players

      // Setup camps
      store.setPropertyCustodian(1, custodian.id)
      store.setPropertyCustodian(3, custodian.id)

      // Execute with invalid target ID
      store.siberianCampsGulag(custodian.id, 'invalid-id')

      // Should not crash - verify no Gulag logs added
      const logs = useGameStore.getState().gameLog
      expect(logs.filter(log => log.type === 'gulag')).toHaveLength(0)
    })
  })

  describe('kgbPreviewTest', () => {
    it('should preview a test question when custodian owns KGB Headquarters', () => {
      const store = useGameStore.getState()

      // Setup: Create player
      store.initializePlayers([
        { name: 'Custodian', piece: 'hammer', isStalin: false }
      ])
      const [custodian] = useGameStore.getState().players

      // Setup: Give custodian KGB Headquarters (space 23)
      store.setPropertyCustodian(23, custodian.id)

      // Mock alert
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => undefined)

      // Execute
      store.kgbPreviewTest(custodian.id)

      // Verify alert was called with question preview
      expect(alertSpy).toHaveBeenCalled()
      const alertMessage = alertSpy.mock.calls[0][0] as string
      expect(alertMessage).toContain('KGB HEADQUARTERS')
      expect(alertMessage).toContain('Difficulty:')
      expect(alertMessage).toContain('Question:')
      expect(alertMessage).toContain('Answer:')

      // Verify counter incremented
      const updatedCustodian = useGameStore.getState().players.find(p => p.id === custodian.id)
      expect(updatedCustodian?.kgbTestPreviewsUsedThisRound).toBe(1)

      // Verify log entry added
      const logs = useGameStore.getState().gameLog
      expect(logs.some(log =>
        log.type === 'system' &&
        log.message.includes('used KGB Headquarters to preview')
      )).toBe(true)
    })

    it('should fail when custodian does not own KGB Headquarters', () => {
      const store = useGameStore.getState()

      // Setup: Create player without KGB
      store.initializePlayers([
        { name: 'Custodian', piece: 'hammer', isStalin: false }
      ])
      const [custodian] = useGameStore.getState().players

      // Execute
      store.kgbPreviewTest(custodian.id)

      // Verify counter not incremented
      const updatedCustodian = useGameStore.getState().players.find(p => p.id === custodian.id)
      expect(updatedCustodian?.kgbTestPreviewsUsedThisRound).toBe(0)

      // Verify error log entry
      const logs = useGameStore.getState().gameLog
      expect(logs.some(log =>
        log.type === 'system' &&
        log.message.includes('must control KGB Headquarters')
      )).toBe(true)
    })

    it('should fail when already used once this round', () => {
      const store = useGameStore.getState()

      // Setup: Create player
      store.initializePlayers([
        { name: 'Custodian', piece: 'hammer', isStalin: false }
      ])
      const [custodian] = useGameStore.getState().players

      // Setup: Give custodian KGB and set counter to 1
      store.setPropertyCustodian(23, custodian.id)
      store.updatePlayer(custodian.id, { kgbTestPreviewsUsedThisRound: 1 })

      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => undefined)

      // Execute
      store.kgbPreviewTest(custodian.id)

      // Verify alert was NOT called
      expect(alertSpy).not.toHaveBeenCalled()

      // Verify counter still at 1
      const updatedCustodian = useGameStore.getState().players.find(p => p.id === custodian.id)
      expect(updatedCustodian?.kgbTestPreviewsUsedThisRound).toBe(1)

      // Verify error log entry
      const logs = useGameStore.getState().gameLog
      expect(logs.some(log =>
        log.type === 'system' &&
        log.message.includes('already used KGB Preview this round')
      )).toBe(true)
    })

    it('should handle invalid custodian ID gracefully', () => {
      const store = useGameStore.getState()

      // Execute with invalid ID
      store.kgbPreviewTest('invalid-id')

      // Should not crash - verify no KGB logs
      const logs = useGameStore.getState().gameLog
      expect(logs.filter(log =>
        log.message.includes('KGB')
      )).toHaveLength(0)
    })

    it('should allow use again after round ends (counter resets)', () => {
      const store = useGameStore.getState()

      // Setup: Create player
      store.initializePlayers([
        { name: 'Custodian', piece: 'hammer', isStalin: false }
      ])
      const [custodian] = useGameStore.getState().players

      // Setup: Give custodian KGB and use ability
      store.setPropertyCustodian(23, custodian.id)
      store.updatePlayer(custodian.id, { kgbTestPreviewsUsedThisRound: 1 })

      // Simulate round end (counter should reset)
      store.updatePlayer(custodian.id, { kgbTestPreviewsUsedThisRound: 0 })

      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => undefined)

      // Execute
      store.kgbPreviewTest(custodian.id)

      // Verify alert was called (ability works again)
      expect(alertSpy).toHaveBeenCalled()

      // Verify counter incremented to 1
      const updatedCustodian = useGameStore.getState().players.find(p => p.id === custodian.id)
      expect(updatedCustodian?.kgbTestPreviewsUsedThisRound).toBe(1)
    })
  })

  describe('ministryTruthRewrite', () => {
    it('should rewrite rule when custodian owns all ministries and Stalin approves', () => {
      const store = useGameStore.getState()

      // Setup: Create player
      store.initializePlayers([
        { name: 'Custodian', piece: 'hammer', isStalin: false }
      ])
      const [custodian] = useGameStore.getState().players

      // Setup: Give custodian all three ministries (16, 18, 19)
      store.setPropertyCustodian(16, custodian.id)
      store.setPropertyCustodian(18, custodian.id)
      store.setPropertyCustodian(19, custodian.id)

      const newRule = 'All players must salute Stalin before rolling dice'

      // Execute: Request rule rewrite (creates pending action)
      store.ministryTruthRewrite(custodian.id, newRule)

      // Verify pending action was created
      const pendingAction = useGameStore.getState().pendingAction
      expect(pendingAction?.type).toBe('ministry-truth-approval')

      // Approve the rule change
      store.approveMinistryTruthRewrite(custodian.id, newRule, true)

      // Verify custodian marked as having used ability
      const updatedCustodian = useGameStore.getState().players.find(p => p.id === custodian.id)
      expect(updatedCustodian?.hasUsedMinistryTruthRewrite).toBe(true)

      // Verify log entry added with the new rule
      const logs = useGameStore.getState().gameLog
      expect(logs.some(log =>
        log.type === 'system' &&
        log.message.includes('Ministry of Truth') &&
        log.message.includes(newRule)
      )).toBe(true)
    })

    it('should not rewrite rule when Stalin vetoes', () => {
      const store = useGameStore.getState()

      // Setup: Create player
      store.initializePlayers([
        { name: 'Custodian', piece: 'hammer', isStalin: false }
      ])
      const [custodian] = useGameStore.getState().players

      // Setup: Give custodian all three ministries
      store.setPropertyCustodian(16, custodian.id)
      store.setPropertyCustodian(18, custodian.id)
      store.setPropertyCustodian(19, custodian.id)

      const newRule = 'Players can skip Gulag by singing anthem'

      // Execute: Request rule rewrite (creates pending action)
      store.ministryTruthRewrite(custodian.id, newRule)

      // Verify pending action was created
      const pendingAction = useGameStore.getState().pendingAction
      expect(pendingAction?.type).toBe('ministry-truth-approval')

      // Veto the rule change
      store.approveMinistryTruthRewrite(custodian.id, newRule, false)

      // Verify custodian NOT marked as having used ability
      const updatedCustodian = useGameStore.getState().players.find(p => p.id === custodian.id)
      expect(updatedCustodian?.hasUsedMinistryTruthRewrite).toBe(false)

      // Verify log entry about Stalin's veto
      const logs = useGameStore.getState().gameLog
      expect(logs.some(log =>
        log.type === 'system' &&
        log.message.includes('Stalin vetoed')
      )).toBe(true)
    })

    it('should fail when custodian does not own all three ministries', () => {
      const store = useGameStore.getState()

      // Setup: Create player
      store.initializePlayers([
        { name: 'Custodian', piece: 'hammer', isStalin: false }
      ])
      const [custodian] = useGameStore.getState().players

      // Setup: Give custodian only two ministries
      store.setPropertyCustodian(16, custodian.id)
      store.setPropertyCustodian(18, custodian.id)
      // Missing space 19

      const newRule = 'Test rule'

      // Execute
      store.ministryTruthRewrite(custodian.id, newRule)

      // Verify error log entry
      const logs = useGameStore.getState().gameLog
      expect(logs.some(log =>
        log.type === 'system' &&
        log.message.includes('must control all three Government Ministries')
      )).toBe(true)
    })

    it('should fail when custodian has already used ability', () => {
      const store = useGameStore.getState()

      // Setup: Create player
      store.initializePlayers([
        { name: 'Custodian', piece: 'hammer', isStalin: false }
      ])
      const [custodian] = useGameStore.getState().players

      // Setup: Give custodian all ministries and mark ability as used
      store.setPropertyCustodian(16, custodian.id)
      store.setPropertyCustodian(18, custodian.id)
      store.setPropertyCustodian(19, custodian.id)
      store.updatePlayer(custodian.id, { hasUsedMinistryTruthRewrite: true })

      vi.spyOn(window, 'confirm').mockReturnValue(true)

      const newRule = 'Test rule'

      // Execute
      store.ministryTruthRewrite(custodian.id, newRule)

      // Verify confirm was not called (ability already used)
      expect(window.confirm).not.toHaveBeenCalled()
    })

    it('should handle invalid custodian ID gracefully', () => {
      const store = useGameStore.getState()

      // Execute with invalid ID
      store.ministryTruthRewrite('invalid-id', 'Test rule')

      // Should not crash - verify no Ministry logs
      const logs = useGameStore.getState().gameLog
      expect(logs.filter(log =>
        log.message.includes('Ministry')
      )).toHaveLength(0)
    })
  })

  describe('pravdaPressRevote', () => {
    it('should force revote when custodian owns all media properties', () => {
      const store = useGameStore.getState()

      // Setup: Create player
      store.initializePlayers([
        { name: 'Custodian', piece: 'hammer', isStalin: false }
      ])
      const [custodian] = useGameStore.getState().players

      // Setup: Give custodian all three State Media properties (26, 27, 29)
      store.setPropertyCustodian(26, custodian.id)
      store.setPropertyCustodian(27, custodian.id)
      store.setPropertyCustodian(29, custodian.id)

      // Mock alert
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => undefined)

      const decision = 'Should Player 2 be eliminated?'

      // Execute
      store.pravdaPressRevote(custodian.id, decision)

      // Verify custodian marked as having used ability
      const updatedCustodian = useGameStore.getState().players.find(p => p.id === custodian.id)
      expect(updatedCustodian?.hasUsedPravdaPressRevote).toBe(true)

      // Verify log entry added
      const logs = useGameStore.getState().gameLog
      expect(logs.some(log =>
        log.type === 'system' &&
        log.message.includes('Pravda Press') &&
        log.message.includes(decision)
      )).toBe(true)

      // Verify alert was called
      expect(alertSpy).toHaveBeenCalled()
      const alertMessage = alertSpy.mock.calls[0][0] as string
      expect(alertMessage).toContain('PRAVDA PRESS')
      expect(alertMessage).toContain(decision)
      expect(alertMessage).toContain('THE PEOPLE DEMAND IT')
    })

    it('should fail when custodian does not own all three media properties', () => {
      const store = useGameStore.getState()

      // Setup: Create player
      store.initializePlayers([
        { name: 'Custodian', piece: 'hammer', isStalin: false }
      ])
      const [custodian] = useGameStore.getState().players

      // Setup: Give custodian only two media properties
      store.setPropertyCustodian(26, custodian.id)
      store.setPropertyCustodian(27, custodian.id)
      // Missing space 29

      const decision = 'Test decision'

      // Execute
      store.pravdaPressRevote(custodian.id, decision)

      // Verify custodian NOT marked as having used ability
      const updatedCustodian = useGameStore.getState().players.find(p => p.id === custodian.id)
      expect(updatedCustodian?.hasUsedPravdaPressRevote).toBe(false)

      // Verify error log entry
      const logs = useGameStore.getState().gameLog
      expect(logs.some(log =>
        log.type === 'system' &&
        log.message.includes('must control all three State Media properties')
      )).toBe(true)
    })

    it('should fail when custodian has already used ability', () => {
      const store = useGameStore.getState()

      // Setup: Create player
      store.initializePlayers([
        { name: 'Custodian', piece: 'hammer', isStalin: false }
      ])
      const [custodian] = useGameStore.getState().players

      // Setup: Give custodian all media properties and mark ability as used
      store.setPropertyCustodian(26, custodian.id)
      store.setPropertyCustodian(27, custodian.id)
      store.setPropertyCustodian(29, custodian.id)
      store.updatePlayer(custodian.id, { hasUsedPravdaPressRevote: true })

      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => undefined)

      const decision = 'Test decision'

      // Execute
      store.pravdaPressRevote(custodian.id, decision)

      // Verify alert was not called (ability already used)
      expect(alertSpy).not.toHaveBeenCalled()

      // Verify custodian still marked as having used ability
      const updatedCustodian = useGameStore.getState().players.find(p => p.id === custodian.id)
      expect(updatedCustodian?.hasUsedPravdaPressRevote).toBe(true)
    })

    it('should handle invalid custodian ID gracefully', () => {
      const store = useGameStore.getState()

      // Execute with invalid ID
      store.pravdaPressRevote('invalid-id', 'Test decision')

      // Should not crash - verify no Pravda logs
      const logs = useGameStore.getState().gameLog
      expect(logs.filter(log =>
        log.message.includes('Pravda')
      )).toHaveLength(0)
    })
  })
})
