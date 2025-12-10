/**
 * Unit tests for Rules Engine
 */

import {
  PIECE,
  PLAYER,
  getPieceOwner,
  isKing,
  isPlayerPiece,
  getOpponent,
  generateMoves,
  generateJumps,
  generateAllMoves,
  isValidMove,
  hasLegalMoves,
  applyMove
} from '../src/rules.js';

describe('Rules Engine - Helper Functions', () => {
  test('getPieceOwner returns correct owner', () => {
    expect(getPieceOwner(PIECE.RED)).toBe(PLAYER.RED);
    expect(getPieceOwner(PIECE.RED_KING)).toBe(PLAYER.RED);
    expect(getPieceOwner(PIECE.BLACK)).toBe(PLAYER.BLACK);
    expect(getPieceOwner(PIECE.BLACK_KING)).toBe(PLAYER.BLACK);
    expect(getPieceOwner(PIECE.EMPTY)).toBe(null);
  });

  test('isKing identifies kings correctly', () => {
    expect(isKing(PIECE.RED_KING)).toBe(true);
    expect(isKing(PIECE.BLACK_KING)).toBe(true);
    expect(isKing(PIECE.RED)).toBe(false);
    expect(isKing(PIECE.BLACK)).toBe(false);
    expect(isKing(PIECE.EMPTY)).toBe(false);
  });

  test('isPlayerPiece identifies ownership correctly', () => {
    expect(isPlayerPiece(PIECE.RED, PLAYER.RED)).toBe(true);
    expect(isPlayerPiece(PIECE.RED_KING, PLAYER.RED)).toBe(true);
    expect(isPlayerPiece(PIECE.BLACK, PLAYER.BLACK)).toBe(true);
    expect(isPlayerPiece(PIECE.BLACK_KING, PLAYER.BLACK)).toBe(true);
    expect(isPlayerPiece(PIECE.RED, PLAYER.BLACK)).toBe(false);
    expect(isPlayerPiece(PIECE.EMPTY, PLAYER.RED)).toBe(false);
  });

  test('getOpponent returns correct opponent', () => {
    expect(getOpponent(PLAYER.RED)).toBe(PLAYER.BLACK);
    expect(getOpponent(PLAYER.BLACK)).toBe(PLAYER.RED);
  });
});

describe('Rules Engine - Basic Moves', () => {
  test('Red piece moves diagonally forward (up)', () => {
    const board = [
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, PIECE.RED, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0]
    ];

    const moves = generateMoves(board, { row: 5, col: 3 });

    expect(moves).toHaveLength(2);
    expect(moves).toContainEqual({
      from: { row: 5, col: 3 },
      to: { row: 4, col: 2 },
      isJump: false
    });
    expect(moves).toContainEqual({
      from: { row: 5, col: 3 },
      to: { row: 4, col: 4 },
      isJump: false
    });
  });

  test('Black piece moves diagonally forward (down)', () => {
    const board = [
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, PIECE.BLACK, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0]
    ];

    const moves = generateMoves(board, { row: 2, col: 3 });

    expect(moves).toHaveLength(2);
    expect(moves).toContainEqual({
      from: { row: 2, col: 3 },
      to: { row: 3, col: 2 },
      isJump: false
    });
    expect(moves).toContainEqual({
      from: { row: 2, col: 3 },
      to: { row: 3, col: 4 },
      isJump: false
    });
  });

  test('Piece at edge has limited moves', () => {
    const board = [
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [PIECE.RED, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0]
    ];

    const moves = generateMoves(board, { row: 5, col: 0 });

    expect(moves).toHaveLength(1);
    expect(moves[0].to).toEqual({ row: 4, col: 1 });
  });

  test('Blocked piece has no moves', () => {
    const board = [
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, PIECE.RED, 0, PIECE.RED, 0, 0, 0],
      [0, 0, 0, PIECE.RED, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0]
    ];

    const moves = generateMoves(board, { row: 5, col: 3 });

    expect(moves).toHaveLength(0);
  });
});

describe('Rules Engine - King Moves', () => {
  test('King moves in all four diagonal directions', () => {
    const board = [
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, PIECE.RED_KING, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0]
    ];

    const moves = generateMoves(board, { row: 4, col: 3 });

    expect(moves).toHaveLength(4);
    expect(moves).toContainEqual({
      from: { row: 4, col: 3 },
      to: { row: 3, col: 2 },
      isJump: false
    });
    expect(moves).toContainEqual({
      from: { row: 4, col: 3 },
      to: { row: 3, col: 4 },
      isJump: false
    });
    expect(moves).toContainEqual({
      from: { row: 4, col: 3 },
      to: { row: 5, col: 2 },
      isJump: false
    });
    expect(moves).toContainEqual({
      from: { row: 4, col: 3 },
      to: { row: 5, col: 4 },
      isJump: false
    });
  });

  test('Black king can move backwards', () => {
    const board = [
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, PIECE.BLACK_KING, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0]
    ];

    const moves = generateMoves(board, { row: 4, col: 3 });

    expect(moves).toHaveLength(4);
    // Should include backward moves (decreasing row for black)
    const backwardMoves = moves.filter(m => m.to.row < 4);
    expect(backwardMoves).toHaveLength(2);
  });
});

describe('Rules Engine - Single Jumps', () => {
  test('Red piece can jump over black piece', () => {
    const board = [
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, PIECE.BLACK, 0, 0, 0, 0],
      [0, 0, 0, 0, PIECE.RED, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0]
    ];

    const moves = generateMoves(board, { row: 5, col: 4 });

    expect(moves).toHaveLength(1);
    expect(moves[0]).toEqual({
      from: { row: 5, col: 4 },
      to: { row: 3, col: 2 },
      isJump: true,
      captured: [{ row: 4, col: 3 }]
    });
  });

  test('Black piece can jump over red piece', () => {
    const board = [
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, PIECE.BLACK, 0, 0, 0, 0],
      [0, 0, 0, 0, PIECE.RED, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0]
    ];

    const moves = generateMoves(board, { row: 2, col: 3 });

    expect(moves).toHaveLength(1);
    expect(moves[0]).toEqual({
      from: { row: 2, col: 3 },
      to: { row: 4, col: 5 },
      isJump: true,
      captured: [{ row: 3, col: 4 }]
    });
  });

  test('Cannot jump over own piece', () => {
    const board = [
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, PIECE.RED, 0, 0, 0, 0],
      [0, 0, 0, 0, PIECE.RED, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0]
    ];

    const moves = generateMoves(board, { row: 5, col: 4 });

    expect(moves).toHaveLength(1);
    expect(moves[0].isJump).toBe(false);
  });

  test('King can jump backwards', () => {
    const board = [
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, PIECE.RED_KING, 0, 0, 0, 0],
      [0, 0, 0, 0, PIECE.BLACK, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0]
    ];

    const moves = generateMoves(board, { row: 3, col: 3 });

    expect(moves.some(m => m.to.row === 5 && m.to.col === 5 && m.isJump)).toBe(true);
  });
});

describe('Rules Engine - Multi-Jump Sequences', () => {
  test('Red piece performs double jump', () => {
    const board = [
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, PIECE.BLACK, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, PIECE.BLACK, 0, 0],
      [0, 0, 0, 0, PIECE.RED, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0]
    ];

    const moves = generateMoves(board, { row: 5, col: 4 });

    // Should have multi-jump sequence
    const multiJump = moves.find(m =>
      m.to.row === 1 && m.to.col === 4 && m.captured.length === 2
    );

    expect(multiJump).toBeDefined();
    expect(multiJump.captured).toHaveLength(2);
    expect(multiJump.captured).toContainEqual({ row: 4, col: 5 });
    expect(multiJump.captured).toContainEqual({ row: 2, col: 5 });
  });

  test('Multiple multi-jump paths available', () => {
    const board = [
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, PIECE.BLACK, 0, PIECE.BLACK, 0, 0, 0],
      [0, 0, 0, PIECE.RED_KING, 0, 0, 0, 0],
      [0, 0, PIECE.BLACK, 0, PIECE.BLACK, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0]
    ];

    const moves = generateMoves(board, { row: 3, col: 3 });

    // King should have multiple jump options in different directions
    const jumpMoves = moves.filter(m => m.isJump);
    expect(jumpMoves.length).toBeGreaterThan(0);
  });
});

describe('Rules Engine - Mandatory Capture', () => {
  test('Must jump if jump is available', () => {
    const board = [
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, PIECE.BLACK, 0, 0, 0, 0, 0],
      [0, 0, 0, PIECE.RED, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0]
    ];

    const moves = generateMoves(board, { row: 5, col: 3 });

    // Should only return jump moves, not simple moves
    expect(moves.every(m => m.isJump)).toBe(true);
    expect(moves).toHaveLength(1);
  });

  test('generateAllMoves returns only jumps when available for any piece', () => {
    const board = [
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, PIECE.BLACK, 0, 0, 0, 0, 0],
      [0, 0, 0, PIECE.RED, 0, PIECE.RED, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0]
    ];

    const moves = generateAllMoves(board, PLAYER.RED);

    // Piece at (5,3) can jump, piece at (5,5) can only move
    // Should only return the jump
    expect(moves.every(m => m.isJump)).toBe(true);
  });
});

describe('Rules Engine - Move Validation', () => {
  test('isValidMove accepts legal move', () => {
    const board = [
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, PIECE.RED, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0]
    ];

    const valid = isValidMove(
      board,
      { row: 5, col: 3 },
      { row: 4, col: 2 },
      PLAYER.RED
    );

    expect(valid).toBe(true);
  });

  test('isValidMove rejects illegal move', () => {
    const board = [
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, PIECE.RED, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0]
    ];

    const valid = isValidMove(
      board,
      { row: 5, col: 3 },
      { row: 6, col: 3 }, // Trying to move straight down
      PLAYER.RED
    );

    expect(valid).toBe(false);
  });

  test('isValidMove rejects move of opponent piece', () => {
    const board = [
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, PIECE.BLACK, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0]
    ];

    const valid = isValidMove(
      board,
      { row: 2, col: 3 },
      { row: 3, col: 4 },
      PLAYER.RED // Red trying to move black piece
    );

    expect(valid).toBe(false);
  });
});

describe('Rules Engine - Game State', () => {
  test('hasLegalMoves detects available moves', () => {
    const board = [
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, PIECE.RED, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0]
    ];

    expect(hasLegalMoves(board, PLAYER.RED)).toBe(true);
  });

  test('hasLegalMoves detects no moves available', () => {
    const board = [
      [PIECE.RED, PIECE.RED, 0, 0, 0, 0, 0, 0],
      [PIECE.RED, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0]
    ];

    // Red piece at top left corner blocked by other red pieces, cannot move forward
    expect(hasLegalMoves(board, PLAYER.RED)).toBe(false);
  });
});

describe('Rules Engine - Apply Move', () => {
  test('applyMove executes simple move correctly', () => {
    const board = [
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, PIECE.RED, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0]
    ];

    const move = {
      from: { row: 5, col: 3 },
      to: { row: 4, col: 2 },
      isJump: false
    };

    const newBoard = applyMove(board, move);

    expect(newBoard[5][3]).toBe(PIECE.EMPTY);
    expect(newBoard[4][2]).toBe(PIECE.RED);
    expect(board[5][3]).toBe(PIECE.RED); // Original board unchanged
  });

  test('applyMove executes jump and removes captured piece', () => {
    const board = [
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, PIECE.BLACK, 0, 0, 0, 0],
      [0, 0, 0, 0, PIECE.RED, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0]
    ];

    const move = {
      from: { row: 5, col: 4 },
      to: { row: 3, col: 2 },
      isJump: true,
      captured: [{ row: 4, col: 3 }]
    };

    const newBoard = applyMove(board, move);

    expect(newBoard[5][4]).toBe(PIECE.EMPTY);
    expect(newBoard[3][2]).toBe(PIECE.RED);
    expect(newBoard[4][3]).toBe(PIECE.EMPTY); // Captured piece removed
  });

  test('applyMove promotes red piece to king at row 0', () => {
    const board = [
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, PIECE.RED, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0]
    ];

    const move = {
      from: { row: 1, col: 1 },
      to: { row: 0, col: 0 },
      isJump: false
    };

    const newBoard = applyMove(board, move);

    expect(newBoard[0][0]).toBe(PIECE.RED_KING);
  });

  test('applyMove promotes black piece to king at row 7', () => {
    const board = [
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, PIECE.BLACK, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0]
    ];

    const move = {
      from: { row: 6, col: 1 },
      to: { row: 7, col: 0 },
      isJump: false
    };

    const newBoard = applyMove(board, move);

    expect(newBoard[7][0]).toBe(PIECE.BLACK_KING);
  });

  test('applyMove executes multi-jump correctly', () => {
    const board = [
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, PIECE.BLACK, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, PIECE.BLACK, 0, 0],
      [0, 0, 0, 0, PIECE.RED, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0]
    ];

    const move = {
      from: { row: 5, col: 4 },
      to: { row: 1, col: 4 },
      isJump: true,
      captured: [{ row: 4, col: 5 }, { row: 2, col: 3 }]
    };

    const newBoard = applyMove(board, move);

    expect(newBoard[5][4]).toBe(PIECE.EMPTY);
    expect(newBoard[1][4]).toBe(PIECE.RED);
    expect(newBoard[4][5]).toBe(PIECE.EMPTY);
    expect(newBoard[2][3]).toBe(PIECE.EMPTY);
  });
});
