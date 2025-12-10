# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Test Commands

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage report
npm run test:coverage

# Run unit tests only (excludes Puppeteer integration tests)
npm run test:unit

# Run Puppeteer integration tests only
npm run test:integration
```

## Architecture

Browser-based Checkers game using vanilla JavaScript (ES modules) with Jest/Puppeteer for testing.

### Core Modules (src/)

- **rules.js** - Rules engine: move generation, validation, captures, multi-jumps, king promotion. Exports `PIECE` and `PLAYER` constants, pure functions for move logic.
- **gameState.js** - `GameState` class managing board state, turn tracking, move history, win detection. Uses rules.js internally.
- **ai.js** - AI opponent using minimax with alpha-beta pruning. Difficulty levels: Easy/Medium/Hard.
- **boardView.js** - DOM rendering and user interaction.
- **main.js** - Application entry point.

### Key Design Patterns

- Immutable board updates: `applyMove()` returns new board, never mutates
- Mandatory captures: if jumps exist, simple moves are disallowed
- Multi-jump sequences tracked via recursive `generateJumpMovesRecursive()`
- Board coordinates: row 0 = top (BLACK side), row 7 = bottom (RED side)
- Dark squares only: pieces exist where `(row + col) % 2 !== 0`

### Piece Constants

```javascript
PIECE.EMPTY = 0, PIECE.RED = 1, PIECE.RED_KING = 2, PIECE.BLACK = 3, PIECE.BLACK_KING = 4
PLAYER.RED = 'red', PLAYER.BLACK = 'black'
```

RED moves up (decreasing row), BLACK moves down (increasing row). RED starts first.

## Testing

- Unit tests in `tests/` using Jest with jsdom environment
- Integration tests use Puppeteer (`puppeteer.test.js`)
- Test setup in `tests/setup.js`
- Coverage threshold: 70% (branches, functions, lines, statements)
