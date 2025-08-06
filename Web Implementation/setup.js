/**
 * Setup page functionality for Presidente game
 */
class SetupManager {
    constructor() {
        this.form = document.getElementById('playerSetupForm');
        this.startButton = document.querySelector('.start-game-btn');
        this.inputs = document.querySelectorAll('input[type="text"]');
        
        this.initializeEventListeners();
        this.setupInputValidation();
    }

    /**
     * Initialize event listeners
     */
    initializeEventListeners() {
        this.form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        
        // Add input event listeners for real-time validation
        this.inputs.forEach(input => {
            input.addEventListener('input', () => this.validateInput(input));
            input.addEventListener('blur', () => this.validateInput(input));
        });

        // Add keyboard navigation
        this.inputs.forEach((input, index) => {
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    if (index < this.inputs.length - 1) {
                        this.inputs[index + 1].focus();
                    } else {
                        this.form.dispatchEvent(new Event('submit'));
                    }
                }
            });
        });
    }

    /**
     * Setup input validation
     */
    setupInputValidation() {
        // Add custom validation attributes
        this.inputs.forEach(input => {
            input.setAttribute('minlength', '2');
            input.setAttribute('maxlength', '20');
            input.setAttribute('pattern', '[A-Za-z0-9\\s]+');
        });
    }

    /**
     * Validate individual input
     * @param {HTMLInputElement} input - Input element to validate
     */
    validateInput(input) {
        const value = input.value.trim();
        const isValid = this.isValidPlayerName(value);
        
        input.classList.toggle('valid', isValid && value.length > 0);
        input.classList.toggle('invalid', !isValid && value.length > 0);
        
        this.updateStartButtonState();
    }

    /**
     * Check if player name is valid
     * @param {string} name - Player name to validate
     * @returns {boolean} - True if valid
     */
    isValidPlayerName(name) {
        if (!name || name.length < 2) return false;
        if (name.length > 20) return false;
        if (!/^[A-Za-z0-9\s]+$/.test(name)) return false;
        return true;
    }

    /**
     * Update start button state based on form validity
     */
    updateStartButtonState() {
        const allValid = Array.from(this.inputs).every(input => {
            const value = input.value.trim();
            return this.isValidPlayerName(value);
        });

        this.startButton.disabled = !allValid;
        
        if (allValid) {
            this.startButton.classList.add('ready');
        } else {
            this.startButton.classList.remove('ready');
        }
    }

    /**
     * Handle form submission
     * @param {Event} e - Form submit event
     */
    handleFormSubmit(e) {
        e.preventDefault();
        
        const playerNames = this.getPlayerNames();
        
        if (this.validateAllPlayers(playerNames)) {
            this.startGame(playerNames);
        }
    }

    /**
     * Get player names from form inputs
     * @returns {Array<string>} - Array of player names
     */
    getPlayerNames() {
        return Array.from(this.inputs).map(input => input.value.trim());
    }

    /**
     * Validate all player names
     * @param {Array<string>} playerNames - Array of player names
     * @returns {boolean} - True if all names are valid
     */
    validateAllPlayers(playerNames) {
        // Check if all names are provided
        if (playerNames.some(name => !name)) {
            this.showError('Please enter names for all players');
            return false;
        }

        // Check if names are valid
        if (playerNames.some(name => !this.isValidPlayerName(name))) {
            this.showError('Please enter valid names (2-20 characters, letters and numbers only)');
            return false;
        }

        // Check for duplicate names
        const uniqueNames = new Set(playerNames);
        if (uniqueNames.size !== playerNames.length) {
            this.showError('Player names must be unique');
            return false;
        }

        return true;
    }

    /**
     * Show error message
     * @param {string} message - Error message to display
     */
    showError(message) {
        // Remove existing error message
        const existingError = document.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }

        // Create and show new error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i>
            <span>${message}</span>
        `;
        
        this.form.insertBefore(errorDiv, this.form.firstChild);
        
        // Auto-remove error after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 5000);
    }

    /**
     * Start the game with provided player names
     * @param {Array<string>} playerNames - Array of player names
     */
    startGame(playerNames) {
        // Show loading state
        this.setLoadingState(true);
        
        // Store player names in session storage
        sessionStorage.setItem('presidentePlayerNames', JSON.stringify(playerNames));
        
        // Navigate to game page after a short delay for UX
        setTimeout(() => {
            window.location.href = 'presidente.html';
        }, 1000);
    }

    /**
     * Set loading state for the form
     * @param {boolean} isLoading - Whether to show loading state
     */
    setLoadingState(isLoading) {
        const container = document.querySelector('.setup-card');
        
        if (isLoading) {
            container.classList.add('loading');
            this.startButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Starting Game...';
            this.startButton.disabled = true;
        } else {
            container.classList.remove('loading');
            this.startButton.innerHTML = '<i class="fas fa-play"></i> Start Game';
            this.startButton.disabled = false;
        }
    }

    /**
     * Pre-fill form with default names if available
     */
    prefillDefaultNames() {
        const defaultNames = ['Alice', 'Bob', 'Charlie', 'Diana'];
        
        this.inputs.forEach((input, index) => {
            if (defaultNames[index]) {
                input.value = defaultNames[index];
                this.validateInput(input);
            }
        });
    }
}

// Add error message styles
const errorStyles = document.createElement('style');
errorStyles.textContent = `
    .error-message {
        display: flex;
        align-items: center;
        gap: 10px;
        background: linear-gradient(135deg, #fed7d7 0%, #feb2b2 100%);
        color: #c53030;
        padding: 12px 16px;
        border-radius: 12px;
        border: 1px solid #feb2b2;
        margin-bottom: 20px;
        font-size: 0.9rem;
        font-weight: 500;
        animation: slideIn 0.3s ease;
    }

    .error-message i {
        font-size: 1rem;
    }

    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateY(-10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .player-input-group input.valid {
        border-color: #38a169;
        background: linear-gradient(135deg, #f0fff4 0%, #e6fffa 100%);
    }

    .player-input-group input.invalid {
        border-color: #e53e3e;
        background: linear-gradient(135deg, #fff5f5 0%, #fed7d7 100%);
    }

    .start-game-btn.ready {
        background: linear-gradient(135deg, #38a169 0%, #2f855a 100%);
        box-shadow: 0 4px 15px rgba(56, 161, 105, 0.3);
    }

    .start-game-btn.ready:hover {
        box-shadow: 0 8px 25px rgba(56, 161, 105, 0.4);
    }
`;
document.head.appendChild(errorStyles);

// Initialize setup manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const setupManager = new SetupManager();
    
    // Pre-fill with default names for demo purposes
    // Comment this out if you don't want default names
    setupManager.prefillDefaultNames();
}); 