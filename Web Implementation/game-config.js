// ============================================================================
// GAME CONFIGURATION
// ============================================================================

/**
 * Game configuration constants
 */
const GameConfig = {
    // Card configuration
    SUITS: ['clubs', 'diamonds', 'hearts', 'spades'],
    RANKS: ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'],
    VALUES: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
    
    // Game rules
    NUMBER_OF_PLAYERS: 4,
    CARDS_PER_PLAYER: 13,
    SHUFFLE_ITERATIONS: 1000,
    
    // UI configuration
    CARD_POSITIONING: {
        MIN_X: 40,
        MAX_X: 45,
        MIN_Y: 35,
        MAX_Y: 40
    },
    
    // Animation configuration
    GLOW_ANIMATION: 'glow 1s infinite alternate',
    
    // DOM element IDs
    ELEMENT_IDS: {
        PLAYER_INPUTS: ['Player1', 'Player2', 'Player3', 'Player4'],
        DECK_CONTAINERS: ['deck1', 'deck2', 'deck3', 'deck4'],
        NEW_GAME_BUTTON: 'input[value="Novo Jogo"]',
        SKIP_TURN_BUTTON: 'passarRodada',
        TURN_DISPLAY: 'numerorodada'
    },
    
    // CSS classes
    CSS_CLASSES: {
        CARD_BASE: 'card_',
        SUIT_CLASSES: {
            clubs: 'card_clubs',
            diamonds: 'card_diamonds',
            hearts: 'card_hearts',
            spades: 'card_spades'
        }
    },
    
    // Game phases
    GAME_PHASES: {
        WAITING: 'waiting',
        PLAYING: 'playing',
        ROUND_END: 'roundEnd',
        GAME_OVER: 'gameOver'
    }
};

// Export for use in other modules (if using modules)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameConfig;
} 