/**
 * Game Configuration
 * 
 * This file contains all the game configuration constants and settings
 * that are shared between the client and server.
 */

// Card suits and ranks
const CARD_SUITS = ['hearts', 'diamonds', 'clubs', 'spades'];
const CARD_RANKS = [
    '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'
];

// Card values (3=3, ..., A=14, 2=15)
const CARD_VALUES = {
    '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
    'J': 11, 'Q': 12, 'K': 13, 'A': 14, '2': 15
};

// Game settings
const GAME_CONFIG = {
    // Number of players
    MIN_PLAYERS: 2,
    MAX_PLAYERS: 4,
    
    // Cards per player (for 4 players: 13 cards each)
    CARDS_PER_PLAYER: 13,
    
    // Turn timeout in milliseconds (e.g., 30 seconds per turn)
    TURN_TIMEOUT: 30000,
    
    // Animation durations in milliseconds
    ANIMATION_DURATIONS: {
        CARD_DEAL: 100,
        CARD_PLAY: 300,
        CARD_MOVE: 500,
        NOTIFICATION: 2000
    },
    
    // UI settings
    UI: {
        CARD_WIDTH: 80,
        CARD_HEIGHT: 116,
        CARD_OFFSET: 25, // Horizontal offset for card fanning
        CARD_RAISE: 20   // How much cards raise on hover
    }
};

// Game phases
const GAME_PHASES = {
    WAITING: 'waiting',   // Waiting for players
    PLAYING: 'playing',   // Game in progress
    ROUND_END: 'roundEnd', // Round ended
    GAME_OVER: 'gameOver' // Game over
};

// Player positions (for 4-player game)
const PLAYER_POSITIONS = [
    { id: 0, name: 'Player 1', className: 'player-1' },
    { id: 1, name: 'Player 2', className: 'player-2' },
    { id: 2, name: 'Player 3', className: 'player-3' },
    { id: 3, name: 'Player 4', className: 'player-4' }
];

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    // Node.js/CommonJS
    module.exports = {
        CARD_SUITS,
        CARD_RANKS,
        CARD_VALUES,
        GAME_CONFIG,
        GAME_PHASES,
        PLAYER_POSITIONS
    };
} else {
    // Browser/global
    window.GameConfig = {
        CARD_SUITS,
        CARD_RANKS,
        CARD_VALUES,
        GAME_CONFIG,
        GAME_PHASES,
        PLAYER_POSITIONS
    };
}
