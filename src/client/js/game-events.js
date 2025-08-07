// ============================================================================
// GAME EVENTS AND UTILITIES
// ============================================================================

/**
 * Custom event types for the game
 */
const GameEvents = {
    CARD_PLAYED: 'cardPlayed',
    TURN_CHANGED: 'turnChanged',
    ROUND_ENDED: 'roundEnded',
    GAME_STARTED: 'gameStarted',
    GAME_ENDED: 'gameEnded',
    PLAYER_SKIPPED: 'playerSkipped'
};

/**
 * Event emitter for game events
 */
class GameEventEmitter {
    constructor() {
        this.listeners = {};
    }

    /**
     * Adds an event listener
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     */
    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    }

    /**
     * Removes an event listener
     * @param {string} event - Event name
     * @param {Function} callback - Callback function to remove
     */
    off(event, callback) {
        if (!this.listeners[event]) return;
        
        const index = this.listeners[event].indexOf(callback);
        if (index > -1) {
            this.listeners[event].splice(index, 1);
        }
    }

    /**
     * Emits an event with data
     * @param {string} event - Event name
     * @param {*} data - Event data
     */
    emit(event, data) {
        if (!this.listeners[event]) return;
        
        this.listeners[event].forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`Error in event listener for ${event}:`, error);
            }
        });
    }
}

/**
 * Utility functions for the game
 */
class GameUtils {
    /**
     * Generates a random position for card placement
     * @param {Object} config - Positioning configuration
     * @returns {Object} - Object with x and y coordinates
     */
    static generateRandomPosition(config) {
        const x = Math.floor(Math.random() * (config.MAX_X - config.MIN_X)) + config.MIN_X;
        const y = Math.floor(Math.random() * (config.MAX_Y - config.MIN_Y)) + config.MIN_Y;
        return { x, y };
    }

    /**
     * Validates player names
     * @param {Array<string>} playerNames - Array of player names
     * @returns {Object} - Validation result with isValid and errors
     */
    static validatePlayerNames(playerNames) {
        const errors = [];
        
        if (!Array.isArray(playerNames)) {
            errors.push('Player names must be an array');
            return { isValid: false, errors };
        }

        if (playerNames.length !== 4) {
            errors.push('Exactly 4 players are required');
            return { isValid: false, errors };
        }

        playerNames.forEach((name, index) => {
            if (!name || !name.trim()) {
                errors.push(`Player ${index + 1} name is required`);
            } else if (name.trim().length < 2) {
                errors.push(`Player ${index + 1} name must be at least 2 characters`);
            }
        });

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Formats turn display text
     * @param {number} playerIndex - Player index (0-3)
     * @returns {string} - Formatted turn text
     */
    static formatTurnDisplay(playerIndex) {
        return `${playerIndex + 1}o turno`;
    }

    /**
     * Checks if an element is a card element
     * @param {HTMLElement} element - Element to check
     * @returns {boolean} - True if element is a card
     */
    static isCardElement(element) {
        if (!element || !element.classList) return false;
        
        return element.classList.contains('card_clubs') ||
               element.classList.contains('card_diamonds') ||
               element.classList.contains('card_hearts') ||
               element.classList.contains('card_spades');
    }

    /**
     * Debounces a function call
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in milliseconds
     * @returns {Function} - Debounced function
     */
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Throttles a function call
     * @param {Function} func - Function to throttle
     * @param {number} limit - Time limit in milliseconds
     * @returns {Function} - Throttled function
     */
    static throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
}

/**
 * Error handling utilities
 */
class GameErrorHandler {
    /**
     * Handles game errors gracefully
     * @param {Error} error - The error to handle
     * @param {string} context - Context where the error occurred
     */
    static handleError(error, context = 'Unknown') {
        console.error(`Game error in ${context}:`, error);
        
        // You could add more sophisticated error handling here
        // such as sending to an error reporting service
    }

    /**
     * Validates game state
     * @param {GameState} gameState - Game state to validate
     * @returns {boolean} - True if state is valid
     */
    static validateGameState(gameState) {
        if (!gameState) return false;
        if (!Array.isArray(gameState.players)) return false;
        if (gameState.players.length !== 4) return false;
        if (gameState.currentPlayerIndex < 0 || gameState.currentPlayerIndex >= 4) return false;
        
        return true;
    }
}

// Export for use in other modules (if using modules)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        GameEvents,
        GameEventEmitter,
        GameUtils,
        GameErrorHandler
    };
} 