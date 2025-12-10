/**
 * Board View Module - Handles rendering and user interaction
 */

import { PIECE, PLAYER } from './rules.js';

// Internal state
let currentGameState = null;
let selectedSquare = null;
let validMoves = [];
let onMoveCompleteCallback = null;

/**
 * Create a piece DOM element
 */
export function createPieceElement(piece) {
  const div = document.createElement('div');
  div.className = 'piece';

  if (piece === PIECE.RED || piece === PIECE.RED_KING) {
    div.classList.add('red');
  } else if (piece === PIECE.BLACK || piece === PIECE.BLACK_KING) {
    div.classList.add('black');
  }

  if (piece === PIECE.RED_KING || piece === PIECE.BLACK_KING) {
    div.classList.add('king');
  }

  return div;
}

/**
 * Clear all pieces from the board
 */
export function clearPieces() {
  const squares = document.querySelectorAll('.square');
  squares.forEach(square => {
    square.innerHTML = '';
  });
}

/**
 * Clear all highlights (selected, highlighted, and hint classes)
 */
export function clearHighlights() {
  const squares = document.querySelectorAll('.square');
  squares.forEach(square => {
    square.classList.remove('selected', 'highlighted', 'hint-from', 'hint-to');
  });
}

/**
 * Clear entire board (pieces and highlights)
 */
export function clearBoard() {
  clearPieces();
  clearHighlights();
}

/**
 * Render pieces from board state
 */
export function renderPieces(boardState) {
  clearPieces();

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = boardState[row][col];
      if (piece !== PIECE.EMPTY) {
        const square = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        if (square) {
          const pieceElement = createPieceElement(piece);
          square.appendChild(pieceElement);
        }
      }
    }
  }
}

/**
 * Highlight valid move destinations
 */
export function highlightValidMoves(moves) {
  clearHighlights();

  moves.forEach(move => {
    const square = document.querySelector(`[data-row="${move.to.row}"][data-col="${move.to.col}"]`);
    if (square) {
      square.classList.add('highlighted');
    }
  });
}

/**
 * Highlight a hint move (from and to squares)
 */
export function highlightHint(from, to) {
  clearHighlights();

  const fromSquare = document.querySelector(`[data-row="${from.row}"][data-col="${from.col}"]`);
  const toSquare = document.querySelector(`[data-row="${to.row}"][data-col="${to.col}"]`);

  if (fromSquare) {
    fromSquare.classList.add('hint-from');
  }
  if (toSquare) {
    toSquare.classList.add('hint-to');
  }
}

/**
 * Select a square and show valid moves
 */
export function selectSquare(row, col, gameState) {
  // Clear previous selection
  clearHighlights();

  // Mark square as selected
  const square = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
  if (square) {
    square.classList.add('selected');
  }

  // Store selected square
  selectedSquare = { row, col };

  // Get and highlight valid moves
  validMoves = gameState.getLegalMoves({ row, col });
  highlightValidMoves(validMoves);
}

/**
 * Deselect current square
 */
export function deselectSquare() {
  clearHighlights();
  selectedSquare = null;
  validMoves = [];
}

/**
 * Get the currently selected square
 */
export function getSelectedSquare() {
  return selectedSquare;
}

/**
 * Get current valid moves
 */
export function getValidMoves() {
  return validMoves;
}

/**
 * Check if a square is highlighted as a valid move
 */
export function isSquareHighlighted(row, col) {
  const square = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
  return square && square.classList.contains('highlighted');
}

/**
 * Execute a move
 */
export function executeMove(from, to, gameState) {
  const success = gameState.makeMove(from, to);

  if (success) {
    // Clear selection and highlights
    deselectSquare();

    // Re-render board with new state
    renderBoard(gameState);

    // Update game info
    updateGameInfo(gameState);

    // Trigger callback if set (for AI moves, etc.)
    if (onMoveCompleteCallback) {
      onMoveCompleteCallback(gameState);
    }

    return true;
  }

  return false;
}

/**
 * Update game information displays
 */
export function updateGameInfo(gameState) {
  // Update current player
  const currentPlayerElement = document.getElementById('current-player');
  if (currentPlayerElement) {
    const player = gameState.getCurrentPlayer();
    currentPlayerElement.textContent = player === PLAYER.RED ? 'Red' : 'Black';
    currentPlayerElement.className = `player-indicator ${player}`;
  }

  // Update game status
  const gameStatusElement = document.getElementById('game-status');
  if (gameStatusElement) {
    if (gameState.isGameOver()) {
      const winner = gameState.getWinner();
      gameStatusElement.textContent = winner ? `${winner === PLAYER.RED ? 'Red' : 'Black'} Wins!` : 'Draw';
      gameStatusElement.className = 'status-message winner';
    } else {
      gameStatusElement.textContent = 'Game in progress';
      gameStatusElement.className = 'status-message active';
    }
  }

  // Update captured pieces count
  const captured = gameState.getCapturedPieces();
  const redCapturedElement = document.querySelector('#stats-panel .captured-red');
  const blackCapturedElement = document.querySelector('#stats-panel .captured-black');

  if (redCapturedElement) {
    redCapturedElement.textContent = captured[PLAYER.BLACK] || 0; // RED captured BLACK pieces
  }
  if (blackCapturedElement) {
    blackCapturedElement.textContent = captured[PLAYER.RED] || 0; // BLACK captured RED pieces
  }
}

/**
 * Handle square click event
 */
export function handleSquareClick(event) {
  if (!currentGameState) return;

  // Find the clicked square
  const square = event.target.closest('.square');
  if (!square) return;

  const row = parseInt(square.dataset.row);
  const col = parseInt(square.dataset.col);

  // Get piece at clicked square
  const board = currentGameState.getBoard();
  const piece = board[row][col];
  const currentPlayer = currentGameState.getCurrentPlayer();

  // Check if game is over
  if (currentGameState.isGameOver()) {
    console.log('Game is over. Start a new game.');
    return;
  }

  // Case 1: Clicking on currently selected square - deselect
  if (selectedSquare && selectedSquare.row === row && selectedSquare.col === col) {
    deselectSquare();
    return;
  }

  // Case 2: Clicking on a highlighted square (valid move destination) - execute move
  if (selectedSquare && isSquareHighlighted(row, col)) {
    executeMove(selectedSquare, { row, col }, currentGameState);
    return;
  }

  // Case 3: Clicking on own piece - select it
  if (piece !== PIECE.EMPTY) {
    const pieceOwner = (piece === PIECE.RED || piece === PIECE.RED_KING) ? PLAYER.RED : PLAYER.BLACK;

    if (pieceOwner === currentPlayer) {
      selectSquare(row, col, currentGameState);
      return;
    }
  }

  // Case 4: Clicking elsewhere - deselect
  deselectSquare();
}

/**
 * Setup event listeners on board squares
 */
export function setupBoardEventListeners() {
  const boardElement = document.getElementById('board');

  if (boardElement) {
    // Use event delegation - single listener on board
    boardElement.addEventListener('click', handleSquareClick);
  }
}

/**
 * Remove event listeners (for cleanup)
 */
export function removeBoardEventListeners() {
  const boardElement = document.getElementById('board');

  if (boardElement) {
    boardElement.removeEventListener('click', handleSquareClick);
  }
}

/**
 * Render the complete board
 */
export function renderBoard(gameState) {
  const board = gameState.getBoard();
  renderPieces(board);
  updateGameInfo(gameState);
}

/**
 * Initialize board view with game state
 * @param {GameState} gameState - The game state to render
 * @param {Function} onMoveComplete - Optional callback called after each move
 */
export function initializeBoardView(gameState, onMoveComplete = null) {
  // Store game state reference
  currentGameState = gameState;

  // Store callback
  onMoveCompleteCallback = onMoveComplete;

  // Reset selection state
  selectedSquare = null;
  validMoves = [];

  // Clear any existing listeners
  removeBoardEventListeners();

  // Setup new event listeners
  setupBoardEventListeners();

  // Render initial board state
  renderBoard(gameState);
}

/**
 * Get current game state (for testing/debugging)
 */
export function getCurrentGameState() {
  return currentGameState;
}
