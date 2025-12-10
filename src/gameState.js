/**
 * GameState Module - Manages game state, board, turns, and game flow
 */

import {
  PIECE,
  PLAYER,
  generateMoves,
  generateAllMoves,
  isValidMove,
  applyMove,
  hasLegalMoves,
  getOpponent
} from './rules.js';

/**
 * Initialize a standard checkers board with starting position
 * BLACK pieces on rows 0-2 (move down/increasing row), RED pieces on rows 5-7 (move up/decreasing row)
 * Pieces only placed on dark squares (where row + col is odd)
 */
export function initializeBoard() {
  const board = [];

  for (let row = 0; row < 8; row++) {
    board[row] = [];
    for (let col = 0; col < 8; col++) {
      // Dark squares are where (row + col) is odd
      const isDarkSquare = (row + col) % 2 !== 0;

      if (!isDarkSquare) {
        // Light squares are always empty in checkers
        board[row][col] = PIECE.EMPTY;
      } else if (row < 3) {
        // BLACK pieces on top three rows (move down/increasing row)
        board[row][col] = PIECE.BLACK;
      } else if (row > 4) {
        // RED pieces on bottom three rows (move up/decreasing row)
        board[row][col] = PIECE.RED;
      } else {
        // Middle two rows are empty
        board[row][col] = PIECE.EMPTY;
      }
    }
  }

  return board;
}

/**
 * GameState class - Manages the complete state of a checkers game
 */
export class GameState {
  /**
   * Create a new game with optional initial board state
   * @param {Array} initialBoard - Optional 8x8 board array (defaults to standard starting position)
   * @param {string} startingPlayer - Optional starting player (defaults to RED)
   */
  constructor(initialBoard = null, startingPlayer = PLAYER.RED) {
    this.board = initialBoard || initializeBoard();
    this.currentPlayer = startingPlayer;
    this.gameStatus = 'active'; // 'active', 'finished'
    this.winner = null;
    this.moveHistory = [];
    this.capturedPieces = {
      [PLAYER.RED]: 0,
      [PLAYER.BLACK]: 0
    };
  }

  /**
   * Get the current board state
   * Returns a copy to prevent external modification
   */
  getBoard() {
    return this.board.map(row => [...row]);
  }

  /**
   * Get the current player
   */
  getCurrentPlayer() {
    return this.currentPlayer;
  }

  /**
   * Check if the game is over
   */
  isGameOver() {
    return this.gameStatus === 'finished';
  }

  /**
   * Get the winner (null if game is not over)
   */
  getWinner() {
    return this.winner;
  }

  /**
   * Get the complete move history
   */
  getMoveHistory() {
    return [...this.moveHistory];
  }

  /**
   * Get the game status
   */
  getGameStatus() {
    return this.gameStatus;
  }

  /**
   * Get count of captured pieces
   */
  getCapturedPieces() {
    return { ...this.capturedPieces };
  }

  /**
   * Get all legal moves for a specific position
   * @param {Object} position - {row, col}
   */
  getLegalMoves(position) {
    if (this.isGameOver()) {
      return [];
    }
    return generateMoves(this.board, position);
  }

  /**
   * Get all legal moves for the current player
   */
  getAllLegalMoves() {
    if (this.isGameOver()) {
      return [];
    }
    return generateAllMoves(this.board, this.currentPlayer);
  }

  /**
   * Make a move on the board
   * @param {Object} from - {row, col} starting position
   * @param {Object} to - {row, col} ending position
   * @returns {boolean} true if move was successful, false otherwise
   */
  makeMove(from, to) {
    // Can't make moves if game is over
    if (this.isGameOver()) {
      console.warn('Cannot make move: game is already over');
      return false;
    }

    // Validate the move
    if (!isValidMove(this.board, from, to, this.currentPlayer)) {
      console.warn('Invalid move attempted:', from, to);
      return false;
    }

    // Get all legal moves to find the complete move object (includes jump info)
    const legalMoves = generateMoves(this.board, from);
    const moveObj = legalMoves.find(m => m.to.row === to.row && m.to.col === to.col);

    if (!moveObj) {
      console.warn('Move not found in legal moves');
      return false;
    }

    // Apply the move
    const newBoard = applyMove(this.board, moveObj);

    // Track captured pieces
    if (moveObj.isJump && moveObj.captured) {
      const opponent = getOpponent(this.currentPlayer);
      this.capturedPieces[opponent] += moveObj.captured.length;
    }

    // Record move in history
    this.moveHistory.push({
      from: { ...from },
      to: { ...to },
      player: this.currentPlayer,
      isJump: moveObj.isJump,
      captured: moveObj.captured ? [...moveObj.captured] : [],
      moveNumber: this.moveHistory.length + 1
    });

    // Update board
    this.board = newBoard;

    // Switch to next player
    this.currentPlayer = getOpponent(this.currentPlayer);

    // Check if game is over (next player has no legal moves)
    if (!hasLegalMoves(this.board, this.currentPlayer)) {
      this.gameStatus = 'finished';
      this.winner = getOpponent(this.currentPlayer); // Previous player wins
    }

    return true;
  }

  /**
   * Reset the game to initial state
   */
  reset() {
    this.board = initializeBoard();
    this.currentPlayer = PLAYER.RED;
    this.gameStatus = 'active';
    this.winner = null;
    this.moveHistory = [];
    this.capturedPieces = {
      [PLAYER.RED]: 0,
      [PLAYER.BLACK]: 0
    };
  }

  /**
   * Create a copy of the current game state
   */
  clone() {
    const clonedGame = new GameState(this.getBoard(), this.currentPlayer);
    clonedGame.gameStatus = this.gameStatus;
    clonedGame.winner = this.winner;
    clonedGame.moveHistory = [...this.moveHistory];
    clonedGame.capturedPieces = { ...this.capturedPieces };
    return clonedGame;
  }

  /**
   * Get a summary of the current game state
   */
  getGameSummary() {
    return {
      currentPlayer: this.currentPlayer,
      gameStatus: this.gameStatus,
      winner: this.winner,
      moveCount: this.moveHistory.length,
      capturedPieces: this.getCapturedPieces(),
      hasLegalMoves: !this.isGameOver() && this.getAllLegalMoves().length > 0
    };
  }
}

/**
 * Create a new game instance
 * Convenience factory function
 */
export function createNewGame() {
  return new GameState();
}
