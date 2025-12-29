# Piece Abilities Implementation - Resume Prompt

Use this prompt to start or resume implementing piece-specific abilities in Communistopoly.

---

## 🚀 **Starting Fresh** (Session 1)

```
I need to implement piece-specific abilities for Communistopoly.

Context:
- We have 9 skipped tests for 5 different piece abilities
- Current status: 152 passing / 21 skipped tests
- All stubs have detailed TODO comments in src/store/gameStore.ts
- Implementation plan: Designs/piece-implementation-plan.md

Abilities to implement:
1. Iron Curtain - Disappear Property (easy)
2. Lenin Statue - Inspiring Speech (easy)
3. Sickle - Harvest Ability (medium)
4. Hammer - Stoy Bonus (medium, needs movement integration)
5. Tank - Requisition (complex, needs lap tracking)

Please start with the simplest abilities first (Iron Curtain, Lenin, Sickle) and implement them one at a time, committing after each. Follow the implementation plan and TODO comments in the code.

For each ability:
1. Read the stub with TODO comments
2. Read the corresponding test(s)
3. Implement the logic
4. Enable the test (remove .skip())
5. Verify it passes
6. Commit with clear message

Let's start with Iron Curtain Disappear Property.
```

---

## 🔄 **Resuming Work** (Subsequent Sessions)

```
I'm resuming work on implementing piece abilities for Communistopoly.

Previous progress:
- [List which abilities you've already implemented]
- Current test status: [X passing / Y skipped]

Next to implement:
- [Ability name from the plan]

Context:
- Implementation plan: Designs/piece-implementation-plan.md
- Stubs with TODOs: src/store/gameStore.ts
- Tests: src/tests/store/pieceAbilities.test.ts

Please continue where we left off. Read the TODO comments for the next ability, implement it, enable its test(s), verify, and commit.
```

---

## 📋 **Quick Status Check** (Any Time)

```
Please give me a status update on the piece abilities implementation:

1. How many piece ability tests are currently passing?
2. How many are still skipped?
3. Which abilities have been implemented?
4. Which abilities remain?
5. What should I work on next?

Reference: Designs/piece-implementation-plan.md
```

---

## 🐛 **Debugging a Failed Test** (When Stuck)

```
I'm implementing [Ability Name] but the test is failing.

Test: src/tests/store/pieceAbilities.test.ts:[line number]
Stub: src/store/gameStore.ts:[line number]

Error: [paste error message]

Please help me debug:
1. Review the TODO comments in the stub
2. Review the test expectations
3. Check what might be missing in my implementation
4. Suggest fixes

The implementation plan is in Designs/piece-implementation-plan.md
```

---

## ✅ **Verifying Completion** (Final Check)

```
I believe I've completed all piece ability implementations. Please verify:

1. Run tests and confirm all 9 piece ability tests pass
2. Check that we have 161 passing / 12 skipped (gulag tests remain)
3. Verify ESLint passes with no errors
4. Confirm all abilities have been committed separately
5. Check that implementation matches the plan in Designs/piece-implementation-plan.md

If complete, please summarize what was implemented and suggest next steps (Option 3: Gulag escape mechanisms).
```

---

## 📝 **Key Files Reference**

### Code Locations
- **Stubs with TODOs:** `src/store/gameStore.ts`
  - Iron Curtain: line 305
  - Lenin Speech: line 323
  - Sickle Harvest: line 353
  - Tank Requisition: line 421
  - Hammer (movePlayer): line 246

- **Service (Hammer bonus already implemented):** `src/services/StoyService.ts:30-42`

### Tests
- **All piece tests:** `src/tests/store/pieceAbilities.test.ts`
  - Hammer: line 34
  - Sickle: line 163
  - Tank: lines 301, 325, 354, 380
  - Iron Curtain: lines 569, 807
  - Lenin: line 715

### Documentation
- **Implementation Plan:** `Designs/piece-implementation-plan.md`
- **This Prompt:** `Designs/piece-abilities-prompt.md`

---

## 💡 **Implementation Tips**

### General Pattern
```typescript
methodName: (param1, param2) => {
  const state = get()

  // 1. Validate piece type and "used" flag
  const player = state.getPlayer(playerId)
  if (!player || player.piece !== 'expectedPiece') return
  if (player.hasUsedAbility) return

  // 2. Validate ability-specific requirements
  // (e.g., property exists, target has money, etc.)

  // 3. Execute ability logic
  // (transfer property, money, etc.)

  // 4. Mark ability as used
  state.markAbilityUsed(playerId)

  // 5. Add log entry
  state.addGameLogEntry(`Message about what happened`)
}
```

### ESLint Notes
- Unused parameters need `// eslint-disable-next-line @typescript-eslint/no-unused-vars`
- Unsafe calls need `// eslint-disable-next-line @typescript-eslint/no-unsafe-call`
- Check existing stubs for examples

### Testing Workflow
```bash
# Run specific test file
npm test -- pieceAbilities.test.ts --run

# Run all tests
npm test -- --run

# Check ESLint
npm run lint

# Git workflow
git add -A
git commit -m "Feat: Implement [Ability Name]"
```

---

## 🎯 **Success Criteria**

After each ability:
- ✅ Test no longer skipped (`.skip()` removed)
- ✅ Test passes (green in test output)
- ✅ ESLint clean (no errors)
- ✅ Committed with clear message

After all abilities:
- ✅ 161 passing tests (was 152)
- ✅ 12 skipped tests (was 21)
- ✅ All piece abilities functional in-game
- ✅ Clean git history with separate commits

---

## 📞 **Getting Help**

If you encounter issues:
1. Check the TODO comments in the stub
2. Read the test to understand expectations
3. Review similar abilities that are working
4. Check the implementation plan for guidance
5. Use the "Debugging" prompt above

Remember: Implement one ability at a time, test thoroughly, and commit frequently!
