/**
 * Main entry point for Checkers Web App
 *
 * This file initializes the application and coordinates between
 * the various modules (game state, UI, AI, etc.)
 */

import { createNewGame } from './gameState.js';
import { initializeBoardView, highlightHint } from './boardView.js';
import { getBestMove, getHint } from './ai.js';
import { PLAYER } from './rules.js';

// Game state
let gameState = null;
let gameMode = null; // 'local-2p', 'vs-ai-easy', 'vs-ai-medium', 'vs-ai-hard', 'online-2p'
let aiDifficulty = null; // 'easy', 'medium', 'hard'

// Main application initialization
document.addEventListener('DOMContentLoaded', () => {
    console.log('Checkers app initializing...');

    // Initialize the board grid
    initializeBoard();

    // Setup event listeners
    setupEventListeners();

    // Start default game (local 2-player)
    startNewGame('local-2p');
    updateModeButtonState('local-2p');

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
 * Start a new game with specified mode
 */
function startNewGame(mode) {
    console.log(`Starting new game: ${mode}`);

    // Create new game state
    gameState = createNewGame();
    gameMode = mode;

    // Set AI difficulty based on mode
    if (mode === 'vs-ai-easy') {
        aiDifficulty = 'easy';
    } else if (mode === 'vs-ai-medium') {
        aiDifficulty = 'medium';
    } else if (mode === 'vs-ai-hard') {
        aiDifficulty = 'hard';
    } else {
        aiDifficulty = null;
    }

    // Initialize board view with AI callback
    initializeBoardView(gameState, makeAIMove);

    console.log('Game started successfully');
}

/**
 * Make AI move if it's AI's turn
 */
function makeAIMove() {
    if (!gameState || !aiDifficulty) return;
    if (gameState.isGameOver()) return;

    const currentPlayer = gameState.getCurrentPlayer();

    // In vs AI mode, BLACK is the AI
    if (currentPlayer === PLAYER.BLACK) {
        console.log(`AI (${aiDifficulty}) is thinking...`);

        // Small delay to make AI feel more natural
        setTimeout(() => {
            const aiMove = getBestMove(gameState, aiDifficulty);

            if (aiMove) {
                console.log('AI move:', aiMove);
                const success = gameState.makeMove(aiMove.from, aiMove.to);

                if (success) {
                    // Re-initialize board view after AI move (but don't pass callback to avoid recursion)
                    initializeBoardView(gameState, makeAIMove);
                }
            }
        }, 500);
    }
}

/**
 * Update active state on mode buttons
 */
function updateModeButtonState(activeMode) {
    const vsAiBtn = document.getElementById('vs-ai-btn');
    const local2pBtn = document.getElementById('local-2p');
    const online2pBtn = document.getElementById('online-2p');

    // Remove active from all
    vsAiBtn?.classList.remove('active');
    local2pBtn?.classList.remove('active');
    online2pBtn?.classList.remove('active');

    // Add active to current mode
    if (activeMode.startsWith('vs-ai')) {
        vsAiBtn?.classList.add('active');
    } else if (activeMode === 'local-2p') {
        local2pBtn?.classList.add('active');
    } else if (activeMode === 'online-2p') {
        online2pBtn?.classList.add('active');
    }
}

/**
 * Update selected state in AI difficulty dropdown
 */
function updateAiDifficultySelection(difficulty) {
    const easyBtn = document.getElementById('vs-ai-easy');
    const mediumBtn = document.getElementById('vs-ai-medium');
    const hardBtn = document.getElementById('vs-ai-hard');

    easyBtn?.classList.remove('selected');
    mediumBtn?.classList.remove('selected');
    hardBtn?.classList.remove('selected');

    if (difficulty === 'easy') easyBtn?.classList.add('selected');
    else if (difficulty === 'medium') mediumBtn?.classList.add('selected');
    else if (difficulty === 'hard') hardBtn?.classList.add('selected');
}

/**
 * Setup event listeners for game controls
 */
function setupEventListeners() {
    // Dropdown toggle
    const dropdown = document.querySelector('.dropdown');
    const vsAiBtn = document.getElementById('vs-ai-btn');

    vsAiBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown?.classList.toggle('open');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
        dropdown?.classList.remove('open');
    });

    // AI difficulty selection
    document.getElementById('vs-ai-easy')?.addEventListener('click', (e) => {
        e.stopPropagation();
        updateAiDifficultySelection('easy');
        startNewGame('vs-ai-easy');
        updateModeButtonState('vs-ai-easy');
        dropdown?.classList.remove('open');
    });

    document.getElementById('vs-ai-medium')?.addEventListener('click', (e) => {
        e.stopPropagation();
        updateAiDifficultySelection('medium');
        startNewGame('vs-ai-medium');
        updateModeButtonState('vs-ai-medium');
        dropdown?.classList.remove('open');
    });

    document.getElementById('vs-ai-hard')?.addEventListener('click', (e) => {
        e.stopPropagation();
        updateAiDifficultySelection('hard');
        startNewGame('vs-ai-hard');
        updateModeButtonState('vs-ai-hard');
        dropdown?.classList.remove('open');
    });

    // Other mode buttons
    document.getElementById('local-2p')?.addEventListener('click', () => {
        startNewGame('local-2p');
        updateModeButtonState('local-2p');
    });

    document.getElementById('online-2p')?.addEventListener('click', () => {
        console.log('Online 2-Player not yet implemented');
        // startNewGame('online-2p');
        // updateModeButtonState('online-2p');
    });

    // Game action buttons
    document.getElementById('hint-btn')?.addEventListener('click', () => {
        if (!gameState || gameState.isGameOver()) {
            console.log('No game in progress');
            return;
        }

        const hint = getHint(gameState);
        if (hint) {
            highlightHint(hint.from, hint.to);
            console.log(`Hint: Move from (${hint.from.row},${hint.from.col}) to (${hint.to.row},${hint.to.col})`);
        } else {
            console.log('No hint available');
        }
    });

    document.getElementById('new-game-btn')?.addEventListener('click', () => {
        if (gameMode) {
            startNewGame(gameMode);
        } else {
            startNewGame('local-2p');
        }
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
