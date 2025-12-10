/**
 * Unit tests for AI Engine
 */

import { PIECE, PLAYER } from '../src/rules.js';
import { GameState } from '../src/gameState.js';
import {
  evaluateBoard,
  getDifficultyDepth,
  isTerminalState,
  orderMoves,
  minimax,
  getMiniMaxMove,
  getBestMove,
  getHint
} from '../src/ai.js';

describe('AI Engine - Difficulty Configuration', () => {
  test('getDifficultyDepth returns correct depth for easy', () => {
    expect(getDifficultyDepth('easy')).toBe(3);
    expect(getDifficultyDepth('Easy')).toBe(3);
    expect(getDifficultyDepth('EASY')).toBe(3);
  });

  test('getDifficultyDepth returns correct depth for medium', () => {
    expect(getDifficultyDepth('medium')).toBe(5);
    expect(getDifficultyDepth('Medium')).toBe(5);
  });

  test('getDifficultyDepth returns correct depth for hard', () => {
    expect(getDifficultyDepth('hard')).toBe(7);
    expect(getDifficultyDepth('Hard')).toBe(7);
  });

  test('getDifficultyDepth returns default for unknown difficulty', () => {
    expect(getDifficultyDepth('unknown')).toBe(5);
    expect(getDifficultyDepth('')).toBe(5);
  });
});

describe('AI Engine - Board Evaluation', () => {
  test('evaluateBoard returns 0 for equal material', () => {
    const board = Array(8).fill(null).map(() => Array(8).fill(PIECE.EMPTY));
    board[5][0] = PIECE.RED;
    board[2][1] = PIECE.BLACK;

    const score = evaluateBoard(board, PLAYER.RED);

    // Should be roughly equal (within positioning bonuses)
    expect(Math.abs(score)).toBeLessThan(5);
  });

  test('evaluateBoard favors player with more pieces', () => {
    const board = Array(8).fill(null).map(() => Array(8).fill(PIECE.EMPTY));
    board[5][0] = PIECE.RED;
    board[5][2] = PIECE.RED;
    board[2][1] = PIECE.BLACK;

    const score = evaluateBoard(board, PLAYER.RED);

    expect(score).toBeGreaterThan(0); // RED has more pieces
  });

  test('evaluateBoard values kings higher than regular pieces', () => {
    const boardWithKing = Array(8).fill(null).map(() => Array(8).fill(PIECE.EMPTY));
    boardWithKing[3][3] = PIECE.RED_KING;

    const boardWithRegular = Array(8).fill(null).map(() => Array(8).fill(PIECE.EMPTY));
    boardWithRegular[3][3] = PIECE.RED;

    const kingScore = evaluateBoard(boardWithKing, PLAYER.RED);
    const regularScore = evaluateBoard(boardWithRegular, PLAYER.RED);

    expect(kingScore).toBeGreaterThan(regularScore);
  });

  test('evaluateBoard returns negative score when opponent is winning', () => {
    const board = Array(8).fill(null).map(() => Array(8).fill(PIECE.EMPTY));
    board[5][0] = PIECE.RED;
    board[2][1] = PIECE.BLACK;
    board[2][3] = PIECE.BLACK;
    board[2][5] = PIECE.BLACK;

    const score = evaluateBoard(board, PLAYER.RED);

    expect(score).toBeLessThan(0); // BLACK has more pieces
  });

  test('evaluateBoard gives positional bonuses', () => {
    const centerBoard = Array(8).fill(null).map(() => Array(8).fill(PIECE.EMPTY));
    centerBoard[4][4] = PIECE.RED; // Center square

    const edgeBoard = Array(8).fill(null).map(() => Array(8).fill(PIECE.EMPTY));
    edgeBoard[5][0] = PIECE.RED; // Edge square at same advancement level

    const centerScore = evaluateBoard(centerBoard, PLAYER.RED);
    const edgeScore = evaluateBoard(edgeBoard, PLAYER.RED);

    expect(centerScore).toBeGreaterThan(edgeScore); // Center is better
  });
});

describe('AI Engine - Terminal State Detection', () => {
  test('isTerminalState returns false for active game', () => {
    const game = new GameState();

    expect(isTerminalState(game)).toBe(false);
  });

  test('isTerminalState returns true when game is over', () => {
    const board = Array(8).fill(null).map(() => Array(8).fill(PIECE.EMPTY));
    board[5][4] = PIECE.RED;
    board[4][3] = PIECE.BLACK;

    const game = new GameState(board, PLAYER.RED);
    game.makeMove({ row: 5, col: 4 }, { row: 3, col: 2 }); // Capture last BLACK piece

    expect(isTerminalState(game)).toBe(true);
  });
});

describe('AI Engine - Move Ordering', () => {
  test('orderMoves prioritizes captures over simple moves', () => {
    const moves = [
      { from: { row: 5, col: 0 }, to: { row: 4, col: 1 }, isJump: false },
      { from: { row: 5, col: 2 }, to: { row: 3, col: 4 }, isJump: true, captured: [{ row: 4, col: 3 }] },
      { from: { row: 5, col: 4 }, to: { row: 4, col: 5 }, isJump: false }
    ];

    const ordered = orderMoves(moves);

    expect(ordered[0].isJump).toBe(true); // Capture should be first
  });

  test('orderMoves maintains relative order for non-captures', () => {
    const moves = [
      { from: { row: 5, col: 0 }, to: { row: 4, col: 1 }, isJump: false },
      { from: { row: 5, col: 2 }, to: { row: 4, col: 3 }, isJump: false }
    ];

    const ordered = orderMoves(moves);

    expect(ordered).toHaveLength(2);
    expect(ordered.every(m => !m.isJump)).toBe(true);
  });
});

describe('AI Engine - Minimax Algorithm', () => {
  test('minimax returns numeric score', () => {
    const game = new GameState();
    const score = minimax(game, 2, -Infinity, Infinity, true, PLAYER.RED);

    expect(typeof score).toBe('number');
    expect(isNaN(score)).toBe(false);
  });

  test('minimax detects winning position', () => {
    // Board where RED can capture last BLACK piece
    const board = Array(8).fill(null).map(() => Array(8).fill(PIECE.EMPTY));
    board[5][4] = PIECE.RED;
    board[4][3] = PIECE.BLACK;

    const game = new GameState(board, PLAYER.RED);
    const score = minimax(game, 3, -Infinity, Infinity, true, PLAYER.RED);

    // Should recognize this as a winning position
    expect(score).toBeGreaterThan(1000);
  });

  test('minimax returns negative score for losing position', () => {
    // Board where BLACK has overwhelming advantage
    const board = Array(8).fill(null).map(() => Array(8).fill(PIECE.EMPTY));
    board[5][0] = PIECE.RED;
    board[2][1] = PIECE.BLACK_KING;
    board[2][3] = PIECE.BLACK_KING;
    board[2][5] = PIECE.BLACK_KING;

    const game = new GameState(board, PLAYER.RED);
    const score = minimax(game, 3, -Infinity, Infinity, true, PLAYER.RED);

    expect(score).toBeLessThan(0);
  });
});

describe('AI Engine - Best Move Selection', () => {
  test('getMiniMaxMove returns valid move object', () => {
    const game = new GameState();
    const move = getMiniMaxMove(game, 3);

    expect(move).not.toBeNull();
    expect(move).toHaveProperty('from');
    expect(move).toHaveProperty('to');
    expect(move).toHaveProperty('score');
    expect(move.from).toHaveProperty('row');
    expect(move.from).toHaveProperty('col');
    expect(move.to).toHaveProperty('row');
    expect(move.to).toHaveProperty('col');
  });

  test('getMiniMaxMove returns null when no moves available', () => {
    const board = Array(8).fill(null).map(() => Array(8).fill(PIECE.EMPTY));
    const game = new GameState(board, PLAYER.RED);

    const move = getMiniMaxMove(game, 3);

    expect(move).toBeNull();
  });

  test('getMiniMaxMove prefers captures when available', () => {
    // Set up board where RED can capture
    const board = Array(8).fill(null).map(() => Array(8).fill(PIECE.EMPTY));
    board[5][4] = PIECE.RED;
    board[4][3] = PIECE.BLACK;
    board[5][0] = PIECE.RED; // Alternative non-capture move

    const game = new GameState(board, PLAYER.RED);
    const move = getMiniMaxMove(game, 3);

    expect(move).not.toBeNull();
    // Should choose the capture (from 5,4 to 3,2)
    expect(move.from).toEqual({ row: 5, col: 4 });
    expect(move.to).toEqual({ row: 3, col: 2 });
  });

  test('getMiniMaxMove returns legal move', () => {
    const game = new GameState();
    const move = getMiniMaxMove(game, 3);

    expect(move).not.toBeNull();

    // Try to apply the move to verify it's legal
    const testGame = game.clone();
    const result = testGame.makeMove(move.from, move.to);

    expect(result).toBe(true);
  });
});

describe('AI Engine - getBestMove API', () => {
  test('getBestMove returns move without score', () => {
    const game = new GameState();
    const move = getBestMove(game, 'easy');

    expect(move).not.toBeNull();
    expect(move).toHaveProperty('from');
    expect(move).toHaveProperty('to');
    expect(move).not.toHaveProperty('score'); // Score should not be exposed
  });

  test('getBestMove works with different difficulty levels', () => {
    const game = new GameState();

    const easyMove = getBestMove(game, 'easy');
    const mediumMove = getBestMove(game, 'medium');
    const hardMove = getBestMove(game, 'hard');

    expect(easyMove).not.toBeNull();
    expect(mediumMove).not.toBeNull();
    expect(hardMove).not.toBeNull();
  });

  test('getBestMove returns legal move', () => {
    const game = new GameState();
    const move = getBestMove(game, 'medium');

    expect(move).not.toBeNull();

    // Verify move is legal
    const testGame = game.clone();
    const result = testGame.makeMove(move.from, move.to);

    expect(result).toBe(true);
  });

  test('getBestMove returns null when no moves available', () => {
    const board = Array(8).fill(null).map(() => Array(8).fill(PIECE.EMPTY));
    const game = new GameState(board, PLAYER.RED);

    const move = getBestMove(game, 'medium');

    expect(move).toBeNull();
  });
});

describe('AI Engine - getHint Function', () => {
  test('getHint returns move with score', () => {
    const game = new GameState();
    const hint = getHint(game);

    expect(hint).not.toBeNull();
    expect(hint).toHaveProperty('from');
    expect(hint).toHaveProperty('to');
    expect(hint).toHaveProperty('score');
  });

  test('getHint returns legal move', () => {
    const game = new GameState();
    const hint = getHint(game);

    expect(hint).not.toBeNull();

    const testGame = game.clone();
    const result = testGame.makeMove(hint.from, hint.to);

    expect(result).toBe(true);
  });
});

describe('AI Engine - Integration with GameState', () => {
  test('AI can play a complete game sequence', () => {
    const game = new GameState();
    let moveCount = 0;
    const maxMoves = 10;

    while (!game.isGameOver() && moveCount < maxMoves) {
      const move = getBestMove(game, 'easy');

      if (!move) break;

      const result = game.makeMove(move.from, move.to);
      expect(result).toBe(true);

      moveCount++;
    }

    expect(moveCount).toBeGreaterThan(0);
  });

  test('AI makes valid moves for both RED and BLACK', () => {
    const game = new GameState();

    // RED's turn
    const redMove = getBestMove(game, 'easy');
    expect(redMove).not.toBeNull();
    game.makeMove(redMove.from, redMove.to);

    // BLACK's turn
    const blackMove = getBestMove(game, 'easy');
    expect(blackMove).not.toBeNull();
    game.makeMove(blackMove.from, blackMove.to);

    expect(game.getMoveHistory()).toHaveLength(2);
  });
});

describe('AI Engine - Performance', () => {
  test('Easy difficulty completes within reasonable time', () => {
    const game = new GameState();
    const startTime = Date.now();

    getBestMove(game, 'easy');

    const elapsedTime = Date.now() - startTime;
    expect(elapsedTime).toBeLessThan(200); // Should be < 200ms
  });

  test('Medium difficulty completes within reasonable time', () => {
    const game = new GameState();
    const startTime = Date.now();

    getBestMove(game, 'medium');

    const elapsedTime = Date.now() - startTime;
    expect(elapsedTime).toBeLessThan(1000); // Should be < 1s
  });

  test('Hard difficulty completes within reasonable time', () => {
    const game = new GameState();
    const startTime = Date.now();

    getBestMove(game, 'hard');

    const elapsedTime = Date.now() - startTime;
    expect(elapsedTime).toBeLessThan(3000); // Should be < 3s
  }, 5000); // Set test timeout to 5s
});
