/**
 * Unit tests for GameState module
 */

import { PIECE, PLAYER } from '../src/rules.js';
import { GameState, initializeBoard, createNewGame } from '../src/gameState.js';

describe('GameState - Board Initialization', () => {
  test('initializeBoard creates 8x8 board', () => {
    const board = initializeBoard();

    expect(board).toHaveLength(8);
    expect(board[0]).toHaveLength(8);
  });

  test('initializeBoard places BLACK pieces on rows 0-2', () => {
    const board = initializeBoard();

    let blackCount = 0;
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 8; col++) {
        if (board[row][col] === PIECE.BLACK) {
          blackCount++;
          // Should only be on dark squares
          expect((row + col) % 2).toBe(1);
        }
      }
    }

    expect(blackCount).toBe(12); // Standard checkers has 12 pieces per side
  });

  test('initializeBoard places RED pieces on rows 5-7', () => {
    const board = initializeBoard();

    let redCount = 0;
    for (let row = 5; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if (board[row][col] === PIECE.RED) {
          redCount++;
          // Should only be on dark squares
          expect((row + col) % 2).toBe(1);
        }
      }
    }

    expect(redCount).toBe(12);
  });

  test('initializeBoard leaves center rows empty', () => {
    const board = initializeBoard();

    for (let row = 3; row < 5; row++) {
      for (let col = 0; col < 8; col++) {
        if ((row + col) % 2 !== 0) {
          // Dark squares in center should be empty
          expect(board[row][col]).toBe(PIECE.EMPTY);
        }
      }
    }
  });

  test('initializeBoard only places pieces on dark squares', () => {
    const board = initializeBoard();

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const isDarkSquare = (row + col) % 2 !== 0;
        if (!isDarkSquare) {
          expect(board[row][col]).toBe(PIECE.EMPTY);
        }
      }
    }
  });
});

describe('GameState - Constructor and Factory', () => {
  test('GameState constructor initializes with default board', () => {
    const game = new GameState();

    expect(game.getBoard()).toHaveLength(8);
    expect(game.getCurrentPlayer()).toBe(PLAYER.RED);
    expect(game.isGameOver()).toBe(false);
    expect(game.getWinner()).toBe(null);
  });

  test('GameState constructor accepts custom board', () => {
    const customBoard = Array(8).fill(null).map(() => Array(8).fill(PIECE.EMPTY));
    customBoard[3][3] = PIECE.RED;

    const game = new GameState(customBoard);

    expect(game.getBoard()[3][3]).toBe(PIECE.RED);
  });

  test('GameState constructor accepts custom starting player', () => {
    const game = new GameState(null, PLAYER.BLACK);

    expect(game.getCurrentPlayer()).toBe(PLAYER.BLACK);
  });

  test('createNewGame factory creates new game instance', () => {
    const game = createNewGame();

    expect(game).toBeInstanceOf(GameState);
    expect(game.getCurrentPlayer()).toBe(PLAYER.RED);
  });
});

describe('GameState - Getter Methods', () => {
  test('getBoard returns copy of board', () => {
    const game = new GameState();
    const board1 = game.getBoard();
    const board2 = game.getBoard();

    expect(board1).toEqual(board2);
    expect(board1).not.toBe(board2); // Different references

    // Modifying returned board should not affect internal state
    board1[0][0] = PIECE.BLACK_KING;
    expect(game.getBoard()[0][0]).not.toBe(PIECE.BLACK_KING);
  });

  test('getCurrentPlayer returns current player', () => {
    const game = new GameState();
    expect(game.getCurrentPlayer()).toBe(PLAYER.RED);
  });

  test('getGameStatus returns game status', () => {
    const game = new GameState();
    expect(game.getGameStatus()).toBe('active');
  });

  test('getMoveHistory returns copy of move history', () => {
    const game = new GameState();
    const history1 = game.getMoveHistory();
    const history2 = game.getMoveHistory();

    expect(history1).toEqual(history2);
    expect(history1).not.toBe(history2);
  });

  test('getCapturedPieces returns captured pieces count', () => {
    const game = new GameState();
    const captured = game.getCapturedPieces();

    expect(captured).toHaveProperty(PLAYER.RED);
    expect(captured).toHaveProperty(PLAYER.BLACK);
    expect(captured[PLAYER.RED]).toBe(0);
    expect(captured[PLAYER.BLACK]).toBe(0);
  });
});

describe('GameState - Move Execution', () => {
  test('makeMove executes valid simple move', () => {
    const game = new GameState();

    // RED piece at (5,0) can move to (4,1)
    const result = game.makeMove({ row: 5, col: 0 }, { row: 4, col: 1 });

    expect(result).toBe(true);
    expect(game.getBoard()[5][0]).toBe(PIECE.EMPTY);
    expect(game.getBoard()[4][1]).toBe(PIECE.RED);
  });

  test('makeMove switches player after valid move', () => {
    const game = new GameState();

    expect(game.getCurrentPlayer()).toBe(PLAYER.RED);

    game.makeMove({ row: 5, col: 0 }, { row: 4, col: 1 });

    expect(game.getCurrentPlayer()).toBe(PLAYER.BLACK);
  });

  test('makeMove rejects invalid move', () => {
    const game = new GameState();

    // Try to move to invalid position (straight ahead instead of diagonal)
    const result = game.makeMove({ row: 5, col: 0 }, { row: 4, col: 0 });

    expect(result).toBe(false);
    expect(game.getCurrentPlayer()).toBe(PLAYER.RED); // Player should not change
  });

  test('makeMove rejects move of opponent piece', () => {
    const game = new GameState();

    // RED's turn, try to move BLACK piece
    const result = game.makeMove({ row: 2, col: 1 }, { row: 3, col: 0 });

    expect(result).toBe(false);
  });

  test('makeMove records move in history', () => {
    const game = new GameState();

    game.makeMove({ row: 5, col: 0 }, { row: 4, col: 1 });

    const history = game.getMoveHistory();
    expect(history).toHaveLength(1);
    expect(history[0].from).toEqual({ row: 5, col: 0 });
    expect(history[0].to).toEqual({ row: 4, col: 1 });
    expect(history[0].player).toBe(PLAYER.RED);
    expect(history[0].moveNumber).toBe(1);
  });

  test('makeMove executes jump and tracks captured pieces', () => {
    // Set up a board with a jump opportunity
    const board = Array(8).fill(null).map(() => Array(8).fill(PIECE.EMPTY));
    board[5][4] = PIECE.RED;
    board[4][3] = PIECE.BLACK;

    const game = new GameState(board, PLAYER.RED);

    const result = game.makeMove({ row: 5, col: 4 }, { row: 3, col: 2 });

    expect(result).toBe(true);
    expect(game.getBoard()[5][4]).toBe(PIECE.EMPTY);
    expect(game.getBoard()[4][3]).toBe(PIECE.EMPTY); // Captured piece removed
    expect(game.getBoard()[3][2]).toBe(PIECE.RED);

    const captured = game.getCapturedPieces();
    expect(captured[PLAYER.BLACK]).toBe(1);
  });

  test('makeMove handles multi-jump correctly', () => {
    // Set up board for double jump
    const board = Array(8).fill(null).map(() => Array(8).fill(PIECE.EMPTY));
    board[5][4] = PIECE.RED;
    board[4][5] = PIECE.BLACK;
    board[2][5] = PIECE.BLACK;

    const game = new GameState(board, PLAYER.RED);

    const result = game.makeMove({ row: 5, col: 4 }, { row: 1, col: 4 });

    expect(result).toBe(true);
    expect(game.getBoard()[5][4]).toBe(PIECE.EMPTY);
    expect(game.getBoard()[4][5]).toBe(PIECE.EMPTY);
    expect(game.getBoard()[2][5]).toBe(PIECE.EMPTY);
    expect(game.getBoard()[1][4]).toBe(PIECE.RED);

    const captured = game.getCapturedPieces();
    expect(captured[PLAYER.BLACK]).toBe(2);
  });
});

describe('GameState - Game Over Detection', () => {
  test('Game detects when player has no legal moves', () => {
    // Create board where BLACK has no pieces left (captured all)
    const board = Array(8).fill(null).map(() => Array(8).fill(PIECE.EMPTY));
    board[5][4] = PIECE.RED;
    board[4][3] = PIECE.BLACK; // Last BLACK piece

    const game = new GameState(board, PLAYER.RED);

    // RED captures the last BLACK piece
    game.makeMove({ row: 5, col: 4 }, { row: 3, col: 2 });

    // Now it's BLACK's turn but BLACK has no pieces left
    expect(game.isGameOver()).toBe(true);
    expect(game.getWinner()).toBe(PLAYER.RED);
  });

  test('Game continues when both players have moves', () => {
    const game = new GameState();

    game.makeMove({ row: 5, col: 0 }, { row: 4, col: 1 });

    expect(game.isGameOver()).toBe(false);
    expect(game.getWinner()).toBe(null);
  });

  test('Cannot make move after game is over', () => {
    // Create board where BLACK has no pieces
    const board = Array(8).fill(null).map(() => Array(8).fill(PIECE.EMPTY));
    board[5][4] = PIECE.RED;
    board[4][3] = PIECE.BLACK;

    const game = new GameState(board, PLAYER.RED);
    game.makeMove({ row: 5, col: 4 }, { row: 3, col: 2 });

    expect(game.isGameOver()).toBe(true);

    // Try to make another move
    const result = game.makeMove({ row: 3, col: 2 }, { row: 2, col: 1 });
    expect(result).toBe(false);
  });
});

describe('GameState - Legal Moves', () => {
  test('getLegalMoves returns moves for specific piece', () => {
    const game = new GameState();

    const moves = game.getLegalMoves({ row: 5, col: 0 });

    expect(moves.length).toBeGreaterThan(0);
    expect(moves[0]).toHaveProperty('from');
    expect(moves[0]).toHaveProperty('to');
  });

  test('getAllLegalMoves returns all moves for current player', () => {
    const game = new GameState();

    const moves = game.getAllLegalMoves();

    expect(moves.length).toBeGreaterThan(0);
    // RED should have 7 pieces that can move forward (7 pieces * 2 directions = ~14 moves)
    expect(moves.length).toBeGreaterThanOrEqual(7);
  });

  test('getLegalMoves returns empty array when game is over', () => {
    const board = Array(8).fill(null).map(() => Array(8).fill(PIECE.EMPTY));
    board[5][4] = PIECE.RED;
    board[4][3] = PIECE.BLACK;

    const game = new GameState(board, PLAYER.RED);
    game.makeMove({ row: 5, col: 4 }, { row: 3, col: 2 });

    // Game is over, no moves should be returned
    const moves = game.getLegalMoves({ row: 3, col: 2 });
    expect(moves).toHaveLength(0);
  });
});

describe('GameState - Reset and Clone', () => {
  test('reset restores game to initial state', () => {
    const game = new GameState();

    game.makeMove({ row: 5, col: 0 }, { row: 4, col: 1 });
    game.makeMove({ row: 2, col: 1 }, { row: 3, col: 0 });

    game.reset();

    expect(game.getCurrentPlayer()).toBe(PLAYER.RED);
    expect(game.isGameOver()).toBe(false);
    expect(game.getWinner()).toBe(null);
    expect(game.getMoveHistory()).toHaveLength(0);
    expect(game.getCapturedPieces()[PLAYER.RED]).toBe(0);
    expect(game.getCapturedPieces()[PLAYER.BLACK]).toBe(0);

    // Board should be reset to initial position
    const board = game.getBoard();
    expect(board[5][0]).toBe(PIECE.RED);
    expect(board[2][1]).toBe(PIECE.BLACK);
  });

  test('clone creates independent copy of game state', () => {
    const game = new GameState();
    game.makeMove({ row: 5, col: 0 }, { row: 4, col: 1 });

    const clone = game.clone();

    // Clone should have same state
    expect(clone.getCurrentPlayer()).toBe(game.getCurrentPlayer());
    expect(clone.getMoveHistory()).toHaveLength(game.getMoveHistory().length);

    // But be independent
    clone.makeMove({ row: 2, col: 1 }, { row: 3, col: 0 });

    expect(clone.getMoveHistory()).toHaveLength(2);
    expect(game.getMoveHistory()).toHaveLength(1);
  });
});

describe('GameState - Game Summary', () => {
  test('getGameSummary returns complete game info', () => {
    const game = new GameState();

    const summary = game.getGameSummary();

    expect(summary).toHaveProperty('currentPlayer');
    expect(summary).toHaveProperty('gameStatus');
    expect(summary).toHaveProperty('winner');
    expect(summary).toHaveProperty('moveCount');
    expect(summary).toHaveProperty('capturedPieces');
    expect(summary).toHaveProperty('hasLegalMoves');

    expect(summary.currentPlayer).toBe(PLAYER.RED);
    expect(summary.gameStatus).toBe('active');
    expect(summary.moveCount).toBe(0);
    expect(summary.hasLegalMoves).toBe(true);
  });
});
