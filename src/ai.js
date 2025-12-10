/**
 * AI Engine for Checkers
 * Implements Minimax algorithm with alpha-beta pruning
 */

import { PIECE, PLAYER, isKing, getPieceOwner } from './rules.js';

/**
 * Difficulty level configurations
 */
const DIFFICULTY_CONFIG = {
  easy: { depth: 3, name: 'Easy' },
  medium: { depth: 5, name: 'Medium' },
  hard: { depth: 7, name: 'Hard' }
};

/**
 * Get search depth for difficulty level
 */
export function getDifficultyDepth(difficulty) {
  const normalizedDifficulty = difficulty.toLowerCase();
  return DIFFICULTY_CONFIG[normalizedDifficulty]?.depth || 5;
}

/**
 * Evaluate the board position for a given player
 * Returns positive score if player is winning, negative if losing
 */
export function evaluateBoard(board, player) {
  let score = 0;

  // Piece values
  const PIECE_VALUE = 10;
  const KING_VALUE = 30;
  const BACK_ROW_BONUS = 2;
  const CENTER_BONUS = 1;
  const ADVANCEMENT_BONUS = 0.5;

  // Count center squares (rows 2-5, cols 2-5)
  const isCenterSquare = (row, col) => row >= 2 && row <= 5 && col >= 2 && col <= 5;

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece === PIECE.EMPTY) continue;

      const pieceOwner = getPieceOwner(piece);
      const pieceIsKing = isKing(piece);

      // Base piece value
      let pieceScore = pieceIsKing ? KING_VALUE : PIECE_VALUE;

      // Positional bonuses
      if (!pieceIsKing) {
        // Back row protection bonus
        if ((pieceOwner === PLAYER.RED && row === 7) ||
            (pieceOwner === PLAYER.BLACK && row === 0)) {
          pieceScore += BACK_ROW_BONUS;
        }

        // Advancement bonus (closer to promotion)
        if (pieceOwner === PLAYER.RED) {
          // RED moves up (toward row 0)
          pieceScore += (7 - row) * ADVANCEMENT_BONUS;
        } else {
          // BLACK moves down (toward row 7)
          pieceScore += row * ADVANCEMENT_BONUS;
        }
      }

      // Center control bonus
      if (isCenterSquare(row, col)) {
        pieceScore += CENTER_BONUS;
      }

      // Add or subtract based on ownership
      if (pieceOwner === player) {
        score += pieceScore;
      } else {
        score -= pieceScore;
      }
    }
  }

  return score;
}

/**
 * Check if the game state is terminal (game over or no moves)
 */
export function isTerminalState(gameState) {
  return gameState.isGameOver();
}

/**
 * Order moves to improve alpha-beta pruning efficiency
 * Captures first, then other moves
 */
export function orderMoves(moves) {
  return moves.sort((a, b) => {
    // Prioritize jumps (captures)
    if (a.isJump && !b.isJump) return -1;
    if (!a.isJump && b.isJump) return 1;

    // Prioritize moves that advance pieces (for non-jumps)
    if (!a.isJump && !b.isJump) {
      const aAdvancement = Math.abs(a.to.row - a.from.row);
      const bAdvancement = Math.abs(b.to.row - b.from.row);
      return bAdvancement - aAdvancement;
    }

    return 0;
  });
}

/**
 * Minimax algorithm with alpha-beta pruning
 *
 * @param {GameState} gameState - Current game state
 * @param {number} depth - Remaining search depth
 * @param {number} alpha - Best score for maximizing player
 * @param {number} beta - Best score for minimizing player
 * @param {boolean} isMaximizing - True if maximizing player's turn
 * @param {string} aiPlayer - The AI player (RED or BLACK)
 * @returns {number} - Evaluated score of the position
 */
export function minimax(gameState, depth, alpha, beta, isMaximizing, aiPlayer) {
  // Terminal state or max depth reached
  if (depth === 0 || isTerminalState(gameState)) {
    if (gameState.isGameOver()) {
      const winner = gameState.getWinner();
      if (winner === aiPlayer) {
        return 10000 + depth; // Prefer faster wins
      } else if (winner === null) {
        return 0; // Draw
      } else {
        return -10000 - depth; // Prefer slower losses
      }
    }
    return evaluateBoard(gameState.getBoard(), aiPlayer);
  }

  const currentPlayer = gameState.getCurrentPlayer();
  const moves = orderMoves(gameState.getAllLegalMoves());

  if (moves.length === 0) {
    // No legal moves - game over
    const opponent = currentPlayer === PLAYER.RED ? PLAYER.BLACK : PLAYER.RED;
    return opponent === aiPlayer ? 10000 + depth : -10000 - depth;
  }

  if (isMaximizing) {
    let maxScore = -Infinity;

    for (const move of moves) {
      const clonedState = gameState.clone();
      clonedState.makeMove(move.from, move.to);

      const score = minimax(clonedState, depth - 1, alpha, beta, false, aiPlayer);
      maxScore = Math.max(maxScore, score);
      alpha = Math.max(alpha, score);

      // Alpha-beta pruning
      if (beta <= alpha) {
        break;
      }
    }

    return maxScore;
  } else {
    let minScore = Infinity;

    for (const move of moves) {
      const clonedState = gameState.clone();
      clonedState.makeMove(move.from, move.to);

      const score = minimax(clonedState, depth - 1, alpha, beta, true, aiPlayer);
      minScore = Math.min(minScore, score);
      beta = Math.min(beta, score);

      // Alpha-beta pruning
      if (beta <= alpha) {
        break;
      }
    }

    return minScore;
  }
}

/**
 * Get the best move for the AI player using minimax
 *
 * @param {GameState} gameState - Current game state
 * @param {number} depth - Search depth
 * @returns {Object|null} - Best move { from, to, score } or null if no moves
 */
export function getMiniMaxMove(gameState, depth) {
  const aiPlayer = gameState.getCurrentPlayer();
  const moves = orderMoves(gameState.getAllLegalMoves());

  if (moves.length === 0) {
    return null;
  }

  let bestMove = null;
  let bestScore = -Infinity;

  for (const move of moves) {
    const clonedState = gameState.clone();
    clonedState.makeMove(move.from, move.to);

    const score = minimax(clonedState, depth - 1, -Infinity, Infinity, false, aiPlayer);

    if (score > bestScore) {
      bestScore = score;
      bestMove = {
        from: move.from,
        to: move.to,
        score: score
      };
    }
  }

  return bestMove;
}

/**
 * Get the best move for the AI at a given difficulty level
 * Main entry point for AI move selection
 *
 * @param {GameState} gameState - Current game state
 * @param {string} difficulty - Difficulty level: 'easy', 'medium', or 'hard'
 * @returns {Object|null} - Best move { from, to } or null if no moves
 */
export function getBestMove(gameState, difficulty = 'medium') {
  const depth = getDifficultyDepth(difficulty);
  const moveWithScore = getMiniMaxMove(gameState, depth);

  if (!moveWithScore) {
    return null;
  }

  // Return move without score for cleaner API
  return {
    from: moveWithScore.from,
    to: moveWithScore.to
  };
}

/**
 * Get a hint for the current player
 * Returns the best move with its evaluation score
 *
 * @param {GameState} gameState - Current game state
 * @param {string} player - Player to get hint for (optional, defaults to current player)
 * @returns {Object|null} - Best move { from, to, score } or null if no moves
 */
export function getHint(gameState, player = null) {
  const targetPlayer = player || gameState.getCurrentPlayer();

  if (gameState.getCurrentPlayer() !== targetPlayer) {
    console.warn('Cannot get hint for non-current player');
    return null;
  }

  return getMiniMaxMove(gameState, 5); // Use medium difficulty depth for hints
}
