// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import 'vite/client'

declare module '*.module.css' {
  const classes: Record<string, string>
  export default classes
}
