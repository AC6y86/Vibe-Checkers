/**
 * Main entry point for Checkers Web App
 *
 * This file initializes the application and coordinates between
 * the various modules (game state, UI, AI, etc.)
 */

// Main application initialization
document.addEventListener('DOMContentLoaded', () => {
    console.log('Checkers app initializing...');

    // Initialize the board
    initializeBoard();

    // Setup event listeners
    setupEventListeners();

    console.log('Checkers app ready!');
});

/**
 * Initialize the checkers board grid
 */
function initializeBoard() {
    const board = document.getElementById('board');

    // Create 8x8 grid of squares
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const square = document.createElement('div');
            square.className = 'square';
            square.dataset.row = row;
            square.dataset.col = col;

            // Alternate light and dark squares
            if ((row + col) % 2 === 0) {
                square.classList.add('light');
            } else {
                square.classList.add('dark');
            }

            board.appendChild(square);
        }
    }

    console.log('Board initialized');
}

/**
 * Setup event listeners for game controls
 */
function setupEventListeners() {
    // Mode selection buttons
    document.getElementById('vs-ai-easy')?.addEventListener('click', () => {
        console.log('Starting game: vs AI (Easy)');
    });

    document.getElementById('vs-ai-medium')?.addEventListener('click', () => {
        console.log('Starting game: vs AI (Medium)');
    });

    document.getElementById('vs-ai-hard')?.addEventListener('click', () => {
        console.log('Starting game: vs AI (Hard)');
    });

    document.getElementById('local-2p')?.addEventListener('click', () => {
        console.log('Starting game: Local 2-Player');
    });

    document.getElementById('online-2p')?.addEventListener('click', () => {
        console.log('Starting game: Online 2-Player');
    });

    // Game action buttons
    document.getElementById('hint-btn')?.addEventListener('click', () => {
        console.log('Hint requested');
    });

    document.getElementById('new-game-btn')?.addEventListener('click', () => {
        console.log('New game requested');
    });

    console.log('Event listeners setup complete');
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initializeBoard,
        setupEventListeners
    };
}
