// ============================================================================
// DOMAIN MODELS
// ============================================================================

/**
 * Represents a playing card with suit, rank, and numeric value
 */
class Card {
    constructor(suit, rank, value) {
        this.suit = suit;
        this.rank = rank;
        this.value = value;
    }

    /**
     * Compares this card with another card
     * @param {Card} otherCard - The card to compare against
     * @returns {number} -1 if this card is lower, 0 if equal, 1 if higher
     */
    compareTo(otherCard) {
        if (this.value < otherCard.value) return -1;
        if (this.value > otherCard.value) return 1;
        return 0;
    }

    /**
     * Checks if this card can be played against the current highest card
     * @param {Card|null} currentHighestCard - The current highest card on the table
     * @returns {boolean} - True if the card can be played
     */
    canBePlayed(currentHighestCard) {
        if (!currentHighestCard) return true;
        return this.value > currentHighestCard.value;
    }
}

/**
 * Represents a deck of playing cards
 */
class Deck {
    constructor() {
        this.cards = [];
    }

    /**
     * Creates a standard 52-card deck
     */
    createDeck() {
        const suits = ['clubs', 'diamonds', 'hearts', 'spades'];
        const ranks = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'];
        const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

        this.cards = [];
        for (const suit of suits) {
            for (let i = 0; i < ranks.length; i++) {
                this.cards.push(new Card(suit, ranks[i], values[i]));
            }
        }
    }

    /**
     * Shuffles the deck using Fisher-Yates algorithm
     */
    shuffle() {
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }

    /**
     * Deals cards to players
     * @param {number} numberOfPlayers - Number of players to deal to
     * @param {number} cardsPerPlayer - Number of cards per player
     * @returns {Array<Array<Card>>} - Array of player hands
     */
    dealCards(numberOfPlayers, cardsPerPlayer) {
        const hands = [];
        for (let i = 0; i < numberOfPlayers; i++) {
            const startIndex = i * cardsPerPlayer;
            const endIndex = startIndex + cardsPerPlayer;
            hands.push(this.cards.slice(startIndex, endIndex));
        }
        return hands;
    }
}

/**
 * Represents a player in the game
 */
class Player {
    constructor(name, id) {
        this.name = name;
        this.id = id;
        this.hand = [];
        this.isWinner = false;
        this.finishPosition = null; // Track when player finishes (1st, 2nd, 3rd, 4th)
    }

    /**
     * Receives cards to their hand
     * @param {Array<Card>} cards - Cards to receive
     */
    receiveCards(cards) {
        this.hand = cards;
    }

    /**
     * Plays a card from their hand
     * @param {Card} card - The card to play
     * @returns {Card|null} - The played card or null if not found
     */
    playCard(card) {
        const cardIndex = this.hand.findIndex(c => 
            c.suit === card.suit && c.rank === card.rank && c.value === card.value
        );
        
        if (cardIndex !== -1) {
            return this.hand.splice(cardIndex, 1)[0];
        }
        return null;
    }

    /**
     * Checks if the player has any cards left
     * @returns {boolean} - True if player has no cards
     */
    hasNoCards() {
        return this.hand.length === 0;
    }

    /**
     * Marks the player as finished with a position
     * @param {number} position - The finish position (1-4)
     */
    markAsFinished(position) {
        this.isWinner = position === 1;
        this.finishPosition = position;
    }
}

// ============================================================================
// GAME STATE MANAGEMENT
// ============================================================================

/**
 * Manages the game state and rules
 */
class GameState {
    constructor() {
        this.players = [];
        this.currentPlayerIndex = 0;
        this.currentRound = 0;
        this.currentHighestCard = null; // Keep for backward compatibility
        this.currentHighestCards = []; // New: array of cards for multi-card plays
        this.roundWinner = null;
        this.gamePhase = 'waiting'; // waiting, playing, roundEnd, gameOver
        this.zIndex = 1;
        this.finishedPlayers = 0; // Track how many players have finished
        this.gameWinner = null;
        this.gameSecond = null;
        this.gameThird = null;
        this.gameLoser = null; // The Presidente (first to finish)

    }

    /**
     * Initializes the game with players
     * @param {Array<string>} playerNames - Array of player names
     */
    initializeGame(playerNames) {
        this.players = playerNames.map((name, index) => new Player(name, index));
        // Randomly select starting player for clockwise turn order
        this.currentPlayerIndex = Math.floor(Math.random() * this.players.length);
        this.currentRound = 0;
        this.currentHighestCard = null;
        this.currentHighestCards = [];
        this.roundWinner = null;
        this.gamePhase = 'playing';
        this.zIndex = 1;
        this.finishedPlayers = 0;
        this.gameWinner = null;
        this.gameSecond = null;
        this.gameThird = null;
        this.gameLoser = null;
        this.gameThird = null;
        this.gameLoser = null;
        
        // Log turn order for verification
        this.logTurnOrder();
    }

    /**
     * Gets the current player
     * @returns {Player} - Current player
     */
    getCurrentPlayer() {
        if (this.isWinner != 1)
            return this.players[this.currentPlayerIndex];
    }

    /**
     * Advances to the next player in clockwise order, skipping finished players
     */
    nextPlayer() {
        const previousPlayerIndex = this.currentPlayerIndex;
        let attempts = 0;
        const maxAttempts = this.players.length;
        
        do {
            this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
            attempts++;
            
            // Prevent infinite loop if all players are finished
            if (attempts >= maxAttempts) {
                break;
            }
        } while (this.players[this.currentPlayerIndex].hasNoCards());
        
        // Log turn progression for debugging
        const previousPlayer = this.players[previousPlayerIndex];
        const currentPlayer = this.getCurrentPlayer();
        const positions = ['Bottom', 'Right', 'Top', 'Left'];
        console.log(`Turn progression: ${previousPlayer.name} (${positions[previousPlayerIndex]}) → ${currentPlayer.name} (${positions[this.currentPlayerIndex]});`);

        this.currentRound++;
        
        // Check if round is complete (all active players have played)
        const activePlayers = this.players.filter(p => !p.hasNoCards()).length;
        if (this.currentRound >= activePlayers) {
            this.endRound();
        }
    }

    /**
     * Ends the current round and starts a new one
     */
    endRound() {
        this.currentRound = 0;
        this.currentHighestCard = null;
        this.currentHighestCards = [];
        
        // Clear the center area when round ends
        const centerArea = document.getElementById('centerArea');
        if (centerArea) {
            const playedCards = centerArea.querySelectorAll('.card-played');
            playedCards.forEach(card => card.remove());
        }
        
        if (this.roundWinner !== null) {
            this.currentPlayerIndex = this.roundWinner;
        }
        
        this.roundWinner = null;
    }

    /**
     * Attempts to play a card
     * @param {Player} player - The player attempting to play
     * @param {Card} card - The card to play
     * @returns {boolean} - True if the card was successfully played
     */
    playCard(player, card) {
        if (player !== this.getCurrentPlayer()) {
            return false;
        }

        if (!card.canBePlayed(this.currentHighestCard)) {
            return false;
        }

        const playedCard = player.playCard(card);
        if (!playedCard) {
            return false;
        }

        this.currentHighestCard = playedCard;
        this.roundWinner = player.id;
        
        // -------- Handle player finishing their hand --------
        if (player.hasNoCards()) {
            this.finishedPlayers++;
            player.markAsFinished(this.finishedPlayers);

            // Record player position variables based on order finished
            switch (this.finishedPlayers) {
                case 1:
                    this.gameWinner = player; // Presidente
                    break;
                case 2:
                    this.gameSecond = player; // Vice
                    break;
                case 3:
                    this.gameThird = player; // Sobre
                    break;
                case 4:
                    this.gameLoser = player; // Cu (last)
                    break;
            }

            // Only end the game when every player has finished
            if (this.finishedPlayers >= this.players.length) {
                this.gamePhase = 'gameOver';
            } else {
                // Clear the table so the next active player starts fresh
                this.currentHighestCard = null;
                this.currentHighestCards = [];
            }
        }
        
        this.nextPlayer();
        
        return true;
    }

    /**
     * Checks if multiple cards can be played
     * @param {Player} player - The player attempting to play
     * @param {Array<Card>} cards - The cards to play
     * @returns {boolean} - True if the cards can be played
     */
    canPlayCards(player, cards) {
        if (player !== this.getCurrentPlayer()) {
            return false;
        }

        if (!cards || cards.length === 0) {
            return false;
        }

        // All cards must have the same value
        const firstCardValue = cards[0].value;
        if (!cards.every(card => card.value === firstCardValue)) {
            return false;
        }

        // If no cards have been played yet, any cards can be played
        if (!this.currentHighestCards || this.currentHighestCards.length === 0) {
            return true;
        }

        // Must play the same number of cards as the current highest
        if (cards.length !== this.currentHighestCards.length) {
            return false;
        }

        // The value must be higher than the current highest cards
        const currentHighestValue = this.currentHighestCards[0].value;
        return firstCardValue > currentHighestValue;
    }

    /**
     * Attempts to play multiple cards
     * @param {Player} player - The player attempting to play
     * @param {Array<Card>} cards - The cards to play
     * @returns {boolean} - True if the cards were successfully played
     */
    playCards(player, cards) {
        if (!this.canPlayCards(player, cards)) {
            return false;
        }

        // Remove cards from player's hand
        const playedCards = [];
        for (const card of cards) {
            const playedCard = player.playCard(card);
            if (playedCard) {
                playedCards.push(playedCard);
            } else {
                // If we can't play a card, put back the ones we already removed
                playedCards.forEach(pc => player.hand.push(pc));
                return false;
            }
        }

        // Update game state
        this.currentHighestCards = playedCards;
        this.currentHighestCard = playedCards[0]; // Keep for backward compatibility
        this.roundWinner = player.id;
        
        // -------- Handle player finishing their hand --------
        if (player.hasNoCards()) {
            this.finishedPlayers++;
            player.markAsFinished(this.finishedPlayers);

            // Record player position variables based on order finished
            switch (this.finishedPlayers) {
                case 1:
                    this.gameWinner = player; // Presidente
                    break;
                case 2:
                    this.gameSecond = player; // Vice
                    break;
                case 3:
                    this.gameThird = player; // Sobre
                    break;
                case 4:
                    this.gameLoser = player; // Cu (last)
                    break;
            }

            // Only end the game when every player has finished
            if (this.finishedPlayers >= this.players.length) {
                this.gamePhase = 'gameOver';
            } else {
                // Clear the table so the next active player starts fresh
                this.currentHighestCard = null;
                this.currentHighestCards = [];
            }
        }
        
        this.nextPlayer();
        
        return true;
    }

    /**
     * Skips the current player's turn
     */
    skipTurn() {
        this.nextPlayer();
    }

    /**
     * Checks if there's a winner (at least one player finished) but game continues
     * @returns {boolean} - True if there's a winner but game continues
     */
    hasWinner() {
        const finishedPlayers = this.players.filter(player => player.hasNoCards());
        const playersWithCards = this.players.filter(player => !player.hasNoCards());
        return finishedPlayers.length > 0 && playersWithCards.length > 1;
    }

    /**
     * Checks if the game is over (all positions determined - only 1 or 0 players remain)
     * @returns {boolean} - True if game is over
     */
    isGameOver() {
        const playersWithCards = this.players.filter(player => !player.hasNoCards());
        return playersWithCards.length <= 1;
    }

    /**
     * Gets the game winner (Presidente)
     * @returns {Player|null} - The winning player or null
     */
    getGameWinner() {
        return this.gameWinner;
    }

    /**
     * Gets the ranking of players
     * @returns {Array<Player>} - Players sorted by finish position
     */
    getPlayerRanking() {
        return this.players
            .filter(p => p.finishPosition !== null)
            .sort((a, b) => a.finishPosition - b.finishPosition);
    }

    /**
     * Resets all game state variables to their initial values
     * This ensures a completely fresh start for each new game
     */
    resetGameState() {
        console.log('Resetting game state to initial values...');
        
        // Reset all players
        this.players.forEach(player => {
            player.hand = [];
            player.isWinner = false;
            player.finishPosition = null;
        });
        
        // Reset game state variables
        this.currentPlayerIndex = 0;
        this.currentRound = 0;
        this.currentHighestCard = null;
        this.currentHighestCards = [];
        this.roundWinner = null;
        this.gamePhase = 'waiting';
        this.zIndex = 1;
        this.finishedPlayers = 0;
        this.gameWinner = null;
        this.gameSecond = null;
        this.gameThird = null;
        this.gameLoser = null;
        
        console.log('Game state reset completed');
    }

    /**
     * Logs the current turn order for verification
     */
    logTurnOrder() {
        if (this.players.length === 0) return;
        
        console.log('=== TURN ORDER VERIFICATION ===');
        const positions = ['Top', 'Right', 'Bottom', 'Left'];
        this.players.forEach((player, index) => {
            console.log(`Player ${index + 1}: ${player.name} (${positions[index]})`);
        });
        console.log('Clockwise order: Bottom → Right → Top → Left → Bottom');
        console.log('Current starting player:', this.getCurrentPlayer().name, `(${positions[this.currentPlayerIndex]})`);
        console.log('================================');
    }
}

// ============================================================================
// SCORE MANAGEMENT SYSTEM
// ============================================================================

/**
 * Manages persistent score tracking across multiple games
 */
class ScoreManager {
    constructor() {
        this.scores = this.loadScores();
        this.initializeScoreTable();
        // Attach expand/collapse behavior for floating score table
        this.setupFloatingScoreTable();
    }

    /**
     * Loads scores from localStorage
     * @returns {Object} - Player scores object
     */
    loadScores() {
        try {
            const stored = localStorage.getItem('presidenteScores');
            return stored ? JSON.parse(stored) : {};
        } catch (error) {
            console.error('Error loading scores:', error);
            return {};
        }
    }

    /**
     * Saves scores to localStorage
     */
    saveScores() {
        try {
            localStorage.setItem('presidenteScores', JSON.stringify(this.scores));
        } catch (error) {
            console.error('Error saving scores:', error);
        }
    }

    /**
     * Initializes a player's score record if it doesn't exist
     * @param {string} playerName - The player's name
     */
    initializePlayer(playerName) {
        if (!this.scores[playerName]) {
            this.scores[playerName] = {
                first: 0,
                second: 0,
                third: 0,
                fourth: 0,
                totalGames: 0
            };
        }
    }

    /**
     * Records a game result for all players
     * @param {Array<Player>} players - Array of players with their finish positions
     */
    recordGameResult(players) {
        players.forEach(player => {
            this.initializePlayer(player.name);
            
            if (player.finishPosition) {
                const position = ['', 'first', 'second', 'third', 'fourth'][player.finishPosition];
                if (position) {
                    this.scores[player.name][position]++;
                    this.scores[player.name].totalGames++;
                }
            }
        });
        
        this.saveScores();
        this.updateScoreTable();
    }

    /**
     * Resets all scores
     */
    resetScores() {
        this.scores = {};
        this.saveScores();
        this.updateScoreTable();
    }

    /**
     * Initializes the score table UI
     */
    initializeScoreTable() {
        // Set up reset button event listener
        const resetBtn = document.getElementById('resetScoresBtn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to reset all scores? This cannot be undone.')) {
                    this.resetScores();
                }
            });
        }
        
        this.updateScoreTable();
    }

    /**
     * Updates the score table display
     */
    updateScoreTable() {
        const scoreRows = document.getElementById('scoreRows');
        if (!scoreRows) return;

        // Clear existing rows
        scoreRows.innerHTML = '';

        // Get all players sorted by total games (most active first)
        const sortedPlayers = Object.entries(this.scores)
            .sort(([,a], [,b]) => b.totalGames - a.totalGames);

        if (sortedPlayers.length === 0) {
            scoreRows.innerHTML = `
                <div class="no-scores-message">
                    <p>No games played yet. Start a game to see scores!</p>
                </div>
            `;
            return;
        }

        sortedPlayers.forEach(([playerName, scores]) => {
            const row = document.createElement('div');
            row.className = 'score-row';
            row.innerHTML = `
                <div class="player-name">${playerName}</div>
                <div class="score-value first">${scores.first}</div>
                <div class="score-value second">${scores.second}</div>
                <div class="score-value third">${scores.third}</div>
                <div class="score-value fourth">${scores.fourth}</div>
                <div class="total-games">${scores.totalGames}</div>
            `;
            scoreRows.appendChild(row);
        });
    }

    /**
     * Sets up floating/collapsible score table expand/collapse logic
     */
    setupFloatingScoreTable() {
        const floating = document.getElementById('scoreTableFloating');
        const collapseBtn = document.getElementById('scoreCollapseBtn');
        if (!floating || !collapseBtn) return;
        // Remove previous event listeners by replacing the button
        const newBtn = collapseBtn.cloneNode(true);
        collapseBtn.parentNode.replaceChild(newBtn, collapseBtn);
        newBtn.addEventListener('click', () => {
            floating.classList.toggle('collapsed');
            // Change chevron direction
            const icon = newBtn.querySelector('i');
            if (floating.classList.contains('collapsed')) {
                icon.classList.remove('fa-chevron-down');
                icon.classList.add('fa-chevron-up');
            } else {
                icon.classList.remove('fa-chevron-up');
                icon.classList.add('fa-chevron-down');
            }
        });
    }

    /**
     * Updates scores for current players (ensures they appear in table)
     * @param {Array<string>} playerNames - Array of current player names
     */
    updateCurrentPlayers(playerNames) {
        playerNames.forEach(name => this.initializePlayer(name));
        this.updateScoreTable();
    }
}

// ============================================================================
// NOTIFICATION SYSTEM
// ============================================================================

/**
 * Manages notifications and messages to players
 */
class NotificationManager {
    constructor() {
        this.notificationOverlay = document.getElementById('notificationOverlay');
        this.notificationMessage = document.getElementById('notificationMessage');
        this.notificationTitle = document.getElementById('notificationTitle');
        this.notificationText = document.getElementById('notificationText');
        this.toastContainer = document.getElementById('toastContainer');
        this.turnIndicator = document.getElementById('turnIndicator');
        this.turnPlayerName = document.getElementById('turnPlayerName');
    }

    /**
     * Shows a modal notification
     * @param {string} title - Notification title
     * @param {string} message - Notification message
     * @param {string} type - Type of notification (error, warning, success, info)
     * @param {number} duration - Duration in milliseconds (0 for manual close)
     */
    showNotification(title, message, type = 'info', duration = 3000) {
        if (!this.notificationOverlay) return;

        // Set content
        this.notificationTitle.textContent = title;
        this.notificationText.textContent = message;

        // Set icon based on type
        const icon = this.notificationMessage.querySelector('.icon');
        switch (type) {
            case 'error':
                icon.className = 'icon fas fa-exclamation-triangle';
                this.notificationMessage.className = 'notification-message error';
                break;
            case 'warning':
                icon.className = 'icon fas fa-exclamation-circle';
                this.notificationMessage.className = 'notification-message warning';
                break;
            case 'success':
                icon.className = 'icon fas fa-check-circle';
                this.notificationMessage.className = 'notification-message success';
                break;
            default:
                icon.className = 'icon fas fa-info-circle';
                this.notificationMessage.className = 'notification-message info';
        }

        // Show notification
        this.notificationOverlay.classList.add('show');

        // Auto-hide if duration is specified
        if (duration > 0) {
            setTimeout(() => {
                this.hideNotification();
            }, duration);
        }
    }

    /**
     * Hides the modal notification
     */
    hideNotification() {
        if (this.notificationOverlay) {
            this.notificationOverlay.classList.remove('show');
        }
    }

    /**
     * Shows a toast notification
     * @param {string} message - Toast message
     * @param {string} type - Type of toast (error, warning, success, info)
     * @param {number} duration - Duration in milliseconds
     */
    showToast(message, type = 'info', duration = 3000) {
        if (!this.toastContainer) return;

        const toast = document.createElement('div');
        toast.className = `toast-message ${type}`;
        
        const icon = this.getToastIcon(type);
        
        toast.innerHTML = `
            <div class="toast-content">
                <i class="toast-icon ${icon}"></i>
                <div class="toast-text">${message}</div>
            </div>
        `;

        this.toastContainer.appendChild(toast);

        // Trigger animation
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);

        // Auto-remove
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, duration);
    }

    /**
     * Gets the appropriate icon for toast type
     * @param {string} type - Toast type
     * @returns {string} Icon class
     */
    getToastIcon(type) {
        switch (type) {
            case 'error': return 'fas fa-exclamation-triangle';
            case 'warning': return 'fas fa-exclamation-circle';
            case 'success': return 'fas fa-check-circle';
            default: return 'fas fa-info-circle';
        }
    }

    /**
     * Shows turn indicator
     * @param {string} playerName - Name of the player whose turn it is
     * @param {number} duration - Duration to show the indicator
     */
    showTurnIndicator(playerName, duration = 2000) {
        if (!this.turnIndicator || !this.turnPlayerName) return;

        this.turnPlayerName.textContent = playerName;
        this.turnIndicator.classList.add('show');

        setTimeout(() => {
            this.turnIndicator.classList.remove('show');
        }, duration);
    }

    /**
     * Shows invalid card play message
     * @param {string} cardRank - Rank of the card that was attempted
     * @param {string} currentCardRank - Rank of the current highest card
     */
    showInvalidCardMessage(cardRank, currentCardRank) {
        this.showNotification(
            'Invalid Play',
            `You cannot play ${cardRank} when ${currentCardRank} is on the table. You need a higher card.`,
            'error',
            4000
        );
    }

    /**
     * Shows turn skip message
     * @param {string} playerName - Name of the player who skipped
     */
    showSkipTurnMessage(playerName) {
        this.showToast(`${playerName} skipped their turn`, 'warning', 2500);
    }

    /**
     * Shows turn change message
     * @param {string} playerName - Name of the player whose turn it is now
     */
    showTurnChangeMessage(playerName) {
        this.showTurnIndicator(playerName, 2000);
        this.showToast(`It's ${playerName}'s turn`, 'info', 2000);
    }

    /**
     * Shows game start message with randomly selected player
     * @param {string} playerName - Name of the randomly selected starting player
     */
    showGameStartMessage(playerName) {
        // Show prominent modal notification
        this.showNotification(
            '🎲 Game Started! 🎲',
            `${playerName} was randomly selected to start the game!\n\nGet ready to play Presidente!`,
            'success',
            4000
        );
        
        // Show turn indicator
        this.showTurnIndicator(`${playerName} starts!`, 3000);
        
        // Show toast message
        this.showToast(`Game started! ${playerName} was randomly selected to begin`, 'success', 3000);
        
        // Update center area to show starting player
        this.showStartingPlayerInCenter(playerName);
    }
    
    /**
     * Shows the starting player in the center area
     * @param {string} playerName - Name of the starting player
     */
    showStartingPlayerInCenter(playerName) {
        const centerArea = document.getElementById('centerArea');
        if (centerArea) {
            centerArea.innerHTML = `
                <div class="center-message game-start-message">
                    <i class="fas fa-dice"></i>
                    <h2>🎲 Game Started! 🎲</h2>
                    <p><strong>${playerName}</strong> was randomly selected to start!</p>
                    <div class="starting-player-info">
                        <i class="fas fa-play-circle"></i>
                        <span>${playerName} goes first</span>
                    </div>
                </div>
            `;
            
            // Clear the center message after 5 seconds
            setTimeout(() => {
                if (centerArea.querySelector('.game-start-message')) {
                    centerArea.innerHTML = `
                        <div class="center-message">
                            <i class="fas fa-play-circle"></i>
                            <p>Click cards to play</p>
                        </div>
                    `;
                }
            }, 5000);
        }
    }

    /**
     * Shows card played message
     * @param {string} playerName - Name of the player who played
     * @param {string} cardRank - Rank of the card played
     */
    showCardPlayedMessage(playerName, cardRank) {
        this.showToast(`${playerName} played ${cardRank}`, 'success', 2000);
    }

    /**
     * Shows player finished message
     * @param {string} playerName - Name of the player who finished
     * @param {number} position - Finish position (1-4)
     */
    showPlayerFinishedMessage(playerName, position) {
        const positionText = position === 1 ? '1st (Presidente!)' : 
                           position === 2 ? '2nd (Vice)' : 
                           position === 3 ? '3rd (Sobre)' : '4th (CU!)';
        
        this.showNotification(
            'Player Finished!',
            `${playerName} finished in ${positionText} place!`,
            position === 1 ? 'success' : 'info',
            3000
        );
    }
}

// ============================================================================
// UI MANAGEMENT
// ============================================================================

/**
 * Manages the user interface and DOM interactions
 */
class UIManager {
    constructor(gameController) {
        this.gameController = gameController;
        this.deckElements = {};
        this.notificationManager = new NotificationManager();
        this.initializeDeckElements();
    }

    /**
     * Initializes references to deck DOM elements
     */
    initializeDeckElements() {
        for (let i = 1; i <= 4; i++) {
            this.deckElements[i] = document.getElementById(`deck${i}`);
        }
    }

    /**
     * Renders player hands on the UI
     * @param {Array<Player>} players - Array of players
     */
    renderPlayerHands(players) {
        players.forEach((player, index) => {
            this.renderPlayerHand(player, index + 1);
        });
    }

    /**
     * Renders a single player's hand
     * @param {Player} player - The player whose hand to render
     * @param {number} deckNumber - The deck element number (1-4)
     */
    renderPlayerHand(player, deckNumber) {
        const sortedHand = player.hand.sort((a, b) => a.value - b.value);
        let lastValue = null;
        const deckElement = this.deckElements[deckNumber];
        if (!deckElement) return;
        
        deckElement.innerHTML = '';

        sortedHand.forEach(card => {
            const cardElement = this.createCardElement(card, player.id);
        // Add visual separator for the first card of a value group
        if (lastValue === null || card.value !== lastValue) {
            cardElement.classList.add('group-start');
        }
        lastValue = card.value;
            deckElement.appendChild(cardElement);
        });

        // Update card count
        const countElement = document.getElementById(`player${deckNumber}Count`);
        if (countElement) {
            countElement.textContent = `${player.hand.length} cards`;
        }

        // Update player status if finished
        if (player.finishPosition !== null) {
            const playerArea = document.querySelector(`.player${deckNumber}-area`);
            if (playerArea) {
                playerArea.classList.add('finished');
                if (player.isWinner) {
                    playerArea.classList.add('presidente');
                }
            }
        }
    }

    /**
     * Creates a card DOM element
     * @param {Card} card - The card to create element for
     * @param {number} playerId - The player ID for the card
     * @returns {HTMLElement} - The card DOM element
     */
    createCardElement(card, playerId) {
        const cardElement = document.createElement('div');
        cardElement.className = `card_${card.suit}`;
        cardElement.id = `card_${card.rank}${card.suit}_player${playerId}`;
        cardElement.innerHTML = card.rank;
        cardElement.setAttribute('data-value', card.value);
        cardElement.setAttribute('data-player-id', playerId);
        cardElement.setAttribute('data-suit', card.suit);
        cardElement.setAttribute('data-rank', card.rank);
        
        // Add direct click handler to the card
        cardElement.addEventListener('click', (e) => {
            e.stopPropagation();
            console.log('Card clicked directly:', cardElement);
            if (this.gameController && this.gameController.handleCardClick) {
                this.gameController.handleCardClick(e, playerId, cardElement);
            } else {
                console.error('Game controller or handleCardClick method not available');
            }
        });
        
        return cardElement;
    }

    /**
     * Highlights the current player's area
     * @param {number} playerIndex - Index of the current player
     */
    highlightCurrentPlayer(playerIndex) {
        // Remove highlight from all player areas
        for (let i = 1; i <= 4; i++) {
            const area = document.querySelector(`.player${i}-area`);
            if (area) area.classList.remove('active-player');
        }
        // Highlight the current player's area
        const currentArea = document.querySelector(`.player${playerIndex + 1}-area`);
        if (currentArea) currentArea.classList.add('active-player');
        // Render action buttons in the active player's area
        this.renderActionButtonsForCurrentPlayer(playerIndex);
    }

    /**
     * Renders Play Hand and Skip Turn buttons for the current player
     * @param {number} playerIndex - Index of the current player
     */
    renderActionButtonsForCurrentPlayer(playerIndex) {
        // Remove action buttons from all player areas
        document.querySelectorAll('.player-area .action-buttons').forEach(el => el.remove());
        // Remove highlight from all player areas
        for (let i = 1; i <= 4; i++) {
            const area = document.querySelector(`.player${i}-area`);
            if (area) area.classList.remove('active-player');
        }
        const area = document.querySelector(`.player${playerIndex + 1}-area`);
        if (!area) return;
        // Always highlight active player area
        area.classList.add('active-player');
        // Create action button container
        const actionDiv = document.createElement('div');
        actionDiv.className = 'action-buttons';
        // Play Hand button
        const playBtn = document.createElement('button');
        playBtn.className = 'play-hand-btn';
        playBtn.id = 'playHandBtn';
        playBtn.innerHTML = `<i class="fas fa-play"></i> Play Hand`;
        playBtn.style.display = 'none'; // Only show if cards selected
        playBtn.onclick = () => window.gameController.playSelectedCards();
        actionDiv.appendChild(playBtn);
        // Skip Turn button
        const skipBtn = document.createElement('button');
        skipBtn.className = 'skip-turn-btn';
        skipBtn.id = 'passarRodada';
        skipBtn.innerHTML = `<i class="fas fa-forward"></i> Skip Turn`;
        skipBtn.onclick = () => window.gameController.skipCurrentTurn();
        actionDiv.appendChild(skipBtn);
        // Insert after player info
        const playerInfo = area.querySelector('.player-info');
        if (playerInfo) {
            playerInfo.after(actionDiv);
        } else {
            area.appendChild(actionDiv);
        }
        // Show Play Hand button only if cards are selected
        if (window.gameController && window.gameController.selectedCards && window.gameController.selectedCards.length > 0) {
            playBtn.style.display = 'inline-flex';
        } else {
            playBtn.style.display = 'none';
        }
        // Prevent other players from interacting with their cards
        for (let i = 1; i <= 4; i++) {
            const deck = document.getElementById(`deck${i}`);
            if (deck) {
                if ((i-1) !== playerIndex) {
                    deck.style.pointerEvents = 'none';
                    deck.style.opacity = 0.6;
                } else {
                    deck.style.pointerEvents = '';
                    deck.style.opacity = 1;
                }
            }
        }
    }

    /**
     * Moves multiple cards to the center of the table as the current highest play
     * @param {Array<HTMLElement>} cardElements - The card elements to move
     * @param {number} startZIndex - The starting z-index for layering
     */
    moveCardsToCenter(cardElements, startZIndex) {
        const centerArea = document.getElementById('centerArea');
        if (!centerArea) {
            console.log('Center area not found');
            return;
        }

        console.log('Moving cards to center:', cardElements.length, 'cards');

        // Clear all previous plays - only show the latest highest play
        this.clearPreviousPlays();
        
        // Clear any existing center message
        const centerMessage = centerArea.querySelector('.center-message');
        if (centerMessage) {
            centerMessage.remove();
        }
        
        const cardWidth = 60;
        const cardHeight = 80;
        const centerWidth = centerArea.offsetWidth;
        const centerHeight = centerArea.offsetHeight;
        
        // Calculate positioning for multiple cards
        const totalWidth = cardElements.length * cardWidth + (cardElements.length - 1) * 10; // 10px gap between cards
        const startX = Math.max(10, (centerWidth - totalWidth) / 2);
        const centerY = Math.max(10, (centerHeight - cardHeight) / 2);
        
        cardElements.forEach((cardElement, index) => {
            // Clone the card element
            const cardClone = cardElement.cloneNode(true);
            cardClone.classList.add('card-played', 'current-highest');
            
            // Position cards in a row with slight overlap for visual appeal
            const x = startX + (index * (cardWidth + 5)); // 5px overlap
            const y = centerY + (Math.random() * 10 - 5); // Small random vertical offset
            
            cardClone.style.position = 'absolute';
            cardClone.style.left = `${x}px`;
            cardClone.style.top = `${y}px`;
            cardClone.style.zIndex = (startZIndex + index).toString();
            
            console.log(`Card ${index + 1} positioned at:`, { x, y, zIndex: startZIndex + index });
            
            centerArea.appendChild(cardClone);
            
            // Remove the original card from its deck
            cardElement.remove();
        });
        
        console.log('Cards moved successfully');
    }

    /**
     * Moves a single card to the center (backward compatibility)
     * @param {HTMLElement} cardElement - The card element to move
     * @param {number} zIndex - The z-index for layering
     */
    moveCardToCenter(cardElement, zIndex) {
        this.moveCardsToCenter([cardElement], zIndex);
    }

    /**
     * Clears all previous plays from the center area, keeping only current highest
     */
    clearPreviousPlays() {
        const centerArea = document.getElementById('centerArea');
        if (!centerArea) return;
        
        // Remove all played cards that are not the current highest
        const playedCards = centerArea.querySelectorAll('.card-played:not(.current-highest)');
        playedCards.forEach(card => card.remove());
        
        // Remove the current-highest class from existing cards so they can be cleared next time
        const currentHighest = centerArea.querySelectorAll('.current-highest');
        currentHighest.forEach(card => card.classList.remove('current-highest'));
    }

    /**
     * Updates the turn display
     * @param {number} playerIndex - Current player index
     */
    updateTurnDisplay(playerIndex) {
        const turnDisplay = document.getElementById('numerorodada');
        if (turnDisplay) {
            const currentPlayer = this.gameController?.gameState?.players[playerIndex];
            if (currentPlayer) {
                turnDisplay.innerHTML = `${currentPlayer.name}'s turn`;
            } else {
                turnDisplay.innerHTML = `${playerIndex + 1}o turno`;
            }
        }
    }

    /**
     * Shows the game winner
     * @param {Player} winner - The winning player
     */
    showGameWinner(winner) {
        const centerArea = document.getElementById('centerArea');
        if (centerArea) {
            centerArea.innerHTML = `
                <div class="center-message winner-message">
                    <i class="fas fa-crown"></i>
                    <h2>🎉 Presidente! 🎉</h2>
                    <p>${winner.name} wins the game!</p>
                    <button class="new-game-btn" onclick="window.gameController.startNewGame()">
                        <i class="fas fa-plus"></i>
                        Play Again
                    </button>
                </div>
            `;
        }
    }

    /**
     * Clears the center area of played cards
     */
    clearCenterArea() {
        const centerArea = document.getElementById('centerArea');
        if (centerArea) {
            centerArea.innerHTML = `
                <div class="center-message">
                    <i class="fas fa-play-circle"></i>
                    <p>Click "New Game" to start playing</p>
                </div>
            `;
        }
    }

    /**
     * Resets all UI elements to their initial state
     * This includes clearing animations, CSS classes, and resetting all visual elements
     */
    resetUI() {
        console.log('Resetting UI to initial state...');
        
        // Clear all deck containers
        for (let i = 1; i <= 4; i++) {
            const deckElement = this.deckElements[i];
            if (deckElement) {
                deckElement.innerHTML = '';
            }
        }
        
        // Reset all player areas - remove all status classes
        document.querySelectorAll('.player-area').forEach(area => {
            area.classList.remove('active', 'finished', 'presidente');
        });
        
        // Reset card counts to default
        for (let i = 1; i <= 4; i++) {
            const countElement = document.getElementById(`player${i}Count`);
            if (countElement) {
                countElement.textContent = '13 cards';
            }
        }
        
        // Clear center area completely
        const centerArea = document.getElementById('centerArea');
        if (centerArea) {
            centerArea.innerHTML = `
                <div class="center-message">
                    <i class="fas fa-play-circle"></i>
                    <p>Click "New Game" to start playing</p>
                </div>
            `;
        }
        
        // Reset turn display
        const turnDisplay = document.getElementById('numerorodada');
        if (turnDisplay) {
            turnDisplay.innerHTML = 'Waiting for players...';
        }
        
        // Hide any active notifications
        this.notificationManager.hideNotification();
        
        // Clear toast container
        const toastContainer = document.getElementById('toastContainer');
        if (toastContainer) {
            toastContainer.innerHTML = '';
        }
        
        // Hide turn indicator
        const turnIndicator = document.getElementById('turnIndicator');
        if (turnIndicator) {
            turnIndicator.classList.remove('show');
        }
        
        console.log('UI reset completed');
    }
}

// ============================================================================
// GAME CONTROLLER
// ============================================================================

/**
 * Main game controller that orchestrates the game
 */
class GameController {
    constructor() {
        this.gameState = new GameState();
        this.uiManager = new UIManager(this); // Pass the game controller instance
        this.deck = new Deck();
        this.notificationManager = this.uiManager.notificationManager;
        this.scoreManager = new ScoreManager();
        // Flag to ensure a game's results are recorded only once
        this.gameResultRecorded = false;
        this.selectedCards = []; // Track selected cards
        this.selectedCardValue = null; // Track the value of selected cards
        this.setupEventListeners();
        this.initializeGame();
    }

    /**
     * Initialize the game
     */
    initializeGame() {
        // Check if we have player names from setup page
        const playerNames = this.getPlayerNamesFromStorage();
        if (playerNames && playerNames.length === 4) {
            this.startNewGameWithNames(playerNames);
        } else {
            // Show setup message
            this.showSetupMessage();
        }
    }

    /**
     * Get player names from session storage
     * @returns {Array<string>|null} - Array of player names or null
     */
    getPlayerNamesFromStorage() {
        try {
            const stored = sessionStorage.getItem('presidentePlayerNames');
            return stored ? JSON.parse(stored) : null;
        } catch (error) {
            console.error('Error reading player names from storage:', error);
            return null;
        }
    }

    /**
     * Show setup message when no players are configured
     */
    showSetupMessage() {
        const centerArea = document.getElementById('centerArea');
        if (centerArea) {
            centerArea.innerHTML = `
                <div class="center-message">
                    <i class="fas fa-users"></i>
                    <p>No players configured</p>
                    <button class="setup-btn" onclick="window.location.href='setup.html'">
                        <i class="fas fa-cog"></i>
                        Setup Players
                    </button>
                </div>
            `;
        }
    }

    /**
     * Sets up event listeners for user interactions
     */
    setupEventListeners() {
        // New game button
        const newGameButton = document.getElementById('newGameBtn');
        if (newGameButton) {
            newGameButton.addEventListener('click', () => this.startNewGame());
        }

        // Skip turn button
        const skipTurnButton = document.getElementById('passarRodada');
        if (skipTurnButton) {
            skipTurnButton.addEventListener('click', () => this.skipCurrentTurn());
        }

        // Notification overlay click to close
        const notificationOverlay = document.getElementById('notificationOverlay');
        if (notificationOverlay) {
            notificationOverlay.addEventListener('click', (e) => {
                if (e.target === notificationOverlay) {
                    this.notificationManager.hideNotification();
                }
            });
        }
    }

    /**
     * Starts a new game
     */
    startNewGame() {
        const playerNames = this.getPlayerNamesFromStorage();
        
        if (!playerNames || playerNames.length !== 4) {
            this.showSetupMessage();
            return;
        }

        this.startNewGameWithNames(playerNames);
    }

    /**
     * Starts a new game with provided player names
     * @param {Array<string>} playerNames - Array of player names
     */
    startNewGameWithNames(playerNames) {
        // Reset flag for new game
        this.gameResultRecorded = false;
        this.showLoading(true);
        
        // Clear any card selections
        this.clearCardSelection();
        
        // Reset UI to initial state before starting new game
        this.uiManager.resetUI();
        
        // Reset game state to ensure clean start
        this.gameState.resetGameState();
        
        setTimeout(() => {
            this.gameState.initializeGame(playerNames);
            this.deck.createDeck();
            this.deck.shuffle();
            
            const hands = this.deck.dealCards(4, 13);
            
            this.gameState.players.forEach((player, index) => {
                player.receiveCards(hands[index]);
            });
            
            this.updatePlayerNames(playerNames);
            this.uiManager.renderPlayerHands(this.gameState.players);
            this.uiManager.highlightCurrentPlayer(this.gameState.currentPlayerIndex);
            this.uiManager.updateTurnDisplay(this.gameState.currentPlayerIndex);
            this.clearCenterArea();
            this.showLoading(false);
            
            // Update score table with current players
            this.scoreManager.updateCurrentPlayers(playerNames);
            
            // Show welcome message for randomly selected starting player
            const firstPlayer = this.gameState.getCurrentPlayer();
            console.log(`Game started! Random starting player: ${firstPlayer.name} (Player ${this.gameState.currentPlayerIndex + 1})`);
            if (firstPlayer) {
                this.notificationManager.showGameStartMessage(firstPlayer.name);
            }
        }, 1000);
    }

    /**
     * Update player names in the UI
     * @param {Array<string>} playerNames - Array of player names
     */
    updatePlayerNames(playerNames) {
        for (let i = 0; i < playerNames.length; i++) {
            const nameElement = document.getElementById(`player${i + 1}Name`);
            if (nameElement) {
                nameElement.textContent = playerNames[i];
            }
        }
    }

    /**
     * Clear the center area
     */
    clearCenterArea() {
        const centerArea = document.getElementById('centerArea');
        if (centerArea) {
            centerArea.innerHTML = `
                <div class="center-message">
                    <i class="fas fa-play-circle"></i>
                    <p>Click "New Game" to start playing</p>
                </div>
            `;
        }
    }

    /**
     * Show or hide loading overlay
     * @param {boolean} show - Whether to show loading
     */
    showLoading(show) {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            if (show) {
                loadingOverlay.classList.add('show');
            } else {
                loadingOverlay.classList.remove('show');
            }
        }
    }

    /**
     * Handles card click events for selection
     * @param {Event} event - The click event
     * @param {number} playerIndex - The player index (0-3)
     * @param {HTMLElement} cardElement - The clicked card element
     */
    handleCardClick(event, playerIndex, cardElement) {
        console.log('Card clicked:', {
            playerIndex,
            currentPlayerIndex: this.gameState.currentPlayerIndex,
            cardElement: cardElement,
            cardClasses: cardElement.className
        });

        if (this.gameState.currentPlayerIndex !== playerIndex) {
            console.log('Not current player\'s turn');
            this.notificationManager.showToast('Not your turn!', 'warning', 2000);
            return;
        }

        const cardValue = parseInt(cardElement.getAttribute('data-value'));
        const cardSuit = cardElement.getAttribute('data-suit');
        const cardRank = cardElement.getAttribute('data-rank');
        const currentPlayer = this.gameState.getCurrentPlayer();

        console.log('Card details:', {
            cardValue,
            cardSuit,
            cardRank,
            currentPlayer: currentPlayer.name
        });

        // Check if card is already selected
        const cardId = `${cardRank}${cardSuit}`;
        const isSelected = cardElement.classList.contains('selected');

        if (isSelected) {
            // Deselect the card
            this.deselectCard(cardElement, cardId);
        } else {
            // Try to select the card
            this.selectCard(cardElement, cardId, cardValue, cardRank);
        }

        // Update the play hand button visibility
        this.updatePlayHandButton();
    }

    /**
     * Selects a card if valid
     * @param {HTMLElement} cardElement - The card element
     * @param {string} cardId - The card ID
     * @param {number} cardValue - The card value
     * @param {string} cardRank - The card rank
     */
    selectCard(cardElement, cardId, cardValue, cardRank) {
        // If no cards selected yet, or same value as already selected cards
        if (this.selectedCards.length === 0 || this.selectedCardValue === cardValue) {
            cardElement.classList.add('selected');
            this.selectedCards.push({
                element: cardElement,
                id: cardId,
                value: cardValue,
                rank: cardRank,
                suit: cardElement.getAttribute('data-suit')
            });
            this.selectedCardValue = cardValue;
            
            console.log('Card selected:', cardId, 'Total selected:', this.selectedCards.length);
        } else {
            // Show message that only same value cards can be selected
            this.notificationManager.showToast(
                `You can only select cards of the same value (${this.getCardRankName(this.selectedCardValue)})`, 
                'warning', 
                3000
            );
        }
    }

    /**
     * Deselects a card
     * @param {HTMLElement} cardElement - The card element
     * @param {string} cardId - The card ID
     */
    deselectCard(cardElement, cardId) {
        cardElement.classList.remove('selected');
        this.selectedCards = this.selectedCards.filter(card => card.id !== cardId);
        
        // If no cards left selected, reset the selected value
        if (this.selectedCards.length === 0) {
            this.selectedCardValue = null;
        }
        
        console.log('Card deselected:', cardId, 'Total selected:', this.selectedCards.length);
    }

    /**
     * Gets the display name for a card rank value
     * @param {number} value - The card value
     * @returns {string} - The card rank name
     */
    getCardRankName(value) {
        const ranks = ['', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'];
        return ranks[value] || value.toString();
    }

    /**
     * Updates the visibility of the play hand button
     */
    updatePlayHandButton() {
        const playHandBtn = document.getElementById('playHandBtn');
        if (!playHandBtn) {
            // Create the play hand button if it doesn't exist

            return;
        }

        if (this.selectedCards.length > 0) {
            playHandBtn.style.display = 'block';
            const cardName = this.getCardRankName(this.selectedCardValue);
            const countText = this.selectedCards.length === 1 ? '' : ` (${this.selectedCards.length})`;
            playHandBtn.innerHTML = `
                <i class="fas fa-play"></i>
                Play ${cardName}${countText}
            `;
        } else {
            playHandBtn.style.display = 'none';
        }
    }



    /**
     * Plays the selected cards
     */
    playSelectedCards() {
        if (this.selectedCards.length === 0) {
            this.notificationManager.showToast('No cards selected!', 'warning', 2000);
            return;
        }

        const currentPlayer = this.gameState.getCurrentPlayer();
        const selectedCardObjects = this.selectedCards.map(selectedCard => {
            return currentPlayer.hand.find(card => 
                card.rank === selectedCard.rank && card.suit === selectedCard.suit
            );
        }).filter(card => card !== undefined);

        console.log('Attempting to play cards:', selectedCardObjects);

        // Check if the play is valid
        if (this.gameState.canPlayCards(currentPlayer, selectedCardObjects)) {
            // Play the cards
            if (this.gameState.playCards(currentPlayer, selectedCardObjects)) {
                console.log('Cards played successfully');
                
                // Show cards played message
                const cardName = this.getCardRankName(this.selectedCardValue);
                const countText = this.selectedCards.length === 1 ? '' : ` x${this.selectedCards.length}`;
                this.notificationManager.showCardPlayedMessage(currentPlayer.name, `${cardName}${countText}`);
                
                // Move cards to center as the new highest play
                const cardElements = this.selectedCards.map(card => card.element);
                this.uiManager.moveCardsToCenter(cardElements, this.gameState.zIndex);
                this.gameState.zIndex += this.selectedCards.length;
                
                // Clear selection
                this.clearCardSelection();
                
                // Update UI
                this.uiManager.renderPlayerHands(this.gameState.players);
                
                // Check if player finished their cards
                if (currentPlayer.hasNoCards()) {
                    this.notificationManager.showPlayerFinishedMessage(currentPlayer.name, currentPlayer.finishPosition);
                }
                
                // Check if game is over (all positions determined)
                if (this.gameState.isGameOver()) {
                    console.log('Game completely finished! All positions determined.');
                    this.handleGameCompletion();
                } else if (this.gameState.hasWinner()) {
                    // Winner already announced; game continues for remaining positions
                    const winner = this.gameState.getGameWinner();
                    if (winner) {
                        console.log('Winner determined:', winner.name, 'but game continues for remaining positions');
                    }                  
                    // Continue with next player
                    const nextPlayer = this.gameState.getCurrentPlayer();
                    if (nextPlayer) {
                        this.notificationManager.showTurnChangeMessage(nextPlayer.name);
                    }
                    this.uiManager.highlightCurrentPlayer(this.gameState.currentPlayerIndex);
                    this.uiManager.updateTurnDisplay(this.gameState.currentPlayerIndex);
                } else {
                    // Show turn change message
                    const nextPlayer = this.gameState.getCurrentPlayer();
                    if (nextPlayer) {
                        this.notificationManager.showTurnChangeMessage(nextPlayer.name);
                    }
                    
                    this.uiManager.highlightCurrentPlayer(this.gameState.currentPlayerIndex);
                    this.uiManager.updateTurnDisplay(this.gameState.currentPlayerIndex);
                }
            }
        } else {
            console.log('Cards could not be played');
            
            // Show invalid play message
            const cardName = this.getCardRankName(this.selectedCardValue);
            if (this.gameState.currentHighestCards && this.gameState.currentHighestCards.length > 0) {
                const currentCardName = this.getCardRankName(this.gameState.currentHighestCards[0].value);
                this.notificationManager.showToast(
                    `Cannot play ${this.selectedCards.length} ${cardName}(s) over ${this.gameState.currentHighestCards.length} ${currentCardName}(s)`, 
                    'error', 
                    3000
                );
            } else {
                this.notificationManager.showToast('Invalid play!', 'error', 2000);
            }
        }
    }

    /**
     * Clears all card selections
     */
    clearCardSelection() {
        this.selectedCards.forEach(selectedCard => {
            selectedCard.element.classList.remove('selected');
        });
        this.selectedCards = [];
        this.selectedCardValue = null;
        this.updatePlayHandButton();
    }

    /**
     * Handles game completion when all positions are determined
     */
    handleGameCompletion() {
        // Prevent duplicate recordings
        if (this.gameResultRecorded) {
            return;
        }
        this.gameResultRecorded = true;
        // Record the game result in the score table
        this.scoreManager.recordGameResult(this.gameState.players);
        
        // Show final game results
        const winner = this.gameState.getGameWinner();
        if (winner) {
            this.uiManager.showGameWinner(winner);
        }
        
        // Show final standings
        this.showFinalStandings();
    }
    
    /**
     * Shows the final standings of all players
     */
    showFinalStandings() {
        const sortedPlayers = [...this.gameState.players]
            .filter(player => player.finishPosition)
            .sort((a, b) => a.finishPosition - b.finishPosition);
        
        let standingsMessage = 'Final Standings:\n';
        const positions = ['', '1st', '2nd', '3rd', '4th'];
        
        sortedPlayers.forEach(player => {
            const position = positions[player.finishPosition] || `${player.finishPosition}th`;
            standingsMessage += `${position}: ${player.name}\n`;
        });
        
        console.log(standingsMessage);
        
        // Show toast with final standings
        setTimeout(() => {
            this.notificationManager.showToast(
                'Game Complete! Check the score table for updated rankings.',
                'success',
                5000
            );
        }, 2000);
    }

    /**
     * Skips the current player's turn
     */
    skipCurrentTurn() {
        const currentPlayer = this.gameState.getCurrentPlayer();
        
        // Show skip message
        if (currentPlayer) {
            this.notificationManager.showSkipTurnMessage(currentPlayer.name);
        }
        
        this.gameState.skipTurn();
        
        // Show turn change message
        const nextPlayer = this.gameState.getCurrentPlayer();
        if (nextPlayer) {
            this.notificationManager.showTurnChangeMessage(nextPlayer.name);
        }
        
        this.uiManager.highlightCurrentPlayer(this.gameState.currentPlayerIndex);
        this.uiManager.updateTurnDisplay(this.gameState.currentPlayerIndex);
    }
}

// ============================================================================
// GAME INITIALIZATION
// ============================================================================



/**
 * Legacy function for backward compatibility
 * @param {string} player1 - Player 1 name
 * @param {string} player2 - Player 2 name
 * @param {string} player3 - Player 3 name
 * @param {string} player4 - Player 4 name
 */
function novoJogo(player1, player2, player3, player4) {
    // Store player names in session storage
    const playerNames = [player1, player2, player3, player4];
    sessionStorage.setItem('presidentePlayerNames', JSON.stringify(playerNames));
    
    // Start new game
    if (gameController) {
        gameController.startNewGameWithNames(playerNames);
    }
}

// Initialize the game controller when the DOM is loaded
let gameController;
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing game controller...');
    try {
        gameController = new GameController();
        console.log('Game controller initialized successfully');
        
        // Test if we can access the game controller globally
        window.gameController = gameController;
        console.log('Game controller made available globally');
        
        // Test card click detection
        setTimeout(() => {
            console.log('Testing card click detection...');
            const testCard = document.querySelector('.card_diamonds, .card_spades, .card_hearts, .card_clubs');
            if (testCard) {
                console.log('Found test card:', testCard);
                testCard.addEventListener('click', () => {
                    console.log('Test card clicked!');
                });
            } else {
                console.log('No cards found for testing');
            }
        }, 2000);
        
    } catch (error) {
        console.error('Error initializing game controller:', error);
    }
});