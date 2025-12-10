/**
 * Rules Engine for American Checkers
 * Handles move generation, validation, and game rules
 */

// Piece types
export const PIECE = {
  EMPTY: 0,
  RED: 1,
  RED_KING: 2,
  BLACK: 3,
  BLACK_KING: 4
};

// Player constants
export const PLAYER = {
  RED: 'red',
  BLACK: 'black'
};

/**
 * Check if a position is within board bounds
 */
function isInBounds(row, col) {
  return row >= 0 && row < 8 && col >= 0 && col < 8;
}

/**
 * Get the owner of a piece
 */
export function getPieceOwner(piece) {
  if (piece === PIECE.RED || piece === PIECE.RED_KING) return PLAYER.RED;
  if (piece === PIECE.BLACK || piece === PIECE.BLACK_KING) return PLAYER.BLACK;
  return null;
}

/**
 * Check if a piece is a king
 */
export function isKing(piece) {
  return piece === PIECE.RED_KING || piece === PIECE.BLACK_KING;
}

/**
 * Check if a piece belongs to the given player
 */
export function isPlayerPiece(piece, player) {
  return getPieceOwner(piece) === player;
}

/**
 * Get opponent player
 */
export function getOpponent(player) {
  return player === PLAYER.RED ? PLAYER.BLACK : PLAYER.RED;
}

/**
 * Get valid movement directions for a piece
 * Regular pieces move forward only, kings move in all diagonal directions
 */
function getDirections(piece) {
  if (piece === PIECE.RED) {
    // Red moves up (decreasing row)
    return [[-1, -1], [-1, 1]];
  } else if (piece === PIECE.BLACK) {
    // Black moves down (increasing row)
    return [[1, -1], [1, 1]];
  } else if (isKing(piece)) {
    // Kings move in all diagonal directions
    return [[-1, -1], [-1, 1], [1, -1], [1, 1]];
  }
  return [];
}

/**
 * Generate simple (non-capture) moves for a piece at given position
 */
function generateSimpleMoves(board, row, col) {
  const piece = board[row][col];
  const moves = [];
  const directions = getDirections(piece);

  for (const [dr, dc] of directions) {
    const newRow = row + dr;
    const newCol = col + dc;

    if (isInBounds(newRow, newCol) && board[newRow][newCol] === PIECE.EMPTY) {
      moves.push({
        from: { row, col },
        to: { row: newRow, col: newCol },
        isJump: false
      });
    }
  }

  return moves;
}

/**
 * Generate jump moves (captures) for a piece at given position
 * Recursively handles multi-jump sequences
 */
function generateJumpMovesRecursive(board, row, col, visitedBoard = null, capturedPieces = [], originalRow = null, originalCol = null) {
  // Create a copy of the board to track visited positions during multi-jumps
  if (visitedBoard === null) {
    visitedBoard = board.map(row => [...row]);
    originalRow = row;
    originalCol = col;
  }

  const piece = visitedBoard[row][col];
  const player = getPieceOwner(piece);
  const jumps = [];
  const directions = getDirections(piece);

  for (const [dr, dc] of directions) {
    const jumpedRow = row + dr;
    const jumpedCol = col + dc;
    const landRow = row + dr * 2;
    const landCol = col + dc * 2;

    // Check if we can jump over an opponent piece
    if (isInBounds(landRow, landCol)) {
      const jumpedPiece = visitedBoard[jumpedRow][jumpedCol];
      const landPiece = visitedBoard[landRow][landCol];

      // Valid jump: land on empty square, jump over opponent piece
      if (landPiece === PIECE.EMPTY &&
          jumpedPiece !== PIECE.EMPTY &&
          getPieceOwner(jumpedPiece) === getOpponent(player)) {

        // Make the jump on the temporary board
        const newBoard = visitedBoard.map(row => [...row]);
        newBoard[landRow][landCol] = piece;
        newBoard[row][col] = PIECE.EMPTY;
        newBoard[jumpedRow][jumpedCol] = PIECE.EMPTY;

        const newCaptured = [...capturedPieces, { row: jumpedRow, col: jumpedCol }];

        // Check for additional jumps (multi-jump)
        const continuedJumps = generateJumpMovesRecursive(
          board, // Original board for reference
          landRow,
          landCol,
          newBoard,
          newCaptured,
          originalRow,
          originalCol
        );

        if (continuedJumps.length > 0) {
          // Add all continued jump sequences
          jumps.push(...continuedJumps);
        } else {
          // No more jumps available, this is a complete jump sequence
          jumps.push({
            from: { row: originalRow, col: originalCol },
            to: { row: landRow, col: landCol },
            isJump: true,
            captured: newCaptured
          });
        }
      }
    }
  }

  // If this is the initial call and we found jumps, return only the complete sequences
  if (capturedPieces.length === 0) {
    return jumps;
  }

  // For recursive calls, if no further jumps found, return empty to signal sequence end
  return jumps;
}

/**
 * Generate all jump moves for a piece
 */
export function generateJumps(board, position) {
  return generateJumpMovesRecursive(board, position.row, position.col);
}

/**
 * Generate all legal moves for a piece at given position
 * Returns array of move objects with from/to positions
 */
export function generateMoves(board, position) {
  const { row, col } = position;

  // Validate position
  if (!isInBounds(row, col)) {
    return [];
  }

  const piece = board[row][col];

  // No piece at position
  if (piece === PIECE.EMPTY) {
    return [];
  }

  // Check for jumps first (mandatory captures)
  const jumps = generateJumpMovesRecursive(board, row, col);

  if (jumps.length > 0) {
    // If jumps are available, only return jumps (captures are mandatory)
    return jumps;
  }

  // No jumps available, return simple moves
  return generateSimpleMoves(board, row, col);
}

/**
 * Generate all legal moves for a player
 * Takes into account mandatory capture rule
 */
export function generateAllMoves(board, player) {
  const allMoves = [];
  const allJumps = [];

  // First pass: collect all moves and jumps
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];

      if (isPlayerPiece(piece, player)) {
        const jumps = generateJumpMovesRecursive(board, row, col);
        const simpleMoves = generateSimpleMoves(board, row, col);

        if (jumps.length > 0) {
          allJumps.push(...jumps);
        }
        allMoves.push(...simpleMoves);
      }
    }
  }

  // If any jumps exist, only return jumps (mandatory capture)
  if (allJumps.length > 0) {
    return allJumps;
  }

  return allMoves;
}

/**
 * Check if a specific move is valid
 */
export function isValidMove(board, from, to, player) {
  if (!isInBounds(from.row, from.col) || !isInBounds(to.row, to.col)) {
    return false;
  }

  const piece = board[from.row][from.col];

  // Must be player's piece
  if (!isPlayerPiece(piece, player)) {
    return false;
  }

  // Generate all legal moves for this piece
  const legalMoves = generateMoves(board, from);

  // Check if the requested move is in the legal moves list
  return legalMoves.some(move =>
    move.to.row === to.row && move.to.col === to.col
  );
}

/**
 * Check if a player has any legal moves available
 */
export function hasLegalMoves(board, player) {
  return generateAllMoves(board, player).length > 0;
}

/**
 * Apply a move to the board and return the new board state
 * Does not modify the original board
 */
export function applyMove(board, move) {
  const newBoard = board.map(row => [...row]);
  const piece = newBoard[move.from.row][move.from.col];

  // Move the piece
  newBoard[move.to.row][move.to.col] = piece;
  newBoard[move.from.row][move.from.col] = PIECE.EMPTY;

  // Remove captured pieces if this was a jump
  if (move.isJump && move.captured) {
    for (const captured of move.captured) {
      newBoard[captured.row][captured.col] = PIECE.EMPTY;
    }
  }

  // Promote to king if reached opposite end
  // RED moves up (to row 0), BLACK moves down (to row 7)
  if (piece === PIECE.RED && move.to.row === 0) {
    newBoard[move.to.row][move.to.col] = PIECE.RED_KING;
  } else if (piece === PIECE.BLACK && move.to.row === 7) {
    newBoard[move.to.row][move.to.col] = PIECE.BLACK_KING;
  }

  return newBoard;
}
