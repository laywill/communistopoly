// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import '@testing-library/jest-dom'
import { beforeEach } from 'vitest'

// Reset any mocks between tests
beforeEach(() => {
  // Clear localStorage between tests
  localStorage.clear()
})
